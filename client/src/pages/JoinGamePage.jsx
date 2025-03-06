import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function JoinGamePage() {
  const navigate = useNavigate()
  const [gameCode, setGameCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")

  const handleJoinGame = () => {
    if (!gameCode || !playerName) {
      setError("Please enter both game code and your name")
      return
    }

    setIsJoining(true)
    setError("")

    // In a real app, we would make an API call to join the game
    // For now, we'll simulate a delay and redirect to the game page
    setTimeout(() => {
      navigate(`/game/${gameCode}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto">
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Join Game</CardTitle>
              <CardDescription className="text-center text-gray-400">
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="gameCode">Game Code</Label>
                  <Input
                    id="gameCode"
                    placeholder="Enter 6-digit code"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    className="bg-gray-700 border-gray-600 uppercase"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerName">Your Name</Label>
                  <Input
                    id="playerName"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button onClick={handleJoinGame} className="w-full bg-red-600 hover:bg-red-700" disabled={isJoining}>
                  {isJoining ? "Joining..." : "Join Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

