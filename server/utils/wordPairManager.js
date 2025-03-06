import wordPairs from '../data/wordPairs.js';

// Keep track of used word pairs to prevent repetition
let usedWordPairs = new Set();

/**
 * Get a random word pair that hasn't been used in the current session
 * @param {string} category - Optional category to filter word pairs
 * @returns {Object} A word pair object with civilian and undercover words
 */
const getRandomWordPair = (category = 'all') => {
  // Reset used pairs if all have been used
  if (usedWordPairs.size >= wordPairs.length) {
    usedWordPairs.clear();
    console.log('All word pairs have been used, resetting tracking');
  }

  // Filter word pairs by category if specified
  const availablePairs = category === 'all' 
    ? wordPairs.filter(pair => !usedWordPairs.has(`${pair.civilian}-${pair.undercover}`))
    : wordPairs.filter(pair => 
        pair.category === category && 
        !usedWordPairs.has(`${pair.civilian}-${pair.undercover}`)
      );

  // If no pairs available in the specified category, use any category
  const pairsToUse = availablePairs.length > 0 
    ? availablePairs 
    : wordPairs.filter(pair => !usedWordPairs.has(`${pair.civilian}-${pair.undercover}`));

  // Get a random pair
  const randomPair = pairsToUse[Math.floor(Math.random() * pairsToUse.length)];
  
  // Mark this pair as used
  usedWordPairs.add(`${randomPair.civilian}-${randomPair.undercover}`);
  
  return randomPair;
};

/**
 * Get all available categories from the word pairs
 * @returns {Array} Array of unique categories
 */
const getCategories = () => {
  const categories = new Set(wordPairs.map(pair => pair.category));
  return Array.from(categories);
};

/**
 * Reset the used word pairs tracking
 */
const resetUsedWordPairs = () => {
  usedWordPairs.clear();
  console.log('Word pair tracking has been reset');
};

export { getRandomWordPair, getCategories, resetUsedWordPairs };
