// Utility functions

/**
 * Conditionally join class names
 * @param  {...string} classes - Class names to join
 * @returns {string} - Joined class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
} 