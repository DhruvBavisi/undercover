import React, { useEffect, useState } from 'react';

function getRandomizedSpeakingOrder(players) {
  // Create a copy of the array to avoid mutation
  const randomized = [...players];
  
  // Fisher-Yates shuffle algorithm
  for (let i = randomized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }

  return randomized;
}

const OfflineGamePage = () => {
  const [gameState, setGameState] = useState('discussion');
  const [players, setPlayers] = useState([]);
  const [speakingOrder, setSpeakingOrder] = useState([]);

  // Add a dedicated function to randomize speaking order that can be called at specific times
  const randomizeSpeakingOrder = () => {
    if (players.length > 0) {
      console.log('Manually randomizing speaking order');
      const randomizedOrder = getRandomizedSpeakingOrder([...players]);
      setSpeakingOrder(randomizedOrder);
      console.log('New speaking order:', randomizedOrder.map(p => p.role));
    }
  };

  // Call this function at specific points in your game flow
  // For example, when starting a new round or after role assignment

  useEffect(() => {
    if (gameState === 'discussion' && players.length > 0) {
      // Use setTimeout to ensure this happens after any other state updates
      setTimeout(() => {
        randomizeSpeakingOrder();
      }, 0);
    }
  }, [gameState, players]);

  return (
    // Rest of the component code
  );
};

export default OfflineGamePage; 