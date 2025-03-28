import mongoose from 'mongoose';
import { getRandomWordPair } from '../utils/wordPacks.js';

const gameRoomSchema = new mongoose.Schema({
roomCode: {
type: String,
required: true,
unique: true,
trim: true,
uppercase: true
},
hostId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
players: [{
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
name: String,
username: String,
avatarId: Number,
isReady: {
type: Boolean,
default: false
},
role: {
type: String,
enum: ['civilian', 'undercover', 'mrwhite', ''],
default: ''
},
word: {
type: String,
default: ''
},
isEliminated: {
type: Boolean,
default: false
}
}],
status: {
type: String,
enum: ['waiting', 'in-progress', 'completed'],
default: 'waiting'
},
currentPhase: {
type: String,
enum: ['discussion', 'voting', 'elimination', 'gameOver', ''],
default: ''
},
settings: {
maxPlayers: {
type: Number,
min: 3,
max: 20
},
roundTime: {
type: Number,
min: 30,
max: 180
},
wordPack: {
type: String
},
numUndercovers: {
type: Number,
min: 1
},
numMrWhites: {
type: Number,
min: 0
},
customWords: {
civilian: String,
undercover: String
}
},
currentRound: {
type: Number,
default: 0
},
rounds: [{
roundNumber: Number,
playerTurn: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
speakingOrder: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
}],
descriptions: [{
playerId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
description: String,
timestamp: {
type: Date,
default: Date.now
}
}],
votes: [{
voterId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
votedForId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
}
}],
eliminatedPlayer: {
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
name: String,
role: String,
word: String
}
}],
messages: [{
id: String,
playerName: String,
playerId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
},
content: String,
timestamp: {
type: Date,
default: Date.now
}
}],
words: {
civilian: String,
undercover: String
},
winner: {
type: String,
enum: ['civilians', 'undercovers', 'mrwhite', ''],
default: ''
},
createdAt: {
type: Date,
default: Date.now,
expires: 86400 // Automatically delete after 24 hours
}
});

// Generate a random room code
gameRoomSchema.statics.generateRoomCode = function() {
const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
let code = '';
for (let i = 0; i < 6; i++) {
code += characters.charAt(Math.floor(Math.random() * characters.length));
}
return code;
};

// Check if a room is full
gameRoomSchema.methods.isFull = function() {
return this.players.length >= this.settings.maxPlayers;
};

// Check if a player is in the room
gameRoomSchema.methods.hasPlayer = function(userId) {
return this.players.some(player => player.userId.toString() === userId.toString());
};

// Add a player to the room
gameRoomSchema.methods.addPlayer = function(player) {
if (!this.hasPlayer(player.userId) && !this.isFull()) {
this.players.push(player);
return true;
}
return false;
};

// Remove a player from the room
gameRoomSchema.methods.removePlayer = function(userId) {
const initialLength = this.players.length;
this.players = this.players.filter(player => player.userId.toString() !== userId.toString());
return initialLength !== this.players.length;
};

// Update the startGame method to handle Mr. White
gameRoomSchema.methods.startGame = function() {
if (this.players.length < 3) {
throw new Error('Not enough players to start the game');
}

// Reset game state
this.status = 'in-progress';
this.currentRound = 1;
this.currentPhase = 'discussion';
this.rounds = [];
this.messages = [];
this.winner = '';

// Get word pair based on settings
let civilian, undercover;

if (this.settings.customWords && 
this.settings.customWords.civilian && 
this.settings.customWords.undercover) {
civilian = this.settings.customWords.civilian;
undercover = this.settings.customWords.undercover;
} else {
const wordPair = getRandomWordPair(this.settings.wordPack);
civilian = wordPair[0];
undercover = wordPair[1];
}

this.words = { civilian, undercover };

// Shuffle players array
const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);

// Calculate number of undercovers (respect settings but ensure at least 1)
const numUndercovers = Math.min(
Math.max(1, this.settings.numUndercovers || 1),
Math.floor(this.players.length / 3)
);

// Get number of Mr. Whites from settings
const numMrWhites = Math.min(
this.settings.numMrWhites || 0,
Math.floor(this.players.length / 5)  // Limit Mr. Whites to 20% of players
);

// Assign roles
let assignedUndercovers = 0;
let assignedMrWhites = 0;

// Reset player roles and words
this.players.forEach(player => {
player.role = '';
player.word = '';
player.isEliminated = false;
});

