import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {boolean} isCurrentPlayer
 * @property {boolean} isEliminated
 * @property {string} avatar
 * @property {string} role
 * 
 * @param {Object} props
 * @param {Player} props.player
 * @param {Function} props.onVote
 * @param {boolean} props.canVote
 */
export default function GamePlayerCard({ player, onVote, canVote }) {
  const { id, name, isEliminated, isCurrentPlayer, avatar, role } = player;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      isEliminated && "opacity-60",
      isCurrentPlayer && "ring-2 ring-primary"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary-foreground">
            <AvatarImage src={avatar || `/placeholder.svg?height=48&width=48`} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{name}</p>
                {isCurrentPlayer && (
                  <Badge variant="outline" className="bg-primary/20 text-primary-foreground">
                    Current Turn
                  </Badge>
                )}
                {isEliminated && (
                  <Badge variant="outline" className="bg-destructive/20 text-destructive">
                    Eliminated
                  </Badge>
                )}
              </div>
              
              {canVote && !isEliminated && (
                <button 
                  onClick={() => onVote(id)}
                  className="px-3 py-1 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm transition-colors"
                >
                  Vote
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

