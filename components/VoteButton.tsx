import React, { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

interface VoteButtonProps {
  pollId: string;
  optionId: string; 
}

const VoteButton: React.FC<VoteButtonProps> = ({ pollId, optionId }) => {
  const call = useCall();
  const [voted, setVoted] = useState(false);

  const handleVote = async () => {
    if (!call || voted) {
      console.warn('Call not available or already voted');
      return;
    }

    console.log("✅ Sending vote:", { pollId, optionId });

    try {
      await call.sendCustomEvent({
        type: 'vote-cast',
        data: {
          type: 'vote-cast',
          pollId,
          optionId: Number(optionId), 
        },
      });

      console.log("✅ Vote sent successfully");
      setVoted(true); // Disable after voting
    } catch (error) {
      console.error("❌ Error sending vote:", error);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={voted}
      className={`text-xs px-2 py-1 rounded transition ${
        voted ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
      } text-white`}
      title={voted ? 'You already voted' : 'Vote for this option'}
    >
      {voted ? 'Voted' : 'Vote'}
    </button>
  );
};

export default VoteButton;
