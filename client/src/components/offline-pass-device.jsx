import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

/**
 * @param {Object} props
 * @param {string} props.playerName
 * @param {string} props.playerAvatar
 * @param {Function} props.onContinue
 * @param {boolean} props.showAvatar
 */
export default function OfflinePassDevice({ playerName, playerAvatar, onContinue, showAvatar }) {
  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm text-center">
          <CardHeader className="pb-6">
            <div className="flex flex-col space-y-1.5 py-5">
              <CardTitle className="text-2xl">Pass the device to</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-6 flex flex-col items-center justify-center">
            {showAvatar ? (
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src={playerAvatar} alt={playerName} />
                <AvatarFallback className="bg-gray-700">{playerName.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-gray-700 rounded-full">
                {playerName.charAt(0)}
              </div>
            )}
            <h2 className="text-3xl font-bold">{playerName}</h2>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={onContinue}
            >
              Reveal Word
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
