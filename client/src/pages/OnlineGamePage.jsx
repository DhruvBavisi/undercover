import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SocketContext from '../context/SocketContext';

const OnlineGamePage = () => {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const params = useParams();

  // Game state similar to offline mode
  const [gamePhase, setGamePhase] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState({});

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle game state updates from server
    socket.on('game-state-update', (state) => {
      setPlayers(state.players);
      setGamePhase(state.phase);
    });

    // Handle player join/leave events
    socket.on('player-joined', (player) => {
      setPlayers(prev => [...prev, player]);
    });

    socket.on('player-left', (playerId) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    // Cleanup on unmount
    return () => {
      socket.off('game-state-update');
      socket.off('player-joined');
      socket.off('player-left');
    };
  }, [socket]);

  // Handle game creation
  const handleCreateGame = () => {
    socket.emit('create-game', {
      playerName: 'Host', // Replace with actual player name
      settings: {
        roundTime: 60,
        wordCategory: 'general',
        includeWhite: true
      }
    });
  };

  useEffect(() => {
    // Check if we're in create mode
    const isCreateMode = params.create === 'true';
    if (isCreateMode) {
      // Automatically create game when in create mode
      handleCreateGame();
    }
  }, [params]);

  return (
    <div className='container mx-auto px-4 pt-20 pb-8'>
      <div className='bg-gray-800/70 border-gray-700 max-w-4xl mx-auto p-6 rounded-lg'>
        {gamePhase === 'lobby' && (
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-4'>Create New Game</h2>
            <div className='mt-6'>
              <h3 className='text-xl font-semibold mb-2'>Players</h3>
              <ul className='space-y-2'>
                {players.map(player => (
                  <li key={player.id} className='bg-gray-700/50 p-3 rounded-lg'>
                    {player.name}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCreateGame}
                className='mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors'
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineGamePage;
