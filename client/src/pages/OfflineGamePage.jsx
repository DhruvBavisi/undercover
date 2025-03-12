import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Pause } from "lucide-react"
import OfflineRoleReveal from "../components/offline-role-reveal"
import OfflinePassDevice from "../components/offline-pass-device"
import OfflineVoting from "../components/offline-voting"
import OfflineElimination from "../components/offline-elimination"
import OfflineGameOver from "../components/offline-game-over"
import PauseMenu from "../components/pause-menu"
import { getRandomWordPair, assignRoles, randomizeSpeakingOrder } from "../utils/game-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import Starfield from "../components/Starfield"

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {string} word
 * @property {boolean} isEliminated
 * @property {string} avatar
 * 
 * @typedef {'pass'|'reveal'|'voting'|'elimination'|'gameOver'} GamePhase
 */

export default function OfflineGamePage() {
  const navigate = useNavigate()
  const [gamePhase, setGamePhase] = useState("pass")
  const [players, setPlayers] = useState([])
  const [speakingOrder, setSpeakingOrder] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [gameSettings, setGameSettings] = useState({
    roundTime: 60,
    wordCategory: "general",
    includeWhite: true,
  })
  const [wordPair, setWordPair] = useState(["", ""])
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState(null)
  const [whiteGuessCorrect, setWhiteGuessCorrect] = useState(false)
  const [round, setRound] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [scores, setScores] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddPlayerConfirm, setShowAddPlayerConfirm] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem("offlineGameSettings")
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings)
        setGameSettings(settings)
        const { playerNames } = settings
        const playerCount = playerNames.length
        const selectedWordPair = getRandomWordPair(settings.wordCategory)
        setWordPair(selectedWordPair)
        
        // Get players and speaking order from the assignRoles function
        const { players: initialPlayers, speakingOrder: initialOrder } = assignRoles(
          playerNames, 
          playerCount, 
          settings.includeWhite, 
          selectedWordPair,
          settings.undercoverCount
        )
        
        setPlayers(initialPlayers)
        setSpeakingOrder(randomizeSpeakingOrder(initialPlayers, 1))
        
        // Initialize scores
        const initialScores = {}
        initialPlayers.forEach((player) => {
          initialScores[player.id] = 0
        })
        setScores(initialScores)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing game:", error)
        navigate("/offline")
      }
    } else {
      navigate("/offline")
    }
  }, [navigate])

  const handleRoleRevealComplete = () => {
    const nextIndex = currentPlayerIndex + 1
    if (nextIndex >= players.length) {
      setGamePhase("voting")
      setCurrentPlayerIndex(0)
    } else {
      setCurrentPlayerIndex(nextIndex)
      setGamePhase("pass") // Show pass device screen between players
    }
  }

  const handleVoteComplete = (playerId) => {
    if (!eliminatedPlayerId) { // Ensure only one player is eliminated per round
      setEliminatedPlayerId(playerId)
      setPlayers(players.map((player) => (player.id === playerId ? { ...player, isEliminated: true } : player)))
      setGamePhase("elimination")
    }
  }

  const handleWhiteGuess = (guess, isCorrect) => {
    setWhiteGuessCorrect(isCorrect);
    if (isCorrect) {
      // Mr. White wins, update scores
      const newScores = { ...scores };
      players.forEach((player) => {
        if (player.role === "Mr. White") {
          // Award decreasing points based on the round number
          // First round: 5 points, second round: 4 points, etc.
          const guessPoints = Math.max(6 - round, 2); // Minimum 2 points
          newScores[player.id] += guessPoints;
        }
      });
      setScores(newScores);
    }
  }

  const handleEliminationComplete = () => {
    const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);
    if (eliminatedPlayer?.role === "Mr. White" && whiteGuessCorrect) {
      // Final score calculation for game over
      calculateFinalScores();
      setGamePhase("gameOver");
      return;
    }

    const remainingPlayers = players.filter((p) => !p.isEliminated);

    // Update scores based on elimination and survival
    const newScores = { ...scores };
    
    // 1. Base points for surviving the round
    remainingPlayers.forEach((player) => {
      newScores[player.id] = (newScores[player.id] || 0) + 1; // 1 point for surviving
    });
    
    // 2. Points for eliminating specific roles
    if (eliminatedPlayer?.role === "Undercover") {
      remainingPlayers.forEach((player) => {
        if (player.role === "Civilian") {
          newScores[player.id] += 2; // 2 points for eliminating an Undercover
        }
      });
    } else if (eliminatedPlayer?.role === "Mr. White") {
      remainingPlayers.forEach((player) => {
        if (player.role === "Civilian") {
          newScores[player.id] += 3; // 3 points for eliminating Mr. White
        }
      });
    } else if (eliminatedPlayer?.role === "Civilian") {
      // Undercover players get points for successful deception
      remainingPlayers.forEach((player) => {
        if (player.role === "Undercover") {
          newScores[player.id] += 2; // 2 points for successful deception
        }
      });
    }
    
    // 3. Extra points for Undercover players for surviving each round
    remainingPlayers.forEach((player) => {
      if (player.role === "Undercover") {
        newScores[player.id] += 1; // 1 extra point for Undercover survival
      }
    });
    
    setScores(newScores);

    // Check game-over conditions
    const remainingUndercover = remainingPlayers.filter((p) => p.role === "Undercover");
    const remainingMrWhite = remainingPlayers.filter((p) => p.role === "Mr. White");
    if (
      remainingUndercover.length === 0 &&
      remainingMrWhite.length === 0 ||
      remainingPlayers.length <= 2
    ) {
      // Calculate final scores before game over
      calculateFinalScores();
      setGamePhase("gameOver");
    } else {
      // Randomize speaking order for the next round
      const newSpeakingOrder = randomizeSpeakingOrder(remainingPlayers, round + 1);
      setSpeakingOrder(newSpeakingOrder);

      setRound(round + 1);
      setGamePhase("voting");
      setCurrentPlayerIndex(0);
    }

    setEliminatedPlayerId(null); // Reset eliminated player ID for the next round
  }

  // New function to calculate final scores at game end
  const calculateFinalScores = () => {
    const remainingPlayers = players.filter((p) => !p.isEliminated);
    const remainingCivilians = remainingPlayers.filter(p => p.role === "Civilian");
    const remainingUndercover = remainingPlayers.filter(p => p.role === "Undercover");
    const remainingMrWhite = remainingPlayers.filter(p => p.role === "Mr. White");
    const eliminatedMrWhite = players.filter(p => p.isEliminated && p.role === "Mr. White");
    
    // Determine the winning team
    let winnerRole = "Civilians";
    if (remainingCivilians.length <= remainingUndercover.length) {
      winnerRole = "Undercover";
    } else if (remainingMrWhite.length > 0) {
      winnerRole = "Mr. White";
    } else if (eliminatedMrWhite.length > 0 && whiteGuessCorrect) {
      winnerRole = "Mr. White";
    }
    
    const newScores = { ...scores };
    
    // Award bonus points to the winning team
    players.forEach((player) => {
      // Bonus points for winning team
      if (
        (winnerRole === "Civilians" && player.role === "Civilian") ||
        (winnerRole === "Undercover" && player.role === "Undercover") ||
        (winnerRole === "Mr. White" && player.role === "Mr. White")
      ) {
        newScores[player.id] += 3; // 3 bonus points for being on winning team
      }
      
      // Extra bonus for Undercover victory
      if (winnerRole === "Undercover" && player.role === "Undercover") {
        newScores[player.id] += 2; // 2 extra points for Undercover victory
      }
    });
    
    setScores(newScores);
  }

  const handleRestart = () => {
    // Reset game state while preserving scores
    setRound(1);
    setCurrentPlayerIndex(0);
    setEliminatedPlayerId(null);
    setWhiteGuessCorrect(false);

    // Re-assign roles and words
    const newWordPair = getRandomWordPair(gameSettings.wordCategory);
    setWordPair(newWordPair);

    const { players: newPlayers, speakingOrder: newOrder } = assignRoles(
      players.map((p) => p.name),
      players.length,
      gameSettings.includeWhite,
      newWordPair,
      gameSettings.undercoverCount
    );

    // Preserve scores for existing players
    const newScores = { ...scores };
    newPlayers.forEach((player) => {
      if (!newScores[player.id]) {
        newScores[player.id] = 0;
      }
    });

    setPlayers(newPlayers);
    setSpeakingOrder(randomizeSpeakingOrder(newPlayers, 1));
    setScores(newScores);
    setGamePhase("pass");
  };

  const handleAddPlayer = () => {
    setShowAddPlayerConfirm(true);
  };

  const confirmAddPlayer = () => {
    // Store current players in localStorage to preserve them
    const currentPlayerNames = players.map(p => p.name);
    localStorage.setItem('offlineGamePlayers', JSON.stringify(currentPlayerNames));
    navigate('/offline/setup');
  };

  const cancelAddPlayer = () => {
    setShowAddPlayerConfirm(false);
  };

  const handleQuit = () => {
    setShowQuitConfirm(true);
  };

  const confirmQuit = () => {
    navigate('/');
  };

  const cancelQuit = () => {
    setShowQuitConfirm(false);
  };

  const renderGamePhase = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-400">Loading game...</div>
        </div>
      )
    }

    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <Starfield />
        <div className="relative z-10">
          {gamePhase === "pass" && (
            <OfflinePassDevice
              playerName={players[currentPlayerIndex].name}
              playerAvatar={players[currentPlayerIndex].avatar}
              onContinue={() => setGamePhase("reveal")}
            />
          )}
          {gamePhase === "reveal" && (
            <OfflineRoleReveal
              player={players[currentPlayerIndex]}
              onComplete={handleRoleRevealComplete}
            />
          )}
          {gamePhase === "voting" && (
            <OfflineVoting
              players={players}
              speakingOrder={speakingOrder}
              onVoteComplete={handleVoteComplete}
              round={round}
            />
          )}
          {gamePhase === "elimination" && (
            <OfflineElimination
              player={players.find((p) => p.id === eliminatedPlayerId)}
              onComplete={handleEliminationComplete}
              onWhiteGuess={handleWhiteGuess}
              civilianWord={wordPair[0]}
            />
          )}
          {gamePhase === "gameOver" && (
            <OfflineGameOver
              players={players}
              civilianWord={wordPair[0]}
              undercoverWord={wordPair[1]}
              scores={scores}
              whiteGuessCorrect={whiteGuessCorrect}
              onRestart={handleRestart}
              onAddPlayer={handleAddPlayer}
              onQuit={handleQuit}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <Starfield />
      <div className="relative z-10">
        {renderGamePhase()}
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <Badge variant="outline" className="text-lg py-1 px-3">
          Round {round}
        </Badge>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsPaused(true)}
        >
          <Pause className="h-4 w-4" />
        </Button>
      </div>
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onRestart={handleRestart}
          onQuit={handleQuit}
          onAddPlayer={handleAddPlayer}
        />
      )}
      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Quit</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to quit the game?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={confirmQuit} className="bg-red-600 hover:bg-red-700">
              Quit Game
            </Button>
            <Button onClick={cancelQuit} variant="outline">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAddPlayerConfirm} onOpenChange={setShowAddPlayerConfirm}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Add Player</DialogTitle>
            <DialogDescription className="text-gray-400">
              Adding a new player will restart the game. Continue?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={confirmAddPlayer} className="bg-green-600 hover:bg-green-700">
              Add Player
            </Button>
            <Button onClick={cancelAddPlayer} variant="outline">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
