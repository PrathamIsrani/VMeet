'use client';

import { useEffect, useState } from 'react';
import {
  StreamVideoClient,
  StreamVideo,
  Call,
  User,
  StreamCall, 
} from '@stream-io/video-react-sdk';
import Loader from './Loader';

import { useUser } from '@clerk/nextjs';
import { tokenProvider } from '@/actions/stream.actions';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();

  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) throw new Error('Stream API Key is missing');

    const streamUser: User = {
      id: user.id,
      name: user.username || user.id,
      image: user.imageUrl,
    };

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: streamUser,
      tokenProvider,
    });

    setVideoClient(client);

    const dummyCall = client.call('default', 'some-default-call-id');
    setCall(dummyCall);

    return () => {
      
    };

  }, [user, isLoaded]);

  if (!videoClient || !call) return <Loader />;

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        {children}
      </StreamCall>
    </StreamVideo>
  );
};

export default StreamClientProvider;