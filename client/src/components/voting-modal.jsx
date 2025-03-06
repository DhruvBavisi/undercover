import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {boolean} isCurrentPlayer
 * @property {boolean} isEliminated
 * @property {string} avatar
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Player[]} props.players
 * @param {Function} props.onVote
 */
export default function VotingModal({ isOpen, onClose, players, onVote }) {
  const activePlayers = players.filter(player => !player.isEliminated);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Voting Time</DialogTitle>
          <DialogDescription className="text-center">
            Vote for the player you think is the Undercover or Mr. White
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {activePlayers.map(player => (
            <div 
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => onVote(player.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={player.avatar || `/placeholder.svg?height=40&width=40`} alt={player.name} />
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{player.name}</p>
                  {player.isCurrentPlayer && (
                    <p className="text-xs text-muted-foreground">You</p>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(player.id);
                }}
              >
                Vote
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

