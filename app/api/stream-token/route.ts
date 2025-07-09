import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

export async function POST(req: NextRequest) {
  console.log('--- API Stream Token Route Hit ---');

  const { userId } = await req.json();
  console.log('Received userId in API request:', userId);

  if (!userId) {
    console.error('Error: User ID is missing in request body.');
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const apiKey = process.env.STREAM_API_KEY; 
  const apiSecret = process.env.STREAM_API_SECRET;

  console.log('Environment Variable Check:');
  console.log(`STREAM_API_KEY is ${apiKey ? 'SET' : 'NOT SET'}`);
  console.log(`STREAM_API_SECRET is ${apiSecret ? 'SET' : 'NOT SET'}`);

  if (!apiKey || !apiSecret) {
    console.error('Stream API Key or Secret is not set in environment variables. Please check your .env.local file.');
    return NextResponse.json({ message: 'Server configuration error: Stream credentials missing.' }, { status: 500 });
  }

  try {
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    console.log('StreamChat server client instance created successfully.');

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; 
    const issuedAt = Math.floor(Date.now() / 1000) - 60; 

    console.log(`Attempting to create Stream token for user: ${userId}`);
    const token = serverClient.createToken(userId, expirationTime, issuedAt);
    console.log('Stream token successfully created for user:', userId);

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error generating Stream token in server-side API:', error);
    return NextResponse.json({ message: `Error generating token: ${error.message || 'An unknown error occurred.'}` }, { status: 500 });
  }
}