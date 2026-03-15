import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Loader2, LogIn, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import Starfield from "../components/Starfield";

export default function JoinGamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { join, room, loading, error } = useGameRoom();

  // Get room code from URL query parameters if available
  const queryParams = new URLSearchParams(location.search);
  const initialRoomCode = queryParams.get('code') || '';

  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [formError, setFormError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (roomCode) {
        navigate(`/login?redirect=/join?code=${roomCode}`);
      } else {
        navigate('/login?redirect=/join');
      }
    }
  }, [isAuthenticated, navigate, roomCode]);

  // Redirect to game room if joined
  useEffect(() => {
    if (room && !loading) {
      if (room.status === 'in-progress' || room.status === 'completed') {
        navigate(`/online-game/${room.roomCode}`);
      } else {
        navigate(`/game/${room.roomCode}`);
      }
    }
  }, [room, loading, navigate]);

  const handleJoinGame = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!roomCode.trim()) {
      setFormError('Please enter a game code');
      return;
    }

    if (roomCode.length !== 6) {
      setFormError('Game code must be 6 characters');
      return;
    }

    setIsJoining(true);
    const result = await join(roomCode.trim().toUpperCase());
    if (!result) {
      setIsJoining(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Starfield />
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div>
          <Link to="/" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="bg-gray-800/70 border-gray-700 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl text-center font-bold tracking-tight">
              Join Game
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter the 6-digit code to join a room
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
                <Label htmlFor="roomCode" className="sr-only">Game Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter 6-digit code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-gray-700 border-gray-600 uppercase text-center text-xl tracking-widest font-mono py-6"
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-medium mt-6"
                disabled={loading || isJoining}
              >
                {loading || isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Join Game
                  </>
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

