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
        setSpeakingOrder(initialOrder)
        
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
    setWhiteGuessCorrect(isCorrect)
    if (isCorrect) {
      // Mr. White wins, update scores
      const newScores = { ...scores }
      players.forEach((player) => {
        if (player.role === "Mr. White") {
          newScores[player.id] += 3 // Bonus points for correct guess
        }
      })
      setScores(newScores)
    }
  }

  const handleEliminationComplete = () => {
    const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);
    if (eliminatedPlayer?.role === "Mr. White" && whiteGuessCorrect) {
      setGamePhase("gameOver");
      return;
    }

    const remainingPlayers = players.filter((p) => !p.isEliminated);

    // Update scores based on elimination
    const newScores = { ...scores };
    if (eliminatedPlayer?.role === "Undercover" || eliminatedPlayer?.role === "Mr. White") {
      remainingPlayers.forEach((player) => {
        if (player.role === "Civilian") {
          newScores[player.id] += 1; // Point for correct elimination
        }
      });
    } else if (eliminatedPlayer?.role === "Civilian") {
      remainingPlayers.forEach((player) => {
        if (player.role === "Undercover") {
          newScores[player.id] += 1; // Point for successful deception
        } else if (player.role === "Mr. White") {
          newScores[player.id] += 1; // Point for Mr. White's survival
        }
      });
    }
    setScores(newScores);

    // Check game-over conditions
    const remainingUndercover = remainingPlayers.filter((p) => p.role === "Undercover");
    const remainingMrWhite = remainingPlayers.filter((p) => p.role === "Mr. White");
    if (
      remainingUndercover.length === 0 &&
      remainingMrWhite.length === 0 ||
      remainingPlayers.length <= 2
    ) {
      setGamePhase("gameOver");
    } else {
      // Randomize speaking order for the next round
      const newSpeakingOrder = randomizeSpeakingOrder(remainingPlayers);
      setSpeakingOrder(newSpeakingOrder);

      setRound(round + 1);
      setGamePhase("voting");
      setCurrentPlayerIndex(0);
    }

    setEliminatedPlayerId(null); // Reset eliminated player ID for the next round
  }

  const handleRestartGame = () => {
    // Reset game state
    setRound(1)
    setCurrentPlayerIndex(0)
    setEliminatedPlayerId(null)
    setWhiteGuessCorrect(false)
    
    // Re-assign roles and words
    const newWordPair = getRandomWordPair(gameSettings.wordCategory)
    setWordPair(newWordPair)
    
    const { players: newPlayers, speakingOrder: newOrder } = assignRoles(
      players.map((p) => p.name),
      players.length,
      gameSettings.includeWhite,
      newWordPair,
      gameSettings.undercoverCount
    )
    
    setPlayers(newPlayers)
    setSpeakingOrder(newOrder)
    
    // Reset scores
    const newScores = {}
    newPlayers.forEach((player) => {
      newScores[player.id] = 0
    })
    setScores(newScores)
    setGamePhase("pass")
  }

  const handleAddPlayer = () => {
    // Store current players in localStorage to preserve them
    const currentPlayerNames = players.map(p => p.name);
    
    // Update the game settings in localStorage
    const updatedSettings = {
      ...gameSettings,
      playerNames: currentPlayerNames
    };
    
    localStorage.setItem("offlineGameSettings", JSON.stringify(updatedSettings));
    localStorage.setItem("returnToSetup", "true");
    
    // Navigate to the offline setup page
    navigate("/offline");
  }

  const handleQuit = () => {
    navigate("/")
  }

  const renderGamePhase = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-400">Loading game...</div>
        </div>
      )
    }

    switch (gamePhase) {
      case "pass":
        return (
          <OfflinePassDevice
            playerName={players[currentPlayerIndex].name}
            playerAvatar={players[currentPlayerIndex].avatar}
            onContinue={() => setGamePhase("reveal")}
          />
        )
      case "reveal":
        return (
          <OfflineRoleReveal
            player={players[currentPlayerIndex]}
            onComplete={handleRoleRevealComplete}
          />
        )
      case "voting":
        return (
          <OfflineVoting
            players={players}
            speakingOrder={speakingOrder}
            onVoteComplete={handleVoteComplete}
            round={round}
          />
        )
      case "elimination":
        const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);
        return (
          <OfflineElimination
            player={eliminatedPlayer}
            onComplete={handleEliminationComplete}
            onWhiteGuess={handleWhiteGuess}
            civilianWord={wordPair[0]}
          />
        )
      case "gameOver":
        return (
          <OfflineGameOver
            players={players}
            civilianWord={wordPair[0]}
            undercoverWord={wordPair[1]}
            scores={scores}
            whiteGuessCorrect={whiteGuessCorrect}
            onRestart={handleRestartGame}
            onAddPlayer={handleAddPlayer}
            onQuit={handleQuit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative">
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
      {renderGamePhase()}
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onRestart={handleRestartGame}
          onQuit={handleQuit}
        />
      )}
    </div>
  )
}
