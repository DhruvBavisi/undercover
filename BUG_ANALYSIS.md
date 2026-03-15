# Undercover Game - Comprehensive Bug Analysis

## Repository Structure
```
undercover/
├── client/src/
│   ├── pages/
│   │   ├── WaitingRoomPage.jsx      (lines 226-250: visibility handler)
│   │   ├── GamePage.jsx             (old waiting room)
│   │   ├── OnlineGamePage.jsx       (main game interface - 1945 lines)
│   ├── context/
│   │   ├── GameRoomContext.jsx      (state management - 842 lines)
│   │   └── SocketContext.jsx
│   ├── components/
│   │   └── online/
│   │       ├── GameOverScreen.jsx   (results display)
│   │       └── EliminationReveal.jsx (elimination modal)
│
└── server/
    ├── index.js                     (socket handlers)
    ├── socket/gameHandlers.js       (game phase handlers)
    ├── routes/gameRoomRoutes.js     (REST endpoints)
    └── models/GameRoom.js           (MongoDB schema)
```

---

## ISSUE #1: Background Tab Flash - Wrong Page Shows Briefly

### Symptom
Returning from background briefly shows waiting room before redirecting to game.

### Files Involved
- `client/src/pages/WaitingRoomPage.jsx` (lines 226-250)
- `client/src/context/GameRoomContext.jsx` (lines 62-78, debouncedSetRoom function)

### Root Cause
**Race condition between visibility handler and debounced state update**

The flow:
1. Tab becomes visible → `handleVisibilityChange()` fires
2. Calls `fetchRoom(gameCode, true)` which returns immediately
3. BUT `setRoom()` is debounced by 300ms in `debouncedSetRoom`
4. Meanwhile, redirect logic in `room` effect (line 194) checks stale room state
5. Redirect may not trigger on first check
6. Page renders WaitingRoom before redirect happens 300ms later

**Code:**
```javascript
// GameRoomContext.jsx - Lines 62-78
const debouncedSetRoom = useCallback((updatedRoom) => {
  if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
  updateTimeoutRef.current = setTimeout(() => {
    setRoom(updatedRoom);
  }, 300);  // 300ms DEBOUNCE DELAY
}, []);

// WaitingRoomPage.jsx - Lines 226-239
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible' && gameCode) {
    const roomData = await fetchRoom(gameCode, true);
    if (roomData && roomData.status === 'in-progress' && !redirectingRef.current) {
      // ... but room state not updated yet due to 300ms debounce!
      navigate(`/online-game/${gameCode}`);
    }
  }
};
```

### Fix
Clear debounce when returning from background:

```javascript
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible' && gameCode) {
    // Clear pending debounce to ensure immediate update
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    
    const roomData = await fetchRoom(gameCode, true);
    if (roomData && roomData.status === 'in-progress') {
      navigate(`/online-game/${gameCode}`);
    }
  }
};
```

---

## ISSUE #2: Results Page - Words/Roles Disappear When Another Player Clicks "Play Again"

### Symptom
On GameOverScreen, if another player clicks "Play Again" before you read results, the civilian word, undercover word, and all player roles disappear.

### Files Involved
- `server/index.js` (lines 1452-1495, play-again handler)
- `client/src/pages/OnlineGamePage.jsx` (lines 358-372, handlePlayAgainReset)
- `client/src/components/online/GameOverScreen.jsx` (lines 193-220, words display)

### Root Cause
**Server immediately clears game state when ANY player emits play-again**

The flow:
1. Game over screen shows with `words.civilian = 'apple'` and `words.undercover = 'orange'`
2. Player A clicks "Play Again" → emits `play-again` socket event
3. Server receives event → **IMMEDIATELY resets**:
   ```javascript
   room.words = { civilian: '', undercover: '' };  // CLEARED!
   room.players.forEach(p => {
     p.role = '';   // CLEARED!
     p.word = '';   // CLEARED!
   });
   ```
4. Server broadcasts `room-updated` to ALL players with empty words/roles
5. **Everyone's** GameOverScreen re-renders with empty data
6. Players B, C, etc. can no longer see results they hadn't finished reading

**Key code:**
```javascript
// server/index.js - Lines 1452-1495
socket.on('play-again', async ({ gameCode }) => {
  const room = await GameRoom.findOne({ roomCode: gameCode });
  room.words = { civilian: '', undercover: '' };  // ← PROBLEM: Cleared for everyone
  room.players.forEach(p => {
    p.role = '';
    p.word = '';
  });
  io.to(gameCode).emit('room-updated', { /* empty words/roles */ });
});
```

### Impact
- No voting system - one eager player ruins it for others
- Results are lost immediately
- Players can't verify their final role/word

