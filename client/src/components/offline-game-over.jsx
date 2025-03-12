import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Home, RotateCcw, UserPlus, Trophy, Users, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

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
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const navigate = useNavigate();

  // Determine the winning team based on remaining players and Mr. White guess
  const remainingCivilians = players.filter(p => !p.isEliminated && p.role === "Civilian");
  const remainingUndercover = players.filter(p => !p.isEliminated && p.role === "Undercover");
  const remainingMrWhite = players.filter(p => !p.isEliminated && p.role === "Mr. White");
  const eliminatedMrWhite = players.filter(p => p.isEliminated && p.role === "Mr. White");

  let winnerRole = "Civilians";
  
  // If Mr. White guessed correctly, they win
  if (whiteGuessCorrect) {
    winnerRole = "Mr. White";
  } 
  // If undercover agents remain and no civilians, undercover wins
  else if (remainingCivilians.length === 0 && (remainingUndercover.length > 0 || remainingMrWhite.length > 0)) {
    winnerRole = "Undercover";
  }
  // If Mr. White remains alone, they win
  else if (remainingCivilians.length === 0 && remainingUndercover.length === 0 && remainingMrWhite.length > 0) {
    winnerRole = "Mr. White";
  }

  const getWinningAvatar = () => {
    if (winnerRole === "Civilians") {
      const civilian = players.find(p => p.role === "Civilian");
      return civilian?.avatar || "";
    } else if (winnerRole === "Undercover") {
      const undercover = players.find(p => p.role === "Undercover");
      return undercover?.avatar || "";
    } else {
      const mrWhite = players.find(p => p.role === "Mr. White");
      return mrWhite?.avatar || "";
    }
  };

  const getTopScorer = () => {
    if (!scores) return null;
    
    let topPlayer = null;
    let topScore = -1;
    
    Object.entries(scores).forEach(([playerId, score]) => {
      if (score > topScore) {
        topScore = score;
        topPlayer = players.find(p => p.id === parseInt(playerId));
      }
    });
    
    return {
      player: topPlayer,
      score: topScore
    };
  };

  const topScorer = getTopScorer();

  const handleAddPlayers = () => {
    setShowAddPlayerDialog(true);
  };

  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddNewPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setShowAddPlayerDialog(false);
    }
  };

  const handleQuit = (event) => {
    event.preventDefault();
    onQuit();
    navigate('/');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Civilian":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50";
      case "Undercover":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50";
      case "Mr. White":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50";
      default:
        return "";
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="max-w-4xl mx-auto glass-effect shadow-soft">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {winnerRole === "Civilians" && (
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            {winnerRole === "Undercover" && (
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <User className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            )}
            {winnerRole === "Mr. White" && (
              <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Game Over
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            {winnerRole === "Civilians" && "The Civilians have won!"}
            {winnerRole === "Undercover" && "The Undercover Agents have won!"}
            {winnerRole === "Mr. White" && (
              whiteGuessCorrect 
                ? "Mr. White guessed the word correctly and won!" 
                : "Mr. White is the last player standing and won!"
            )}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span>Top Scorer</span>
              </h3>
              {topScorer && topScorer.player && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={topScorer.player.avatar} alt={topScorer.player.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {topScorer.player.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{topScorer.player.name}</p>
                    <p className="text-sm text-muted-foreground">Score: {topScorer.score}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">The Words</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Civilian Word</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{civilianWord}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Undercover Word</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">{undercoverWord}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Player Results</h3>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Word</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id} className={player.isEliminated ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {player.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getRoleBadgeColor(player.role))}>
                          {player.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{player.word || (player.role === "Mr. White" ? "Unknown" : "")}</TableCell>
                      <TableCell className="text-right">{scores?.[player.id] || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-3 justify-center pt-2">
          <Button onClick={onRestart} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={handleAddPlayers} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Player
          </Button>
          <Button variant="ghost" onClick={handleQuit} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter the name of the player you want to add to the game.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewPlayer}>
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
