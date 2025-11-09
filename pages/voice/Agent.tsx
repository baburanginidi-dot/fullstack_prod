import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { TranscriptMessage } from '../../types';
import { Mic, MicOff, PhoneOff, XCircle } from 'lucide-react';
import { LiveServerMessage } from '@google/genai';
import toast from 'react-hot-toast';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
// --- End Audio Utility Functions ---


enum AgentStatus {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    LISTENING = 'LISTENING',
    THINKING = 'THINKING',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
}

const resolveWsUrl = () => {
    if (process.env.WS_URL) {
        return process.env.WS_URL;
    }
    return import.meta.env.PROD ? 'wss://localhost:3001' : 'ws://localhost:3001';
};

const Agent: React.FC = () => {
    const { user, logout, activePrompt, settings } = useAppContext();
    const navigate = useNavigate();
    const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [liveTranscription, setLiveTranscription] = useState({ user: '', agent: '' });
    const liveTranscriptionRef = useRef({ user: '', agent: '' });
    
    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRefs = useRef<{ input: AudioContext | null, output: AudioContext | null, scriptProcessor: ScriptProcessorNode | null }>({ input: null, output: null, scriptProcessor: null });
    const audioPlaybackRefs = useRef<{ queue: AudioBufferSourceNode[], nextStartTime: number }>({ queue: [], nextStartTime: 0 });

    useEffect(() => {
        if (!user || user.isAdmin) {
            navigate('/');
        }
    }, [user, navigate]);

    const cleanup = useCallback(() => {
        console.log("Cleaning up resources...");
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if(audioContextRefs.current.scriptProcessor) {
            audioContextRefs.current.scriptProcessor.disconnect();
            audioContextRefs.current.scriptProcessor = null;
        }
        if (audioContextRefs.current.input) {
            audioContextRefs.current.input.close();
            audioContextRefs.current.input = null;
        }
        if (audioContextRefs.current.output) {
            audioContextRefs.current.output.close();
            audioContextRefs.current.output = null;
        }
        audioPlaybackRefs.current.queue.forEach(source => source.stop());
        audioPlaybackRefs.current = { queue: [], nextStartTime: 0 };
        setStatus(AgentStatus.IDLE);
    }, []);

    const startConversation = async () => {
        if (status !== AgentStatus.IDLE && status !== AgentStatus.ERROR) return;
        setStatus(AgentStatus.CONNECTING);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const wsUrl = resolveWsUrl();
            wsRef.current = new WebSocket(wsUrl);

            audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioPlaybackRefs.current.nextStartTime = 0;
            
            wsRef.current.onopen = () => {
                console.log("WebSocket connected.");
                const systemInstruction = `${activePrompt?.content || 'You are a helpful assistant.'} The user's name is ${user?.fullName}.`;
                
                // Send initialization message to the server
                wsRef.current?.send(JSON.stringify({
                    type: 'init',
                    payload: {
                        systemInstruction,
                        voice: settings.voice,
                        user: {
                            fullName: user?.fullName ?? '',
                            phoneNumber: user?.phoneNumber ?? ''
                        }
                    }
                }));

                const source = audioContextRefs.current.input!.createMediaStreamSource(stream);
                const scriptProcessor = audioContextRefs.current.input!.createScriptProcessor(4096, 1, 1);
                audioContextRefs.current.scriptProcessor = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const int16 = new Int16Array(inputData.map(f => f * 32768));
                    const base64 = encode(new Uint8Array(int16.buffer));

                    if(wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'audio', payload: base64 }));
                    }
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(audioContextRefs.current.input!.destination);
            };

            wsRef.current.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                if(data.type === 'status') {
                    setStatus(data.payload as AgentStatus);
                } else if (data.type === 'error') {
                     console.error("Server error:", data.payload);
                     toast.error(data.payload);
                     setStatus(AgentStatus.ERROR);
                     cleanup();
                } else if (data.type === 'gemini_response') {
                    const message: LiveServerMessage = data.payload;

                    let didTranscriptionUpdate = false;
                    if (message.serverContent?.inputTranscription) {
                        liveTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
                        didTranscriptionUpdate = true;
                    }
                    if (message.serverContent?.outputTranscription) {
                        liveTranscriptionRef.current.agent += message.serverContent.outputTranscription.text;
                        didTranscriptionUpdate = true;
                    }

                    if(didTranscriptionUpdate) {
                        setLiveTranscription({ ...liveTranscriptionRef.current });
                    }
                    
                    if (message.serverContent?.turnComplete) {
                        const fullInputTranscription = liveTranscriptionRef.current.user;
                        const fullOutputTranscription = liveTranscriptionRef.current.agent;
                        
                        const newMessages: TranscriptMessage[] = [];
                        const turnTimestamp = new Date();
                        if (fullInputTranscription.trim()) {
                            newMessages.push({ speaker: 'user', text: fullInputTranscription, timestamp: turnTimestamp });
                        }
                        if (fullOutputTranscription.trim()) {
                            newMessages.push({ speaker: 'agent', text: fullOutputTranscription, timestamp: turnTimestamp });
                        }

                        if(newMessages.length > 0) {
                            setTranscript(prev => [...prev, ...newMessages]);
                        }

                        liveTranscriptionRef.current = { user: '', agent: '' };
                        setLiveTranscription({user: '', agent: ''});
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        setStatus(AgentStatus.SPEAKING);
                        const outputCtx = audioContextRefs.current.output!;
                        const nextStartTime = Math.max(audioPlaybackRefs.current.nextStartTime, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        
                        source.onended = () => {
                            audioPlaybackRefs.current.queue = audioPlaybackRefs.current.queue.filter(s => s !== source);
                            if(audioPlaybackRefs.current.queue.length === 0) {
                                setStatus(AgentStatus.LISTENING);
                            }
                        };
                        source.start(nextStartTime);
                        audioPlaybackRefs.current.nextStartTime = nextStartTime + audioBuffer.duration;
                        audioPlaybackRefs.current.queue.push(source);
                    }
                }
            };
            wsRef.current.onerror = (err) => {
                console.error("WebSocket error:", err);
                toast.error("A connection error occurred with the server.");
                setStatus(AgentStatus.ERROR);
                cleanup();
            };
            wsRef.current.onclose = () => {
                console.log("WebSocket closed.");
                if(status !== AgentStatus.IDLE) {
                    cleanup();
                }
            };

        } catch (err: any) {
            console.error("Failed to start conversation:", err);
            let errorMessage = "Could not access microphone. An unknown error occurred.";
            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || (err.message && err.message.toLowerCase().includes('device not found'))) {
                errorMessage = "No microphone found. Please connect a microphone and try again.";
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Microphone access was denied. Please allow it in your browser settings.";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "Microphone is already in use or a hardware error occurred.";
            } else if (err.message) {
                errorMessage = `Could not access microphone: ${err.message}`;
            }
            toast.error(errorMessage);
            setStatus(AgentStatus.ERROR);
        }
    };
    
    const endConversation = () => {
        cleanup();
    };

    const handleHangUp = () => {
        endConversation();
        logout();
        navigate('/');
    };
    
    const handleClearLiveTranscription = () => {
        liveTranscriptionRef.current = { user: '', agent: '' };
        setLiveTranscription({ user: '', agent: '' });
    };

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4 md:p-8">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Hello, {user?.fullName || 'User'}!</h1>
                <button onClick={handleHangUp} className="flex items-center gap-2 bg-brand-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                    <PhoneOff size={20}/>
                    <span>End & Logout</span>
                </button>
            </header>

            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto mb-6 flex flex-col relative">
                {transcript.map((msg, index) => (
                    <div key={index} className={`mb-4 max-w-xl p-3 rounded-lg ${msg.speaker === 'user' ? 'bg-brand-primary self-end' : 'bg-gray-700 self-start'}`}>
                        <p className="font-bold capitalize">{msg.speaker === 'user' ? user?.fullName?.split(' ')[0] || 'User' : 'Agent'}</p>
                        <p>{msg.text}</p>
                    </div>
                ))}
                 {liveTranscription.user && (
                    <div className="mb-4 max-w-xl p-3 rounded-lg bg-blue-700 self-end opacity-70">
                         <p className="font-bold capitalize">{user?.fullName?.split(' ')[0] || 'User'}</p>
                        <p>{liveTranscription.user}</p>
                    </div>
                 )}
                 {liveTranscription.agent && (
                    <div className="mb-4 max-w-xl p-3 rounded-lg bg-gray-600 self-start opacity-70">
                        <p className="font-bold capitalize">Agent</p>
                        <p>{liveTranscription.agent}</p>
                    </div>
                 )}
                 {(liveTranscription.user || liveTranscription.agent) && (
                    <div className="absolute bottom-4 right-4">
                        <button
                            onClick={handleClearLiveTranscription}
                            title="Clear live transcription"
                            className="flex items-center gap-1 text-xs bg-gray-900/50 hover:bg-gray-900/80 backdrop-blur-sm text-gray-300 px-2 py-1 rounded-lg transition-colors"
                        >
                            <XCircle size={14} />
                            <span>Clear</span>
                        </button>
                    </div>
                )}
            </div>

            <footer className="flex flex-col items-center justify-center">
                 <p className="text-gray-400 mb-4 h-6">{
                    {
                        [AgentStatus.IDLE]: "Click the button to start the conversation",
                        [AgentStatus.CONNECTING]: "Connecting to agent...",
                        [AgentStatus.LISTENING]: "Listening...",
                        [AgentStatus.THINKING]: "Thinking...",
                        [AgentStatus.SPEAKING]: "Agent is speaking...",
                        [AgentStatus.ERROR]: "An error occurred. Please restart.",
                    }[status]
                 }</p>
                <button
                    onClick={status === AgentStatus.IDLE || status === AgentStatus.ERROR ? startConversation : endConversation}
                    disabled={status === AgentStatus.CONNECTING}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform scale-100 hover:scale-105
                        ${status === AgentStatus.LISTENING || status === AgentStatus.SPEAKING ? 'bg-brand-danger' : 'bg-brand-primary'}
                        ${status === AgentStatus.CONNECTING && 'animate-pulse'}`}
                >
                    {status === AgentStatus.LISTENING || status === AgentStatus.SPEAKING ? <MicOff size={40} /> : <Mic size={40} />}
                </button>
            </footer>
        </div>
    );
};

export default Agent;
