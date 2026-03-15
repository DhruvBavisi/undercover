# Undercover Game Bug Analysis - Complete Index

## Documentation Files

### 1. **BUG_ANALYSIS.md** (Main Document - 415 lines)
Complete detailed analysis of all 4 bugs with:
- Root cause analysis with code excerpts and line numbers
- Impact assessment
- Fix recommendations with code examples
- Priority ranking
- Architectural recommendations

**Read this first for comprehensive understanding**

### 2. **ANALYSIS_INDEX.md** (This File)
Quick reference guide with:
- File locations and summary
- Command to extract issues
- Quick fix checklist

---

## Quick Reference: The 4 Issues

### ISSUE #1: Background Tab Flash
- **Where it happens**: WaitingRoomPage after returning from background
- **Root cause**: 300ms debounce race condition
- **Files**: 
  - `client/src/pages/WaitingRoomPage.jsx` (lines 226-250)
  - `client/src/context/GameRoomContext.jsx` (lines 62-78)
- **Severity**: Medium
- **Fix time**: 10 minutes
- **Fix**: Clear debounce timeout in visibility handler

### ISSUE #2: Results Page Words/Roles Disappear 
- **Where it happens**: GameOverScreen when any player clicks "Play Again"
- **Root cause**: Server clears ALL game state immediately for everyone
- **Files**:
  - `server/index.js` (lines 1452-1495, play-again handler)
  - `client/src/pages/OnlineGamePage.jsx` (lines 358-372)
  - `client/src/components/online/GameOverScreen.jsx` (lines 193-220)
- **Severity**: 🔴 HIGH
- **Fix time**: 30-60 minutes  
- **Fix**: Implement play-again voting system

### ISSUE #3: Stale Elimination Modal
- **Where it happens**: EliminationReveal doesn't update when others click Next
- **Root cause**: Phase change doesn't clear `eliminationData` state
- **Files**:
  - `client/src/pages/OnlineGamePage.jsx` (lines 201-224, 277-286)
  - `client/src/components/online/EliminationReveal.jsx`
- **Severity**: Medium
- **Fix time**: 5 minutes
- **Fix**: Clear eliminationData when phase changes to 'discussion'

### ISSUE #4: Play Again Word Flash
- **Where it happens**: New game after clicking Play Again
- **Root cause**: playerRole/playerWord context not reset in handlePlayAgain
- **Files**:
  - `client/src/pages/OnlineGamePage.jsx` (lines 1355-1381)
  - `client/src/context/GameRoomContext.jsx` (lines 45-46)
- **Severity**: Medium-High
- **Fix time**: 5 minutes
- **Fix**: Add resetPlayerInfo() to context and call it

---

## Repository Structure

```
/home/runner/work/undercover/undercover/
├── client/src/
│   ├── pages/
│   │   ├── WaitingRoomPage.jsx        [Issue #1]
│   │   ├── GamePage.jsx               (older version)
│   │   └── OnlineGamePage.jsx         [Issues #3, #4]
│   ├── context/
│   │   └── GameRoomContext.jsx        [Issues #1, #4]
│   └── components/online/
│       ├── GameOverScreen.jsx         [Issue #2]
│       └── EliminationReveal.jsx      [Issue #3]
│
├── server/
│   ├── index.js                       [Issues #2]
│   ├── routes/gameRoomRoutes.js       (reset endpoint)
│   ├── models/GameRoom.js             (schema)
│   └── socket/gameHandlers.js
│
├── BUG_ANALYSIS.md                    (MAIN DOCUMENT)
└── ANALYSIS_INDEX.md                  (THIS FILE)
```

---

## Game Flow Map

```
HomePage
  ↓
CreateGamePage (Host) / JoinGamePage (Others)
  ↓
WaitingRoomPage [ISSUE #1 OCCURS HERE - Background Flash]
  ├─ Players ready up
  ├─ Host starts game
  └─ Socket: 'game-started' + 'role-info'
     ↓
OnlineGamePage
  ├─ Discussion Phase (1-3 mins per round)
  │  └─ Players give clues
  │
  ├─ Voting Phase
  │  └─ Players vote out suspects
  │     ↓
  ├─ Elimination Phase [ISSUE #3 OCCURS HERE - Stale Modal]
  │  └─ Show who was eliminated
  │     └─ Check if game over, else next round
  │
  └─ Game Over
     └─ GameOverScreen [ISSUE #2 OCCURS HERE - Words Disappear]
        └─ Shows final results
           └─ Click "Play Again"
              ├─ Server resets
              └─ Navigate back to WaitingRoomPage
                 └─ [ISSUE #4 OCCURS HERE - Word Flash]
```

---

## State Management Hierarchy

