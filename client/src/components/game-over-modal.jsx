import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} avatar
 * @property {string} role
 * 
 * @typedef {Object} Words
 * @property {string} civilian
 * @property {string} undercover
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.winner - 'civilians' | 'undercover' | 'mrwhite'
 * @param {Player[]} props.players
 * @param {Words} props.words
 */
export default function GameOverModal({ isOpen, onClose, winner, players, words }) {
  if (!isOpen) return null;

  const getWinnerText = () => {
    if (winner === 'civilians') {
      return 'Civilians Win!';
    } else if (winner === 'undercover') {
      return 'Undercover Wins!';
    } else if (winner === 'mrwhite') {
      return 'Mr. White Wins!';
    }
    return 'Game Over';
  };

  const getWinnerDescription = () => {
    if (winner === 'civilians') {
      return 'The civilians successfully identified and eliminated all the impostors!';
    } else if (winner === 'undercover') {
      return 'The undercover agent successfully blended in and eliminated enough civilians!';
    } else if (winner === 'mrwhite') {
      return 'Mr. White successfully guessed the word!';
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {getWinnerText()}
          </DialogTitle>
          <DialogDescription className="text-center">
            {getWinnerDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <h3 className="font-medium mb-3">Player Roles:</h3>
          <div className="grid gap-3 max-h-60 overflow-y-auto">
            {players.map(player => (
              <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                <Avatar>
                  <AvatarImage src={player.avatar || `/placeholder.svg?height=40&width=40`} alt={player.name} />
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  <p className={`text-sm ${
                    player.role === 'Civilian' ? 'text-green-500' : 
                    player.role === 'Undercover' ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    {player.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {words && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">The Words:</h3>
              <div className="flex gap-4 justify-center">
                <div className="bg-accent/50 p-3 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Civilians</p>
                  <p className="font-bold text-lg">{words.civilian}</p>
                </div>
                {words.undercover && (
                  <div className="bg-accent/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Undercover</p>
                    <p className="font-bold text-lg">{words.undercover}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button onClick={onClose} className="flex-1">
            Back to Lobby
          </Button>
          <Button variant="outline" className="flex-1">
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

