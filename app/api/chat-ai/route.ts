import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 500 });
  }

  const lower = question.toLowerCase();
  const wantsLong = lower.includes('brief') || lower.includes('detail');

  // build prompt: instructing length if asked, otherwise short
  const prompt = wantsLong
    ? `Please explain in detail: ${question}`
    : `Give a concise answer: ${question}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('AI error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
