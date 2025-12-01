import React from 'react';
import { Message } from '../types';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.role === 'model';

  return (
    <div className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'} mb-6 group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 
          ${isAi ? 'bg-sage-100 text-sage-600' : 'bg-stone-200 text-stone-600'}`}>
          {isAi ? <Sparkles size={16} /> : <User size={16} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
          <div className={`px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm whitespace-pre-wrap
            ${isAi 
              ? 'bg-white text-stone-800 rounded-tl-none border border-stone-100' 
              : 'bg-sage-600 text-white rounded-tr-none'
            }`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-stone-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};