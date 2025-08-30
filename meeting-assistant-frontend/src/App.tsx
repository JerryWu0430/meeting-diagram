import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const DARK_BG = '#181818';
const ORANGE = '#ff8800';
const LIGHT_ORANGE = '#ffb366';

// Mock data for diagram, summary, transcript
const mockDiagrams = [
  {
    nodes: [
      { id: '1', position: { x: 100, y: 100 }, data: { label: 'Meeting Start' }, style: { background: ORANGE, color: '#fff' } },
      { id: '2', position: { x: 300, y: 100 }, data: { label: 'Topic 1' }, style: { background: LIGHT_ORANGE, color: '#181818' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: ORANGE } },
    ],
    summary: 'Meeting started. Topic 1 introduced.',
    transcript: 'User: Let’s begin.\nUser: First, Topic 1.'
  },
  {
    nodes: [
      { id: '1', position: { x: 100, y: 100 }, data: { label: 'Meeting Start' }, style: { background: ORANGE, color: '#fff' } },
      { id: '2', position: { x: 300, y: 100 }, data: { label: 'Topic 1' }, style: { background: LIGHT_ORANGE, color: '#181818' } },
      { id: '3', position: { x: 500, y: 100 }, data: { label: 'Decision' }, style: { background: ORANGE, color: '#fff' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: ORANGE } },
      { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: LIGHT_ORANGE } },
    ],
    summary: 'Decision made on Topic 1.',
    transcript: 'User: Let’s begin.\nUser: First, Topic 1.\nUser: We decided to proceed.'
  },
  {
    nodes: [
      { id: '1', position: { x: 100, y: 100 }, data: { label: 'Meeting Start' }, style: { background: ORANGE, color: '#fff' } },
      { id: '2', position: { x: 300, y: 100 }, data: { label: 'Topic 1' }, style: { background: LIGHT_ORANGE, color: '#181818' } },
      { id: '3', position: { x: 500, y: 100 }, data: { label: 'Decision' }, style: { background: ORANGE, color: '#fff' } },
      { id: '4', position: { x: 300, y: 250 }, data: { label: 'Topic 2' }, style: { background: LIGHT_ORANGE, color: '#181818' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: ORANGE } },
      { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: LIGHT_ORANGE } },
      { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: ORANGE } },
    ],
    summary: 'Topic 2 introduced.',
    transcript: 'User: Let’s begin.\nUser: First, Topic 1.\nUser: We decided to proceed.\nUser: Next, Topic 2.'
  },
];

function App() {
  const [listening, setListening] = useState(false);
  const [step, setStep] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    if (!listening) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % mockDiagrams.length);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [listening]);

  const handleMicClick = useCallback(() => {
    setListening((l) => !l);
    if (!listening) setStep(0);
  }, [listening]);

  const { nodes, edges, summary, transcript } = mockDiagrams[step];

  return (
    <div className="meeting-app-root">
      <div className="diagram-area">
        <ReactFlow nodes={nodes} edges={edges} fitView style={{ background: DARK_BG }}>
          <Background color="#222" gap={16} />
          <MiniMap nodeColor={n => String(n.style?.background || ORANGE)}/>
          <Controls />
        </ReactFlow>
      </div>
      <div className="side-panel">
        <div className="summary-section">
          <h2>Summary</h2>
          <div className="summary-content">{summary}</div>
        </div>
        <div className="transcript-section">
          <h3>Transcript (dev)</h3>
          <pre className="transcript-content">{transcript}</pre>
        </div>
        <button className={`mic-btn${listening ? ' listening' : ''}`} onClick={handleMicClick}>
          <span role="img" aria-label="mic">🎤</span> {listening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
    </div>
  );
}

export default App;
