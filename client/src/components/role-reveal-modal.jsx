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
 * @property {string} role - "Civilian" | "Undercover" | "Mr. White"
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Player} props.player
 * @param {string} props.word
 */
export default function RoleRevealModal({ isOpen, onClose, player, word }) {
  if (!player) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'Undercover':
        return 'text-red-500';
      case 'Mr. White':
        return 'text-blue-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Role Revealed!</DialogTitle>
          <DialogDescription className="text-center">
            A player has been eliminated from the game
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6 space-y-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={player.avatar || `/placeholder.svg?height=80&width=80`} alt={player.name} />
            <AvatarFallback>{player.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className="text-lg font-medium">{player.name}</h3>
            <p className={`text-xl font-bold ${getRoleColor(player.role)}`}>
              {player.role}
            </p>
            {(player.role === 'Civilian' || player.role === 'Undercover') && (
              <p className="mt-2">
                Their word was: <span className="font-semibold">{word}</span>
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Continue Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

