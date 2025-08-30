import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define different prompt templates for different meeting types
const PROMPT_TEMPLATES = {
  general: {
    name: 'General Meeting',
    prompt: `You are a meeting summarization expert. Create concise, actionable summaries that include:
    - Key discussion points and decisions
    - Action items and next steps
    - Important insights or conclusions
    - Any deadlines or follow-up requirements
    
    Keep summaries clear, structured, and under 150 words. Focus on what matters most for meeting participants.`
  },
  
  hackathon: {
    name: 'Hackathon/Competition',
    prompt: `You are a hackathon summarization expert. Create technical, action-oriented summaries that include:
    - **Project Ideas & Concepts**: Core ideas discussed and their feasibility
    - **Technical Stack & Architecture**: Technologies, frameworks, APIs mentioned
    - **Team Roles & Responsibilities**: Who's doing what (frontend, backend, design, etc.)
    - **Implementation Timeline**: Sprint planning, milestones, and deadlines
    - **Blockers & Challenges**: Technical hurdles and how to overcome them
    - **Resources & APIs**: External services, datasets, or tools to use
    - **Next Coding Sessions**: Immediate next steps and who's responsible
    
    Use developer-friendly language and focus on actionable technical tasks. Keep under 200 words.`
  },
  
  engineering: {
    name: 'Software Engineering',
    prompt: `You are a software engineering meeting expert. Create technical summaries that include:
    - **Architecture Decisions**: System design choices and trade-offs discussed
    - **Code Review Items**: Issues found, refactoring needs, best practices
    - **Sprint Planning**: Story points, task assignments, velocity discussions
    - **Technical Debt**: Issues identified and prioritization
    - **Bug Triage**: Critical issues, severity levels, and assignment
    - **Performance & Scalability**: Optimization opportunities and concerns
    - **DevOps & Infrastructure**: Deployment, monitoring, and tooling decisions
    - **API Changes**: Breaking changes, versioning, and migration plans
    
    Focus on technical accuracy and actionable engineering tasks. Include relevant code concepts and methodologies. Keep under 200 words.`
  },
  
  standup: {
    name: 'Daily Standup',
    prompt: `You are a daily standup summarization expert. Create focused summaries that include:
    - **Yesterday's Accomplishments**: What each team member completed
    - **Today's Goals**: Planned tasks and priorities for each person
    - **Blockers & Dependencies**: Issues preventing progress and who can help
    - **Sprint Progress**: How the team is tracking against sprint goals
    - **Cross-team Updates**: Dependencies on other teams or external factors
    - **Quick Wins**: Small tasks that can be completed today
    
    Keep it concise and action-oriented. Focus on immediate next steps and removing blockers. Under 150 words.`
  },
  
  retrospective: {
    name: 'Sprint Retrospective',
    prompt: `You are a sprint retrospective summarization expert. Create improvement-focused summaries that include:
    - **What Went Well**: Successes, good practices, and team wins
    - **What Didn't Go Well**: Pain points, process issues, and challenges
    - **Action Items for Improvement**: Specific changes to implement next sprint
    - **Process Changes**: Workflow, tooling, or communication improvements
    - **Team Dynamics**: Collaboration insights and relationship improvements
    - **Technical Learnings**: New skills, tools, or approaches discovered
    - **Metrics & Velocity**: Performance data and capacity planning insights
    
    Focus on continuous improvement and concrete action items. Keep under 200 words.`
  }
};

// GET endpoint to retrieve available meeting types
export async function GET() {
  const meetingTypes = Object.entries(PROMPT_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    description: getTypeDescription(key)
  }));
  
  return NextResponse.json({ meetingTypes });
}

function getTypeDescription(type: string): string {
  const descriptions = {
    general: 'Standard business meetings with general discussion points',
    hackathon: 'Fast-paced technical sessions focused on building and shipping',
    engineering: 'Technical meetings covering architecture, code, and system design',
    standup: 'Daily team check-ins with progress updates and blockers',
    retrospective: 'Sprint reviews focused on team improvement and learnings'
  };
  return descriptions[type as keyof typeof descriptions] || 'General meeting type';
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, meetingType = 'general' } = await request.json();
    
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

    // Get the appropriate prompt template
    const template = PROMPT_TEMPLATES[meetingType as keyof typeof PROMPT_TEMPLATES] || PROMPT_TEMPLATES.general;
    
    // Adjust max tokens based on meeting type
    const maxTokens = meetingType === 'general' || meetingType === 'standup' ? 300 : 400;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: template.prompt
        },
        {
          role: 'user',
          content: `Please summarize this ${template.name.toLowerCase()} transcript:\n\n${transcript}`
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';
    
    return NextResponse.json({ 
      summary,
      meetingType,
      templateUsed: template.name
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
