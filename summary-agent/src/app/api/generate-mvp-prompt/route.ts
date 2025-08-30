import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { summary, diagram, transcript, meetingType } = await request.json();
    
    if (!summary || !diagram || !transcript) {
      return NextResponse.json(
        { error: 'Summary, diagram, and transcript are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert software development consultant who creates comprehensive MVP development prompts for AI coding assistants like Cursor.

Your task is to analyze meeting content and create a detailed, actionable prompt that will generate a working MVP application.

PROMPT STRUCTURE:
1. **Project Overview**: Clear description of what the MVP should do
2. **Technical Requirements**: Specific technologies, frameworks, and APIs to use
3. **Core Features**: Essential functionality to implement
4. **Architecture**: System design and component structure
5. **Implementation Steps**: Step-by-step development approach
6. **File Structure**: Recommended project organization
7. **Dependencies**: Required packages and libraries
8. **Testing Strategy**: How to validate the MVP works

TONE & STYLE:
- Professional but conversational
- Specific and actionable
- Include code examples where helpful
- Focus on practical implementation
- Assume the AI assistant will handle the actual coding

FORMAT:
Return a clean, well-structured prompt that can be directly copied and pasted into Cursor.`
        },
        {
          role: 'user',
          content: `Create a comprehensive MVP development prompt based on this meeting discussion.

MEETING TYPE: ${meetingType}

MEETING SUMMARY:
${summary}

SYSTEM ARCHITECTURE DIAGRAM:
${diagram}

FULL TRANSCRIPT:
${transcript}

INSTRUCTIONS:
Analyze the meeting content and create a detailed MVP development prompt that:
1. Clearly describes the application to be built
2. Specifies the technical stack and architecture
3. Lists core features and functionality
4. Provides implementation guidance
5. Can be directly used in Cursor to generate working code

Return ONLY the development prompt - no explanations or markdown blocks.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const prompt = completion.choices[0]?.message?.content || 'Unable to generate MVP prompt';
    
    return NextResponse.json({ 
      prompt,
      meetingType,
      summaryLength: summary.length,
      diagramLength: diagram.length,
      transcriptLength: transcript.length
    });
  } catch (error) {
    console.error('Error generating MVP prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate MVP prompt' },
      { status: 500 }
    );
  }
}
