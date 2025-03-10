import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { useNavigate } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {Function} props.onResume
 * @param {Function} props.onRestart
 * @param {Function} props.onQuit
 * @param {Array} props.currentPlayers
 */
export default function PauseMenu({ onResume, onRestart, onQuit, currentPlayers = [] }) {
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const navigate = useNavigate();

  const handleAddPlayers = () => {
    // Store current players with all necessary data
    const existingPlayers = currentPlayers.map(player => ({
      name: player.name,
      role: player.role,
      id: player.id,
      isEliminated: player.isEliminated
    }));
    
    // Store complete game settings
    const gameSettings = {
      playerNames: existingPlayers.map(p => p.name),
      playerCount: currentPlayers.length,
      existingPlayers: existingPlayers, // Store complete player objects
      fromGame: true
    };

    // Store settings in localStorage
    localStorage.setItem("offlineGameSettings", JSON.stringify(gameSettings));
    localStorage.setItem("returnToSetup", "true");
    
    // Navigate with complete player data
    navigate('/offline', { 
      state: { 
        players: existingPlayers,
        fromGame: true
      } 
    });
  };

  const handleRestart = (e) => {
    e.preventDefault();
    onRestart();
    onResume(); // Close the pause menu after restart
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="bg-gray-800/70 border-gray-700 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Paused</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={onResume} style={{ backgroundColor: '#16a34a' }} className="hover:bg-[#15803d]">
            Resume
          </Button>
          <Button onClick={handleRestart}>
            Restart
          </Button>
          <Button 
            onClick={() => setShowAddPlayerDialog(true)} 
            style={{ backgroundColor: 'white', color: 'black' }} 
            className="!bg-white !text-black"
          >
            Add Player
          </Button>
          <Button onClick={onQuit} style={{ backgroundColor: 'red', color: 'white' }} className="!bg-red-600 !text-white">
            Quit
          </Button>
        </CardContent>
      </Card>

      {/* Add Player Confirmation Dialog */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add New Players</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will pause the current game and take you to the setup page with your current players.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-300">
              Current Players: {currentPlayers.length}
            </div>
            <div className="text-sm text-gray-300">
              You'll be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Add new players</li>
                <li>Adjust game settings</li>
                <li>Start a new game with more players</li>
              </ul>
            </div>
            <div className="text-sm text-yellow-400">
              Note: Current game progress will be lost
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowAddPlayerDialog(false)}
              className="border border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayers}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Continue to Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
