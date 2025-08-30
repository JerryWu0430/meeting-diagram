import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to sanitize and validate Mermaid syntax
function sanitizeMermaidResponse(response: string): string {
  // Remove any markdown code blocks
  let cleaned = response.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any extra whitespace and normalize line endings
  cleaned = cleaned.trim().replace(/\r\n/g, '\n');
  
  // If everything is on one line after the flowchart declaration, split it
  const lines = cleaned.split('\n');
  const expandedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if this line starts with flowchart/graph declaration
    if (/^(flowchart|graph)\s+(TD|LR|TB|RL)/i.test(trimmedLine)) {
      // Extract the declaration and the rest
      const match = trimmedLine.match(/^((?:flowchart|graph)\s+(?:TD|LR|TB|RL))\s*(.*)$/i);
      if (match) {
        expandedLines.push(match[1]);
        const rest = match[2].trim();
        if (rest) {
          // Simple approach: split by arrows and reconstruct
          const parts = rest.split('-->').map(p => p.trim());
          
          for (let i = 0; i < parts.length - 1; i++) {
            let currentNode = parts[i];
            const nextPart = parts[i + 1];
            
            // If currentNode has multiple nodes (like "B[Discussion] B"), take the last one
            const currentNodeMatch = currentNode.match(/(\w+(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\})*)(?:\s+\w+(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\})*)*$/);
            if (currentNodeMatch) {
              // Find all node patterns and take the last one
              const nodeMatches = currentNode.match(/\w+(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\})*/g);
              if (nodeMatches && nodeMatches.length > 0) {
                currentNode = nodeMatches[nodeMatches.length - 1];
              }
            }
            
            // Extract the first node from nextPart
            const nextNodeMatch = nextPart.match(/^(\w+(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\})*)/);
            const nextNode = nextNodeMatch ? nextNodeMatch[1] : nextPart.split(' ')[0];
            
            if (currentNode && nextNode) {
              expandedLines.push(`    ${currentNode} --> ${nextNode}`);
            }
          }
        }
      } else {
        expandedLines.push(trimmedLine);
      }
    } else {
      expandedLines.push(trimmedLine);
    }
  }
  
  // Now process the expanded lines
  const validStarters = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt'];
  let hasValidStart = false;
  const processedLines: string[] = [];
  
  for (const line of expandedLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this is a diagram type declaration
    if (validStarters.some(starter => trimmed.toLowerCase().startsWith(starter))) {
      hasValidStart = true;
      processedLines.push(trimmed);
      continue;
    }
    
    // Skip comment lines
    if (trimmed.startsWith('%%')) {
      processedLines.push(trimmed);
      continue;
    }
    
    // Process node/edge lines
    if (trimmed.includes('-->') || /^\s*\w+[\[\{(]/.test(trimmed)) {
      // Clean the line
      let cleanLine = trimmed
        // Remove dangerous characters
        .replace(/[^\w\s\[\](){}<>|:;,.\-_+='"#@!?&%$*\/\\~`\->]/g, '')
        // Fix spacing around arrows
        .replace(/\s*-->\s*/g, ' --> ')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanLine) {
        // Ensure proper indentation
        if (!cleanLine.startsWith('    ')) {
          cleanLine = '    ' + cleanLine;
        }
        processedLines.push(cleanLine);
      }
    }
  }
  
  // Add flowchart declaration if missing
  if (!hasValidStart) {
    processedLines.unshift('flowchart TD');
  }
  
  // Remove any potentially dangerous content
  const result = processedLines.join('\n')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return result;
}

// Function to extract participants from transcript
function extractParticipants(transcript: string): string[] {
  // Simple heuristic to find speaker names - look for patterns like "Name:" or "Name said"
  const speakerPatterns = [
    /([A-Z][a-z]+):/g,
    /([A-Z][a-z]+) said/g,
    /([A-Z][a-z]+) mentioned/g,
    /([A-Z][a-z]+) asked/g,
    /([A-Z][a-z]+) responded/g,
  ];
  
  const participants = new Set<string>();
  
  speakerPatterns.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const name = match.replace(/:| said| mentioned| asked| responded/g, '').trim();
        if (name.length > 1 && name.length < 20) {
          participants.add(name);
        }
      });
    }
  });
  
  // If no participants found, use generic names
  if (participants.size === 0) {
    return ['Speaker A', 'Speaker B'];
  }
  
  return Array.from(participants).slice(0, 6); // Limit to 6 participants max
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, participants } = await request.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Extract or use provided participants
    const meetingParticipants = participants && Array.isArray(participants) 
      ? participants 
      : extractParticipants(transcript);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a meeting flowchart generation expert. Create detailed, well-structured Mermaid flowcharts from meeting transcripts.

CRITICAL SYNTAX RULES:
1. Return ONLY valid Mermaid syntax - no explanations, no markdown code blocks
2. Start with "flowchart TD" or "flowchart LR"
3. Use ONLY these node shapes:
   - A[Process] for actions/statements
   - B{Decision} for questions/choices
   - C((Start/End)) for meeting start/end
   - D>Input] for participant inputs
4. Node IDs must be single letters: A, B, C, D, etc.
5. Arrows must be: A --> B (with spaces)
6. Labels must be in brackets/braces with NO special characters except spaces, hyphens, and periods
7. Maximum 15 nodes for readability
8. NO subgraphs, NO comments, NO complex syntax

VALID EXAMPLE:
flowchart TD
    A((Meeting Start)) --> B[Alex introduces topic]
    B --> C{Sarah asks question}
    C --> D[Discussion follows]
    D --> E[Decision made]
    E --> F((Meeting End))

INVALID EXAMPLES TO AVOID:
- Node labels with quotes, colons, or special characters
- Complex node shapes like rectangles with rounded corners
- Subgraph syntax
- Comments with %%
- Multi-word node IDs`
        },
        {
          role: 'user',
          content: `Create a Mermaid flowchart for this meeting transcript.

Participants: ${meetingParticipants.join(', ')}

Transcript:
${transcript}

Generate a flowchart showing:
1. Key discussion flow and topics
2. Participant contributions and interactions  
3. Decisions made and action items
4. Timeline progression of the meeting
5. Any important outcomes or next steps

Return only the Mermaid syntax.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const rawDiagram = completion.choices[0]?.message?.content || '';
    
    if (!rawDiagram) {
      return NextResponse.json(
        { error: 'Failed to generate diagram' },
        { status: 500 }
      );
    }

    // Sanitize and validate the response
    const sanitizedDiagram = sanitizeMermaidResponse(rawDiagram);
    
    // Fallback diagram if sanitization results in empty or invalid content
    const fallbackDiagram = `flowchart TD
    A((Meeting Start)) --> B[Discussion begins]
    B --> C[Participants share ideas]
    C --> D{Decision needed}
    D --> E[Action items assigned]
    E --> F((Meeting End))`;
    
    const finalDiagram = sanitizedDiagram.trim().length > 20 ? sanitizedDiagram : fallbackDiagram;
    
    return NextResponse.json({ 
      diagram: finalDiagram,
      participants: meetingParticipants,
      metadata: {
        nodeCount: (finalDiagram.match(/\w+[\[\{(].*?[\]\})]|-->/g) || []).length,
        generated: new Date().toISOString(),
        fallbackUsed: finalDiagram === fallbackDiagram
      }
    });
  } catch (error) {
    console.error('Error generating diagram:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