// Assign roles to shuffled players
shuffledPlayers.forEach((player, index) => {
// Find the actual player in the game room
const actualPlayer = this.players.find(p => p.userId.toString() === player.userId.toString());
if (!actualPlayer) return;

if (assignedMrWhites < numMrWhites) {
// Assign Mr. White role
actualPlayer.role = 'mrwhite';
actualPlayer.word = '';  // Mr. White doesn't know the word
assignedMrWhites++;
} else if (assignedUndercovers < numUndercovers) {
// Assign Undercover role
actualPlayer.role = 'undercover';
actualPlayer.word = undercover;
assignedUndercovers++;
} else {
// Assign Civilian role
actualPlayer.role = 'civilian';
actualPlayer.word = civilian;
}
});

// Generate speaking order for the descriptive phase
// Ensure Mr. White is never first in the first round
const activePlayers = this.players.filter(p => !p.isEliminated);
let speakingOrder = activePlayers.map(p => p.userId);

// Shuffle the speaking order
speakingOrder = speakingOrder.sort(() => Math.random() - 0.5);

// If it's the first round and Mr. White is first, swap positions
if (this.currentRound === 1) {
const mrWhiteIndex = activePlayers.findIndex(p => p.role === 'mrwhite');
if (mrWhiteIndex === 0 && speakingOrder.length > 1) {
// Swap with a random position that's not the first
const swapIndex = Math.floor(Math.random() * (speakingOrder.length - 1)) + 1;
[speakingOrder[0], speakingOrder[swapIndex]] = [speakingOrder[swapIndex], speakingOrder[0]];
}
}

// Initialize first round
const firstPlayer = this.players.find(p => p.userId.toString() === speakingOrder[0].toString());
this.rounds.push({
roundNumber: 1,
playerTurn: firstPlayer.userId,
speakingOrder: speakingOrder,
descriptions: [],
votes: [],
eliminatedPlayer: null
});

return this;
};

// Update the checkWinCondition method to handle Mr. White
gameRoomSchema.methods.checkWinCondition = function() {
const alivePlayers = this.players.filter(p => !p.isEliminated);
const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
const aliveMrWhites = alivePlayers.filter(p => p.role === 'mrwhite');

// Civilians win if all undercovers and Mr. Whites are eliminated
if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
this.status = 'completed';
this.winner = 'civilians';
return 'civilians';
}

// Undercovers win if number of undercovers equals or exceeds civilians
if (aliveUndercovers.length >= aliveCivilians.length) {
this.status = 'completed';
this.winner = 'undercovers';
return 'undercovers';
}

// Mr. White wins if they're the only one left
if (aliveMrWhites.length === 1 && aliveCivilians.length === 0 && aliveUndercovers.length === 0) {
this.status = 'completed';
this.winner = 'mrwhite';
return 'mrwhite';
}

// Game continues
return null;
};

// Add method to handle Mr. White's word guess
gameRoomSchema.methods.handleMrWhiteGuess = function(playerId, word) {
const player = this.players.find(p => p.userId.toString() === playerId.toString());

if (!player || player.role !== 'mrwhite' || player.isEliminated) {
return { success: false, message: 'Invalid guess attempt' };
}

// Check if the guess matches either word
const isCorrect = word.toLowerCase() === this.words.civilian.toLowerCase() ||
word.toLowerCase() === this.words.undercover.toLowerCase();

if (isCorrect) {
return { success: true, winner: 'mrwhite' };
}

return { success: false, message: 'Incorrect guess' };
};

gameRoomSchema.methods.startVotingPhase = function() {
  this.currentPhase = 'voting';
  this.votes = {};
  return {
    phase: 'voting',
    message: 'Voting phase has begun!'
  };
};

gameRoomSchema.methods.submitVote = function(playerId, targetId) {
  if (!this.votes) this.votes = {};
  this.votes[playerId] = targetId;
  
  if (Object.keys(this.votes).length === this.players.length) {
    return this.processVotes();
  }
  return null;
};

gameRoomSchema.methods.processVotes = function() {
  const voteCounts = {};
  Object.values(this.votes).forEach(vote => {
    voteCounts[vote] = (voteCounts[vote] || 0) + 1;
  });

  let maxVotes = 0;
  let eliminatedPlayer = null;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedPlayer = playerId;
    }
  });

  return {
    voteCounts,
    eliminatedPlayer
  };
};

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);

export default GameRoom;