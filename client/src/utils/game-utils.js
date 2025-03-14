// Import word pairs
import wordPairsData from '../data/word-pairs.js';

/**
 * Get a random word pair for the game
 * @param {string} category - The category of words to use
 * @returns {string[]} - Array with two related words [civilianWord, undercoverWord]
 */
// Keep track of used word pairs to prevent repetition
const usedWordPairs = new Set();

export function getRandomWordPair(category = 'general') {
  // If all word pairs have been used, reset the tracking
  if (usedWordPairs.size >= wordPairsData.length) {
    usedWordPairs.clear();
  }

  // Filter out word pairs that have already been used
  const availablePairs = wordPairsData.filter(pair => {
    const pairKey = `${pair[0]}-${pair[1]}`;
    return !usedWordPairs.has(pairKey);
  });

  // Select a random word pair from available pairs
  const randomIndex = Math.floor(Math.random() * availablePairs.length);
  const selectedPair = availablePairs[randomIndex];
  
  // Mark this pair as used
  usedWordPairs.add(`${selectedPair[0]}-${selectedPair[1]}`);
  
  return selectedPair;
}

/**
 * Reset the used word pairs tracking
 */
export function resetUsedWordPairs() {
  usedWordPairs.clear();
}

/**
 * Get the number of Mr. Whites based on player count
 * @param {number} playerCount - Number of players
 * @returns {number} - Number of Mr. Whites allowed
 */
function getMrWhiteCount(playerCount) {
  if (playerCount >= 3 && playerCount <= 8) return 1;
  if (playerCount >= 9 && playerCount <= 16) return 2;
  if (playerCount >= 17 && playerCount <= 20) return 3;
  return 0;
}

/**
 * Get maximum allowed undercover agents for given player count
 * @param {number} playerCount - Number of players
 * @returns {number} - Maximum allowed undercover agents
 */
function getMaxUndercover(playerCount) {
  if (playerCount <= 3) return 1;
  if (playerCount <= 5) return 2;
  if (playerCount <= 7) return 3;
  if (playerCount <= 9) return 4;
  if (playerCount <= 11) return 5;
  if (playerCount <= 13) return 6;
  if (playerCount <= 15) return 7;
  if (playerCount <= 17) return 8;
  return 9; // Max 9 for 18-20 players
}

/**
 * Get maximum allowed Mr. Whites for given player count
 * @param {number} playerCount - Number of players
 * @returns {number} - Maximum allowed Mr. Whites
 */
function getMaxMrWhite(playerCount) {
  if (playerCount <= 3) return 1;
  if (playerCount <= 5) return 2;
  if (playerCount <= 7) return 3;
  if (playerCount <= 9) return 4;
  if (playerCount <= 11) return 5;
  if (playerCount <= 13) return 6;
  if (playerCount <= 15) return 7;
  if (playerCount <= 17) return 8;
  return 9; // Max 9 for 18-20 players
}

/**
 * Get minimum required civilians for given player count
 * @param {number} playerCount - Number of players
 * @returns {number} - Minimum required civilians
 */
function getMinCivilians(playerCount) {
  return Math.ceil(playerCount / 2);
}

/**
 * Randomize the speaking order
 * @param {Array} players - Array of player objects
 * @param {number} round - Current round number
 * @returns {Array} - Randomized array of player IDs for speaking order
 */
export function randomizeSpeakingOrder(players, round = 1) {
  if (!players || players.length === 0) {
    return [];
  }

  // Create a copy of the array to avoid mutation
  const randomized = [...players];

  // First shuffle: Fisher-Yates algorithm
  for (let i = randomized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }

  // Second shuffle: Random offset rotation
  const offset = Math.floor(Math.random() * randomized.length);
  const rotated = [...randomized.slice(offset), ...randomized.slice(0, offset)];

  // Third shuffle: Pair-wise swaps with random probability
  for (let i = 0; i < rotated.length - 1; i += 2) {
    if (Math.random() < 0.5) {
      [rotated[i], rotated[i + 1]] = [rotated[i + 1], rotated[i]];
    }
  }

  // Only prevent Mr. White from being first in the first round
  if (round === 1 && rotated[0]?.role === 'Mr. White') {
    // Find all non-Mr. White players
    const validSwapIndices = rotated
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) => 
        player.role !== 'Mr. White' && 
        index !== 0
      );

    if (validSwapIndices.length > 0) {
      // Randomly select a non-Mr. White player to swap with
      const swapIndex = validSwapIndices[Math.floor(Math.random() * validSwapIndices.length)].index;
      [rotated[0], rotated[swapIndex]] = [rotated[swapIndex], rotated[0]];
    }
  }

  // Final validation: ensure we don't have any obvious patterns
  const roles = rotated.map(p => p.role);
  const hasPattern = roles.some((role, i) => 
    i > 0 && i < roles.length - 1 && 
    roles[i-1] === role && roles[i+1] === role
  );

  if (hasPattern) {
    // If we detect a pattern, do one more shuffle
    for (let i = rotated.length - 1; i > 0; i--) {
      if (Math.random() < 0.3) { // 30% chance to swap
        const j = Math.floor(Math.random() * i);
        [rotated[i], rotated[j]] = [rotated[j], rotated[i]];
      }
    }
  }

  return rotated.map(player => player.id);
}

