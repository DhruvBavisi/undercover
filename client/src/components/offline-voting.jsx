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
import { motion, AnimatePresence } from "framer-motion"

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

  // Filter out eliminated players from speaking order
  const activeSpeakingOrder = speakingOrder.filter(playerId => {
    const player = players.find(p => p.id === playerId);
    return player && !player.isEliminated;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center border-b border-gray-700">
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
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {activeSpeakingOrder.map((playerId, index) => {
                    const player = players.find(p => p.id === playerId);
                    const isSelected = selectedPlayer === player.id;
                    
                    return (
                      <motion.div
                        key={player.id}
                        variants={itemVariants}
                        layoutId={`player-${player.id}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left h-auto py-3 px-4 relative overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? "border-purple-500 bg-purple-500/20 text-purple-100"
                              : "border-gray-700 hover:bg-gray-700/50 text-gray-200"
                          }`}
                          onClick={() => setSelectedPlayer(player.id)}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="selection-highlight"
                              className="absolute inset-0 bg-purple-500/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                          <div className="flex items-center w-full relative z-10">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 shrink-0 transition-colors ${
                              isSelected ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
                            }`}>
                              <span>{index + 1}</span>
                            </div>
                            <div className="flex-grow truncate font-medium">{player.name}</div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="h-3 w-3 rounded-full bg-purple-500 ml-2"
                              />
                            )}
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-2 pb-6 flex justify-center border-t border-gray-700">
            <Button
              size="lg"
              className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleVote}
              disabled={selectedPlayer === null}
            >
              Eliminate Selected Player
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
