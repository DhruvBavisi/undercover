import React from 'react';
import { cn } from '../lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

/**
 * @typedef {Object} Message
 * @property {string} playerName
 * @property {string} content
 * @property {boolean} isSystem
 * 
 * @param {Object} props
 * @param {Message} props.message
 */
export default function ChatMessage({ message }) {
  const { playerName, content, isSystem } = message;

  if (isSystem) {
    return <div className="bg-blue-900/50 text-blue-100 p-2 rounded text-sm text-center">{content}</div>
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg",
        "bg-gray-800 text-gray-100"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={playerName} />
          <AvatarFallback>{playerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className={cn(
          "font-semibold",
          "text-purple-300"
        )}>
          {playerName}
        </span>
      </div>
      <p className="mt-1">{content}</p>
    </div>
  );
}