### Fix (Recommended)
**Implement Play-Again Voting System:**

Server-side:
```javascript
socket.on('play-again', async ({ gameCode, userId }) => {
  const room = await GameRoom.findOne({ roomCode: gameCode });
  
  // Track votes instead of immediate reset
  if (!room.playAgainVotes.includes(userId)) {
    room.playAgainVotes.push(userId);
  }
  
  // Only reset when all players have voted
  if (room.playAgainVotes.length === room.players.length) {
    room.status = 'waiting';
    room.words = { civilian: '', undercover: '' };
    // ... reset other fields
  }
  
  // Broadcast vote count to all players
  io.to(gameCode).emit('play-again-vote-update', {
    votes: room.playAgainVotes.length,
    total: room.players.length
  });
});
```

Client-side (GameOverScreen):
```javascript
{/* Show vote count and wait message */}
<div className="text-center text-gray-400">
  {votesForPlayAgain.length}/{totalPlayers} players ready
  {votesForPlayAgain.length < totalPlayers && (
    <p className="text-sm mt-2">Waiting for other players...</p>
  )}
</div>
```

---

## ISSUE #3: Eliminated Player Modal Not Updating Until Others Click "Next Round"

### Symptom
EliminationReveal modal shows the current round's eliminated player. If you wait before clicking "Next Round" and another player clicks it first, the modal doesn't update—it's stuck showing the previous elimination until you manually advance.

### Files Involved
- `server/index.js` (voting-results handler)
- `client/src/pages/OnlineGamePage.jsx` (lines 277-286, handleVotingResults; lines 201-224, handleSpeakingOrderUpdate)
- `client/src/components/online/EliminationReveal.jsx` (modal component)

### Root Cause
**Phase transition doesn't explicitly clear stale elimination data**

The flow:
1. Round 1 ends → Player A eliminated → `voting-results` event fires
2. Client: `handleVotingResults()` sets `setEliminationData(eliminationData)` and `setShowEliminationReveal(true)`
3. User sees EliminationReveal modal with Player A
4. **Another player clicks "Next Round"** 
5. Server broadcasts `speaking-order-updated` for Round 2
6. Client: `handleSpeakingOrderUpdate()` updates `setLocalCurrentRound(2)` and `setSpeakingOrder([...])`
7. **BUT:** The handler does NOT clear `eliminationData` or `showEliminationReveal`!
8. Result: Modal still visible with stale Round 1 elimination data

**Key code:**
```javascript
// OnlineGamePage.jsx - Lines 201-224
const handleSpeakingOrderUpdate = (data) => {
  console.log('Speaking order updated:', data.speakingOrder);
  setSpeakingOrder(data.speakingOrder);
  setCurrentTurn(data.speakingOrder[0]);
  setTimerActive(true);
  setLocalCurrentRound(data.currentRound);
  // ← MISSING: Clear elimination data when transitioning rounds!
};
```

### Fix
Clear elimination state when phase changes:

```javascript
// Add listener for phase changes
socket.on('phase-change', (data) => {
  console.log('Phase changed:', data.phase);
  
  // Clear elimination data when leaving elimination phase
  if (data.phase !== 'elimination') {
    setShowEliminationReveal(false);
    setEliminationData(null);
  }
  
  setLocalGamePhase(data.phase);
  // ... other phase logic
});
```

Or modify `handleSpeakingOrderUpdate`:
```javascript
const handleSpeakingOrderUpdate = (data) => {
  // Clear old elimination when starting new round
  setShowEliminationReveal(false);
  setEliminationData(null);
  
  setSpeakingOrder(data.speakingOrder);
  setCurrentTurn(data.speakingOrder[0]);
  setLocalCurrentRound(data.currentRound);
};
```

---

## ISSUE #4: Play Again Word Flash - Previous Role/Word Shows Briefly

### Symptom
After clicking "Play Again" and starting a new game, the old role and word briefly flash before being replaced with new ones.

### Files Involved
- `client/src/pages/OnlineGamePage.jsx` (lines 1355-1381, handlePlayAgain)
- `client/src/context/GameRoomContext.jsx` (lines 45-46, playerRole/playerWord state)
- `server/index.js` (line 848, role-info emission)

### Root Cause
**playerRole and playerWord context state not cleared during play-again reset**

The flow:
1. Game over, `playerRole = 'civilian'`, `playerWord = 'apple'`
2. User clicks "Play Again"
3. `handlePlayAgain()` resets local state BUT not context state:
   ```javascript
   const handlePlayAgain = () => {
     // Resets: setGameWinner, setVotes, setMessages, etc.
     // BUT MISSING: resetPlayerInfo()
     navigate(`/game/${room.roomCode}`);
   };
   ```
