'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Call } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';

interface PollProps {
  call?: Call;
  onClose: () => void;
  onPollCreated?: (poll: {
    question: string;
    options: string[];
    id: string;
    creatorId: string;
  }) => void;
}

const Poll: React.FC<PollProps> = ({ call, onClose, onPollCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    } else {
      toast.warning('Maximum of 5 options allowed.');
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
  };

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      toast.error('Please fill in the question and all options.');
      return;
    }

    const pollData = {
      type: 'poll-created',
      question,
      options,
    };

    try {
      await call?.sendCustomEvent(pollData);
      toast.success('Poll created successfully!');

      const generatedPoll = {
        ...pollData,
        id: `${call?.currentUserId || 'user'}-${Date.now()}`,
        creatorId: call?.currentUserId || 'unknown',
      };

      //Callback to MeetingRoom to update pollHistory
      onPollCreated?.(generatedPoll);

      onClose();
    } catch (err) {
      console.error('Failed to create poll:', err);
      toast.error('Failed to create poll.');
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-white"
        title="Close Poll Creator"
      >
        <X size={20} />
      </button>
      <h2 className="text-xl font-bold mb-4">📋 Create a New Poll</h2>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none mb-4"
        placeholder="Enter poll question"
      />

      {options.map((option, index) => (
        <div key={index} className="flex items-center mb-2">
          <input
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none"
            placeholder={`Option ${index + 1}`}
          />
          {options.length > 2 && (
            <button
              onClick={() => removeOption(index)}
              className="ml-2 text-red-500 hover:text-red-700"
              title="Remove Option"
            >
              <X size={18} />
            </button>
          )}
        </div>
      ))}

      {options.length < 5 && (
        <button
          onClick={addOption}
          className="mt-2 text-sm text-blue-400 hover:underline"
        >
          ➕ Add another option
        </button>
      )}

      <button
        onClick={handleCreatePoll}
        className="mt-6 bg-green-600 hover:bg-green-700 px-4 py-2 w-full rounded font-semibold"
      >
        ✅ Create Poll
      </button>
    </div>
  );
};

export default Poll;
