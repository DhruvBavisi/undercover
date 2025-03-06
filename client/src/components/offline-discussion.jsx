import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { MessageCircle } from "lucide-react"

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {boolean} isEliminated
 * 
 * @param {Object} props
 * @param {Player[]} props.players
 * @param {number} props.currentPlayerIndex
 * @param {number} props.round
 * @param {Function} props.onComplete
 * @param {Function} props.onNextPlayer
 */
export default function OfflineDiscussion({ players, currentPlayerIndex, round, onComplete, onNextPlayer }) {
  const [allPlayersSpoken, setAllPlayersSpoken] = useState(false);
  const [playersSpoken, setPlayersSpoken] = useState([]);

  // Get active players (not eliminated)
  const activePlayers = players.filter((p) => !p.isEliminated);

  // Current player
  const currentPlayer = activePlayers[currentPlayerIndex];

  // Check if all players have spoken
  const checkAllPlayersSpoken = (spokenPlayers) => {
    if (spokenPlayers.length === activePlayers.length) {
      setAllPlayersSpoken(true);
    }
  };

  // Handle next player
  const handleNextPlayer = () => {
    // Add current player to spoken list
    if (currentPlayer && !playersSpoken.includes(currentPlayer.id)) {
      const newPlayersSpoken = [...playersSpoken, currentPlayer.id];
      setPlayersSpoken(newPlayersSpoken);
      checkAllPlayersSpoken(newPlayersSpoken);
    }

    // Move to next player
    onNextPlayer();
  };

  return (
    <Card className="bg-gray-800/70 border-gray-700">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Discussion Phase</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6 py-6">
        {!allPlayersSpoken ? (
          <>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-bold text-blue-400 mb-2">
                Speaking Now
              </h3>
              <div className="text-3xl font-bold mb-2">{currentPlayer?.name}</div>
              <p className="text-sm text-gray-300">Describe your word without saying it directly</p>
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 bg-blue-500/20">
                <MessageCircle className="w-10 h-10 text-blue-400" />
              </div>

              <h2 className="text-xl font-bold mb-4">
                Round {round} - Player {playersSpoken.length + 1}/{activePlayers.length}
              </h2>

              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {activePlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`text-xs p-2 rounded-full ${
                      playersSpoken.includes(player.id)
                        ? "bg-green-500/20 text-green-400"
                        : index === currentPlayerIndex
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500"
                          : "bg-gray-700/50 text-gray-400"
                    }`}
                  >
                    {player.name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 bg-green-500/20">
              <MessageCircle className="w-10 h-10 text-green-400" />
            </div>

            <h2 className="text-2xl font-bold mb-4">Discussion Complete!</h2>

            <p className="text-gray-300 mb-6">
              All players have described their words. It's time to vote on who you think is the Undercover Agent or Mr.
              White.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!allPlayersSpoken ? (
          <Button onClick={handleNextPlayer} className="w-full">
            Next Player
          </Button>
        ) : (
          <Button onClick={onComplete} className="w-full bg-yellow-600 hover:bg-yellow-700">
            Proceed to Voting
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

