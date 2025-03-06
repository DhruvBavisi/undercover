/**
 * Get a random word pair for the game
 * @param {string} category - The category of words to use
 * @returns {string[]} - Array with two related words [civilianWord, undercoverWord]
 */
export function getRandomWordPair(category = 'general') {
  // Sample word pairs for different categories
  const wordPairs = {
    general: [
      ['Dog', 'Wolf'],
      ['Car', 'Truck'],
      ['House', 'Apartment'],
      ['Chair', 'Sofa'],
      ['Phone', 'Computer'],
      ['Book', 'Magazine'],
      ['Coffee', 'Tea'],
      ['Beach', 'Pool'],
      ['Pizza', 'Burger'],
      ['Movie', 'TV Show']
    ],
    tech: [
      ['JavaScript', 'TypeScript'],
      ['React', 'Angular'],
      ['Node.js', 'Deno'],
      ['MongoDB', 'PostgreSQL'],
      ['GitHub', 'GitLab'],
      ['Chrome', 'Firefox'],
      ['Windows', 'MacOS'],
      ['iPhone', 'Android'],
      ['AWS', 'Azure'],
      ['Docker', 'Kubernetes']
    ],
    food: [
      ['Pizza', 'Pasta'],
      ['Burger', 'Sandwich'],
      ['Apple', 'Orange'],
      ['Coffee', 'Tea'],
      ['Cake', 'Pie'],
      ['Rice', 'Noodles'],
      ['Chicken', 'Turkey'],
      ['Chocolate', 'Vanilla'],
      ['Sushi', 'Sashimi'],
      ['Taco', 'Burrito']
    ]
  };

  // Get word pairs for the selected category or use general if category doesn't exist
  const selectedWordPairs = wordPairs[category] || wordPairs.general;
  
  // Select a random word pair
  const randomIndex = Math.floor(Math.random() * selectedWordPairs.length);
  return selectedWordPairs[randomIndex];
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
 * @returns {Array} - Randomized array of player IDs for speaking order
 */
export function randomizeSpeakingOrder(players) {
  if (!players || players.length === 0) {
    return [];
  }

  // Create a copy of the array to avoid mutation
  const randomized = [...players];

  // Fisher-Yates shuffle algorithm
  for (let i = randomized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }

  // Ensure Mr. White isn't first
  if (randomized[0]?.role === 'Mr. White') {
    // Collect all valid swap candidates (non-Mr. White players)
    const validCandidates = randomized
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) => 
        player.role !== 'Mr. White' && 
        index !== 0 // Ensure we don't swap with ourselves
      );

    // Only swap if valid candidates exist
    if (validCandidates.length > 0) {
      // Randomly select a candidate from valid options
      const swapTarget = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      
      // Perform the swap
      [randomized[0], randomized[swapTarget.index]] = 
        [randomized[swapTarget.index], randomized[0]];
    }
  }

  return randomized.map(player => player.id);
}

/**
 * Assign roles to players
 * @param {string[]} playerNames - Array of player names
 * @param {number} playerCount - Number of players
 * @param {boolean} includeWhite - Whether to include Mr. White role
 * @param {string[]} wordPair - The word pair for the game [civilianWord, undercoverWord]
 * @param {number} undercoverCount - Number of undercover agents to include
 * @returns {Array} - Array of players with assigned roles and words
 */
export function assignRoles(playerNames, playerCount, includeWhite = true, wordPair = ['', ''], undercoverCount = 1) {
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

  // Validate role counts
  const actualUndercoverCount = Math.min(maxUndercover, undercoverCount);
  const mrWhiteCount = includeWhite ? Math.min(maxMrWhite, playerCount - actualUndercoverCount - minCivilians) : 0;

  // Create array of all player indices and shuffle for role assignment
  const roleAssignmentOrder = players.map(p => p.id);
  for (let i = roleAssignmentOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roleAssignmentOrder[i], roleAssignmentOrder[j]] = [roleAssignmentOrder[j], roleAssignmentOrder[i]];
  }

  // Assign roles
  let assignmentPointer = 0;
  
  // Assign Undercover
  for (let i = 0; i < actualUndercoverCount; i++) {
    const playerId = roleAssignmentOrder[assignmentPointer++];
    players[playerId] = {
      ...players[playerId],
      role: 'Undercover',
      word: wordPair[1],
      avatar: '/avatars/undercover.png'
    };
  }

  // Assign Mr. White
  for (let i = 0; i < mrWhiteCount; i++) {
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
  const speakingOrder = randomizeSpeakingOrder(players);

  return {
    players,
    speakingOrder
  };
}