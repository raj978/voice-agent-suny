# Bluejay Voice Chat Room with Transcription

A real-time voice-enabled chatbot using LiveKit where users can converse with "Sunny," a friendly weather expert agent who specializes in San Ramon, CA weather conditions.

## 🌟 Features

- **Real-time Voice Chat**: Seamless voice conversation with AI agent
- **Live Transcription**: Real-time speech-to-text for both user and agent
- **Weather Integration**: Ask about current weather in San Ramon, CA
- **Creative Agent Personality**: Meet Sunny, your local weather expert
- **Responsive UI**: Clean, modern interface built with Next.js and Tailwind CSS
- **AWS Deployment Ready**: Includes deployment scripts for AWS ECS

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Real-time**: LiveKit React components
- **Features**: Voice controls, live transcript, connection status

### Backend (Python)
- **Agent Framework**: LiveKit Agents
- **Speech-to-Text**: Deepgram
- **Text-to-Speech**: OpenAI TTS (Nova voice)
- **LLM**: OpenAI GPT-4o-mini
- **Voice Activity Detection**: Silero VAD
- **Weather API**: OpenWeatherMap

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- LiveKit Cloud account (free tier)
- OpenAI API key
- Deepgram API key
- OpenWeatherMap API key (optional)

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Update .env.local with your LiveKit credentials
# NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
# LIVEKIT_API_KEY=your-api-key
# LIVEKIT_API_SECRET=your-api-secret

# Start development server
npm run dev
```

### 2. Backend Setup

```bash
cd backend

# Run setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and update environment file
cp .env.example .env
# Update .env with your API keys

# Start the agent
python weather_agent.py dev
```

### 3. LiveKit Cloud Setup

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Copy your WebSocket URL, API Key, and API Secret
4. Update both frontend and backend environment files

## 🌤️ Meet Sunny - Your Weather Agent

Sunny is a cheerful weather expert who has lived in San Ramon, California for over 20 years. Key personality traits:

- **Friendly & Enthusiastic**: Always positive and warm
- **Local Expert**: Deep knowledge of San Ramon's weather patterns
- **Conversational**: Speaks naturally, not like a robot
- **Informative**: Provides current weather data plus local insights

### Try These Prompts:
- "What's the weather like in San Ramon?"
- "Should I bring a jacket today?"
- "Tell me about the local weather patterns"
- "How's the weather compared to yesterday?"

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

**Backend (.env):**
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-key
DEEPGRAM_API_KEY=your-deepgram-key
OPENWEATHER_API_KEY=your-weather-key
```

## 🚀 Deployment

### Local Development
```bash
# Frontend
npm run dev

# Backend
cd backend
python weather_agent.py dev
```

### Production

**Frontend (Vercel):**
```bash
npm run build
# Deploy to Vercel or your preferred platform
```

**Backend (AWS ECS - Bonus Points!):**
```bash
cd backend
python deploy_aws.py
# Follow the deployment instructions
```

**Backend (Docker):**
```bash
cd backend
docker-compose up -d
```

## 💰 Cost Breakdown (Under $10 Budget)

- **LiveKit Cloud**: Free tier (sufficient for demo)
- **OpenAI API**: ~$2-3 for testing
- **Deepgram**: Free tier (45,000 minutes)
- **OpenWeatherMap**: Free tier
- **AWS ECS Fargate**: ~$5-7/month (if deployed)

**Total Estimated Cost**: $2-10 depending on usage

## 🛠️ AI Tools Used

- **GitHub Copilot**: Code completion and suggestions
- **ChatGPT**: Architecture planning and documentation
- **Claude**: Code review and optimization suggestions

## 🎯 Design Decisions & Assumptions

### Design Choices:
1. **Next.js App Router**: Modern React framework with excellent TypeScript support
2. **LiveKit**: Industry-standard WebRTC solution with great developer experience
3. **Modular Architecture**: Separate frontend/backend for scalability
4. **Function Calling**: Used OpenAI function calling for weather API integration
5. **Real-time Transcription**: Enhanced user experience with live text feedback

### Assumptions:
- Users have modern browsers with WebRTC support
- Primary use case is desktop/mobile web (not native apps)
- English language only for this demo
- San Ramon, CA as the primary location focus

### Limitations & Trade-offs:
- **Weather API Dependency**: Limited functionality without OpenWeatherMap key
- **Voice Quality**: Dependent on user's microphone and network connection
- **Latency**: Some delay expected due to STT → LLM → TTS pipeline
- **Concurrent Users**: Free tier limits simultaneous connections
- **Mobile Experience**: May require additional optimization for mobile browsers

## 📁 Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/token/         # LiveKit token generation
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat interface
├── backend/               # Python agent backend
│   ├── weather_agent.py   # Main agent code
│   ├── deploy_aws.py      # AWS deployment script
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Container configuration
│   └── setup.sh          # Setup script
├── components/ui/         # shadcn/ui components
└── README.md             # This file
\`\`\`

## 🧪 Testing

1. **Start both frontend and backend**
2. **Click "Start Call"** to join the room
3. **Wait for Sunny's welcome message**
4. **Ask about weather**: "What's the weather in San Ramon?"
5. **Check transcript** updates in real-time
6. **Test voice controls** (mute/unmute, end call)

## 🤝 Contributing

This is a take-home interview project, but feel free to:
- Report bugs or issues
- Suggest improvements
- Fork for your own experiments

## 📄 License

MIT License - feel free to use this code for your own projects!

---

**Built with ❤️ by Rajat for the Bluejay take-home **
