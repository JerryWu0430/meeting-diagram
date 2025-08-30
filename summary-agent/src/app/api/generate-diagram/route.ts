import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Basic sanitization for already well-formatted diagrams
function basicSanitize(content: string): string {
  return content
    // Remove dangerous content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Clean up extra whitespace while preserving structure
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive blank lines
    .trim();
}

// Function to sanitize and validate Mermaid syntax
function sanitizeMermaidResponse(response: string): string {
  // Remove any markdown code blocks
  let cleaned = response.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any extra whitespace and normalize line endings
  cleaned = cleaned.trim().replace(/\r\n/g, '\n');
  
  // Check if the diagram is already properly formatted (multi-line)
  const lines = cleaned.split('\n');
  const hasMultipleLines = lines.length > 1;
  const startsWithValidDiagram = /^(flowchart|graph)\s+(TD|LR|TB|RL)/i.test(lines[0]);
  
  // If it's already properly formatted, just do basic sanitization
  if (hasMultipleLines && startsWithValidDiagram) {
    return basicSanitize(cleaned);
  }
  
  // Otherwise, use the complex sanitization for single-line syntax
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
    const { transcript, participants, summary, previousDiagram } = await request.json();
    
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
          content: `You are a system architecture diagram expert. Create technical system architecture diagrams using Mermaid syntax based on meeting discussions about software systems, applications, or technical solutions.

DIAGRAM FOCUS:
Analyze the meeting content and create a system architecture diagram that shows:
1. **System Components**: Services, databases, APIs, frontend/backend components
2. **Data Flow**: How information moves between components
3. **User Interactions**: How users interact with the system
4. **External Dependencies**: Third-party services, APIs, external systems
5. **Technical Stack**: Technologies, frameworks, platforms mentioned
6. **Infrastructure**: Deployment, hosting, storage solutions

CONTEXT-AWARE GENERATION:
- If a previous diagram is provided, build upon it by deleting redudant components, connections, or details
- Only add new elements if they are discussed in the current transcript
- Preserve existing structure and relationships from the previous diagram.
- Delete repetitive components and elements that might be conflicting with the new transcript
- Maintain consistency with the previous diagram's style and naming conventions
- If the previous diagram is comprehensive, focus on incremental updates rather than complete rewrites
- Dont ever exceed more than 10 nodes in the diagram

MERMAID SYNTAX RULES:
1. Return ONLY valid Mermaid syntax - no explanations, no markdown code blocks
2. Start with "flowchart TD" (top-down) or "flowchart LR" (left-right)
3. Use these node shapes for system components:
   - A[Service/Component] for services, APIs, applications
   - B[(Database)] for databases, storage
   - C{{External API}} for third-party services
   - D[/User Interface/] for frontend, UI components
   - E>User Input] for user actions/inputs
   - F((Start/End)) for system entry/exit points
4. Node IDs: Single letters A, B, C, etc.
5. Arrows: A --> B (with spaces)
6. Labels: Clear, technical component names
7. Maximum 20 nodes for complex systems
8. NO subgraphs, NO comments, NO special characters in labels

VALID ARCHITECTURE EXAMPLE:
flowchart TD
    A[/Web Frontend/] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[User Service]
    C --> E[(User Database)]
    D --> E
    F{{Payment API}} --> B
    G>User Login] --> A

FOCUS ON TECHNICAL SYSTEMS:
- If discussing software: Show app architecture, data flow, APIs
- If discussing infrastructure: Show deployment, hosting, networking
- If discussing features: Show how features integrate with existing system
- If discussing data: Show data sources, processing, storage
- If non-technical meeting: Create a simple process flow instead`
        },
        {
          role: 'user',
          content: `Create a system architecture diagram based on this meeting discussion.

${summary ? `MEETING SUMMARY:\n${summary}\n\n` : ''}${previousDiagram ? `PREVIOUS DIAGRAM CONTEXT:\n\`\`\`mermaid\n${previousDiagram}\n\`\`\`\n\n` : ''}PARTICIPANTS: ${meetingParticipants.join(', ')}

TRANSCRIPT:
${transcript}

INSTRUCTIONS:
Analyze the meeting content and create a system architecture diagram that represents:
1. **Technical systems, services, or applications** discussed
2. **Data flow and component interactions** mentioned
3. **User interfaces and user interactions** described
4. **External services, APIs, or dependencies** referenced
5. **Infrastructure or deployment architecture** if discussed
6. **Technology stack components** (databases, frameworks, etc.)

${previousDiagram ? `IMPORTANT: Build upon the previous diagram by adding new elements and connections discussed in this transcript. Preserve the existing structure and only add what's new or modified.` : ''}

If the meeting is non-technical, create a simple process flow of the main workflow or decision process discussed.

Return ONLY the Mermaid syntax - no explanations or markdown blocks.`
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
