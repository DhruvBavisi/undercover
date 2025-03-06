import { useState } from "react"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"

/**
 * Voting component for offline game
 * @param {Object[]} players - Array of player objects
 * @param {number[]} speakingOrder - Array of player indices in speaking order
 * @param {Function} onVoteComplete - Callback when vote is complete
 * @param {number} round - Current round number
 */
export default function OfflineVoting({
  players,
  speakingOrder,
  onVoteComplete,
  round,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const activePlayers = players.filter((player) => !player.isEliminated)

  const handleVote = () => {
    const selectedPlayerObj = players.find((player) => player.id === selectedPlayer);
    if (selectedPlayer !== null && selectedPlayerObj && !selectedPlayerObj.isEliminated) {
      onVoteComplete(selectedPlayer);
    }
  }

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm">
          <CardHeader className="text-center border-b border-gray-700">
            <Badge variant="outline" className="mx-auto mb-2 px-3 py-1">
              Round {round}
            </Badge>
            <CardTitle className="text-2xl">Elimination Phase</CardTitle>
            <CardDescription>
              Discuss and vote on who to eliminate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="text-gray-300 mb-4 text-center">
              Speaking order - each player should describe their word:
            </div>
            
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-3">
                {speakingOrder.map((playerId, index) => {
                  const player = players.find(p => p.id === playerId);
                  if (!player || player.isEliminated) return null;
                  
                  return (
                    <Button
                      key={player.id}
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-3 px-4 ${
                        selectedPlayer === player.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-700 hover:bg-gray-700/30"
                      }`}
                      onClick={() => setSelectedPlayer(player.id)}
                      disabled={player.isEliminated}
                    >
                      <div className="flex items-center w-full">
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 shrink-0">
                          <span>{index + 1}</span>
                        </div>
                        <div className="flex-grow truncate">{player.name}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-2 pb-6 flex justify-center border-t border-gray-700">
            <Button
              size="lg"
              className="w-full"
              onClick={handleVote}
              disabled={selectedPlayer === null}
            >
              Eliminate Selected Player
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
