import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { Client, type Room } from '@colyseus/sdk';
import { VERSION } from '../packages/shared/world.js';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function until(fn: () => boolean, ms = 5000) { const end = Date.now() + ms; while (!fn()) { if (Date.now() > end) throw new Error('State wait timed out'); await sleep(30); } }
test('real clients share movement, seat races, emotes, disconnect release and rooms', { timeout: 35000 }, async () => {
  const port = 2600 + Math.floor(Math.random() * 500);
  const proc = spawn(process.execPath, ['apps/server/dist/apps/server/src/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; proc.stdout.on('data', d => output += d); proc.stderr.on('data', d => output += d);
  const rooms: Room[] = [];
  try {
    let healthy = false;
    for (let i = 0; i < 80; i++) { try { healthy = (await fetch(`http://127.0.0.1:${port}/health`)).ok; } catch {} if (healthy) break; await sleep(100); }
    assert.ok(healthy, output);
    const client = new Client(`http://127.0.0.1:${port}`);
    await assert.rejects(client.joinOrCreate('playground', { name: '손님', version: 'old' }));
    const a = await client.joinOrCreate('playground', { name: '산책자', version: VERSION }); rooms.push(a);
    const b = await client.joinById(a.roomId, { name: '친구', version: VERSION }); rooms.push(b);
    a.onMessage('notice', () => {}); b.onMessage('notice', () => {});
    await until(() => a.state?.players.size === 2 && b.state?.players.size === 2);
    const sequences = new Map<Room, number>();
    const input = (r: Room, dx: number, dy: number) => { const seq = (sequences.get(r) ?? 0) + 1; sequences.set(r, seq); r.send('input', { dx, dy, seq }); };
    async function walk(r: Room, x: number, y: number) {
      const deadline = Date.now() + 8000;
      while (true) {
        const p = r.state.players.get(r.sessionId);
        const dx = Math.abs(x - p.x) < 12 ? 0 : Math.sign(x - p.x), dy = Math.abs(y - p.y) < 12 ? 0 : Math.sign(y - p.y);
        input(r, dx, dy); if (!dx && !dy) break;
        if (Date.now() > deadline) throw new Error(`Could not reach ${x},${y}: ${p.x},${p.y}`);
        await sleep(50);
      }
      await sleep(120);
    }
    const initialX = a.state.players.get(a.sessionId).x;
    input(a, 1, 0); await sleep(160); input(a, 0, 0); await sleep(120);
    assert.ok(b.state.players.get(a.sessionId).x > initialX);
    const stopped = a.state.players.get(a.sessionId).x;
    a.send('input', { dx: 999, dy: 0, seq: 99999 }); await sleep(150);
    assert.equal(a.state.players.get(a.sessionId).x, stopped);
    a.send('use', 'bench-1'); await sleep(120); assert.equal(a.state.occupants.size, 0);
    await Promise.all([walk(a, 550, 440), walk(b, 550, 440)]);
    a.send('use', 'bench-1'); b.send('use', 'bench-1');
    await until(() => a.state.occupants.has('bench-1'));
    await sleep(150);
    const winner = a.state.occupants.get('bench-1') === a.sessionId ? a : b;
    const loser = winner === a ? b : a;
    assert.equal(a.state.occupants.size, 1); assert.equal(loser.state.players.get(loser.sessionId).seat, '');
    const seatedX = winner.state.players.get(winner.sessionId).x;
    input(winner, 1, 0); await sleep(150); assert.equal(winner.state.players.get(winner.sessionId).x, seatedX);
    winner.send('leave-seat'); await until(() => a.state.occupants.size === 0);
    loser.send('emote'); await until(() => winner.state.players.get(loser.sessionId).action === 'emote');
    input(loser, 1, 0); await until(() => winner.state.players.get(loser.sessionId).action === 'walk'); input(loser, 0, 0);
    await walk(winner, 1050, 500); winner.send('use', 'swing-1'); await until(() => loser.state.occupants.has('swing-1'));
    const c = await client.joinById(a.roomId, { name: '새친구', version: VERSION }); rooms.push(c);
    await until(() => !!c.state?.occupants?.has('swing-1'));
    assert.equal(c.state.players.get(winner.sessionId).action, 'swinging');
    winner.reconnection.minUptime = 0; winner.reconnection.minDelay = 100; winner.reconnection.delay = 100;
    const reconnected = new Promise<void>(resolve => winner.onReconnect(() => resolve()));
    winner.connection.close(4010, 'test reconnect');
    await until(() => !loser.state.occupants.has('swing-1'));
    await Promise.race([reconnected, sleep(5000).then(() => { throw new Error('Reconnect timed out'); })]);
    await until(() => winner.state.players.get(winner.sessionId)?.seat === '');
    const separate = await client.create('playground', { name: '다른방', version: VERSION }); rooms.push(separate);
    await until(() => separate.state?.players?.size === 1); assert.notEqual(separate.roomId, loser.roomId);
    await winner.leave(); await until(() => !loser.state.players.has(winner.sessionId));
    const loadRoom = await client.create('playground', { name: '정원00', version: VERSION }); rooms.push(loadRoom);
    const crowd = await Promise.all(Array.from({ length: 15 }, (_, i) => client.joinById(loadRoom.roomId, { name: `정원${String(i + 1).padStart(2, '0')}`, version: VERSION })));
    rooms.push(...crowd);
    await until(() => loadRoom.state?.players?.size === 16);
    await assert.rejects(client.joinById(loadRoom.roomId, { name: '초과접속', version: VERSION }));
    const loadClients = [loadRoom, ...crowd];
    const loadX = loadRoom.state.players.get(loadRoom.sessionId).x;
    for (let step = 0; step < 20; step++) { loadClients.forEach(r => input(r, step < 10 ? 1 : -1, 0)); await sleep(50); }
    loadClients.forEach(r => input(r, 0, 0)); await sleep(150);
    assert.equal(loadRoom.state.players.size, 16);
    assert.ok(Math.abs(loadRoom.state.players.get(loadRoom.sessionId).x - loadX) < 30);
  } finally { await Promise.race([Promise.allSettled(rooms.filter(r => r.connection.isOpen).map(r => r.leave())), sleep(1000)]); proc.kill(); }
});
