import React from 'react';
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog"

/**
 * @param {Object} props
 * @param {Function} props.onResume
 * @param {Function} props.onRestart
 * @param {Function} props.onQuit
 */
export default function PauseMenu({ onResume, onRestart, onQuit }) {
  return (
    <Dialog open={true} onOpenChange={onResume}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Game Paused</DialogTitle>
          <DialogDescription className="text-gray-400">
            What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={onRestart} variant="secondary">
            Restart Game
          </Button>
          <Button onClick={onQuit} variant="destructive">
            Quit Game
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onResume} className="w-full">
            Resume Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

