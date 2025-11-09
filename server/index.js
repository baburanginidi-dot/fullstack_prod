"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const crypto_1 = require("crypto");
const ws_1 = require("ws");
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const phoneValidator_1 = require("./utils/phoneValidator");
const userStore_1 = require("./store/userStore");
dotenv_1.default.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const PORT = process.env.PORT || 3001;
wss.on('connection', (ws, req) => {
    let geminiSession = null;
    let activeSessionId = null;
    let connectedPhoneNumber = null;
    const requestOrigin = req.headers.origin;
    if (requestOrigin && requestOrigin !== FRONTEND_URL) {
        console.warn(`Blocked WS connection from origin ${requestOrigin}`);
        ws.close(1008, 'Origin not allowed');
        return;
    }
    console.log('Client connected');
    // FIX: Changed Buffer to any to avoid type error when @types/node is not present.
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'init') {
                const { systemInstruction, voice, user: incomingUser } = data.payload;
                const fullName = (incomingUser?.fullName || '').trim();
                const normalizedPhoneNumber = (0, phoneValidator_1.normalizePhoneNumber)(incomingUser?.phoneNumber || '');
                if (!fullName || !normalizedPhoneNumber) {
                    ws.send(JSON.stringify({ type: 'error', payload: 'Full name and phone number are required.' }));
                    ws.close(1008, 'Invalid user information');
                    return;
                }
                if (!(0, phoneValidator_1.isPhoneNumberFormatValid)(normalizedPhoneNumber)) {
                    ws.send(JSON.stringify({ type: 'error', payload: 'Invalid phone number format.' }));
                    ws.close(1008, 'Invalid phone number');
                    return;
                }
                const phoneIsUnique = (0, phoneValidator_1.isPhoneNumberUnique)(normalizedPhoneNumber, (phone) => Boolean(userStore_1.userStore.getUserByPhone(phone)));
                let userRecord = userStore_1.userStore.getUserByPhone(normalizedPhoneNumber);
                if (phoneIsUnique || !userRecord) {
                    userRecord = userStore_1.userStore.createUser({
                        phoneNumber: normalizedPhoneNumber,
                        fullName,
                        sessions: [],
                    });
                }
                else if (userRecord.fullName !== fullName) {
                    userRecord = userStore_1.userStore.updateUser(normalizedPhoneNumber, { fullName });
                }
                const sessionRecord = {
                    id: (0, crypto_1.randomUUID)(),
                    startedAt: new Date().toISOString(),
                    status: 'active',
                };
                userRecord = userStore_1.userStore.updateUser(normalizedPhoneNumber, {
                    sessions: [...userRecord.sessions, sessionRecord],
                });
                connectedPhoneNumber = normalizedPhoneNumber;
                activeSessionId = sessionRecord.id;
                const ai = new genai_1.GoogleGenAI({ apiKey: GEMINI_API_KEY });
                geminiSession = await ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [genai_1.Modality.AUDIO],
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
            }
            else if (data.type === 'audio' && geminiSession) {
                const pcmBlob = {
                    data: data.payload, // base64 string from client
                    mimeType: 'audio/pcm;rate=16000',
                };
                await geminiSession.sendRealtimeInput({ media: pcmBlob });
            }
        }
        catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
        if (connectedPhoneNumber && activeSessionId) {
            const record = userStore_1.userStore.getUserByPhone(connectedPhoneNumber);
            if (record) {
                const updatedSessions = record.sessions.map((session) => session.id === activeSessionId ? { ...session, status: 'ended' } : session);
                userStore_1.userStore.updateUser(connectedPhoneNumber, { sessions: updatedSessions });
            }
        }
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
        if (connectedPhoneNumber && activeSessionId) {
            const record = userStore_1.userStore.getUserByPhone(connectedPhoneNumber);
            if (record) {
                const updatedSessions = record.sessions.map((session) => session.id === activeSessionId ? { ...session, status: 'ended' } : session);
                userStore_1.userStore.updateUser(connectedPhoneNumber, { sessions: updatedSessions });
            }
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
