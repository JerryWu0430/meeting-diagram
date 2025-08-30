'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';

interface VoiceAgentProps {
  className?: string;
}

// Define proper types for transport events
interface TransportEvent {
  type: string;
  delta?: string;
  transcript?: string;
  error?: unknown;
  [key: string]: unknown;
}

interface SessionError {
  type: string;
  error: unknown;
}

export default function VoiceAgent({ className = '' }: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);

  useEffect(() => {
    // Initialize the agent
    agentRef.current = new RealtimeAgent({
      name: 'Meeting Summary Assistant',
      instructions: `You are a helpful meeting summary assistant. You can help users:
      - Summarize meeting notes and discussions
      - Extract key action items and decisions
      - Organize meeting content by topics
      - Provide insights and recommendations based on meeting content
      
      Be conversational, helpful, and focus on making meeting information more accessible and actionable.`,
    });

    return () => {
      if (sessionRef.current) {
        // Close the session properly
        try {
          sessionRef.current.close();
        } catch (err) {
          console.error('Error closing session:', err);
        }
      }
    };
  }, []);

  const connectToSession = async () => {
    if (!agentRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get ephemeral token from our API
      const response = await fetch('/api/realtime-token', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get realtime token');
      }
      
      const data = await response.json();
      console.log('Token response data:', data); // Debug log
      
      // Try different possible response structures
      let clientSecret = data.client_secret?.value;
      if (!clientSecret) {
        clientSecret = data.client_secret;
      }
      if (!clientSecret) {
        clientSecret = data.secret;
      }
      if (!clientSecret) {
        clientSecret = data.value;
      }
      
      if (!clientSecret) {
        console.error('Full response structure:', JSON.stringify(data, null, 2));
        throw new Error(`Invalid token response structure. Expected client_secret.value but got: ${JSON.stringify(data)}`);
      }

      // Create and connect to session
      const session = new RealtimeSession(agentRef.current, {
        model: 'gpt-realtime',
      });

      sessionRef.current = session;

      // Set up event listeners using the correct API
      session.on('transport_event', (event: TransportEvent) => {
        // Handle transcript delta events
        if (event.type === 'transcript_delta') {
          setTranscript(prev => prev + (event.delta || ''));
        }
        // Handle completed transcription
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          setTranscript(event.transcript || '');
        }
        // Handle errors
        if (event.type === 'error') {
          console.error('Transport error:', event.error);
          setError('Transport error occurred');
        }
      });

      session.on('audio_start', () => {
        setIsListening(false);
      });

      session.on('audio_stopped', () => {
        setIsListening(true);
      });

      session.on('error', (error: SessionError) => {
        console.error('Session error:', error);
        setError('Session error occurred');
        setIsConnected(false);
        setIsListening(false);
      });

      // Connect to the session
      await session.connect({ apiKey: clientSecret });
      
      setIsConnected(true);
      setIsListening(true);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        sessionRef.current = null;
      } catch (err) {
        console.error('Error closing session:', err);
      }
    }
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Voice Meeting Assistant
      </h2>
      
      <div className="space-y-4">
        {!isConnected ? (
          <button
            onClick={connectToSession}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Start Voice Session'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Status: {isListening ? 'Listening' : 'Processing'}
              </span>
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Live Transcript:</h3>
              <p className="text-gray-800 min-h-[60px]">
                {transcript || 'Start speaking to see the transcript...'}
              </p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>🎤 Speak naturally to interact with your meeting assistant</p>
              <p>💡 Ask for summaries, action items, or insights</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