```
DATABASE (MongoDB)
    ↓ (Socket Broadcasts)
SERVER MEMORY
    ↓ (HTTP + Socket Events)
CONTEXT STATE (GameRoomContext)
    ├─ room (full room object)
    ├─ playerRole
    ├─ playerWord
    ├─ gamePhase
    ├─ eliminatedPlayer
    ├─ winner
    └─ votes, scores, etc.
    
    ↓ (Props + Hook Returns)
    
COMPONENT STATE (OnlineGamePage Local)
    ├─ localGamePhase (cached)
    ├─ localCurrentRound (cached)
    ├─ showGameOver (modal visibility)
    ├─ gameOverData (modal content)
    ├─ showEliminationReveal (modal visibility)
    ├─ eliminationData (modal content)
    ├─ messages[] (chat history)
    ├─ currentTurn (who's speaking)
    └─ speakingOrder (turn order)
```

**Problems Occur When:**
- Context state is not synchronized with component state
- Modals aren't explicitly dismissed when phase changes
- Context state isn't cleared when game resets
- Debounce delays interfere with navigation logic

---

## Fix Implementation Checklist

### PHASE 1: Quick Fixes (15 minutes total)

- [ ] **Issue #4** - Add resetPlayerInfo to GameRoomContext
  - [ ] Add function in context (3 lines)
  - [ ] Add to context value export (1 line)
  - [ ] Call in handlePlayAgain (1 line)
  
- [ ] **Issue #3** - Clear elimination data on phase change
  - [ ] Add condition to handleSpeakingOrderUpdate (2 lines)
  - [ ] Test that modal clears when advancing rounds
  
### PHASE 2: Medium Fixes (20 minutes total)

- [ ] **Issue #1** - Clear debounce on visibility
  - [ ] Modify handleVisibilityChange (3 lines)
  - [ ] Clear updateTimeoutRef when visible
  - [ ] Test background tab return

### PHASE 3: Major Fix (45-60 minutes)

- [ ] **Issue #2** - Implement voting system
  - [ ] Server-side: Track play-again votes
  - [ ] Server-side: Only reset when all voted
  - [ ] Server-side: Broadcast vote count
  - [ ] Client-side: Show vote count UI
  - [ ] Client-side: Show "waiting for others" message
  - [ ] Test with multiple players

---

## Testing Checklist

### Test Issue #1: Background Tab
- [ ] Have game running on browser tab
- [ ] Switch to another tab for 5+ seconds
- [ ] Return to game tab
- [ ] Verify: No flash of WaitingRoom, smooth redirect to game

### Test Issue #2: Results Persistence  
- [ ] Play game to completion
- [ ] View GameOverScreen with all results visible
- [ ] Have Player B click "Play Again"
- [ ] Verify: Player A still sees words and roles
- [ ] Verify: Player A can click "Play Again" whenever they want

### Test Issue #3: Elimination Modal
- [ ] Play game with 4+ players
- [ ] Get to voting phase
- [ ] Don't click "Continue" immediately
- [ ] Have another player click "Continue"
- [ ] Verify: Your modal still shows current elimination
- [ ] Verify: Modal clears when you click or phase changes

### Test Issue #4: Word Flash
- [ ] Play game to completion
- [ ] View your role/word on GameOverScreen
- [ ] Click "Play Again"
- [ ] Wait for game to start
- [ ] Verify: No flash of old role/word
- [ ] Verify: Immediately shows correct new role/word

---

## Key Code Locations for Reference

### GameRoomContext.jsx
- Lines 45-46: playerRole, playerWord state
- Lines 62-78: debouncedSetRoom function (Issue #1)
- Lines 261-265: handleRoleAssignment (receives role-info)
- Lines 357-372: handlePlayAgainReset (Issue #2)

### OnlineGamePage.jsx  
- Lines 1-52: Imports and context usage
- Lines 201-224: handleSpeakingOrderUpdate (Issue #3)
- Lines 277-286: handleVotingResults
- Lines 358-372: handlePlayAgainReset  
- Lines 1355-1381: handlePlayAgain (Issue #4)
- Lines 1627-1643: Rendering role/word display (flashes old values)

### server/index.js
- Lines 1452-1495: play-again socket handler (Issue #2)
- Lines 848-851: role-info emission
- Lines 575-610: join-room handler (role restoration)

---

## Additional Resources

- Full file analysis in BUG_ANALYSIS.md
- Socket event flow diagram (Game Flow section)
- State management hierarchy (above)
- Before/after code examples in BUG_ANALYSIS.md

---

## Contact / Questions

See BUG_ANALYSIS.md for:
- Detailed code examples
- Timeline diagrams
- Architectural recommendations
- Additional context and background
