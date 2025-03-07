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
          <Button onClick={onResume} className="bg-green-600 hover:bg-green-700">
            Resume
          </Button>
          <Button onClick={onRestart} className="bg-purple-600 hover:bg-purple-700">
            Restart
          </Button>
          <Button onClick={handleAddPlayer} variant="outline">
            Add Player
          </Button>
          <Button onClick={onQuit} variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10">
            Quit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
