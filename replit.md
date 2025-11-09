# Voice Agent Application

## Overview
Full-stack voice agent application with React frontend, Express backend, WebSocket communication, and Google Gemini AI integration for real-time voice conversations.

## Recent Changes (November 2025)

### Replit Database Migration
- **Migrated from in-memory storage to Replit Database** for persistent user data
- Created `server/store/replitUserStore.ts` implementing the UserStore interface with async/await
- Updated `server/store/userStore.ts` interface to support both sync and async operations
- All user data (phone numbers, names, sessions) now persists across server restarts

### Replit Environment Support
- **Auto-detection of Replit environment** via `REPL_ID`, `REPL_SLUG`, `REPL_OWNER`
- **Automatic URL configuration** - generates `https://${REPL_SLUG}.${REPL_OWNER}.repl.co`
- **Static file serving** - serves frontend from `dist/` folder in production
- **WebSocket protocol** - automatically uses `wss://` on Replit for secure connections
- **CORS configuration** - dynamically allows Replit domains
- **Fallback logic** - gracefully handles missing Replit env vars, falls back to localhost

## Project Structure

### Backend (`/server`)
- `index.ts` - Main Express server with WebSocket and Gemini AI integration
- `store/userStore.ts` - UserStore interface definition
- `store/replitUserStore.ts` - Replit Database implementation of UserStore
- `utils/phoneValidator.ts` - Phone number validation utilities

### Frontend
- React + TypeScript + Vite
- Pages: Login, Agent, Admin Dashboard
- Real-time audio communication via WebSocket
- Built to `/dist` folder for production

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key (set in Replit Secrets)

### Optional (Auto-detected on Replit)
- `FRONTEND_URL` - Frontend URL (default: auto-detected from Replit or localhost:3000)
- `PORT` - Server port (default: 3001 locally, auto-set by Replit)
- `REPL_ID`, `REPL_SLUG`, `REPL_OWNER` - Automatically provided by Replit

## Database

### Replit Database Schema
User records are stored with keys: `user:{phoneNumber}`

```typescript
UserRecord {
  phoneNumber: string
  fullName: string
  sessions: SessionRecord[]
}

SessionRecord {
  id: string
  startedAt: string
  status: 'active' | 'ended'
  metadata?: Record<string, unknown>
}
```

### Database Operations
- `getUserByPhone(phoneNumber)` - Fetch user by phone number
- `createUser({phoneNumber, fullName, sessions?})` - Create new user
- `updateUser(phoneNumber, updates)` - Update existing user
- All operations include `[ReplitDB]` prefixed logging for monitoring

## Development

### Local Development
```bash
npm install
npm run dev        # Frontend dev server (port 3000)
```

To run the backend server locally:
```bash
npx tsx watch server/index.ts
```

### Replit Deployment
1. Set `GEMINI_API_KEY` in Replit Secrets
2. Build frontend: `npm run build`
3. Build backend: `npm run build:server`
4. Server auto-detects Replit and serves both frontend and backend on same port
5. Database automatically persists via Replit Database

## Features
- Phone number-based authentication (no passwords)
- Real-time voice conversations with Google Gemini AI
- Persistent user sessions
- WebSocket-based audio streaming
- Admin dashboard
- Production-ready Replit deployment

## Security
- Helmet.js for security headers
- CORS restricted to allowed origins
- WebSocket origin validation
- Secrets managed via environment variables
- No sensitive data logged

## Monitoring
Database operations log with `[ReplitDB]` prefix for easy monitoring:
- User creation, updates, and fetch operations
- Error tracking with context (phone numbers, update data)
- Replit environment detection logs on startup
