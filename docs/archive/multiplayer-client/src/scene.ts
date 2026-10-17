import Phaser from 'phaser';
import { WORLD, obstacles, seats } from '../../../packages/shared/world';
export type Person = { name: string; x: number; y: number; direction: string; action: string; actionAt: number; color: number; seat: string };
export const live = { players: new Map<string, Person>(), occupants: new Map<string, string>(), self: '', time: Date.now(), dx: 0, dy: 0 };
const palette = [0x91acb6, 0xd6a17c, 0xb6a4c5, 0x8ea981];
type Doll = { body: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; shadow: Phaser.GameObjects.Ellipse; x: number; y: number };
export class Garden extends Phaser.Scene {
  dolls = new Map<string, Doll>(); private swing!: Phaser.GameObjects.Graphics;
  constructor() { super('garden'); }
  create() {
    const g = this.add.graphics();
    g.fillStyle(0xdce9bc); g.fillRect(0, 0, 1600, 1000);
    // A deterministic scattering keeps the garden identical across browsers.
    let seed = 42; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 950; i++) {
      const x = rand() * 1600, y = rand() * 1000;
      g.fillStyle(i % 3 ? 0xc5d79e : 0xf3f4cc, .65); g.fillEllipse(x, y, 3 + rand() * 4, 2);
    }
    g.lineStyle(150, 0xc9dca9, .5); g.lineBetween(170, 650, 1420, 650);
    g.lineStyle(112, 0xeee6cb); g.lineBetween(120, 650, 1480, 650); g.lineBetween(800, 230, 800, 1000);
    g.lineStyle(96, 0xf4edd9); g.lineBetween(120, 650, 1480, 650); g.lineBetween(800, 230, 800, 1000);
    for (let i = 0; i < 90; i++) { const x = 130 + rand() * 1340; g.fillStyle(0xd7cfb8, .5); g.fillEllipse(x, 610 + rand() * 80, 5, 3); }
    // Sandbox and circular meeting lawn.
    g.fillStyle(0xbacb91); g.fillRoundedRect(380, 275, 320, 230, 40); g.fillStyle(0xe5e6bc); g.fillRoundedRect(388, 283, 304, 214, 34);
    g.fillStyle(0xc9d9a7); g.fillEllipse(1060, 430, 360, 270); g.fillStyle(0xdce3b1); g.fillEllipse(1060, 430, 330, 240);
    g.fillStyle(0xcbdca9); g.fillEllipse(805, 650, 245, 180); g.fillStyle(0xe7eacb); g.fillEllipse(805, 650, 215, 155);
    // Fence.
    g.fillStyle(0xc1b08a); g.fillRect(32, 68, 1536, 8); g.fillRect(32, 91, 1536, 7);
    for (let x = 35; x < 1580; x += 32) { g.fillStyle(0xe4d5ae); g.fillRoundedRect(x, 48, 10, 70, 4); }
    // Flower patches, stepping stones, and hedge beds.
    for (const o of obstacles) {
      g.fillStyle(0xb3c38e); g.fillRoundedRect(o.x - 8, o.y + 8, o.w + 16, o.h + 10, 24);
      g.fillStyle(0x9eb57b); g.fillRoundedRect(o.x, o.y, o.w, o.h, 22);
      for (let i = 0; i < 15; i++) { const x = o.x + 15 + rand() * (o.w - 30), y = o.y + 12 + rand() * (o.h - 24); g.fillStyle([0xf5d9a0, 0xf9edd5, 0xdfb3a3][i % 3]); g.fillCircle(x, y, 5); g.fillStyle(0xe0b564); g.fillCircle(x, y, 2); }
    }
    this.tree(190, 300, 1.1); this.tree(1415, 310, 1.15); this.tree(150, 870, .95); this.tree(1440, 895, 1);
    // Bench: layered wood, steel feet, and plaque.
    const b = this.add.graphics().setDepth(360);
    b.fillStyle(0x638276); b.fillRoundedRect(475, 346, 10, 60, 3); b.fillRoundedRect(620, 346, 10, 60, 3);
    b.fillStyle(0x937356); b.fillRoundedRect(462, 315, 180, 13, 4); b.fillRoundedRect(462, 333, 180, 13, 4);
    b.fillStyle(0xc6a16e); b.fillRoundedRect(460, 357, 185, 19, 5); b.fillStyle(0xddba86); b.fillRoundedRect(460, 354, 185, 9, 4);
    this.add.text(552, 465, '잠깐 쉬어가요', { fontFamily: 'sans-serif', fontSize: '14px', color: '#8c9e70' }).setOrigin(.5);
    // Swing support stays behind riders, ropes/seat animate separately.
    const frame = this.add.graphics().setDepth(200); frame.lineStyle(12, 0x789c86); frame.lineBetween(930, 480, 970, 250); frame.lineBetween(1170, 480, 1130, 250); frame.lineBetween(965, 250, 1135, 250);
    frame.lineStyle(4, 0x9bb79d); frame.lineBetween(930, 480, 970, 250); frame.lineBetween(1170, 480, 1130, 250);
    this.swing = this.add.graphics().setDepth(410);
    this.add.text(1050, 555, '바람을 타는 시간', { fontSize: '14px', color: '#8c9e70' }).setOrigin(.5);
    // Picnic details.
    const picnic = this.add.graphics(); picnic.fillStyle(0xb7c998); picnic.fillEllipse(420, 825, 165, 100); picnic.fillStyle(0xe6b79c); picnic.fillRoundedRect(355, 775, 135, 70, 8); picnic.lineStyle(2, 0xf8ddbe, .8);
    for (let x = 365; x < 490; x += 18) picnic.lineBetween(x, 775, x, 845);
    for (let y = 785; y < 845; y += 17) picnic.lineBetween(355, y, 490, y);
    picnic.fillStyle(0xa77b50); picnic.fillRoundedRect(430, 765, 40, 30, 5); picnic.lineStyle(3, 0xa77b50); picnic.strokeEllipse(450, 763, 24, 21);
    this.add.text(800, 150, 'LITTLE GARDEN', { fontFamily: 'Georgia', fontSize: '20px', color: '#587446', letterSpacing: 4 }).setOrigin(.5);
    this.add.text(800, 182, '작은 순간이 모이는 곳', { fontSize: '12px', color: '#71865a' }).setOrigin(.5);
    this.scale.on('resize', this.fit, this); this.fit();
  }
  fit() {
    const width = this.scale.width, height = this.scale.height;
    this.cameras.main.setZoom(Math.min(width / WORLD.width, height / WORLD.height));
    this.cameras.main.centerOn(WORLD.width / 2, WORLD.height / 2);
  }
  tree(x: number, y: number, scale: number) {
    const g = this.add.graphics({ x, y }).setScale(scale).setDepth(y);
    g.fillStyle(0x769657, .18); g.fillEllipse(8, 4, 130, 43); g.fillStyle(0xa7865e); g.fillRoundedRect(-10, -70, 20, 75, 6);
    g.fillStyle(0x85a66a); g.fillCircle(0, -104, 62); g.fillStyle(0x94b678); g.fillCircle(-25, -115, 43); g.fillCircle(24, -130, 42); g.fillStyle(0xa5c488); g.fillCircle(-12, -145, 36);
    g.fillStyle(0xbed59b, .6); g.fillEllipse(-25, -153, 20, 12); g.fillEllipse(20, -119, 15, 9);
  }
  doll(id: string, p: Person) {
    const shadow = this.add.ellipse(p.x, p.y, 42, 13, 0x4f6843, .16);
    const body = this.add.container(p.x, p.y);
    const g = this.add.graphics(); const color = palette[p.color % palette.length];
    // Original placeholder: oversized bobbed head, garden overalls, flower pin.
    g.fillStyle(0x625b51); g.fillRoundedRect(-20, -24, 15, 22, 6); g.fillRoundedRect(5, -24, 15, 22, 6);
    g.fillStyle(color); g.fillRoundedRect(-24, -46, 48, 34, 12); g.fillStyle(0xf4ead1); g.fillRoundedRect(-13, -45, 26, 15, 5);
    g.fillStyle(0xffe4cc); g.fillEllipse(-28, -30, 12, 17); g.fillEllipse(28, -30, 12, 17);
    g.fillStyle(0x675b4f); g.fillEllipse(0, -76, 69, 69); g.fillRoundedRect(-34, -76, 68, 36, 14);
    g.fillStyle(0xffe4cc); g.fillEllipse(0, -69, 56, 48);
    g.fillStyle(0x756354); g.fillEllipse(-14, -91, 38, 30); g.fillEllipse(15, -89, 34, 27);
    g.fillStyle(0x443f38); g.fillEllipse(-11, -69, 4, 7); g.fillEllipse(11, -69, 4, 7);
    g.lineStyle(1.5, 0xa77868); g.lineBetween(-3, -59, 0, -57); g.lineBetween(0, -57, 4, -59);
    g.fillStyle(0xedb4a1, .65); g.fillEllipse(-19, -61, 10, 5); g.fillEllipse(19, -61, 10, 5);
    g.fillStyle(0xf2deb1); g.fillCircle(24, -88, 6); g.fillCircle(31, -88, 6); g.fillCircle(27, -94, 6); g.fillStyle(0xd6ad61); g.fillCircle(27, -88, 4);
    g.fillStyle(0xf3d29b); g.fillCircle(0, -22, 3); body.add(g);
    const wave = this.add.text(28, -120, '♡', { fontSize: '29px', color: '#dc927d' }); wave.setName('wave'); body.add(wave); wave.setVisible(false);
    const arm = this.add.graphics({ x: 23, y: -37 }).setName('arm'); arm.fillStyle(color); arm.fillRoundedRect(-4, -22, 11, 23, 5); arm.fillStyle(0xffe4cc); arm.fillEllipse(1, -27, 13, 17); body.add(arm); arm.setVisible(false);
    const back = this.add.ellipse(0, -71, 57, 48, 0x756354).setName('back'); body.add(back); back.setVisible(false);
    const label = this.add.text(p.x, p.y + 15, p.name + (id === live.self ? ' · 나' : ''), { fontFamily: 'sans-serif', fontSize: '15px', color: id === live.self ? '#3f6540' : '#637453', backgroundColor: '#ffffefdc', padding: { x: 10, y: 5 } }).setOrigin(.5, 0);
    if (id === live.self) { const marker = this.add.triangle(0, -123, 0, 0, 12, 0, 6, 8, 0x5b8151); body.add(marker); }
    const doll = { body, label, shadow, x: p.x, y: p.y }; this.dolls.set(id, doll); return doll;
  }
  update(_time: number, delta: number) {
    const now = Date.now(), phase = Math.sin((now + clockOffset()) / 650), swingY = 420 + phase * 30;
    this.swing.clear().lineStyle(3, 0xa58d64); this.swing.lineBetween(1025, 258, 1025, swingY - 7); this.swing.lineBetween(1075, 258, 1075, swingY - 7); this.swing.fillStyle(0xb28d5c); this.swing.fillRoundedRect(1017, swingY - 8, 66, 12, 4);
    for (const [id, p] of live.players) {
      const d = this.dolls.get(id) ?? this.doll(id, p);
      const factor = 1 - Math.exp(-delta / 65);
      d.x += (p.x - d.x) * factor; d.y += (p.y - d.y) * factor;
      const moving = p.action === 'walk', emote = p.action === 'emote';
      const bob = moving ? Math.sin(now / 85) * 3 : Math.sin(now / 500) * .9;
      const y = p.action === 'swinging' ? swingY : d.y;
      d.body.setPosition(d.x, y + bob).setDepth(y + 1);
      d.body.setAngle(moving ? Math.sin(now / 85) * 3 : emote ? Math.sin(now / 120) * 9 : p.action === 'swinging' ? phase * 8 : 0);
      d.body.setScale(p.direction === 'left' ? -.88 : .88, .88);
      (d.body.getByName('wave') as Phaser.GameObjects.Text).setVisible(emote); (d.body.getByName('back') as Phaser.GameObjects.Ellipse).setVisible(p.direction === 'up' && !p.seat);
      (d.body.getByName('arm') as Phaser.GameObjects.Graphics).setVisible(emote).setAngle(Math.sin(now / 90) * 25);
      d.shadow.setPosition(d.x, p.seat ? p.y + 5 : d.y).setDepth(y - 2).setAlpha(p.action === 'swinging' ? .08 : .16);
      d.label.setPosition(d.x, y + 15).setDepth(y + 1000);
    }
    for (const [id, d] of this.dolls) if (!live.players.has(id)) { d.body.destroy(); d.label.destroy(); d.shadow.destroy(); this.dolls.delete(id); }
  }
}
let offset = 0;
export function setServerTime(time: number) { offset = time - Date.now(); }
function clockOffset() { return offset; }
export function startGarden(parent: string) {
  return new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#dce9bc', antialias: true, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: [Garden], render: { roundPixels: false } });
}
