'use client';

import React, { useState, useEffect } from 'react';
import { StreamChat, UserResponse } from 'stream-chat';
import {
  Chat as StreamChatUI,
  Channel,
  MessageList,
  MessageSimple,
  useChannelStateContext,
  useChatContext,
} from 'stream-chat-react';

import 'stream-chat-react/dist/css/v2/index.css';
import ChatInput from './ChatInput';

type ChatProps = {
  channel: ReturnType<StreamChat['channel']>;
  localParticipant: UserResponse;
  onClose: () => void;
};

const Chat: React.FC<ChatProps> = ({ channel, localParticipant, onClose }) => {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const { client } = useChatContext();
  const { messages } = useChannelStateContext();

  useEffect(() => {
    console.log('Current messages in channel context:', messages);
  }, [messages]);

  const vote = (messageId: string) =>
    setVotes((prev) => ({ ...prev, [messageId]: (prev[messageId] || 0) + 1 }));

  return (
    <StreamChatUI client={client}>
      <Channel channel={channel}>
        <div className="flex flex-col h-full rounded-lg">
          <div className="flex-1 custom-scrollbar">
            
            <MessageList Message={MessageSimple} />

            {(() => {
              const ctx = useChannelStateContext();
              const msgs = ctx?.messages ?? [];

              return msgs.map((msg) => {
                if (!msg.text) return null;

                const isQuery = msg.text.startsWith('Querry Sent to AI');
                const isAI = msg.user?.id === 'AiBot';

                if (isQuery) {
                  const queryText = msg.text.replace('Querry Sent to AI :', '').trim();
                  return (
                    <div key={msg.id} className="flex justify-end px-2 mt-2">
                      <div className="bg-blue-100 text-blue-900 rounded px-3 py-2 text-sm shadow max-w-xs">
                        <p className="font-bold mb-1">Querry Sent to AI:</p>
                        <p>{queryText}</p>
                      </div>
                    </div>
                  );
                }

                if (isAI) {
                  return (
                    <div key={msg.id} className="flex justify-start px-2 mt-2">
                      <div className="bg-gray-100 text-gray-800 rounded px-3 py-2 text-sm shadow max-w-xs">
                        <p className="font-bold mb-1">VMEET AI Response:</p>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                return null;
              });
            })()}


            {(() => {
              const ctx = useChannelStateContext();
              const msgs = ctx?.messages ?? [];
              return msgs.map((msg) =>
                msg.text?.startsWith('Q: ') && msg.user?.id !== 'AiBot' ? (
                  <div key={msg.id} className="flex justify-end px-2">
                    <button
                      onClick={() => vote(msg.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      👍 {votes[msg.id] ?? 0}
                    </button>
                  </div>
                ) : null
              );
            })()}
          </div>

          <div className="border-t border-gray-200 p-2 bg-white">
            <ChatInput channel={channel} localParticipant={localParticipant} />
          </div>
        </div>
      </Channel>
    </StreamChatUI>
  );
};

export default Chat;
