import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Send } from 'lucide-react'
import ChatMessage from '../components/chat-message'
import GamePlayerCard from '../components/game-player-card'
import RoleRevealModal from '../components/role-reveal-modal'
import VotingModal from '../components/voting-modal'
import GameOverModal from '../components/game-over-modal'
import { getGameDetails } from '../services/api'
import socketService from '../services/socket'

// Mock data for initial development
const MOCK_PLAYERS = [
  { id: 1, name: "Alex", role: "Civilian", isEliminated: false, isCurrentPlayer: true },
  { id: 2, name: "Blake", role: "Civilian", isEliminated: false, isCurrentPlayer: false },
  { id: 3, name: "Casey", role: "Undercover", isEliminated: false, isCurrentPlayer: false },
  { id: 4, name: "Dana", role: "Civilian", isEliminated: false, isCurrentPlayer: false },
  { id: 5, name: "Elliot", role: "Mr. White", isEliminated: false, isCurrentPlayer: false },
  { id: 6, name: "Frankie", role: "Civilian", isEliminated: false, isCurrentPlayer: false },
];

const MOCK_MESSAGES = [
  { id: 1, playerName: "System", content: "Game has started! Each player will take turns describing their word.", isSystem: true },
  { id: 2, playerName: "Alex", content: "I'll go first. My word is something I use every day.", isSystem: false },
];

export default function GamePage() {
  const params = useParams()
  const gameId = params.gameId
  const navigate = useNavigate()

  const [players, setPlayers] = useState(MOCK_PLAYERS)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [gamePhase, setGamePhase] = useState("discussion") // discussion, voting, elimination, gameOver
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [showRoleReveal, setShowRoleReveal] = useState(false)
  const [showVoting, setShowVoting] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null)
  const [secretWord, setSecretWord] = useState("Smartphone") // This would be assigned by the server
  const [playerId, setPlayerId] = useState(() => {
    return localStorage.getItem(`game_${gameId}_playerId`) || null
  })

  // Connect to socket and fetch game data
  useEffect(() => {
    if (!gameId) return

    // Try to get player ID from local storage
    const storedPlayerId = localStorage.getItem(`game_${gameId}_playerId`)
    
    if (storedPlayerId) {
      setPlayerId(parseInt(storedPlayerId))
      
      // Connect to socket
      const socket = socketService.connect()
      socketService.joinGame(gameId, parseInt(storedPlayerId))
      
      // Set up socket event listeners
      socketService.onReceiveMessage((message) => {
        setMessages(prev => [...prev, message])
      })
      
      socketService.onPlayerEliminated((data) => {
        setPlayers(prev => 
          prev.map(p => p.id === data.playerId ? { ...p, isEliminated: true } : p)
        )
        
        const player = players.find(p => p.id === data.playerId)
        if (player) {
          setEliminatedPlayer(player)
          setShowRoleReveal(true)
        }
      })
      
      socketService.onGamePhaseChanged((data) => {
        setGamePhase(data.phase)
        
        if (data.phase === 'voting') {
          setShowVoting(true)
        } else if (data.phase === 'gameOver') {
          setShowGameOver(true)
        }
      })
      
      // Fetch game details
      const fetchGameDetails = async () => {
        try {
          const response = await getGameDetails(gameId)
          if (response.success) {
            const { game } = response
            setPlayers(game.players)
            setMessages(game.messages)
            setGamePhase(game.gamePhase)
            setCurrentPlayerTurn(game.currentPlayerTurn)
          }
        } catch (error) {
          console.error('Error fetching game details:', error)
        }
      }
      
      fetchGameDetails()
    } else {
      // No player ID found, redirect to join page
      navigate(`/join?gameId=${gameId}`)
    }
    
    return () => {
      socketService.disconnect()
    }
  }, [gameId, navigate])

  // Simulate timer countdown
  useEffect(() => {
    if (gamePhase === "discussion" && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && gamePhase === "discussion") {
      // Time's up, move to voting phase
      setShowVoting(true)
      setGamePhase("voting")
      socketService.changeGamePhase("voting")
    }
  }, [timeRemaining, gamePhase])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    socketService.sendMessage(newMessage)
    setNewMessage("")

    // In a real game, this would trigger the next player's turn
    if (currentPlayerTurn === players.length) {
      // Last player has spoken, move to voting
      setTimeout(() => {
        setShowVoting(true)
        setGamePhase("voting")
        socketService.changeGamePhase("voting")
      }, 2000)
    } else {
      setCurrentPlayerTurn(currentPlayerTurn + 1)
    }
  }

  const handleVote = (playerId) => {
    socketService.submitVote(playerId)
    setShowVoting(false)

    // Simulate player elimination
    const playerToEliminate = players.find((p) => p.id === playerId)
    setEliminatedPlayer(playerToEliminate)
    socketService.eliminatePlayer(playerId)

    setTimeout(() => {
      setShowRoleReveal(true)
      setGamePhase("elimination")
      socketService.changeGamePhase("elimination")
    }, 1000)
  }

  const handleContinueAfterReveal = () => {
    setShowRoleReveal(false)

    // Check if game should end
    const remainingPlayers = players.filter((p) => !p.isEliminated)
    if (remainingPlayers.length <= 2) {
      setShowGameOver(true)
      setGamePhase("gameOver")
      socketService.changeGamePhase("gameOver")
    } else {
      // Continue to next round
      setGamePhase("discussion")
      socketService.changeGamePhase("discussion")
      setTimeRemaining(60)
      setCurrentPlayerTurn(1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Game Room: {gameId}</h1>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/3">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Players</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {players.map((player) => (
                    <GamePlayerCard 
                      key={player.id} 
                      player={player} 
                      isCurrentTurn={currentPlayerTurn === player.id && gamePhase === "discussion"}
                      timeRemaining={currentPlayerTurn === player.id ? timeRemaining : null}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:w-2/3 flex flex-col">
            <Card className="bg-gray-800/70 border-gray-700 flex-grow">
              <CardContent className="p-4 flex flex-col h-[calc(100vh-10rem)]">
                <div className="flex-grow overflow-y-auto mb-4 space-y-3">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    placeholder={
                      gamePhase === "discussion" && currentPlayerTurn === 1
                        ? "Describe your word without being too obvious..."
                        : "Chat with other players..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-gray-700 border-gray-600"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={gamePhase !== "discussion" && currentPlayerTurn !== 1}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Role reveal modal */}
      {showRoleReveal && eliminatedPlayer && (
        <RoleRevealModal
          isOpen={showRoleReveal}
          onClose={handleContinueAfterReveal}
          player={eliminatedPlayer}
          word={eliminatedPlayer.role === 'Civilian' ? secretWord : ''}
        />
      )}

      {/* Voting modal */}
      {showVoting && <VotingModal 
        isOpen={showVoting} 
        onClose={() => setShowVoting(false)} 
        players={players.filter((p) => !p.isEliminated)} 
        onVote={handleVote} 
      />}

      {/* Game over modal */}
      {showGameOver && (
        <GameOverModal
          isOpen={showGameOver}
          onClose={() => navigate('/')}
          winner="civilians" // This would be determined by the server
          players={players}
          words={{
            civilian: secretWord,
            undercover: secretWord // In a real game, this would be different
          }}
        />
      )}
    </div>
  )
} 