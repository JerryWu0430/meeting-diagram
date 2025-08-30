# Live Meeting Diagram Generation Feature

## Overview

This feature automatically generates live Mermaid flowcharts from meeting transcriptions using OpenAI's GPT models. The diagrams visualize the meeting flow, participant interactions, decisions, and action items in real-time.

## How It Works

### 1. API Endpoint (`/api/generate-diagram`)
- **Input**: Meeting transcript text
- **Processing**: 
  - Extracts participant names from transcript
  - Sends transcript to OpenAI GPT-4o-mini with specialized prompts
  - Sanitizes and validates the returned Mermaid syntax
- **Output**: Valid Mermaid diagram code with metadata

### 2. Frontend Integration
- **Auto-generation**: Diagrams generate automatically 5 seconds after speech stops
- **Manual generation**: "Generate Diagram" button for immediate creation
- **Real-time rendering**: Uses Mermaid.js to render SVG diagrams
- **Error handling**: Displays errors with raw code for debugging

### 3. Sanitization & Security
- Removes markdown code blocks from LLM responses
- Validates Mermaid syntax structure
- Strips potentially dangerous content (scripts, event handlers)
- Provides fallback diagram types if invalid

## Features

### Automatic Participant Detection
The system automatically identifies speakers from patterns like:
- "John: said something"
- "Mary mentioned that..."
- "Alex asked about..."

### Diagram Content
Generated diagrams include:
- Meeting flow and timeline progression
- Participant contributions and interactions
- Key decisions and action items
- Discussion topics and outcomes
- Risk identification and concerns

### UI Components
- **Three-column layout**: Transcript | Summary | Diagram
- **Live updates**: Real-time generation with loading states
- **Error handling**: Graceful fallbacks with debug information
- **Manual controls**: Generate/Clear buttons for user control

## Usage

1. **Start a voice session** in the meeting assistant
2. **Speak naturally** - the system captures your meeting content
3. **Watch live updates**:
   - Transcripts appear immediately
   - Summaries generate after 2 seconds
   - Diagrams generate after 5 seconds
4. **Manual generation**: Use "Generate Diagram" button for immediate creation
5. **Session persistence**: All data (transcript, summary, diagram) persists across disconnections

## Technical Implementation

### API Route Structure
```typescript
POST /api/generate-diagram
{
  "transcript": "meeting content...",
  "participants": ["optional", "participant", "list"]
}
```

### Response Format
```typescript
{
  "diagram": "flowchart TD\n  A[Start] --> B[Decision]...",
  "participants": ["Speaker A", "Speaker B"],
  "metadata": {
    "nodeCount": 15,
    "generated": "2024-01-01T12:00:00Z"
  }
}
```

### Mermaid Configuration
- **Theme**: Default with custom styling
- **Security**: Loose mode for HTML labels
- **Layout**: Auto-sizing with responsive design
- **Error handling**: Graceful fallbacks for invalid syntax

## Error Handling

1. **Invalid Mermaid syntax**: Shows error message with raw code
2. **API failures**: Logs errors and shows user-friendly messages  
3. **Network issues**: Handles timeouts and connection errors
4. **Empty content**: Requires minimum content length for generation

## Performance Considerations

- **Debounced generation**: Prevents excessive API calls
- **Efficient rendering**: Clears previous diagrams before new ones
- **Memory management**: Proper cleanup of timeouts and references
- **Responsive design**: Adapts to different screen sizes

## Future Enhancements

- **Diagram export**: Save as SVG/PNG files
- **Custom styling**: User-selectable themes and colors
- **Interactive elements**: Clickable nodes with detailed information
- **Version history**: Track diagram evolution throughout meeting
- **Integration**: Export to other meeting tools and platforms

## Dependencies

- **OpenAI API**: GPT-4o-mini for diagram generation
- **Mermaid.js**: Client-side diagram rendering
- **React**: Frontend framework with hooks
- **Next.js**: API routes and server-side functionality
