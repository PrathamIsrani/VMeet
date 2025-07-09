'use client';

import React, { useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

interface CaptionsProps {
  onTranscript: (transcript: string) => void;
  isVisible: boolean; 
  textColor: 'white' | 'yellow' | 'cyan'; 
}

const colorClasses = {
  white: 'text-white',
  yellow: 'text-yellow-300',
  cyan: 'text-cyan-300',
};


interface TranscriptionEventData {
  data: {
    text?: string;
  };
  
  type: 'closed_caption' | string;
}

export default function Captions({ onTranscript, isVisible, textColor }: CaptionsProps) {
  const call = useCall();
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    console.log('Captions useEffect: isVisible:', isVisible, 'Call object:', call);

    
    if (!call) {
      console.log('Captions: Call object is not available yet.');
     
      if (transcriptRef.current) {
        transcriptRef.current.innerText = "Awaiting transcription...";
      }
      return;
    }

    
    const handleCustomEvent = (e: TranscriptionEventData) => {
     
      console.log('Captions: Custom event received:', e);

     
      if (e.type === 'closed_caption') {
        const segment = e.data.text; 

        if (segment) {
          
          console.log('Captions: Closed Caption segment:', segment);

          onTranscript(segment);

          if (transcriptRef.current) {
            transcriptRef.current.innerText = segment;
            console.log('Captions: Updated display div.');
          } else {
            console.log('Captions: transcriptRef.current is null, cannot update display.');
          }
        } else {
          console.log('Captions: Closed Caption segment text is empty or undefined.');
        }
      }
    };


    (call as any).on('customEvent', handleCustomEvent); 
    console.log('Captions: Custom event listener attached.');

    
    return () => {
      (call as any).off('customEvent', handleCustomEvent);
      console.log('Captions: Custom event listener detached.');
    };
  }, [call, onTranscript]); 
  if (!isVisible) {
    console.log('Captions: Not visible, returning null.');
    return null;
  }


  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div
        ref={transcriptRef} 
        className={`
          bg-black/40 backdrop-blur-sm p-3 rounded-lg max-w-2xl text-center
          ${colorClasses[textColor]} font-semibold text-lg
        `}
      >
        Awaiting transcription...
      </div>
    </div>
  );
}