'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MeetingPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const { isLoaded, user } = useUser();
  const { call, isCallLoading, isCallInvalid } = useGetCallById(id!);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [chatChannel, setChatChannel] = useState<ReturnType<StreamChat['channel']> | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(true);

  const clientRef = useRef<StreamChat | null>(null);

  useEffect(() => {
    if (!user || !id || !isLoaded) {
      console.log('MeetingPage useEffect: User, ID, or isLoaded not ready for chat init, skipping.');
      return;
    }

    if (clientRef.current && clientRef.current.userID === user.id && chatChannel) {
        console.log('Stream Chat already initialized for this user and ID, skipping re-initialization.');
        setIsChatLoading(false);
        return;
    }

    const initializeStreamChat = async () => {
      setIsChatLoading(true);
      console.log('Attempting to initialize Stream Chat...');

      const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
      if (!apiKey) {
        console.error('Stream API Key is not set. Please check your .env.local file.');
        toast.error('Stream API Key missing. Chat unavailable.');
        setIsChatLoading(false);
        return;
      }

      try {
        if (!clientRef.current) {
          clientRef.current = new StreamChat(apiKey);
          setChatClient(clientRef.current);
          console.log('New StreamChat client instance created and set.');
        } else {
          setChatClient(clientRef.current);
          console.log('Reusing existing StreamChat client instance.');
        }

        const response = await fetch('/api/stream-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          let errorMessage = 'Unknown API error for Stream token';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || `API error: ${response.status} ${response.statusText}`;
          } catch (jsonError) {
            errorMessage = `API error: ${response.status} ${response.statusText} (Could not parse error message)`;
          }
          console.error("Failed to get Stream token from API:", errorMessage);
          toast.error(`Failed to get chat token: ${errorMessage}`);
          setChatClient(null);
          setIsChatLoading(false);
          return;
        }

        const data = await response.json();
        const token = data.token;

        if (!token) {
          console.error("Failed to get Stream token from API: Token not found in response.");
          toast.error("Failed to get chat token: Token not found in response.");
          setChatClient(null);
          setIsChatLoading(false);
          return;
        }

        console.log('Connecting Stream Chat user:', { id: user.id, name: user.fullName || user.id });
        await clientRef.current.connectUser(
          { id: user.id, name: user.fullName || user.id, image: user.imageUrl || undefined },
          token
        );
        console.log('✅ Stream Chat user connected successfully.');

        const ch = clientRef.current.channel('messaging', `meeting-${id}`, {
          members: [user.id],
        });
        console.log('Attempting to watch Stream Chat channel:', `meeting-${id}`);
        await ch.watch();
        setChatChannel(ch);
        console.log('✅ Stream Chat channel watched successfully.');

      } catch (error) {
        console.error("Stream Chat initialization error:", error);
        toast.error(`Stream Chat init failed: ${error instanceof Error ? error.message : String(error)}`);
        setChatClient(null);
        setChatChannel(null);
      } finally {
        setIsChatLoading(false);
      }
    };

    initializeStreamChat();

    return () => {
      if (clientRef.current && clientRef.current.userID) {
        console.log('Disconnecting Stream Chat user on component unmount.');
        clientRef.current.disconnectUser();
        clientRef.current = null;
      }
    };
  }, [user, id, isLoaded]);

  if (!id || !user || isCallLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-1">
        <Loader className="h-10 w-10 animate-spin text-white" />
        <p className="text-white ml-2">Loading user data or call info...</p>
      </div>
    );
  }

  if (!call) {
    return (
        <div className="flex items-center justify-center h-screen bg-dark-1">
            <Loader className="h-10 w-10 animate-spin text-white" />
            <p className="text-white ml-2">Finding meeting...</p>
        </div>
    );
  }

  if (isCallInvalid) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen text-white bg-dark-1">
        <h1 className="text-2xl font-bold">
          {isPersonalRoom ? "Failed to Load Your Personal Room" : "Invalid Meeting Link"}
        </h1>
        <p className="text-lg mt-2">
          {isPersonalRoom
            ? "Issue loading your personal room. Ensure login or try later."
            : "Meeting link is invalid or expired."}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Go to Home
        </Button>
      </section>
    );
  }

  const notAllowed =
    call.type === 'invited' &&
    !call.state.members.some((m) => m.user.id === user.id);
  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <>
              {isChatLoading ? (
                <div className="flex items-center justify-center h-screen bg-dark-1">
                  <Loader className="h-10 w-10 animate-spin text-white" />
                  <p className="text-white ml-2">Loading chat...</p>
                </div>
              ) : (
                <MeetingRoom
                  call={call}
                  chatClient={chatClient}
                  chatChannel={chatChannel}
                
                />
              )}
            </>
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;