4. Navigate to WaitingRoomPage
5. Game starts → Redirect to OnlineGamePage
6. OnlineGamePage renders BEFORE new `role-info` arrives
7. Component reads `playerRole = 'civilian'` and `playerWord = 'apple'` from context (still old!)
8. Displays old role/word briefly
9. 50ms later, server sends new `role-info` → setPlayerRole('undercover'), setPlayerWord('orange')
10. Component re-renders with correct values

**Key code:**
```javascript
// OnlineGamePage.jsx - Lines 1355-1381
const handlePlayAgain = () => {
  localStorage.removeItem('game_session');
  socket.emit('play-again', { gameCode: room.roomCode });

  setGameWinner(null);
  setVotes({});
  setMessages([]);
  // ... other resets ...
  // MISSING: resetPlayerInfo() or setPlayerRole(null), setPlayerWord(null)
  
  navigate(`/game/${room.roomCode}`);
};

// OnlineGamePage.jsx - Lines 1627-1643 (rendering with stale values)
<div className="bg-gray-700/50 rounded-lg p-3">
  {displayRole === 'mrwhite' ? '???' : playerWord}  {/* ← Shows old word! */}
</div>
```

### Fix
Add resetPlayerInfo to GameRoomContext:

```javascript
// GameRoomContext.jsx - Add to value object
const resetPlayerInfo = () => {
  setPlayerRole(null);
  setPlayerWord(null);
};

const value = {
  // ... existing fields
  playerRole,
  playerWord,
  resetPlayerInfo,  // ← ADD THIS
  // ... rest of value
};
```

Then use it in OnlineGamePage:

```javascript
// OnlineGamePage.jsx
const { resetPlayerInfo } = useGameRoom();

const handlePlayAgain = () => {
  localStorage.removeItem('game_session');
  if (!socket || !room) return;

  socket.emit('play-again', { gameCode: room.roomCode });

  setGameWinner(null);
  setVotes({});
  setMessages([]);
  setSpeakingOrder([]);
  setCurrentTurn(null);
  setLocalGamePhase('waiting');
  setLocalCurrentRound(1);
  setShowGameOver(false);
  setGameOverData(null);
  setEliminationData(null);
  setMrWhiteGuessResult(null);
  setInitialFetchDone(false);
  setDisconnectedPlayers(new Set());
  setConfirmedVotes(new Set());
  setPlayerSelections({});

  resetPlayerInfo();  // ← ADD THIS
  
  navigate(`/game/${room.roomCode}`);
};
```

---

## Summary Table

| Issue | Root Cause | Files | Severity |
|-------|-----------|-------|----------|
| #1 Background Flash | 300ms debounce race condition | WaitingRoomPage, GameRoomContext | Medium |
| #2 Results Disappear | Any player's play-again clears server state immediately | server/index.js, GameOverScreen | **High** |
| #3 Stale Elimination | Phase transition doesn't clear `eliminationData` | OnlineGamePage, EliminationReveal | Medium |
| #4 Word Flash | `playerRole`/`playerWord` not reset on play-again | OnlineGamePage, GameRoomContext | Medium-High |

---

## Quick Fix Priority

1. **#2 (Results Disappear)** - Implement play-again voting system
2. **#4 (Word Flash)** - Add resetPlayerInfo to context
3. **#3 (Stale Elimination)** - Clear elimination data on phase change  
4. **#1 (Background Flash)** - Clear debounce on visibility change

---

## State Management Recommendations

### Add Comprehensive Reset Function
Create a `resetGameState()` function that clears ALL state at once:

```javascript
// GameRoomContext.jsx
const resetGameState = () => {
  setPlayerRole(null);
  setPlayerWord(null);
  setGamePhase('waiting');
  setCurrentRound(1);
  setVotes({});
  setEliminatedPlayer(null);
  setWinner(null);
  setScores({});
  setReadyPlayers(new Set());
  setVotingResults(null);
};

// Use everywhere state needs full reset:
// - After play-again
// - When leaving a game
// - On socket disconnect/reconnect
```

### Implement Vote-Based Play-Again
Don't reset on first click, wait for consensus or timeout.

### Add Phase Transition Cleanup
Ensure each phase change clears relevant stale state:
- `'elimination' → 'discussion'`: Clear `eliminationData`, `showEliminationReveal`
- `'gameOver' → 'waiting'`: Clear `winner`, `scores`, `votingResults`

### Review Debounce Strategy
The 300ms debounce was meant to prevent re-renders, but it causes race conditions. Consider:
- Only debounce non-critical updates
- Bypass debounce for game state changes (status, phase)
- Use debounce only for cosmetic updates

