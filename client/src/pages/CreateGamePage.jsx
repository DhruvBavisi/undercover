import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { ArrowLeft, Plus, Minus, User, Copy, Users, Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { MAX_PLAYERS, MIN_PLAYERS, DEFAULT_ROUND_TIME } from '../config';

export default function CreateGamePage() {
  const { isAuthenticated, user } = useAuth();
  const { create, loading, error } = useGameRoom();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState('');
  const [gameCreated, setGameCreated] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [roundTime, setRoundTime] = useState(DEFAULT_ROUND_TIME);
  const [wordPack, setWordPack] = useState('standard');
  const [numUndercovers, setNumUndercovers] = useState(1);
  const [numMrWhites, setNumMrWhites] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleCreateGame = async () => {
    // Create game settings object
    const settings = {
      maxPlayers,
      roundTime,
      wordPack,
      numUndercovers,
      numMrWhites
    };
    
    // Call the create function from GameRoomContext
    await create(settings);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
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
                {gameCreated ? "Game Created!" : "Create Online Game"}
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                {gameCreated ? "Share this code with your friends to join" : "Set up your online game parameters"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-900 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!gameCreated ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Your Name</Label>
                    <Input
                      id="playerName"
                      value={user?.name || user?.username || ""}
                      disabled
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="maxPlayers">Max Players: {maxPlayers}</Label>
                      <div className="w-2/3">
                        <Slider
                          id="maxPlayers"
                          min={MIN_PLAYERS}
                          max={MAX_PLAYERS}
                          step={1}
                          value={[maxPlayers]}
                          onValueChange={(value) => setMaxPlayers(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="roundTime">Round Time: {roundTime}s</Label>
                      <div className="w-2/3">
                        <Slider
                          id="roundTime"
                          min={30}
                          max={180}
                          step={10}
                          value={[roundTime]}
                          onValueChange={(value) => setRoundTime(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wordPack">Word Pack</Label>
                    <Select value={wordPack} onValueChange={setWordPack}>
                      <SelectTrigger id="wordPack" className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select a word pack" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="places">Places</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="numUndercovers">Undercovers: {numUndercovers}</Label>
                      <div className="w-2/3">
                        <Slider
                          id="numUndercovers"
                          min={1}
                          max={3}
                          step={1}
                          value={[numUndercovers]}
                          onValueChange={(value) => setNumUndercovers(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="numMrWhites">Mr. Whites: {numMrWhites}</Label>
                      <div className="w-2/3">
                        <Slider
                          id="numMrWhites"
                          min={0}
                          max={1}
                          step={1}
                          value={[numMrWhites]}
                          onValueChange={(value) => setNumMrWhites(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating game...
                      </>
                    ) : (
                      "Create Game"
                    )}
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
                        onClick={() => {
                          navigator.clipboard.writeText(gameCode);
                          toast({
                            title: "Game Code Copied",
                            description: "The game code has been copied to your clipboard.",
                          });
                        }}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <Users className="h-5 w-5" />
                    <span>Waiting for players (1/{maxPlayers})</span>
                  </div>

                  <Button onClick={() => navigate(`/game/${gameCode}`)} className="w-full bg-red-600 hover:bg-red-700">
                    Start Game
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

