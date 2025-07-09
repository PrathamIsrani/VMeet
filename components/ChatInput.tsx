'use client';

import React, { useState, FormEvent } from 'react';
import { UserResponse } from 'stream-chat';
import { toast } from 'sonner'; 

interface ChatInputProps {
  channel: any; 
  localParticipant: UserResponse;
}

const ChatInput: React.FC<ChatInputProps> = ({ channel, localParticipant }) => {
  const [text, setText] = useState<string>('');

  const sendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    if (!localParticipant) {
      console.error("Local participant not available for sending message from ChatInput.");
      return;
    }

    const userId = localParticipant.id;
    const userName = localParticipant.name || localParticipant.id;

    if (text.startsWith('@Ai ')) {
      const question = text.slice(4).trim();
      await channel.sendMessage({ text: `🙋‍♂️ Querry Sent to AI 🤔: \n \n ${question}`, user: { id: userId, name: userName } });

      // ✅ Show toast while AI is responding
      const loadingId = toast.loading('🤖 VMEET AI is responding...');

      try {
        const res = await fetch('/api/chat-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });

        const { answer } = await res.json();

        await channel.sendMessage({
  text: `🤖 VMEET AI Response 🤖:\n \n${answer}`,
  user: { id: 'AiBot', name: 'VMEET AI' },
});


        toast.success('✅ VMEET AI has responded!', { id: loadingId }); // ✅ Dismiss and show success
      } catch (error) {
        console.error("❌ Error fetching AI reply:", error);
        await channel.sendMessage({ text: "Sorry, I couldn't get an AI reply right now.", user: { id: 'AiBot', name: 'VMEET AI' } });
        toast.error("❌ Failed to get response from VMEET AI", { id: loadingId }); // ✅ Dismiss and show error
      }
    } else {
      await channel.sendMessage({ text, user: { id: userId, name: userName } });
      console.log('✅ Message sent successfully from ChatInput:', text);
    }

    setText('');
  };

  return (
    <form onSubmit={sendMessage} className="flex gap-2 w-full items-center">
      <input
        type="text"
        placeholder="Message or @Ai for AI"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-2 border rounded text-gray-800 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;
