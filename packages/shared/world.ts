export const VERSION = '1';
export const WORLD = { width: 1600, height: 1000, speed: 185, radius: 18 };
export const obstacles = [
  { x: 100, y: 160, w: 230, h: 90 }, { x: 1260, y: 160, w: 230, h: 90 },
  { x: 705, y: 110, w: 190, h: 100 }, { x: 115, y: 730, w: 220, h: 120 },
  { x: 1240, y: 750, w: 230, h: 100 },
];
export const seats = [
  { id: 'bench-1', kind: 'bench', x: 520, y: 370, exitX: 520, exitY: 445 },
  { id: 'bench-2', kind: 'bench', x: 585, y: 370, exitX: 585, exitY: 445 },
  { id: 'swing-1', kind: 'swing', x: 1050, y: 420, exitX: 1050, exitY: 530 },
] as const;
export function validNickname(value: unknown): string {
  if (typeof value !== 'string') throw new Error('닉네임을 입력해주세요.');
  const name = value.trim();
  if ([...name].length < 2 || [...name].length > 12 || /[\p{C}<>]/u.test(name)) throw new Error('닉네임은 특수 제어문자 없이 2~12자로 입력해주세요.');
  return name;
}
export function blocked(x: number, y: number): boolean {
  const r = WORLD.radius;
  return x < r + 25 || y < r + 70 || x > WORLD.width - r - 25 || y > WORLD.height - r - 25 ||
    obstacles.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h);
}
export function move(x: number, y: number, dx: number, dy: number, seconds: number) {
  const length = Math.hypot(dx, dy);
  if (!length) return { x, y };
  const distance = WORLD.speed * Math.min(Math.max(seconds, 0), .1);
  const nx = x + dx / length * distance, ny = y + dy / length * distance;
  return { x: blocked(nx, y) ? x : nx, y: blocked(blocked(nx, y) ? x : nx, ny) ? y : ny };
}
export function canUse(player: { x: number; y: number; seat: string }, seatId: string, occupied: boolean) {
  const seat = seats.find(s => s.id === seatId);
  return !!seat && !occupied && !player.seat && Math.hypot(player.x - seat.x, player.y - seat.y) <= 110;
}
