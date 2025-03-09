// Add Mr. White guess handler
socket.on('mr-white-guess', async ({ gameCode, playerId, word }) => {
  try {
    const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
    if (!gameRoom) {
      socket.emit('error', { message: 'Game room not found' });
      return;
    }

    const result = gameRoom.handleMrWhiteGuess(playerId, word);
    
    if (result.success) {
      // Mr. White wins!
      gameRoom.winner = 'mrwhite';
      gameRoom.currentPhase = 'gameOver';
      await gameRoom.save();

      // Notify all players
      io.to(gameCode).emit('game-over', {
        winner: 'mrwhite',
        word: word,
        correctWord: gameRoom.words.civilian
      });
    } else {
      // Notify the player of incorrect guess
      socket.emit('guess-result', {
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error handling Mr. White guess:', error);
    socket.emit('error', { message: 'Server error' });
  }
});

// Update the change-game-phase handler to handle Mr. White's guessing phase
socket.on('change-game-phase', async ({ gameCode, newPhase }) => {
  try {
    const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
    if (!gameRoom) {
      socket.emit('error', { message: 'Game room not found' });
      return;
    }

    // Update game phase
    gameRoom.currentPhase = newPhase;

    // Special handling for elimination phase
    if (newPhase === 'elimination') {
      const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
      if (!currentRound) {
        socket.emit('error', { message: 'Invalid round' });
        return;
      }

      // Count votes
      const voteCount = {};
      currentRound.votes.forEach(vote => {
        voteCount[vote.votedForId] = (voteCount[vote.votedForId] || 0) + 1;
      });

      // Find player with most votes
      let maxVotes = 0;
      let eliminatedPlayerId = null;
      Object.entries(voteCount).forEach(([playerId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedPlayerId = playerId;
        }
      });

      if (eliminatedPlayerId) {
        const eliminatedPlayer = gameRoom.players.find(
          p => p.userId.toString() === eliminatedPlayerId
        );
        if (eliminatedPlayer) {
          eliminatedPlayer.isEliminated = true;
          currentRound.eliminatedPlayer = {
            userId: eliminatedPlayer.userId,
            name: eliminatedPlayer.name,
            role: eliminatedPlayer.role,
            word: eliminatedPlayer.word
          };

          // Check if Mr. White is eliminated
          if (eliminatedPlayer.role === 'mrwhite') {
            // Give Mr. White one chance to guess the word
            io.to(gameCode).emit('mr-white-last-chance', {
              playerId: eliminatedPlayer.userId,
              name: eliminatedPlayer.name
            });
            
            // Wait for guess or timeout
            setTimeout(async () => {
              const updatedRoom = await GameRoom.findOne({ roomCode: gameCode });
              if (updatedRoom && updatedRoom.currentPhase === 'elimination') {
                // If no correct guess was made, proceed with elimination
                const winner = updatedRoom.checkWinCondition();
                if (winner) {
                  updatedRoom.winner = winner;
                  updatedRoom.currentPhase = 'gameOver';
                  await updatedRoom.save();
                  
                  io.to(gameCode).emit('game-over', {
                    winner,
                    eliminatedPlayer: currentRound.eliminatedPlayer
                  });
                }
              }
            }, 30000); // Give 30 seconds for Mr. White to guess
            
            return;
          }
        }
      }

      // Check win condition
      const winner = gameRoom.checkWinCondition();
      if (winner) {
        gameRoom.winner = winner;
        gameRoom.currentPhase = 'gameOver';
      }
    }

    await gameRoom.save();

    // Notify all players of phase change
    io.to(gameCode).emit('phase-change', {
      phase: newPhase,
      eliminatedPlayer: newPhase === 'elimination' ? gameRoom.rounds[gameRoom.currentRound - 1].eliminatedPlayer : null,
      winner: gameRoom.winner
    });

  } catch (error) {
    console.error('Error changing game phase:', error);
    socket.emit('error', { message: 'Server error' });
  }
}); 