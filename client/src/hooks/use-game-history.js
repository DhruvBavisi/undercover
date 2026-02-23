import { useState, useEffect, useCallback } from "react";

export function useGameHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX and to ensure hydration
    const timer = setTimeout(() => {
      try {
        const storedHistory = JSON.parse(localStorage.getItem("gameHistory") || "[]");
        // Sort by date descending (newest first)
        const sortedHistory = Array.isArray(storedHistory) 
          ? storedHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
        setHistory(sortedHistory);
      } catch (e) {
        console.error("Failed to load history", e);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const addGameToHistory = useCallback((gameData) => {
    try {
      const newGame = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        ...gameData
      };

      const currentHistory = JSON.parse(localStorage.getItem("gameHistory") || "[]");
      const updatedHistory = [newGame, ...currentHistory];
      
      localStorage.setItem("gameHistory", JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      return true;
    } catch (e) {
      console.error("Failed to save game to history", e);
      return false;
    }
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your entire game history?")) {
      localStorage.removeItem("gameHistory");
      setHistory([]);
      return true;
    }
    return false;
  }, []);

  return {
    history,
    isLoading,
    addGameToHistory,
    clearHistory
  };
}
