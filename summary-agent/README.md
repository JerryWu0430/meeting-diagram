# Meeting Summary Assistant

A voice-powered AI assistant built with OpenAI Agents SDK and Next.js that helps you summarize meetings, extract action items, and organize discussions.

## Features

- 🎤 **Voice Interaction**: Speak naturally to interact with your AI assistant
- 📝 **Smart Summaries**: Get instant AI-powered summaries of meeting content
- ✅ **Action Items**: Automatically extract and organize follow-up tasks
- 🧠 **AI-Powered**: Built on OpenAI's latest GPT models for intelligent assistance

## Setup

### Prerequisites

- Node.js 18+ 
- OpenAI API key with access to the Realtime API

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
# OpenAI API Key for Voice Agent
OPENAI_API_KEY=your_actual_openai_api_key_here
```

**Important**: Replace `your_actual_openai_api_key_here` with your real OpenAI API key.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start Voice Session**: Click "Start Voice Session" to begin
2. **Grant Microphone Access**: Allow microphone access when prompted
3. **Speak Naturally**: Share your meeting content, questions, or requests
4. **Get AI Assistance**: Receive summaries, insights, and organized information

## How It Works

The application uses OpenAI's Realtime API to provide real-time voice interaction:

1. **Connection**: Establishes a secure WebRTC connection to OpenAI
2. **Voice Processing**: Converts speech to text in real-time
3. **AI Analysis**: Processes content using GPT models
4. **Response**: Provides intelligent summaries and insights

## Technical Details

- **Frontend**: Next.js 15 with React 19
- **Voice Processing**: OpenAI Realtime API with WebRTC
- **AI Models**: GPT-Realtime for voice interactions
- **Styling**: Tailwind CSS for modern UI

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key with Realtime API access | Yes |

## Troubleshooting

- **Microphone Access**: Ensure your browser has permission to access the microphone
- **API Key**: Verify your OpenAI API key is correct and has Realtime API access
- **Network**: Check your internet connection for WebRTC connectivity

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License - see LICENSE file for details.
