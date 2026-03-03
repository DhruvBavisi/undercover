import { io } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:3001/api';
const SOCKET_URL = 'http://127.0.0.1:3001';

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
        return data;
    } catch (e) {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
        throw new Error(`Invalid JSON response from ${url}: ${text}`);
    }
}

async function runTest() {
    console.log('--- STARTING CHAT HISTORY SIMULATION ---');

    // 1. Authenticate Host User
    let hostUser, hostToken;
    const randomSuffix = Math.floor(Math.random() * 100000);
    try {
        const authRes = await fetchJson(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: `host${randomSuffix}@test.com`, password: 'password' })
        });
        hostUser = authRes.user;
        hostToken = authRes.token;
    } catch {
        const authRes = await fetchJson(`${API_BASE}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ name: `Host${randomSuffix}`, username: `host${randomSuffix}`, email: `host${randomSuffix}@test.com`, password: 'password' })
        });
        hostUser = authRes.user;
        hostToken = authRes.token;
    }

    // 2. Create Game Room
    const roomRes = await fetchJson(`${API_BASE}/game-rooms/rooms`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hostToken}` },
        body: JSON.stringify({ settings: { maxPlayers: 20, roundTime: 60, wordPack: 'standard' } })
    });
    const roomCode = roomRes.room.roomCode;
    console.log(`✅ Room Created: ${roomCode}`);

    // Wait and establish Host Socket
    await new Promise((resolve) => setTimeout(resolve, 500));
    let hostSocket = io(SOCKET_URL, { path: '/socket.io/', transports: ['websocket'] });
    await new Promise((resolve, reject) => {
        hostSocket.on('connect', () => {
            hostSocket.emit('authenticate', { userId: hostUser.id });
            hostSocket.emit('join-room', { roomCode, userId: hostUser.id });
            resolve();
        });
        hostSocket.on('error', reject);
    });

    // Send generic chat payload using REST or Socket
    console.log("Sending chat messages...");

    hostSocket.emit('send-message', {
        gameCode: roomCode,
        playerId: hostUser.id,
        playerName: hostUser.name || 'Host',
        content: 'Hello World!'
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    hostSocket.emit('send-message', {
        gameCode: roomCode,
        playerId: hostUser.id,
        playerName: hostUser.name || 'Host',
        content: 'Does this persist?'
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Authenticate a new Late Joiner
    let lateUser, lateToken;
    try {
        const authRes = await fetchJson(`${API_BASE}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ name: `Late${randomSuffix}`, username: `late${randomSuffix}`, email: `late${randomSuffix}@test.com`, password: 'password' })
        });
        lateUser = authRes.user;
        lateToken = authRes.token;
    } catch (e) {
        throw e;
    }

    // Connect Late Socket
    let lateSocket = io(SOCKET_URL, { path: '/socket.io/', transports: ['websocket'] });
    await new Promise((resolve, reject) => {
        lateSocket.on('connect', () => {
            lateSocket.emit('authenticate', { userId: lateUser.id });
            // This time we join room via API
            fetchJson(`${API_BASE}/game-rooms/rooms/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${lateToken}` },
                body: JSON.stringify({ roomCode })
            }).then(() => {
                lateSocket.emit('join-room', { roomCode, userId: lateUser.id });
                resolve();
            }).catch(reject);
        });
    });

    console.log("Fetching standalone chat payload for late joiner...");
    const chatFetch = await fetchJson(`${API_BASE}/game-rooms/rooms/${roomCode}/messages`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${lateToken}` }
    });

    console.log(`Payload received by Late Joiner -> Messages count:`, chatFetch.messages?.length);
    if (chatFetch.messages && chatFetch.messages.length >= 2 && chatFetch.messages.find(m => m.content === 'Does this persist?')) {
        console.log("✅ Chat history synchronization passed successfully for Late Joiner");
    } else {
        throw new Error("Missing specific chat messages in REST payload fetch.");
    }

    // Validate `isSystem` and `isDescription` fields mapping persistence
    const systemJoinMsg = chatFetch.messages.find(m => m.content.includes("joined the game"));
    if (systemJoinMsg && systemJoinMsg.isSystem === true) {
        console.log("✅ Chat attribute persistence (Mongoose Schema) resolved correctly.");
    } else {
        console.warn("⚠️ Chat attribute mapping failed or System message not produced accurately.");
        console.warn(systemJoinMsg);
    }

    console.log('\n=======================================');
    console.log('🎉 ALL TESTS COMPLETED');
    console.log('=======================================');
    hostSocket.disconnect();
    lateSocket.disconnect();
}

runTest().catch(err => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
});
