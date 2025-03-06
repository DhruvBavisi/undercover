import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Slider } from "../components/ui/slider"
import { Switch } from "../components/ui/switch"
import { ArrowLeft, Copy, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export default function CreateGamePage() {
  const navigate = useNavigate()
  const [gameCode, setGameCode] = useState("")
  const [gameCreated, setGameCreated] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [playerCount, setPlayerCount] = useState(6)
  const [roundTime, setRoundTime] = useState(60)
  const [includeWhite, setIncludeWhite] = useState(true)
  const [wordCategory, setWordCategory] = useState("general")

  const handleCreateGame = () => {
    // In a real implementation, this would make an API call to create the game
    // For now, we'll generate a random game code
    const newGameCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setGameCode(newGameCode)
    setGameCreated(true)
  }

  const handleStartGame = () => {
    // In a real implementation, this would start the game via API
    navigate(`/game/${gameCode}`)
  }

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode)
    // Would add a toast notification in a full implementation
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
              <CardTitle className="text-2xl text-center">
                {gameCreated ? "Game Created!" : "Create New Game"}
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                {gameCreated ? "Share this code with your friends to join" : "Set up your game parameters"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!gameCreated ? (
                <div className="space-y-6">
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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="playerCount">Player Count: {playerCount}</Label>
                      <span className="text-gray-400 text-sm">(4-10 players)</span>
                    </div>
                    <Slider
                      id="playerCount"
                      min={4}
                      max={10}
                      step={1}
                      value={[playerCount]}
                      onValueChange={(value) => setPlayerCount(value[0])}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="roundTime">Round Time: {roundTime}s</Label>
                      <span className="text-gray-400 text-sm">(30-120 seconds)</span>
                    </div>
                    <Slider
                      id="roundTime"
                      min={30}
                      max={120}
                      step={15}
                      value={[roundTime]}
                      onValueChange={(value) => setRoundTime(value[0])}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wordCategory">Word Category</Label>
                    <Select value={wordCategory} onValueChange={setWordCategory}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="animals">Animals</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="movies">Movies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeWhite" className="cursor-pointer">
                      Include Mr. White
                    </Label>
                    <Switch id="includeWhite" checked={includeWhite} onCheckedChange={setIncludeWhite} />
                  </div>

                  <Button
                    onClick={handleCreateGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!playerName}
                  >
                    Create Game
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 text-center">
                    <p className="text-sm text-gray-400 mb-2">Game Code</p>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-mono tracking-wider">{gameCode}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyGameCode}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <Users className="h-5 w-5" />
                    <span>Waiting for players (1/{playerCount})</span>
                  </div>

                  <Button onClick={handleStartGame} className="w-full bg-red-600 hover:bg-red-700">
                    Start Game
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

