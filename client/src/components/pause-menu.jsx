import React from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';

/**
 * @param {Object} props
 * @param {Function} props.onResume
 * @param {Function} props.onRestart
 * @param {Function} props.onQuit
 * @param {Function} props.handleAddPlayer
 */
export default function PauseMenu({ onResume, onRestart, onQuit, handleAddPlayer }) {
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
          <Button onClick={onRestart}>
            Restart
          </Button>
          <Button onClick={handleAddPlayer} style={{ backgroundColor: 'white', color: 'black' }} className="!bg-white !text-black">
            Add Player
          </Button>
          <Button onClick={onQuit} style={{ backgroundColor: 'red', color: 'white' }} className="!bg-red-600 !text-white">
            Quit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
