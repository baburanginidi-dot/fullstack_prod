# Gemini Voice Agent Portal

A full-stack voice agent application built with React, TypeScript, Express, and Google's Gemini AI. Users can interact with an AI voice agent through real-time audio conversations. The system uses phone numbers as unique identifiers and supports session management.

## 🚀 Features

- **Real-time Voice Conversations**: Interact with AI agent using voice input/output
- **Phone Number Authentication**: Simple authentication using phone numbers (no passwords)
- **Session Management**: Track and manage user sessions
- **Admin Dashboard**: Manage prompts, knowledge base, and settings
- **WebSocket Communication**: Real-time bidirectional communication
- **Persistent Storage**: User data and sessions stored in database (Replit Database)

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Replit account (for deployment) or local development environment

## 🛠️ Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd fullstack_prod

# Install dependencies
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# WebSocket Configuration
WS_URL=ws://localhost:3001
```

### 3. Build and Run

```bash
# Build frontend and backend
npm run build
npm run build:server

# Start the server
npm run start:server

# In another terminal, start frontend dev server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🚀 Replit Deployment

This application is optimized for Replit deployment. Follow these steps to deploy on Replit:

### Step 1: Create Replit Project

1. Go to [Replit](https://replit.com) and create a new Repl
2. Choose **Node.js** as the language template
3. Import this repository or upload the project files

### Step 2: Install Replit Database

The application uses Replit Database for persistent storage. Install it:

```bash
npm install @replit/database
```

### Step 3: Configure Replit Secrets

1. In Replit, click on the **Secrets** tab (lock icon) in the left sidebar
2. Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `GEMINI_API_KEY` | `your_api_key_here` | Your Google Gemini API key (Required) |
| `FRONTEND_URL` | `https://your-repl-name.your-username.repl.co` | Your Replit URL (Optional, auto-detected) |
| `WS_URL` | `wss://your-repl-name.your-username.repl.co` | WebSocket URL (Optional, auto-detected) |

**Note**: Replit automatically provides `REPL_ID`, `REPL_SLUG`, and `REPL_OWNER` environment variables. The application will auto-detect the Replit URL if `FRONTEND_URL` is not set.

### Step 4: Configure .replit File

Create a `.replit` file in the root directory (if not exists):

```toml
# .replit
language = "nodejs"

[deploy]
run = ["sh", "-c", "npm install && npm run build && npm run build:server && node server/index.js"]

[env]
PORT = "3001"
NODE_ENV = "production"
```

### Step 5: Update package.json Scripts

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "start:server": "node server/index.js",
    "start": "npm run build && npm run build:server && npm run start:server"
  }
}
```

### Step 6: Build and Deploy

1. Click the **Run** button in Replit (or press `Ctrl+Enter`)
2. Replit will automatically:
   - Install dependencies
   - Build the frontend (React app)
   - Compile TypeScript server code
   - Start the server

### Step 7: Access Your Application

Once deployed, your application will be available at:
- **URL**: `https://your-repl-name.your-username.repl.co`
- The frontend and backend will be served from the same domain

## 🔧 Replit-Specific Configuration

### Auto-Detection of Replit Environment

The application automatically detects if it's running on Replit and configures:

- **Frontend URL**: Auto-detected from `REPL_SLUG` and `REPL_OWNER`
- **WebSocket URL**: Auto-converted to `wss://` for secure connections
- **CORS**: Automatically allows Replit domain
- **Static Files**: Frontend served from Express server

### Database Integration

The application uses Replit Database for persistent storage:

```typescript
// Example: Using Replit Database
import { Client } from '@replit/database';
const db = new Client();

// Store data
await db.set('key', 'value');

// Retrieve data
const value = await db.get('key');
```

### Environment Variables in Replit

Replit provides these environment variables automatically:
- `REPL_ID`: Unique Repl identifier
- `REPL_SLUG`: Repl name
- `REPL_OWNER`: Repl owner username
- `PORT`: Server port (automatically assigned)

## 📁 Project Structure

