'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  Call,
  StreamVideoParticipant, 
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, Music4, MessageSquare, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Loader } from 'lucide-react';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';
import Soundboard from './Soundboard';
import { toast } from 'sonner';

import Captions from './Captions';
import Chat from './Chat'; 
import Summary from './Summary';

import Poll from './Poll';
import VoteButton from './VoteButton';

import { StreamChat, UserResponse } from 'stream-chat'; 
import { Chat as StreamChatProvider, Channel } from 'stream-chat-react';
import { useUser } from '@clerk/nextjs';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

// --- Custom Event Types ---
interface StreamCustomEvent {
  type: string;
  data: any;
  user?: { id: string; name?: string };
}

interface SoundboardMessageData {
  type: 'soundboard-event';
  soundId: string;
  soundFile: string;
  senderId?: string;
}



interface PollCreatedEventData {
  type: 'poll-created';
  question: string;
  options: string[];
  creatorName?: string;
}

interface VoteCastEventData {
  type: 'vote-cast';
  pollId: string;
  optionId: number;
  voterId?: string;
}
// --- End Custom Event Types ---

interface MeetingRoomProps {
  call: Call;
  chatClient: StreamChat | null;
  chatChannel: ReturnType<StreamChat['channel']> | null;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ call, chatClient, chatChannel }) => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { useLocalParticipant, useCallCallingState } = useCallStateHooks();
  
  const localParticipant: StreamVideoParticipant | undefined = useLocalParticipant();
  const callingState = useCallCallingState();

  const { user, isLoaded } = useUser(); 

  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [transcript, setTranscript] = useState('');
 
  const [showPolls, setShowPolls] = useState(false);

  const [activePoll, setActivePoll] = useState<PollCreatedEventData & { id: string, creatorId: string } | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, Record<number, number>>>({});

  const [showCaptions, setShowCaptions] = useState(false);
  const [captionTextColor, setCaptionTextColor] = useState<'white' | 'yellow' | 'cyan'>('white');
   const [captionsServiceStarted, setCaptionsServiceStarted] = useState(false);
  
   const [pollHistory, setPollHistory] = useState<(PollCreatedEventData & { id: string, creatorId: string })[]>([]);

