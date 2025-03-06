import { io } from 'socket.io-client';
import config from '../lib/config';

const SOCKET_URL = config.socketUrl;

class SocketService {
  constructor() {
    this.socket = null;
    this.gameCode = null;
    this.playerId = null;
  }

  connect() {
    this.socket = io(SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
    
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinGame(gameCode, playerId) {
    if (!this.socket) {
      this.connect();
    }
    
    this.gameCode = gameCode;
    this.playerId = playerId;
    
    this.socket.emit('join-game', { gameCode, playerId });
  }

  sendMessage(content) {
    if (this.socket && this.gameCode && this.playerId) {
      this.socket.emit('send-message', {
        gameCode: this.gameCode,
        playerId: this.playerId,
        content
      });
    }
  }

  submitVote(votedForId) {
    if (this.socket && this.gameCode && this.playerId) {
      this.socket.emit('submit-vote', {
        gameCode: this.gameCode,
        voterId: this.playerId,
        votedForId
      });
    }
  }

  eliminatePlayer(playerId) {
    if (this.socket && this.gameCode) {
      this.socket.emit('eliminate-player', {
        gameCode: this.gameCode,
        playerId
      });
    }
  }

  changeGamePhase(newPhase) {
    if (this.socket && this.gameCode) {
      this.socket.emit('change-game-phase', {
        gameCode: this.gameCode,
        newPhase
      });
    }
  }

  onPlayerJoined(callback) {
    if (this.socket) {
      this.socket.on('player-joined', callback);
    }
  }

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }

  onUpdateMessages(callback) {
    if (this.socket) {
      this.socket.on('update-messages', callback);
    }
  }

  onVoteSubmitted(callback) {
    if (this.socket) {
      this.socket.on('vote-submitted', callback);
    }
  }

  onPlayerEliminated(callback) {
    if (this.socket) {
      this.socket.on('player-eliminated', callback);
    }
  }

  onGamePhaseChanged(callback) {
    if (this.socket) {
      this.socket.on('game-phase-changed', callback);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;