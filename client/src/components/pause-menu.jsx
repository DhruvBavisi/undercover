import React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useNavigate } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {Function} props.onResume
 * @param {Function} props.onRestart
 * @param {Function} props.onQuit
 * @param {Array} props.currentPlayers
 */
export default function PauseMenu({ 
  isOpen, 
  onClose,
  onResume,
  onRestart,
  onAddPlayer,
  title = "Game Paused",
  showRestart = true
}) {
  const navigate = useNavigate();

  const handleQuit = () => {
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={onResume}
            className="w-full !bg-green-600 hover:!bg-green-700"
          >
            Resume Game
          </Button>
          {showRestart && (
            <Button
              onClick={onRestart}
              className="w-full !bg-blue-600 hover:!bg-blue-700"
            >
              Restart Game
            </Button>
          )}
          <Button
            onClick={onAddPlayer}
            className="w-full !bg-white hover:!bg-gray-100 !text-black"
          >
            Add Player
          </Button>
          <Button
            variant="destructive"
            onClick={handleQuit}
            className="w-full !bg-red-600 hover:!bg-red-700"
          >
            Quit to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
