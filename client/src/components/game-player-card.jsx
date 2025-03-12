import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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
      "overflow-hidden transition-all duration-300 border shadow-soft",
      isEliminated ? "opacity-60" : "card-hover",
      isCurrentPlayer && "ring-2 ring-primary"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-background shadow-md">
              <AvatarImage src={avatar || `/placeholder.svg?height=56&width=56`} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isCurrentPlayer && (
              <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                <span className="animate-pulse-subtle">
                  <span className="sr-only">Current Turn</span>
                  •
                </span>
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <div className="flex gap-2 mt-1">
                  {isCurrentPlayer && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Current Turn
                    </Badge>
                  )}
                  {isEliminated && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                      Eliminated
                    </Badge>
                  )}
                </div>
              </div>
              
              {canVote && !isEliminated && (
                <Button 
                  onClick={() => onVote(id)}
                  size="sm"
                  variant={isCurrentPlayer ? "default" : "outline"}
                  className="transition-all duration-300"
                >
                  Vote
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

