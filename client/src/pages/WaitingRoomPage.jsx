import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, ArrowLeft, Users, Crown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { getWordPackNames } from '../utils/wordPacks';

const WaitingRoomPage = () => {
  const navigate = useNavigate();
  const { gameCode } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { room, isHost, loading, error, fetchRoom } = useGameRoom();
  const { toast } = useToast();
  const [wordPacks, setWordPacks] = useState([]);
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    roundTime: 60,
    wordPack: 'basic',
    numUndercovers: 1,
    includeMrWhite: false,
    customWords: {
      civilian: '',
      undercover: ''
    }
  });

  // Fetch word packs on mount
  useEffect(() => {
    const fetchWordPacks = async () => {
      try {
        const packs = await getWordPackNames();
        setWordPacks(packs);
      } catch (error) {
        console.error('Error fetching word packs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load word packs',
          variant: 'destructive'
        });
      }
    };

    fetchWordPacks();
  }, [toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch room details
  useEffect(() => {
    if (isAuthenticated && gameCode) {
      fetchRoom(gameCode);
    }
  }, [isAuthenticated, gameCode, fetchRoom]);

  const handleSettingChange = (key, value) => {
    if (!isHost) return;

    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Update server
    const socket = window.socket;
    if (socket) {
      socket.emit('update-settings', {
        gameCode: room.roomCode,
        settings: {
          ...settings,
          [key]: value
        }
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleStartGame = () => {
    if (!isHost) return;

    const socket = window.socket;
    if (socket) {
      socket.emit('start-game', {
        gameCode: room.roomCode
      });
    }
  };

  const handleToggleReady = () => {
    const socket = window.socket;
    if (socket) {
      socket.emit('toggle-ready', {
        gameCode: room.roomCode,
        playerId: user.id
      });
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white p-0 mb-8"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>Configure the game settings before starting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="maxPlayers" className="text-sm font-medium">
                      Max Players
                    </label>
                    <Input
                      type="number"
                      id="maxPlayers"
                      value={settings.maxPlayers}
                      onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                      min={4}
                      max={12}
                      className="bg-gray-700 border-gray-600"
                      disabled={!isHost}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="roundTime" className="text-sm font-medium">
                      Round Time (seconds)
                    </label>
                    <Input
                      type="number"
                      id="roundTime"
                      value={settings.roundTime}
                      onChange={(e) => handleSettingChange('roundTime', parseInt(e.target.value))}
                      min={30}
                      max={180}
                      className="bg-gray-700 border-gray-600"
                      disabled={!isHost}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="numUndercovers" className="text-sm font-medium">
                      Number of Undercovers
                    </label>
                    <Input
                      type="number"
                      id="numUndercovers"
                      value={settings.numUndercovers}
                      onChange={(e) => handleSettingChange('numUndercovers', parseInt(e.target.value))}
                      min={1}
                      max={Math.floor((room?.players?.length || 8) / 3)}
                      className="bg-gray-700 border-gray-600"
                      disabled={!isHost}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="wordPack" className="text-sm font-medium">
                      Word Pack
                    </label>
                    <select
                      id="wordPack"
                      value={settings.wordPack}
                      onChange={(e) => handleSettingChange('wordPack', e.target.value)}
                      className="w-full h-10 rounded-md bg-gray-700 border-gray-600 text-white"
                      disabled={!isHost}
                    >
                      {wordPacks.map(pack => (
                        <option key={pack} value={pack}>
                          {pack.charAt(0).toUpperCase() + pack.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMrWhite"
                    checked={settings.includeMrWhite}
                    onCheckedChange={(checked) => handleSettingChange('includeMrWhite', checked)}
                    className="border-gray-600"
                    disabled={!isHost || room?.players?.length < 5}
                  />
                  <label
                    htmlFor="includeMrWhite"
                    className={`text-sm font-medium leading-none ${
                      !isHost || room?.players?.length < 5 ? 'opacity-50' : ''
                    }`}
                  >
                    Include Mr. White
                    {room?.players?.length < 5 && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Requires at least 5 players)
                      </span>
                    )}
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Words (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="Civilian Word"
                      value={settings.customWords.civilian}
                      onChange={(e) => handleSettingChange('customWords', {
                        ...settings.customWords,
                        civilian: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600"
                      disabled={!isHost}
                    />
                    <Input
                      placeholder="Undercover Word"
                      value={settings.customWords.undercover}
                      onChange={(e) => handleSettingChange('customWords', {
                        ...settings.customWords,
                        undercover: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600"
                      disabled={!isHost}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Leave blank to use words from the selected word pack
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                {room?.players?.length || 0} / {settings.maxPlayers} players joined
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {room?.players?.map(player => (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.isReady ? 'bg-green-900/20' : 'bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 relative">
                        {player.name.charAt(0).toUpperCase()}
                        {player.userId === room.hostId && (
                          <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-gray-400">@{player.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {player.userId === room.hostId && (
                        <span className="text-xs bg-yellow-600/80 px-2 py-1 rounded">Host</span>
                      )}
                      {player.isReady && (
                        <span className="text-xs bg-green-600/80 px-2 py-1 rounded">Ready</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {isHost ? (
                  <Button
                    onClick={handleStartGame}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!room?.players?.every(p => p.isReady)}
                  >
                    Start Game
                  </Button>
                ) : (
                  <Button
                    onClick={handleToggleReady}
                    className={`w-full ${
                      room?.players?.find(p => p.userId === user.id)?.isReady
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {room?.players?.find(p => p.userId === user.id)?.isReady
                      ? 'Not Ready'
                      : 'Ready'}
                  </Button>
                )}

                <p className="text-center text-sm text-gray-400">
                  {isHost
                    ? 'All players must be ready to start the game'
                    : 'Waiting for the host to start the game'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage; 