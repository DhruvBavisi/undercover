
/**
 * specific role distribution logic for the game
 */

// Get recommended role distribution based on player count
export const getRecommendedRoles = (count) => {
    switch (count) {
      case 3: return { undercover: 1, mrWhite: 0 }; // 2 Civilians
      case 4: return { undercover: 1, mrWhite: 0 }; // 3 Civilians
      case 5: return { undercover: 1, mrWhite: 1 }; // 3 Civilians
      case 6: return { undercover: 1, mrWhite: 1 }; // 4 Civilians
      case 7: return { undercover: 2, mrWhite: 1 }; // 4 Civilians
      case 8: return { undercover: 2, mrWhite: 1 }; // 5 Civilians
      case 9: return { undercover: 3, mrWhite: 1 }; // 5 Civilians
      case 10: return { undercover: 3, mrWhite: 1 }; // 6 Civilians
      case 11: return { undercover: 3, mrWhite: 2 }; // 6 Civilians
      case 12: return { undercover: 3, mrWhite: 2 }; // 7 Civilians
      case 13: return { undercover: 4, mrWhite: 2 }; // 7 Civilians
      case 14: return { undercover: 4, mrWhite: 2 }; // 8 Civilians
      case 15: return { undercover: 5, mrWhite: 2 }; // 8 Civilians
      case 16: return { undercover: 5, mrWhite: 2 }; // 9 Civilians
      case 17: return { undercover: 5, mrWhite: 3 }; // 9 Civilians
      case 18: return { undercover: 5, mrWhite: 3 }; // 10 Civilians
      case 19: return { undercover: 6, mrWhite: 3 }; // 11 Civilians
      case 20: return { undercover: 6, mrWhite: 3 }; // 11 Civilians
      default: return { undercover: 1, mrWhite: 0 };
    }
  };

export const calculateRounds = (count) => {
    return Math.max(1, count - 2);
}

export const getMaxUndercover = (count) => {
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    if (count <= 9) return 4;
    if (count <= 11) return 5;
    if (count <= 13) return 6;
    if (count <= 15) return 7;
    if (count <= 17) return 8;
    return 9; // Max 9 for 18-20 players
  };

export const getMaxMrWhite = (count) => {
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    if (count <= 9) return 4;
    if (count <= 11) return 5;
    if (count <= 13) return 6;
    if (count <= 15) return 7;
    if (count <= 17) return 8;
    return 9; // Max 9 for 18-20 players
  };

export const getMinCivilians = (count) => {
    return Math.ceil(count / 2);
  };
