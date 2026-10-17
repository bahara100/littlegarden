import './style.css';
import { Client, type Room } from '@colyseus/sdk';
import { startGarden, live, setServerTime, type Person } from './scene';
import { VERSION, seats, validNickname, move } from '../../../packages/shared/world';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
startGarden('game');
const endpoint = import.meta.env.VITE_SERVER_URL || 'http://localhost:2567';
const client = new Client(endpoint);
let room: Room | undefined, seq = 0, nearby = '', seat = '', toastTimer: ReturnType<typeof setTimeout>, joining = false;
const keys = new Set<string>();
let unconfirmed: { seq: number; dx: number; dy: number }[] = [];
el<HTMLButtonElement>('help').onclick = () => el<HTMLDialogElement>('help-dialog').showModal();
el('close-help').onclick = () => el<HTMLDialogElement>('help-dialog').close();
function toast(message: string) { el('toast').textContent = message; el('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el('toast').classList.remove('visible'), 3000); }
function active() { return room && !el<HTMLDialogElement>('help-dialog').open && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || ''); }
function use() { if (room && nearby && !seat) room.send('use', nearby); }
function emote() { if (room && !seat) room.send('emote'); }
function leaveSeat() { room?.send('leave-seat'); }
el('use').onclick = use; el('emote').onclick = emote; el('exit-seat').onclick = leaveSeat;
el('logout').onclick = () => room?.leave();
el('copy-room').onclick = async () => { if (!room) return; try { await navigator.clipboard.writeText(room.roomId); toast('방 코드를 복사했어요. 친구에게 알려주세요.'); } catch { toast('방 코드: ' + room.roomId); } };
el<HTMLFormElement>('join-form').onsubmit = async event => {
  event.preventDefault(); if (joining || room) return;
  try {
    const name = validNickname(el<HTMLInputElement>('nickname').value), code = el<HTMLInputElement>('room-input').value.trim();
    joining = true; el<HTMLButtonElement>('join').disabled = true; el('join').textContent = '놀이터로 가는 중…'; el('entry-error').textContent = '';
    const options = { name, version: VERSION };
    const connected = code ? await client.joinById(code, options) : await client.joinOrCreate('playground', options);
    room = connected; unconfirmed = []; connected.reconnection.minUptime = 0; connected.reconnection.maxRetries = 5; connected.reconnection.maxDelay = 2500;
    live.self = room.sessionId; live.players.clear(); el('entry').hidden = true; el('room-info').hidden = false; el('logout').hidden = false; el('room-code').textContent = room.roomId; el('connection').textContent = '함께 연결되어 있어요';
    connected.onStateChange(state => {
      if (room !== connected) return;
      live.players.clear(); live.occupants.clear();
      state.players.forEach((p: Person & { ack: number }, id: string) => {
        const snapshot = { name: p.name, x: p.x, y: p.y, direction: p.direction, action: p.action, actionAt: p.actionAt, color: p.color, seat: p.seat };
        if (id === live.self) {
          unconfirmed = unconfirmed.filter(i => i.seq > p.ack);
          if (p.seat) unconfirmed = [];
          else for (const i of unconfirmed) Object.assign(snapshot, move(snapshot.x, snapshot.y, i.dx, i.dy, .05));
        }
        live.players.set(id, snapshot);
      });
      state.occupants.forEach((id: string, key: string) => live.occupants.set(key, id));
      setServerTime(state.time); el('population').textContent = `${live.players.size} / 16 명`;
    });
    connected.onMessage('notice', toast);
    connected.onDrop(() => { keys.clear(); unconfirmed = []; el('connection').textContent = '다시 연결하는 중…'; toast('연결이 잠시 끊겼어요. 다시 연결하고 있어요.'); });
    connected.onReconnect(() => { keys.clear(); unconfirmed = []; el('connection').textContent = '함께 연결되어 있어요'; toast('다시 연결됐어요.'); });
    connected.onError((_code, message) => toast(message || '서버 연결에 문제가 생겼어요.'));
    connected.onLeave(() => {
      if (room !== connected) return;
      room = undefined; live.players.clear(); live.occupants.clear(); keys.clear(); seat = ''; nearby = '';
      el('entry').hidden = false; el('room-info').hidden = true; el('logout').hidden = true; el('connection').textContent = '다시 만날 준비'; el('population').textContent = '산책 준비 중'; el('prompt').hidden = true;
      toast('놀이터에서 나왔어요. 다시 입장할 수 있어요.');
    });
    toast('어서 와요! 방향키로 걷고, 1번 키로 인사해요.');
  } catch (error) {
    el('entry-error').textContent = error instanceof Error ? `입장하지 못했어요. ${error.message}` : '서버와 방 코드를 확인해주세요.';
  } finally { joining = false; el<HTMLButtonElement>('join').disabled = false; el('join').textContent = '놀이터 입장하기 →'; }
};
window.addEventListener('keydown', event => {
  if (!active()) return;
  const k = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', '1', 'escape'].includes(k)) event.preventDefault();
  keys.add(k); if (event.repeat) return;
  if (k === 'e') use(); if (k === '1') emote(); if (k === 'escape') leaveSeat();
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => keys.clear());
setInterval(() => {
  const p = live.players.get(live.self);
  seat = p?.seat || ''; nearby = '';
  if (p && !seat) {
    const available = seats.filter(s => !live.occupants.has(s.id) && Math.hypot(p.x - s.x, p.y - s.y) <= 110).sort((a, b) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(p.x - b.x, p.y - b.y));
    nearby = available[0]?.id || '';
  }
  el<HTMLButtonElement>('use').disabled = !nearby; el<HTMLButtonElement>('emote').disabled = !p || !!seat; el<HTMLButtonElement>('exit-seat').disabled = !seat;
  el('prompt').hidden = !seat && !nearby;
  el('prompt').textContent = seat ? 'ESC · 내려오기' : nearby.startsWith('swing') ? 'E · 그네 타기' : 'E · 벤치에 앉기';
  if (!room) return;
  const enabled = active();
  const dx = enabled ? Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')) : 0;
  const dy = enabled ? Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')) : 0;
  if (!room.reconnection.isReconnecting) {
    const input = { dx, dy, seq: ++seq }; room.send('input', input);
    if (p && !p.seat) {
      unconfirmed.push(input); if (unconfirmed.length > 20) unconfirmed.shift();
      Object.assign(p, move(p.x, p.y, dx, dy, .05));
      if (dx || dy) { p.action = 'walk'; p.direction = dx ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'; }
    }
  }
}, 50);
