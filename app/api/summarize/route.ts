import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    
    if (transcript.length > 10000) {
      return NextResponse.json({ error: 'Transcript too long (max 10,000 characters)' }, { status: 413 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Please summarize the following meeting transcript concisely and clearly:\n\nTranscript:\n"${transcript}"\n\nSummary:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}