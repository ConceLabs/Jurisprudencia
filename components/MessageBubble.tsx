import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Role } from '../types';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';

interface MessageBubbleProps {
  role: Role;
  content: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const isUser = role === Role.User;
  const isLoading = content === '';

  const wrapperClasses = `flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `rounded-2xl p-4 max-w-xl lg:max-w-3xl break-words ${
    isUser
      ? 'bg-primary-600 text-white rounded-br-lg'
      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-lg'
  }`;
  const iconClasses = `w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
    isUser
      ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-100'
      : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
  }`;

  return (
    <div className={wrapperClasses}>
      {!isUser && (
        <div className={iconClasses}>
          <BotIcon />
        </div>
      )}
      <div className={bubbleClasses}>
        {isLoading ? (
            <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
            </div>
        ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-inherit">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        )}
      </div>
      {isUser && (
        <div className={iconClasses}>
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;