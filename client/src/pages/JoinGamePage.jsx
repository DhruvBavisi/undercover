import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function JoinGamePage() {
  const { isAuthenticated } = useAuth();
  const { join, loading, error, room } = useGameRoom();
  const navigate = useNavigate();
  
  const [roomCode, setRoomCode] = useState('');
  const [formError, setFormError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Redirect to game page if successfully joined a room
  useEffect(() => {
    if (room && room.roomCode) {
      console.log('Successfully joined room, redirecting to game page');
      navigate(`/game/${room.roomCode}`);
    }
  }, [room, navigate]);
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!roomCode) {
      setFormError('Please enter a game code');
      return;
    }
    
    if (roomCode.length !== 6) {
      setFormError('Game code must be 6 characters');
      return;
    }
    
    setFormError('');
    setIsJoining(true);
    
    try {
      // Call the join function from GameRoomContext
      await join(roomCode);
    } catch (err) {
      console.error('Error joining game:', err);
      setFormError('Failed to join game. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-md">
        <Link to="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <Card className="bg-gray-800 border-gray-700 mt-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Join Online Game</CardTitle>
            <CardDescription className="text-gray-400">
              Enter the game code to join an existing game.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-900 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {formError && (
              <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-900 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleJoinGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Game Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter 6-digit code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-gray-700 border-gray-600"
                  maxLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || isJoining}
              >
                {loading || isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Game'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center text-sm text-gray-400">
            Game codes are 6 characters long and case-insensitive.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