/**
 * Assign roles to players
 * @param {string[]} playerNames - Array of player names
 * @param {number} playerCount - Number of players
 * @param {boolean} includeWhite - Whether to include Mr. White role
 * @param {string[]} wordPair - The word pair for the game [civilianWord, undercoverWord]
 * @param {number} undercoverCount - Number of undercover agents to include
 * @param {number} requestedMrWhiteCount - Number of Mr. White players requested
 * @returns {Array} - Array of players with assigned roles and words
 */
export function assignRoles(playerNames, playerCount, includeWhite = true, wordPair = ['', ''], undercoverCount = 1, requestedMrWhiteCount = 1) {
  if (!playerNames || playerCount < 3) {
    return [];
  }

  // Create player objects from names
  const players = playerNames.slice(0, playerCount).map((name, id) => ({
    id,
    name,
    role: 'Civilian',
    word: '',
    isEliminated: false,
    avatar: '/avatars/civilian.png'
  }));

  // Get role limits
  const maxUndercover = getMaxUndercover(playerCount);
  const maxMrWhite = getMaxMrWhite(playerCount);
  const minCivilians = getMinCivilians(playerCount);

  // IMPORTANT: Ensure we have at least 1 special role in total
  // If both requested counts are 0, force undercover to 1
  let actualUndercoverCount = Math.min(maxUndercover, undercoverCount);
  let mrWhiteCount = includeWhite ? Math.min(maxMrWhite, requestedMrWhiteCount) : 0;
  
  if (actualUndercoverCount === 0 && mrWhiteCount === 0) {
    actualUndercoverCount = 1; // Always ensure at least one special role
  }

  // Ensure we don't exceed the maximum special roles
  const totalSpecialRoles = actualUndercoverCount + mrWhiteCount;
  const maxSpecialRoles = playerCount - minCivilians;
  
  let finalMrWhiteCount = mrWhiteCount;
  let finalUndercoverCount = actualUndercoverCount;
  
  if (totalSpecialRoles > maxSpecialRoles) {
    // Store original Mr. White count before reduction
    const originalMrWhiteCount = finalMrWhiteCount;
    
    // Reduce Mr. White count first if needed
    finalMrWhiteCount = Math.max(0, maxSpecialRoles - actualUndercoverCount);
    
    // If Mr. White was reduced to 0 and there were no undercover agents,
    // we need to ensure at least one special role by adding an undercover
    if (originalMrWhiteCount > 0 && finalMrWhiteCount === 0 && finalUndercoverCount === 0) {
      finalUndercoverCount = 1;
    }
    
    // If still too many special roles, reduce undercover count
    if (finalMrWhiteCount === 0 && finalUndercoverCount > maxSpecialRoles) {
      finalUndercoverCount = maxSpecialRoles;
    }
  }

  // Final safety check: Ensure we have at least 1 special role in total
  if (finalMrWhiteCount + finalUndercoverCount < 1) {
    finalUndercoverCount = 1; // Force at least one undercover
  }

  // Create array of all player indices and shuffle for role assignment
  const roleAssignmentOrder = players.map(p => p.id);
  for (let i = roleAssignmentOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roleAssignmentOrder[i], roleAssignmentOrder[j]] = [roleAssignmentOrder[j], roleAssignmentOrder[i]];
  }

  // Assign roles
  let assignmentPointer = 0;
  
  // Assign Undercover
  for (let i = 0; i < finalUndercoverCount; i++) {
    const playerId = roleAssignmentOrder[assignmentPointer++];
    players[playerId] = {
      ...players[playerId],
      role: 'Undercover',
      word: wordPair[1],
      avatar: '/avatars/undercover.png'
    };
  }

  // Assign Mr. White
  for (let i = 0; i < finalMrWhiteCount; i++) {
    const playerId = roleAssignmentOrder[assignmentPointer++];
    players[playerId] = {
      ...players[playerId],
      role: 'Mr. White',
      word: '',
      avatar: '/avatars/mrwhite.png'
    };
  }

  // Assign Civilians
  for (let i = assignmentPointer; i < players.length; i++) {
    const playerId = roleAssignmentOrder[i];
    players[playerId] = {
      ...players[playerId],
      role: 'Civilian',
      word: wordPair[0],
      avatar: '/avatars/civilian.png'
    };
  }

  // Generate speaking order after roles are assigned
  const speakingOrder = randomizeSpeakingOrder(players, 1);

  return {
    players,
    speakingOrder
  };
}