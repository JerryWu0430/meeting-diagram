import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Making request to OpenAI Realtime API...');
    
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime'
        }
      })
    });

    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      return NextResponse.json(
        { error: `OpenAI API error: ${errorText}`, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenAI API success response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating realtime token:', error);
    return NextResponse.json(
      { error: 'Failed to generate realtime token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
