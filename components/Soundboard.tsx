'use client';

import React from 'react';
import { Call, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { toast } from 'sonner';

type CallStateHooksReturnType = ReturnType<typeof useCallStateHooks>;
type UseLocalParticipantHook = CallStateHooksReturnType['useLocalParticipant'];
type LocalParticipantType = ReturnType<UseLocalParticipantHook>;

interface SoundboardProps {
  onClose: () => void;
  call: Call;
  localParticipant: LocalParticipantType;
}

const sounds = [
  { id: 'laugh', name: 'Laugh', file: '/sounds/laugh.mp3' },
  { id: 'shocked', name: 'Shocked', file: '/sounds/shocked.mp3' },
  { id: 'no', name: 'No', file: '/sounds/no.mp3' },
  { id: 'fail', name: 'Fail', file: '/sounds/fail.mp3' },
  { id: 'lie', name: 'Lie', file: '/sounds/lie.mp3' },
  { id: 'yeah', name: 'Yeah', file: '/sounds/yeah.mp3' },
];

const Soundboard: React.FC<SoundboardProps> = ({ onClose, call, localParticipant }) => {
  const handleSoundPlay = async (soundId: string, soundFile: string) => {
    if (!call || !localParticipant) {
      toast.error('Call or local participant not ready.');
      return;
    }

    new Audio(soundFile).play().catch(console.error);
    toast.info(`Playing sound: ${soundId}`);

    try {
      await call.sendCustomEvent({
        type: 'soundboard-event',
        message: {
          soundId: soundId,
          soundFile: soundFile,
          senderId: localParticipant.userId,
        },
      });
      console.log('Soundboard event sent successfully!');
    } catch (error) {
      console.error('Failed to send soundboard custom event:', error);
      toast.error('Failed to send sound to others.');
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 bg-dark-2 rounded-lg shadow-lg z-50 flex flex-wrap gap-2 max-w-lg">
      <h3 className="w-full text-lg font-bold mb-2 text-white">Soundboard</h3>
      {sounds.map((sound) => (
        <Button
          key={sound.id}
          onClick={() => handleSoundPlay(sound.id, sound.file)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {sound.name}
        </Button>
      ))}
      <Button
        onClick={onClose}
        className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
      >
        Close Soundboard
      </Button>
    </div>
  );
};

export default Soundboard;