const [showPollHistory, setShowPollHistory] = useState(false);


   // --- NEW useEffect for Managing Stream's Closed Captions Service ---
  useEffect(() => {

    if (!call || callingState !== CallingState.JOINED) {
      console.log("MeetingRoom (Captions Effect): Call not joined or not available. Skipping caption service control.");
      return;
    }

    if (showCaptions && !captionsServiceStarted) {
      console.log("MeetingRoom (Captions Effect): Attempting to start closed captions.");
      call.startClosedCaptions({ language: "en" }) 
        .then(() => {
          console.log("MeetingRoom (Captions Effect): Successfully started closed captions.");
          setCaptionsServiceStarted(true);
        })
        .catch((error) => {
          console.error("MeetingRoom (Captions Effect): Failed to start closed captions:", error);
          setCaptionsServiceStarted(false);
          toast.error("Failed to start captions. Check console for details.");
        });
    }
    
    else if (!showCaptions && captionsServiceStarted) {
      console.log("MeetingRoom (Captions Effect): Attempting to stop closed captions.");
      call.stopClosedCaptions()
        .then(() => {
          console.log("MeetingRoom (Captions Effect): Successfully stopped closed captions.");
          setCaptionsServiceStarted(false);
          setTranscript(''); 
        })
        .catch((error) => {
          console.error("MeetingRoom (Captions Effect): Failed to stop closed captions:", error);
        });
    }

  
    return () => {
      if (call && captionsServiceStarted) {
        console.log("MeetingRoom (Captions Effect): Cleanup: Stopping closed captions.");
        call.stopClosedCaptions().catch(console.error);
        setCaptionsServiceStarted(false);
        setTranscript('');
      }
    };
  }, [call, showCaptions, callingState, captionsServiceStarted]);
  

  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;

    const handleCustomEvent = (e: StreamCustomEvent) => {
      if (e.data?.type === 'soundboard-event') {
        const msg = e.data as SoundboardMessageData;
        if (msg.senderId !== localParticipant?.userId) {
          new Audio(msg.soundFile).play().catch(console.error);
          toast.info(`${e.user?.name || 'Someone'} played a sound!`);
        }
      }
      else if (e.data?.type === 'poll-created') {
        const newPollData = e.data as PollCreatedEventData;
        const pollId = `${e.user?.id || 'anon'}-${Date.now()}`;
      
        const fullPoll = {
  ...newPollData,
  id: pollId,
  creatorId: e.user?.id || 'unknown',
  creatorName: e.user?.name || 'Unknown User'  
};


        setActivePoll(fullPoll);
        setPollVotes(prev => {
          const newVotesForPoll: Record<number, number> = {};
          newPollData.options.forEach((_, index) => {
            newVotesForPoll[index] = 0;
          });
          return { ...prev, [fullPoll.id]: newVotesForPoll };
        });
        setPollHistory(prev => [...prev, fullPoll]); 
        toast.info(`New poll created by ${e.user?.name || 'Someone'}: "${newPollData.question}"`);
      }
      else if (e.data?.type === 'vote-cast') {
        const voteData = e.data as VoteCastEventData;
        setPollVotes(prev => {
          const updatedPollVotes = { ...prev };
          if (updatedPollVotes[voteData.pollId]) {
            const optionIndex = voteData.optionId;

            if (!isNaN(optionIndex)) {
                updatedPollVotes[voteData.pollId][optionIndex] =
                  (updatedPollVotes[voteData.pollId][optionIndex] || 0) + 1;
            }
          }
          return updatedPollVotes;
        });
        toast.success(`Vote cast for poll!`);
      }
    };

    (call as any).on('customEvent', handleCustomEvent);

    return () => {
      (call as any).off('customEvent', handleCustomEvent);
    };
  }, [call, localParticipant, callingState]); 

  if (callingState !== CallingState.JOINED || !isLoaded || !user || !chatClient || !chatChannel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  const CallLayoutView = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default: 
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden text-white"> 
      <div className="relative flex items-center justify-center w-full h-full pb-[80px] pt-0"> 
        <div className="flex items-center max-w-[1000px] w-full h-full"> 
          <CallLayoutView />
        </div>
        <div
          className={cn('h-[calc(100vh-192px)] overflow-y-auto bg-dark-1 px-4 py-2 absolute top-0 transition-all duration-300 w-96 z-30', {
            'right-[16px]': showParticipants,
            '-right-[384px]': !showParticipants, 
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      {showCaptions && (
        <div className="fixed bottom-24 w-full flex justify-center z-30">
          <Captions
            onTranscript={setTranscript}
            isVisible={showCaptions}
            textColor={captionTextColor}
          />
        </div>
      )}


{showChat && chatClient && chatChannel && localParticipant && (
    <div
        className="fixed bottom-18 right-4 w-80 h-[calc(100vh-10rem)] bg-white text-gray-800 rounded-lg shadow-lg flex flex-col z-50"
        style={{ width: '350px', height: '600px' }} 
    >
      
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">VMeet Chat Room With AI Respone</h2>
            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
            </button>
        </div>
       
        <StreamChatProvider client={chatClient}>
            <Channel channel={chatChannel}>
                <Chat
                    channel={chatChannel}
                    localParticipant={
                        {
                            id: localParticipant.userId,
                            name: localParticipant.name || localParticipant.userId,
                            image: localParticipant.image || undefined,
                        } as UserResponse
                    }
                    onClose={() => setShowChat(false)}
                />
            </Channel>
        </StreamChatProvider>
      
    </div>
)}


      {showPolls && !activePoll && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
    <Poll
      call={call}
      onClose={() => setShowPolls(false)}

      onPollCreated={(poll) => {
  const fullPoll: PollCreatedEventData & { id: string; creatorId: string; creatorName: string } = {
    ...poll,
    type: 'poll-created',
    id: `${user?.id || 'anon'}-${Date.now()}`,
    creatorId: user?.id || 'unknown',
    creatorName: user?.fullName || user?.username || 'Anonymous', 
  };


  setActivePoll(fullPoll);

  setPollVotes((prev) => {
    const newVotes: Record<number, number> = {};
    fullPoll.options.forEach((_, idx) => {
      newVotes[idx] = 0;
    });
    return { ...prev, [fullPoll.id]: newVotes };
  });

  setPollHistory((prev) => [...prev, fullPoll]);
}}

    />
  </div>
)}

      {activePoll && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 p-4 rounded-lg w-80 text-white shadow-xl">
          <button
            onClick={() => setActivePoll(null)} 
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            title="Close Poll Display"
          >
            <X size={20} />
          </button>

          <h3 className="font-bold text-lg mb-2">📊 {activePoll.question}</h3>
          <div className="space-y-2">
            {activePoll.options.map((option, index) => {
              const optionId = String(index);
              const votes = pollVotes[activePoll.id]?.[index] || 0;
              return (
                <div key={optionId} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span>{option}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Votes: {votes}</span>
                    <VoteButton pollId={activePoll.id} optionId={optionId} />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setActivePoll(null)}
            className="mt-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded w-full"
          >
            Close Poll
          </button>
        </div>
      )}


      {showPollHistory && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-gray-900 p-6 rounded-lg w-[400px] text-white relative max-h-[80vh] overflow-y-auto">
      <button
        onClick={() => setShowPollHistory(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-white"
        title="Close Poll History"
      >
        <X size={20} />
      </button>
      <h2 className="text-xl font-bold mb-4">📜 Poll History</h2>
      {pollHistory.length === 0 ? (
        <p className="text-gray-400">No polls created yet.</p>
      ) : (
        <ul className="space-y-4">


          {pollHistory.map((poll, index) => {
  const voteData = pollVotes[poll.id] || {};
  const totalVotes = Object.values(voteData).reduce((sum, val) => sum + val, 0);

  return (
    <li key={index} className="bg-gray-800 p-3 rounded">
      <h3 className="font-semibold text-lg mb-1">📊 {poll.question}</h3>
      <p className="text-sm text-gray-400 mb-2">
  🧑‍💼 Created by: <strong>{poll.creatorName || poll.creatorId}</strong>
</p>

      <ul className="mt-1 text-sm space-y-1">
        {poll.options.map((opt, idx) => {
          const votes = voteData[idx] || 0;
          const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
          return (
            <li key={idx} className="flex justify-between">
              <span>{opt}</span>
              <span className="text-gray-300">{votes} votes ({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    </li>
  );
})}

        </ul>
      )}
    </div>
  </div>
)}


      {/* Bottom Controls Bar */}

      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 p-3 bg-dark-1/80 z-[60]"> 
        <CallControls onLeave={() => router.push('/')} />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4" title="Change Layout">
            <LayoutList size={20} className="text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item) => (
              <React.Fragment key={item}>
                <DropdownMenuItem onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setShowSoundboard((v) => !v)}
          title="Toggle Soundboard"
          className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4"
        >
          <Music4 size={20} className="text-white" />
        </button>

        <CallStatsButton />
        <button
          onClick={() => setShowParticipants((v) => !v)}
          title="Toggle Participants List"
          className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4"
        >
          <Users size={20} className="text-white" />
        </button>

        <button
          onClick={() => setShowChat((v) => !v)}
          title="Toggle Chat"
          className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4"
        >
          <MessageSquare size={20} className="text-white" />
        </button>

        
        <button
          onClick={() => setShowPolls(true)}
          title="Open Polls"
          className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v14M9 19c-1.381 0-2.5 1.119-2.5 2.5S7.619 24 9 24s2.5-1.119 2.5-2.5S10.381 19 9 19zm12 0c-1.381 0-2.5 1.119-2.5 2.5S19.619 24 21 24s2.5-1.119 2.5-2.5S22.381 19 21 19z"></path></svg>

           {/* <img src="/icons/showPoll.svg" alt="Polls Icon" className="w-5 h-5 text-white" /> */}

        </button>

        <button
  onClick={() => setShowPollHistory(true)}
  title="Poll History"
  className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4"
>
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>


  {/* <img src="/icons/pollHistory.svg" alt="Poll History Icon" className="w-5 h-5 text-white" /> */}

</button>


        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-2xl bg-dark-3 p-2 hover:bg-dark-4" title="Captions Options">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.381 0 2.5 1.119 2.5 2.5s-1.119 2.5-2.5 2.5S9.5 11.881 9.5 10.5 10.619 8 12 8zM12 18c1.381 0 2.5 1.119 2.5 2.5S13.381 23 12 23s-2.5-1.119-2.5-2.5S10.619 18 12 18zM12 3c1.381 0 2.5 1.119 2.5 2.5S13.381 8 12 8s-2.5-1.119-2.5-2.5S10.619 3 12 3zM12 13c1.381 0 2.5 1.119 2.5 2.5S13.381 18 12 18s-2.5-1.119-2.5-2.5S10.619 13 12 13z"></path></svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            <DropdownMenuItem onClick={() => setShowCaptions((v) => !v)}>
              {showCaptions ? 'Turn Captions Off' : 'Turn Captions On'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-dark-1" />
            <DropdownMenuItem onClick={() => setCaptionTextColor('white')}>
              Caption Color: White
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCaptionTextColor('yellow')}>
              Caption Color: Yellow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCaptionTextColor('cyan')}>
              Caption Color: Cyan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isPersonalRoom && ( 
          <div > 
            <EndCallButton />
          </div>
        )}
      </div>

      {showSoundboard && call && localParticipant && (
        <Soundboard onClose={() => setShowSoundboard(false)} call={call} localParticipant={localParticipant} />
      )}
    </section>
  );
};

export default MeetingRoom;