import express from 'express';
import http from 'http';
import path from 'path';
import { randomUUID } from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { normalizePhoneNumber, isPhoneNumberFormatValid } from './utils/phoneValidator';
import { userStore, type SessionRecord } from './store/replitUserStore';

dotenv.config();

const IS_REPLIT = Boolean(process.env.REPL_ID);
const REPL_SLUG = process.env.REPL_SLUG || '';
const REPL_OWNER = process.env.REPL_OWNER || '';

let REPLIT_URL = '';
if (IS_REPLIT && REPL_SLUG && REPL_OWNER) {
    REPLIT_URL = `https://${REPL_SLUG}.${REPL_OWNER}.repl.co`;
} else if (IS_REPLIT) {
    console.warn('Replit detected but REPL_SLUG or REPL_OWNER missing. Using default localhost URL.');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || (IS_REPLIT && REPLIT_URL ? REPLIT_URL : 'http://localhost:3000');
const WS_PROTOCOL = IS_REPLIT ? 'wss:' : 'ws:';

if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
}

type LiveSession = {
    close: () => void;
    sendRealtimeInput: (input: { media: Blob }) => Promise<void> | void;
};

const app = express();

const allowedOrigins = [FRONTEND_URL];
if (IS_REPLIT && REPLIT_URL && REPLIT_URL !== FRONTEND_URL) {
    allowedOrigins.push(REPLIT_URL);
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
            } else if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else if (IS_REPLIT && origin.includes('.repl.co')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }),
);
app.use(
    helmet({
        contentSecurityPolicy: false,
    }),
);

if (IS_REPLIT) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
            return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    let geminiSession: LiveSession | null = null;
    let activeSessionId: string | null = null;
    let connectedPhoneNumber: string | null = null;

    const requestOrigin = req.headers.origin;
    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
        if (IS_REPLIT && requestOrigin.includes('.repl.co')) {
            // Allow WebSocket connections from Replit domains
        } else {
            console.warn(`Blocked WS connection from origin ${requestOrigin}`);
            ws.close(1008, 'Origin not allowed');
            return;
        }
    }
    console.log('Client connected');

    // FIX: Changed Buffer to any to avoid type error when @types/node is not present.
    ws.on('message', async (message: any) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'init') {
                const { systemInstruction, voice, user: incomingUser } = data.payload;
                const fullName = (incomingUser?.fullName || '').trim();
                const normalizedPhoneNumber = normalizePhoneNumber(incomingUser?.phoneNumber || '');

                if (!fullName || !normalizedPhoneNumber) {
                    ws.send(JSON.stringify({ type: 'error', payload: 'Full name and phone number are required.' }));
                    ws.close(1008, 'Invalid user information');
                    return;
                }

                if (!isPhoneNumberFormatValid(normalizedPhoneNumber)) {
                    ws.send(JSON.stringify({ type: 'error', payload: 'Invalid phone number format.' }));
                    ws.close(1008, 'Invalid phone number');
                    return;
                }

                let userRecord = await userStore.getUserByPhone(normalizedPhoneNumber);
                if (!userRecord) {
                    userRecord = await userStore.createUser({
                        phoneNumber: normalizedPhoneNumber,
                        fullName,
                        sessions: [],
                    });
                } else if (userRecord.fullName !== fullName) {
                    userRecord = await userStore.updateUser(normalizedPhoneNumber, { fullName });
                }

                const sessionRecord: SessionRecord = {
                    id: randomUUID(),
                    startedAt: new Date().toISOString(),
                    status: 'active' as const,
                };
                userRecord = await userStore.updateUser(normalizedPhoneNumber, {
                    sessions: [...userRecord.sessions, sessionRecord],
                });

                connectedPhoneNumber = normalizedPhoneNumber;
                activeSessionId = sessionRecord.id;
                
                const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

    ws.on('close', async () => {
        console.log('Client disconnected');
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
        if (connectedPhoneNumber && activeSessionId) {
            const record = await userStore.getUserByPhone(connectedPhoneNumber);
            if (record) {
                const updatedSessions = record.sessions.map((session) =>
                    session.id === activeSessionId ? { ...session, status: 'ended' as const } : session
                );
                await userStore.updateUser(connectedPhoneNumber, { sessions: updatedSessions });
            }
        }
    });

    ws.on('error', async (error) => {
        console.error('WebSocket error:', error);
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
        if (connectedPhoneNumber && activeSessionId) {
            const record = await userStore.getUserByPhone(connectedPhoneNumber);
            if (record) {
                const updatedSessions = record.sessions.map((session) =>
                    session.id === activeSessionId ? { ...session, status: 'ended' as const } : session
                );
                await userStore.updateUser(connectedPhoneNumber, { sessions: updatedSessions });
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    if (IS_REPLIT) {
        console.log(`Replit mode detected`);
        console.log(`Frontend URL: ${FRONTEND_URL}`);
        console.log(`WebSocket protocol: ${WS_PROTOCOL}`);
        console.log(`Serving static files from: dist/`);
    }
});

// This is a basic placeholder for a real server implementation.
// In a production environment, you would transpile this TypeScript file to JavaScript.
// For example, using `tsc server/index.ts` which would generate `server/index.js`.
// The package.json's "server" script would then run `node server/index.js`.
