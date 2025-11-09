import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveSession, Modality, Blob } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    let geminiSession: LiveSession | null = null;

    // FIX: Changed Buffer to any to avoid type error when @types/node is not present.
    ws.on('message', async (message: any) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'init') {
                const { systemInstruction, voice } = data.payload;
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

                geminiSession = await ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                        systemInstruction: systemInstruction,
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                    callbacks: {
                        onopen: () => {
                            console.log('Gemini session opened.');
                             ws.send(JSON.stringify({ type: 'status', payload: 'LISTENING' }));
                        },
                        onmessage: (msg) => {
                            ws.send(JSON.stringify({ type: 'gemini_response', payload: msg }));
                        },
                        onerror: (e) => {
                            console.error('Gemini error:', e);
                            ws.send(JSON.stringify({ type: 'error', payload: 'Gemini session error.' }));
                        },
                        onclose: () => {
                            console.log('Gemini session closed.');
                            ws.close();
                        },
                    },
                });

            } else if (data.type === 'audio' && geminiSession) {
                const pcmBlob: Blob = {
                    data: data.payload, // base64 string from client
                    mimeType: 'audio/pcm;rate=16000',
                };
                await geminiSession.sendRealtimeInput({ media: pcmBlob });
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// This is a basic placeholder for a real server implementation.
// In a production environment, you would transpile this TypeScript file to JavaScript.
// For example, using `tsc server/index.ts` which would generate `server/index.js`.
// The package.json's "server" script would then run `node server/index.js`.