```
fullstack_prod/
├── server/                 # Backend server
│   ├── index.ts           # Main server file
│   ├── store/             # Database store
│   │   └── userStore.ts   # User data store
│   └── utils/             # Utility functions
│       └── phoneValidator.ts
├── pages/                 # React pages
│   ├── admin/            # Admin pages
│   └── voice/            # Voice agent pages
├── context/              # React context
├── layouts/              # Layout components
├── dist/                 # Built frontend (generated)
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## 🔐 Security Features

- **API Key Protection**: API keys stored server-side only
- **CORS Configuration**: Restricted to allowed origins
- **Security Headers**: Helmet.js for security headers
- **WebSocket Authentication**: Origin validation for WebSocket connections
- **Input Validation**: Phone number and user input validation

## 🐛 Troubleshooting

### Issue: "Missing GEMINI_API_KEY"

**Solution**: Make sure you've set the `GEMINI_API_KEY` secret in Replit Secrets tab.

### Issue: WebSocket Connection Failed

**Solution**: 
1. Check if `WS_URL` is correctly configured
2. Ensure WebSocket URL uses `wss://` for HTTPS connections
3. Verify CORS settings allow your Replit domain

### Issue: Frontend Not Loading

**Solution**:
1. Ensure frontend is built: `npm run build`
2. Check if static files are being served from Express
3. Verify `dist/` folder exists with built files

### Issue: Database Not Persisting Data

**Solution**:
1. Ensure `@replit/database` is installed
2. Check if Replit Database is properly initialized
3. Verify database operations are using async/await

### Issue: CORS Errors

**Solution**:
1. Update `FRONTEND_URL` in Replit Secrets
2. Ensure CORS middleware is configured correctly
3. Check WebSocket origin validation

## 📝 API Documentation

### WebSocket API

#### Connection
- **URL**: `ws://localhost:3001` (local) or `wss://your-repl.repl.co` (Replit)
- **Protocol**: WebSocket

#### Message Types

##### Initialize Connection
```json
{
  "type": "init",
  "payload": {
    "systemInstruction": "You are a helpful assistant.",
    "voice": "Zephyr",
    "user": {
      "fullName": "John Doe",
      "phoneNumber": "+1234567890"
    }
  }
}
```

##### Send Audio
```json
{
  "type": "audio",
  "payload": "base64_encoded_audio_data"
}
```

##### Receive Response
```json
{
  "type": "gemini_response",
  "payload": {
    "serverContent": {
      "modelTurn": {
        "parts": [{
          "inlineData": {
            "data": "base64_audio_response"
          }
        }]
      }
    }
  }
}
```

## 🧪 Testing

### Local Testing

```bash
# Run frontend dev server
npm run dev

# Run backend server
npm run dev:server

# Test WebSocket connection
# Use browser console or WebSocket client
```

### Replit Testing

1. Deploy to Replit
2. Open the Replit URL in browser
3. Test voice agent functionality
4. Check server logs in Replit console

## 📦 Dependencies

### Production Dependencies
- `@google/genai`: Google Gemini AI SDK
- `express`: Web server framework
- `ws`: WebSocket library
- `cors`: CORS middleware
- `helmet`: Security headers
- `react`: React framework
- `react-router-dom`: React routing
- `@replit/database`: Replit Database client

### Development Dependencies
- `typescript`: TypeScript compiler
- `vite`: Build tool
- `@vitejs/plugin-react`: Vite React plugin
- `ts-node-dev`: TypeScript development server

## 🚀 Deployment Checklist

Before deploying to Replit, ensure:

- [ ] All dependencies are installed
- [ ] `GEMINI_API_KEY` is set in Replit Secrets
- [ ] `.replit` file is configured
- [ ] Frontend is built (`npm run build`)
- [ ] Server TypeScript is compiled (`npm run build:server`)
- [ ] Replit Database is installed (`npm install @replit/database`)
- [ ] Environment variables are configured
- [ ] CORS is properly configured for Replit domain
- [ ] WebSocket URL is correctly set

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Replit deployment documentation
3. Check server logs in Replit console
4. Verify environment variables and secrets

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
npm update
```

### Rebuilding After Changes

```bash
# Rebuild everything
npm run build
npm run build:server

# Restart server
npm run start:server
```

---

**Note**: This application is optimized for Replit deployment. For local development, ensure all environment variables are set in `.env` file.

