import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Home, RotateCcw, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {string} avatar
 * @property {string} word
 * @property {boolean} isEliminated
 * 
 * @param {Object} props
 * @param {Player[]} props.players
 * @param {string} props.civilianWord
 * @param {string} props.undercoverWord
 * @param {Object} props.scores
 * @param {boolean} props.whiteGuessCorrect
 * @param {Function} props.onRestart
 * @param {Function} props.onAddPlayer
 * @param {Function} props.onQuit
 */
export default function OfflineGameOver({
  players,
  civilianWord,
  undercoverWord,
  scores,
  whiteGuessCorrect = false,
  onRestart,
  onAddPlayer,
  onQuit,
}) {
  const [showPointsTable, setShowPointsTable] = useState(false);

  // Determine the winning team based on remaining players and Mr. White guess
  const remainingCivilians = players.filter(p => !p.isEliminated && p.role === "Civilian");
  const remainingUndercover = players.filter(p => !p.isEliminated && p.role === "Undercover");
  const remainingMrWhite = players.filter(p => !p.isEliminated && p.role === "Mr. White");
  const eliminatedMrWhite = players.filter(p => p.isEliminated && p.role === "Mr. White");

  let winnerRole = "Civilians";
  
  if (remainingCivilians.length <= remainingUndercover.length) {
    winnerRole = "Undercover";
  } else if (remainingMrWhite.length > 0) {
    winnerRole = "Mr. White";
  } else if (eliminatedMrWhite.length > 0 && whiteGuessCorrect) {
    winnerRole = "Mr. White";
  }

  // Get avatar for winning role
  const getWinningAvatar = () => {
    switch(winnerRole) {
      case "Civilians":
        return "/avatars/civilian-avatar.png";
      case "Undercover":
        return "/avatars/undercover-avatar.png";
      case "Mr. White":
        return "/avatars/mrwhite-avatar.png";
      default:
        return "/avatars/civilian-avatar.png";
    }
  };

  // Find the player with the highest score
  const getTopScorer = () => {
    if (!scores || Object.keys(scores).length === 0) return null;
    
    let topScore = -1;
    let topScorers = [];
    
    players.forEach(player => {
      const playerScore = scores[player.id] || 0;
      if (playerScore > topScore) {
        topScore = playerScore;
        topScorers = [player];
      } else if (playerScore === topScore) {
        topScorers.push(player);
      }
    });
    
    return topScorers.length > 0 ? topScorers[0] : null;
  };
  
  const topScorer = getTopScorer();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-gray-800/70 border-gray-700 max-w-4xl mx-auto">
        <CardHeader className="text-center border-b border-gray-700">
          <div className="flex justify-center items-center mb-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                winnerRole === "Civilians" ? "bg-green-500/20" : 
                winnerRole === "Undercover" ? "bg-red-500/20" : 
                "bg-purple-500/20"
              }`}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={getWinningAvatar()} alt={winnerRole} />
                <AvatarFallback className={
                  winnerRole === "Civilians" ? "bg-green-500/20" : 
                  winnerRole === "Undercover" ? "bg-red-500/20" : 
                  "bg-purple-500/20"
                }>
                  {winnerRole[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold mb-2">{winnerRole} Win!</CardTitle>
          
          {topScorer && (
            <div className="text-gray-400 text-sm flex items-center justify-center gap-2">
              Top Player: {topScorer.name} ({scores[topScorer.id] || 0} points)
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">The Secret Words Were:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Civilians</div>
                <div className="text-xl font-semibold">{civilianWord}</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Undercover</div>
                <div className="text-xl font-semibold">{undercoverWord}</div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Player Roles</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPointsTable(!showPointsTable)}
            >
              {showPointsTable ? "Hide Points" : "Show Points"}
            </Button>
          </div>

          <div className="bg-gray-700/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-700">
                  <TableHead className="text-gray-400">Player</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  {showPointsTable && (
                    <TableHead className="text-gray-400 text-right">Points</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow 
                    key={player.id} 
                    className={`border-b border-gray-700/50 ${player.isEliminated ? "opacity-60" : ""}`}
                  >
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar} alt={player.role} />
                        <AvatarFallback className={
                          player.role === "Civilian" ? "bg-green-500/20" : 
                          player.role === "Undercover" ? "bg-red-500/20" : 
                          "bg-purple-500/20"
                        }>
                          {player.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{player.name}</span>
                    </TableCell>
                    <TableCell className={
                      player.role === "Civilian" ? "text-green-500" : 
                      player.role === "Undercover" ? "text-red-500" : 
                      "text-purple-500"
                    }>
                      {player.role}
                      {player.role !== "Mr. White" && (
                        <span className="text-gray-400 text-xs ml-1">
                          ({player.role === "Civilian" ? civilianWord : undercoverWord})
                        </span>
                      )}
                    </TableCell>
                    {showPointsTable && (
                      <TableCell className="text-right">{scores[player.id] || 0}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-gray-700 pt-6">
          <div className="grid grid-cols-3 gap-4 w-full">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={onAddPlayer}
            >
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={onRestart}
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={onQuit}
            >
              <Home className="h-4 w-4" />
              Exit Game
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
