import { createServer } from 'node:http';
import { Server, Room, type Client } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { schema, t } from '@colyseus/schema';
import { WORLD, VERSION, move, seats, validNickname, canUse } from '../../../packages/shared/world.js';

const Player = schema({
  name: t.string().default(''), x: t.number().default(800), y: t.number().default(670), direction: t.string().default('down'),
  action: t.string().default('idle'), seat: t.string().default(''), actionAt: t.number().default(0), ack: t.number().default(0), color: t.number().default(0),
}, 'Player');
const State = schema({ players: t.map(Player), occupants: t.map('string'), time: t.number().default(0) }, 'PlaygroundState');
type Input = { dx: number; dy: number; seq: number; at: number };
export class Playground extends Room {
  state = new State(); maxClients = 16;
  pendingInputs = new Map<string, Input[]>(); lastSequence = new Map<string, number>(); cooldown = new Map<string, number>();
  onCreate() {
    this.patchRate = 50;
    this.maxMessagesPerSecond = 60;
    this.onMessage('input', (client, data) => {
      if (!data || !Number.isInteger(data.seq) || data.seq < 0 || data.seq > Number.MAX_SAFE_INTEGER || ![-1, 0, 1].includes(data.dx) || ![-1, 0, 1].includes(data.dy)) return;
      if (!this.state.players.has(client.sessionId) || data.seq <= (this.lastSequence.get(client.sessionId) ?? -1)) return;
      this.lastSequence.set(client.sessionId, data.seq);
      const queue = this.pendingInputs.get(client.sessionId) ?? [];
      queue.push({ dx: data.dx, dy: data.dy, seq: data.seq, at: Date.now() });
      if (queue.length > 5) queue.shift();
      this.pendingInputs.set(client.sessionId, queue);
    });
    this.onMessage('use', (client, data) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || typeof data !== 'string') return;
      if (!canUse(p, data, this.state.occupants.has(data))) { client.send('notice', '지금은 이 자리를 이용할 수 없어요.'); return; }
      const seat = seats.find(s => s.id === data)!;
      this.state.occupants.set(data, client.sessionId);
      p.seat = data; p.x = seat.x; p.y = seat.y; p.action = seat.kind === 'swing' ? 'swinging' : 'seated'; p.actionAt = Date.now(); p.direction = 'down';
    });
    this.onMessage('leave-seat', client => this.release(client.sessionId));
    this.onMessage('emote', client => {
      const p = this.state.players.get(client.sessionId), now = Date.now();
      if (!p || p.seat || now - (this.cooldown.get(client.sessionId) ?? 0) < 3000) return;
      p.action = 'emote'; p.actionAt = now; this.cooldown.set(client.sessionId, now);
    });
    this.setSimulationInterval(() => this.tick(), 50);
  }
  onAuth(_client: Client, options: { name?: unknown; version?: unknown }) {
    if (options?.version !== VERSION) throw new Error('새로고침 후 다시 입장해주세요.');
    validNickname(options.name);
    return true;
  }
  onJoin(client: Client, options: { name?: unknown; version?: unknown }) {
    const p = new Player(); p.name = validNickname(options.name); p.x = 720 + Math.random() * 160; p.color = Math.floor(Math.random() * 4);
    this.state.players.set(client.sessionId, p);
  }
  release(id: string) {
    const p = this.state.players.get(id);
    if (!p?.seat) return;
    const seat = seats.find(s => s.id === p.seat);
    this.state.occupants.delete(p.seat); p.seat = ''; p.action = 'idle';
    if (seat) { p.x = seat.exitX; p.y = seat.exitY; }
    this.pendingInputs.delete(id);
  }
  async onDrop(client: Client) {
    this.release(client.sessionId); this.pendingInputs.delete(client.sessionId);
    try { await this.allowReconnection(client, 15); } catch { this.cooldown.delete(client.sessionId); this.state.players.delete(client.sessionId); }
  }
  onLeave(client: Client) { this.release(client.sessionId); this.pendingInputs.delete(client.sessionId); this.lastSequence.delete(client.sessionId); this.cooldown.delete(client.sessionId); this.state.players.delete(client.sessionId); }
  tick() {
    const now = Date.now(); this.state.time = now;
    this.state.players.forEach((p, id) => {
      const i = this.pendingInputs.get(id)?.shift();
      if (i) p.ack = i.seq;
      if (p.seat) return;
      if (i && now - i.at < 250 && (i.dx || i.dy)) {
        Object.assign(p, move(p.x, p.y, i.dx, i.dy, .05)); p.action = 'walk';
        p.direction = i.dx ? (i.dx > 0 ? 'right' : 'left') : i.dy > 0 ? 'down' : 'up';
      } else if (p.action !== 'emote' || now - p.actionAt > 2000) p.action = 'idle';
    });
  }
}
const http = createServer();
const server = new Server({
  greet: false,
  transport: new WebSocketTransport({ server: http }),
  express: app => { app.get('/health', (_req, res) => res.json({ ok: true, version: VERSION, world: WORLD.width })); },
});
server.define('playground', Playground);
await server.listen(Number(process.env.PORT || 2567));
console.log('Playground server: http://localhost:' + (process.env.PORT || 2567));

