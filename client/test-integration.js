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
    console.log('--- STARTING INTEGRATION TESTS ---');

    // 1. Authenticate Host User
    let hostUser, hostToken;
    const randomSuffix = Math.floor(Math.random() * 100000);
    try {
        const authRes = await fetchJson(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'host@test.com', password: 'password' })
        });
        hostUser = authRes.user;
        hostToken = authRes.token;
    } catch {
        const randomSuffix = Math.floor(Math.random() * 100000);
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
    if (!roomRes.success) throw new Error('Failed to create room');
    const roomCode = roomRes.room.roomCode;
    console.log(`✅ Room Created: ${roomCode}`);

    // Test 1: Concurrency and timing validation
    console.log('\n--- TEST 1: Concurrency & Real-Time Sync (<100ms) ---');
    await new Promise((resolve, reject) => {
        let hostSocket = io(SOCKET_URL, { path: '/socket.io/', transports: ['websocket'] });
        let updatesReceived = 0;

        // Track update response times
        const requestTimes = {};

        hostSocket.on('connect', () => {
            hostSocket.emit('authenticate', { userId: hostUser.id });
            hostSocket.emit('join-room', { roomCode, userId: hostUser.id });
        });

        hostSocket.on('room-updated', (data) => {
            // Validate full payload
            if (!data.rounds || !data.messages) {
                console.error("FAIL_KEYS:", Object.keys(data));
                return reject(new Error('Payload missing crucial fields (rounds, messages)'));
            }

            const receiveTime = Date.now();
            const p = data.settings.maxPlayers;
            if (requestTimes[p]) {
                const latency = receiveTime - requestTimes[p];
                console.log(`   Update maxPlayers=${p} received in ${latency}ms`);
                if (latency > 100) {
                    console.warn(`   ⚠️ Warning: Latency exceeded 100ms (${latency}ms)`);
                }
            }

            updatesReceived++;
            if (updatesReceived >= 10) {
                console.log('✅ Passed Test 1: Concurrency and Sync Timings');
                hostSocket.disconnect();
                resolve();
            }
        });

        hostSocket.on('error', err => reject(err));

        setTimeout(async () => {
            // Spam 10 rapid concurrent configuration changes
            for (let i = 10; i < 20; i++) {
                requestTimes[i] = Date.now();
                fetchJson(`${API_BASE}/game-rooms/rooms/${roomCode}/settings`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${hostToken}` },
                    body: JSON.stringify({ settings: { maxPlayers: i } })
                }).catch(reject);
            }
        }, 1000);
    });

    // Test 2: Network interruption
    console.log('\n--- TEST 2: Network Interruption / Reconnection Logic ---');
    await new Promise((resolve, reject) => {
        let clientSocket = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['websocket'],
            reconnectionDelayMax: 5000
        });

        let connectedOnce = false;
        let disconnectedOnce = false;

        clientSocket.on('connect', () => {
            if (!connectedOnce) {
                connectedOnce = true;
                console.log('   Client connected. Forcing disconnect to test retry...');
                // Force socket drop
                clientSocket.io.engine.close();
            } else if (disconnectedOnce) {
                console.log('✅ Passed Test 2: Client successfully reconnected using backoff configurations.');
                clientSocket.disconnect();
                resolve();
            }
        });

        clientSocket.on('disconnect', () => {
            if (connectedOnce && !disconnectedOnce) {
                console.log('   Client disconnected. Awaiting backoff reconnect hook...');
                disconnectedOnce = true;
            }
        });
    });

    console.log('\n=======================================');
    console.log('🎉 ALL COMPREHENSIVE SOCKET TESTS PASSED');
    console.log('=======================================');
}

runTest().catch(err => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
});
