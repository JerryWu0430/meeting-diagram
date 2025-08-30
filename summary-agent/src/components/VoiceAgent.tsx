'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

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
  const [transcriptSegments, setTranscriptSegments] = useState<Array<{id: string, text: string, timestamp: Date}>>([]);
  const [summary, setSummary] = useState<string>('');
  const [diagram, setDiagram] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const summaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diagramTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentIdRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // State for diagram rendering
  const [diagramSvg, setDiagramSvg] = useState<string>('');
  const [diagramError, setDiagramError] = useState<string>('');
  
  // State for meeting type selection
  const [meetingType, setMeetingType] = useState<string>('general');
  const [availableMeetingTypes, setAvailableMeetingTypes] = useState<Array<{id: string, name: string, description: string}>>([]);

  // Function to get complete transcript from all segments
  const getCompleteTranscript = useCallback(() => {
    if (transcriptSegments.length === 0) return transcript;
    
    // Combine all transcript segments with timestamps for context
    const completeTranscript = transcriptSegments
      .map((segment, index) => `[Segment ${index + 1} - ${segment.timestamp.toLocaleTimeString()}]: ${segment.text}`)
      .join('\n\n');
    
    // Add current transcript if it exists and is different from the last segment
    if (transcript && transcript.trim() && 
        (!transcriptSegments.length || transcriptSegments[transcriptSegments.length - 1].text !== transcript.trim())) {
      return completeTranscript + `\n\n[Current]: ${transcript}`;
    }
    
    return completeTranscript;
  }, [transcript, transcriptSegments]);

  // Function to generate summary from transcript
  const generateSummary = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 50) return; // Only summarize if there's substantial content
    
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: text, meetingType }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || 'Summary generated successfully');
      } else {
        console.error('Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [meetingType]);

  // Function to generate diagram from transcript
  const generateDiagram = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 100) return; // Only generate diagram if there's substantial content
    
    setIsGeneratingDiagram(true);
    setDiagramError(''); // Clear any previous errors
    
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript: text,
          summary: summary || undefined // Include current summary if available
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const diagramCode = data.diagram;
        
        if (diagramCode) {
          // Generate unique ID for this diagram
          const diagramId = `diagram-${Date.now()}`;
          
          try {
            // Log the diagram code for debugging
            console.log('Attempting to render diagram:', diagramCode);
            
            // Render the Mermaid diagram
            const { svg } = await mermaid.render(diagramId, diagramCode);
            
            console.log('Mermaid rendering successful');
            
            // Use React state instead of direct DOM manipulation
            setDiagramSvg(svg);
            setDiagram(diagramCode);
            setDiagramError('');
                    } catch (mermaidError) {
            console.error('Mermaid rendering error:', mermaidError);
            console.error('Invalid diagram code:', diagramCode);
            
            // Try a fallback: clean the diagram code and try again
            try {
              console.log('Attempting fallback rendering with cleaned code...');
              const cleanedCode = diagramCode
                .replace(/\r\n/g, '\n')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();
              
              const fallbackId = `diagram-fallback-${Date.now()}`;
              const { svg } = await mermaid.render(fallbackId, cleanedCode);
              
              console.log('Fallback rendering successful');
              setDiagramSvg(svg);
              setDiagram(cleanedCode);
              setDiagramError('');
            } catch (fallbackError) {
              console.error('Fallback rendering also failed:', fallbackError);
              
              // Set error state instead of manipulating DOM
              setDiagramSvg('');
              setDiagramError(`Failed to render diagram. The generated Mermaid syntax may be invalid.\n\nRaw diagram code:\n${diagramCode}`);
            }
          }
        }
      } else {
        console.error('Failed to generate diagram');
        setDiagramError('Failed to generate diagram from the API.');
      }
    } catch (err) {
      console.error('Error generating diagram:', err);
      setDiagramError('Error occurred while generating diagram.');
    } finally {
      setIsGeneratingDiagram(false);
    }
  }, [summary]);

  // Debounced summary and diagram generation
  useEffect(() => {
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
    }
    if (diagramTimeoutRef.current) {
      clearTimeout(diagramTimeoutRef.current);
    }
    
    if (transcript.length > 0 || transcriptSegments.length > 0) {
      const completeTranscript = getCompleteTranscript();
      
      summaryTimeoutRef.current = setTimeout(() => {
        generateSummary(completeTranscript);
      }, 2000); // Wait 2 seconds after transcript stops updating
      
      // Generate diagram with a longer delay to allow more content
      diagramTimeoutRef.current = setTimeout(() => {
        generateDiagram(completeTranscript);
      }, 5000); // Wait 5 seconds for diagram generation
    }
    
    return () => {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
      }
    };
  }, [transcript, transcriptSegments, generateDiagram, generateSummary, getCompleteTranscript]);

  // Function to add new transcript segment
  const addTranscriptSegment = (text: string) => {
    if (text.trim()) {
      const newSegment = {
        id: `segment-${segmentIdRef.current++}`,
        text: text.trim(),
        timestamp: new Date()
      };
      setTranscriptSegments(prev => [...prev, newSegment]);
      lastActivityRef.current = Date.now();
    }
  };

  // Function to clear all transcript segments
  const clearTranscripts = () => {
    setTranscriptSegments([]);
    setTranscript('');
    setSummary('');
    setDiagram('');
    setDiagramSvg('');
    setDiagramError('');
  };

  // Function to handle connection errors gracefully
  const handleConnectionError = (error: unknown, isReconnect: boolean = false) => {
    console.error('Connection error:', error);
    
    // Check if it's a timeout/abort error
    const errorObj = error as { error?: { message?: string }; type?: string; message?: string };
    if (errorObj?.error?.message?.includes('User-Initiated Abort') || 
        errorObj?.error?.message?.includes('timeout') ||
        errorObj?.type === 'error') {
      
      if (isReconnect) {
        setError('Reconnection failed. Please try starting a new session.');
        setConnectionStatus('disconnected');
      } else {
        setError('Connection timed out. Attempting to reconnect...');
        setConnectionStatus('reconnecting');
        
        // Attempt to reconnect after a short delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (sessionRef.current) {
            try {
              sessionRef.current.close();
            } catch (err) {
              console.error('Error closing session during reconnect:', err);
            }
            sessionRef.current = null;
          }
          setIsConnected(false);
          setIsListening(false);
          setTranscript('');
          
          // Try to reconnect
          setTimeout(() => {
            connectToSession(true);
          }, 1000);
        }, 2000);
      }
    } else {
      setError(`Connection error: ${errorObj?.error?.message || errorObj?.message || 'Unknown error'}`);
      setConnectionStatus('disconnected');
    }
  };

  // Function to attempt reconnection
  const attemptReconnect = () => {
    if (connectionStatus === 'reconnecting') return;
    
    setConnectionStatus('reconnecting');
    setError('Attempting to reconnect...');
    
    setTimeout(() => {
      connectToSession(true);
    }, 1000);
  };

  // Fetch available meeting types on component mount
  useEffect(() => {
    const fetchMeetingTypes = async () => {
      try {
        const response = await fetch('/api/summarize');
        if (response.ok) {
          const data = await response.json();
          setAvailableMeetingTypes(data.meetingTypes || []);
        }
      } catch (error) {
        console.error('Failed to fetch meeting types:', error);
      }
    };
    
    fetchMeetingTypes();
  }, []);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });

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
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
      }
    };
  }, []);

  const connectToSession = async (isReconnect: boolean = false) => {
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
          lastActivityRef.current = Date.now();
        }
        // Handle completed transcription
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          const completedText = event.transcript || '';
          setTranscript(completedText);
          // Add the completed transcript as a new segment
          addTranscriptSegment(completedText);
          lastActivityRef.current = Date.now();
        }
        // Handle errors
        if (event.type === 'error') {
          console.error('Transport error:', event);
          // Handle empty error objects and provide meaningful error information
          if (!event.error || Object.keys(event.error).length === 0) {
            handleConnectionError({ 
              type: 'transport_error', 
              message: 'Transport layer error occurred - this may indicate a network or WebRTC issue' 
            }, false);
          } else {
            handleConnectionError(event, false);
          }
        }
      });

      session.on('audio_start', () => {
        setIsListening(false);
        lastActivityRef.current = Date.now();
      });

      session.on('audio_stopped', () => {
        setIsListening(true);
        lastActivityRef.current = Date.now();
      });

      session.on('error', (error: SessionError) => {
        console.error('Session error:', error);
        // Handle empty error objects and provide meaningful error information
        if (!error || Object.keys(error).length === 0) {
          handleConnectionError({ 
            type: 'session_error', 
            message: 'Session error occurred - this may indicate a connection or API issue' 
          }, false);
        } else {
          handleConnectionError(error, false);
        }
      });

      // Note: connection_state_change event is not available in this version
      // Connection state is managed through the existing error handlers

      // Connect to the session with timeout
      const connectionPromise = session.connect({ apiKey: clientSecret });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      setIsConnected(true);
      setIsListening(true);
      setConnectionStatus('connected');
      setError(null);
      lastActivityRef.current = Date.now();
    } catch (err) {
      console.error('Connection error:', err);
      
      // Handle specific WebRTC errors
      if (err instanceof Error) {
        if (err.message.includes('Failed to parse SessionDescription')) {
          setError('WebRTC connection failed. Please check your network connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Connection timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to establish connection');
      }
      
      if (isReconnect) {
        handleConnectionError(err, true);
      } else {
        setConnectionStatus('disconnected');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // Clear any pending timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        sessionRef.current = null;
      } catch (err) {
        console.error('Error closing session:', err);
      }
    }
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
    }
    if (diagramTimeoutRef.current) {
      clearTimeout(diagramTimeoutRef.current);
    }
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
    setConnectionStatus('disconnected');
    setError(null);
    // Don't clear transcriptSegments, summary, and diagram - keep them for the session
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg max-w-none w-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Voice Meeting Assistant
        </h2>
        
        {/* Meeting Type Selector */}
        {availableMeetingTypes.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="meeting-type" className="text-sm font-medium text-gray-700">
              Meeting Type:
            </label>
            <select
              id="meeting-type"
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
              style={{ color: '#111827' }}
            >
              {availableMeetingTypes.map((type) => (
                <option key={type.id} value={type.id} title={type.description} className="text-gray-900 bg-white">
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <button
                onClick={() => connectToSession()}
                disabled={isConnecting || connectionStatus === 'reconnecting'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isConnecting ? 'Connecting...' : 
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Start Voice Session'}
              </button>
              
              {connectionStatus === 'reconnecting' && (
                <button
                  onClick={() => attemptReconnect()}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
              )}
            </div>
            
            {/* Show session data even when disconnected */}
            {(transcriptSegments.length > 0 || summary || diagram || diagramSvg) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">Session Data</h3>
                  <button
                    onClick={clearTranscripts}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear Session
                  </button>
                </div>
                
                {/* Two-column layout: diagram on left, transcript+summary on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Meeting Diagram - Takes up 2 columns (left side) */}
                  <div className="lg:col-span-2 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                      🏗️ System Architecture Diagram
                      {isGeneratingDiagram && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                          Generating...
                        </span>
                      )}
                    </h3>
                    <div className="bg-white p-6 rounded border min-h-96 overflow-auto">
                      <div className="w-full h-full">
                        {diagramError ? (
                          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm mb-2">Failed to render diagram</p>
                            <details className="mt-2">
                              <summary className="text-xs text-red-600 cursor-pointer">Show details</summary>
                              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                                {diagramError}
                              </pre>
                            </details>
                          </div>
                        ) : diagramSvg ? (
                          <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                        ) : isGeneratingDiagram ? (
                          <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 text-base">Generating system architecture diagram...</p>
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-500 text-base">
                              System architecture diagram will appear here as you discuss technical systems...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column: Transcript and Summary stacked */}
                  <div className="space-y-6">
                    {/* Transcript Segments List */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        📝 Transcript Segments
                        {transcriptSegments.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {transcriptSegments.length} segments
                          </span>
                        )}
                      </h3>
                      <div className="bg-white rounded border max-h-64 overflow-y-auto">
                        {transcriptSegments.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No transcript segments yet...
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {transcriptSegments.map((segment, index) => (
                              <div key={segment.id} className="p-3 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Segment {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {segment.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {segment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Session Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        🎯 Live Summary
                      </h3>
                      <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                        {summary ? (
                          <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No summary generated yet...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Status: {isListening ? 'Listening' : 'Processing'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const completeTranscript = getCompleteTranscript();
                    generateDiagram(completeTranscript);
                  }}
                  disabled={
                    (!transcript && transcriptSegments.length === 0) || 
                    getCompleteTranscript().length < 100 || 
                    isGeneratingDiagram
                  }
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Generate Diagram
                </button>
                <button
                  onClick={clearTranscripts}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={disconnect}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
            
            {/* Two-column layout: diagram on left, transcript+summary on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Meeting Diagram - Takes up 2 columns (left side) */}
              <div className="lg:col-span-2 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                                        🏗️ System Architecture Diagram
                  {isGeneratingDiagram && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full animate-pulse">
                      Generating...
                    </span>
                  )}
                </h3>
                <div className="bg-white p-6 rounded border min-h-96 overflow-auto">
                  <div className="w-full h-full">
                    {diagramError ? (
                      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm mb-2">Failed to render diagram</p>
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer">Show details</summary>
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                            {diagramError}
                          </pre>
                        </details>
                      </div>
                    ) : diagramSvg ? (
                      <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                    ) : isGeneratingDiagram ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-base">Generating system architecture diagram...</p>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-500 text-base">
                          System architecture diagram will appear here as you discuss technical systems...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: Transcript and Summary stacked */}
              <div className="space-y-6">
                {/* Transcript Segments List */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    📝 Transcript Segments
                    {transcriptSegments.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {transcriptSegments.length} segments
                      </span>
                    )}
                  </h3>
                  <div className="bg-white rounded border max-h-64 overflow-y-auto">
                    {transcriptSegments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Start speaking to see transcript segments...
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {transcriptSegments.map((segment, index) => (
                          <div key={segment.id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Segment {index + 1}
                              </span>
                              <span className="text-xs text-gray-400">
                                {segment.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm leading-relaxed">
                              {segment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Real-time Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    🎯 Live Summary
                    {isGeneratingSummary && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
                        Updating...
                      </span>
                    )}
                  </h3>
                  <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                    {summary ? (
                      <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    ) : transcriptSegments.length > 0 ? (
                      <div className="text-gray-500 text-sm">
                        {isGeneratingSummary ? 'Generating summary...' : 'Summary will appear here shortly...'}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Summary will appear here as you speak...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 How it works:</p>
              <p>🎤 Speak naturally to interact with your meeting assistant</p>
              <p>📝 Each speech segment appears as a separate item in the transcript list</p>
              <p>🎯 AI-generated summaries update automatically in the middle column</p>
              <p>🏗️ System architecture diagrams are generated from technical discussions</p>
              <p>⏱️ Summaries refresh every 2 seconds, diagrams every 5 seconds after you stop speaking</p>
              <p>🗑️ Use &quot;Clear All&quot; to reset all session data</p>
              <p>💾 Your session data is preserved even after disconnecting</p>
              <p>🔄 Automatic reconnection handles timeout disconnections</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
            {connectionStatus === 'reconnecting' && (
              <button
                onClick={() => attemptReconnect()}
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1 px-3 rounded text-xs transition-colors"
              >
                Retry Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
