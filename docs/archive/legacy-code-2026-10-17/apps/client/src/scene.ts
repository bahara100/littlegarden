import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LayoutEditor } from './editor';
import { CATALOG, footprint, cloneLayout, type Layout, type PlacedItem, type ItemKind } from './layout';
import { LifeSimulation, FRIENDS, type AvatarId, type EquipmentId } from './simulation';
import { createScarlet } from './scarlet';
import { loadScarletAsset, type CharacterRig } from './scarletAsset';
import { loadScarletPixel } from './scarletPixel';

export type Selection = AvatarId | EquipmentId;
type Callbacks = { select: (id: Selection) => void; zoom: (value: number) => void; error: () => void; notice: (message: string) => void };
type Rig = CharacterRig;
const BASE_SPAN = 19;
const colors = { grass: '#bfd39d', wood: '#d4a77b', frame: '#819b8c', skin: '#ffe0c5', hair: '#605347', shirt: '#f8edcc', dress: '#91b1a2' };

/** Presentation consumes the renderer-independent life simulation. */
export class Garden3D {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera();
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private root = new THREE.Group();
  private grid = new THREE.Group();
  readonly life = new LifeSimulation();
  private rigs = new Map<AvatarId, Rig>();
  selectedAvatar: AvatarId = 'character';
  selection: Selection = 'character';
  readonly editor = new LayoutEditor();
  private furniture = new THREE.Group();
  private itemGroups = new Map<string, THREE.Group>();
  private swingPivots = new Map<string, THREE.Group>();
  private ghost: THREE.Group | null = null;
  private gridSetting = false;
  private halo: THREE.Mesh;
  private pickables: THREE.Object3D[] = [];
  private targets = new Map<Selection, THREE.Vector3>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private resizeObserver: ResizeObserver;
  private sun: THREE.DirectionalLight;
  private frame = 0;
  private swingAmplitude = .04;
  private lastFrame = performance.now();
  private pointerStart = { x: 0, y: 0, button: -1 };
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private contextLost = false;
  private panMode = false;
  private disposed = false;
  private focusedAvatar: AvatarId | null = null;
  scarletModel: 'loading' | 'ready' | 'fallback' = 'loading';
  readonly pixelMode=new URLSearchParams(location.search).get('art')==='pixel';

  constructor(private host: HTMLElement, private callbacks: Callbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor('#eeeee4');
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    host.appendChild(this.renderer.domElement);
    this.scene.add(this.root);
    const hemi = new THREE.HemisphereLight('#fff7df', '#b5b99f', 2); this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight('#fff0d4', 2.3);
    this.sun.position.set(-9, 18, 8); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    this.sun.shadow.normalBias = .035; this.sun.shadow.bias = -.00015; this.sun.shadow.radius = 4;
    this.scene.add(this.sun);
    this.scene.add(new THREE.DirectionalLight('#e8f6f1', .6));
    this.buildWorld();
    this.root.add(this.furniture);
    this.rebuildFurniture();
    FRIENDS.forEach((f, i) => this.buildCharacter(f.id, i));
    const ring = new THREE.RingGeometry(.6, .67, 64);
    this.halo = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: '#f9f5cc', transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }));
    this.halo.rotation.x = -Math.PI / 2; this.halo.position.y = .035; this.root.add(this.halo);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false; this.controls.enableDamping = true; this.controls.dampingFactor = .1;
    this.controls.screenSpacePanning = false; this.controls.panSpeed = .65; this.controls.zoomSpeed = .8;
    this.controls.minZoom = .65; this.controls.maxZoom = 5;
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener('change', this.onCameraChange);
    this.host.addEventListener('pointerdown', this.onPointerDown);
    this.host.addEventListener('pointerup', this.onPointerUp);
    this.host.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host);
    this.reset(); this.select('character'); this.resize(); this.animate();
    void this.loadScarlet();
  }
  private async loadScarlet() {
    try {
      const rig=await (this.pixelMode?loadScarletPixel():loadScarletAsset());
      if(this.disposed){this.disposeObject(rig.root);return;}
      const previous=this.rigs.get('character')!;
      rig.root.rotation.order='YXZ';rig.root.position.copy(previous.root.position);rig.root.rotation.copy(previous.root.rotation);rig.root.visible=previous.root.visible;
      (previous.root.parent??this.root).add(rig.root);
      this.pickables=this.pickables.filter(o=>o!==previous.root);this.disposeObject(previous.root);
      this.selectable(rig.root,'character',rig.root.position.clone());this.rigs.set('character',rig);this.scarletModel='ready';
      this.callbacks.notice(this.pixelMode?'대각선 도트 홍련이에요. 바닥을 눌러 걸어보세요.':'홍련의 새 SD 모델을 불러왔어요. 가까이 보기로 살펴보세요.');
    } catch(error) { if(!this.disposed){this.scarletModel='fallback';this.callbacks.notice('홍련 모델을 불러오지 못해 임시 모델을 표시해요. 새로고침해 다시 시도해주세요.');console.error('Scarlet asset load failed',error);} }
  }
  private material(color: string, roughness = .88) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }); }
  private mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D, x: number, y: number, z: number) {
    const m = new THREE.Mesh(geometry, this.material(color)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  private box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string, radius = .06) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), color, parent, x, y, z);
  }
  private sphere(parent: THREE.Object3D, x: number, y: number, z: number, r: number, color: string, scale?: [number, number, number]) {
    const m = this.mesh(new THREE.SphereGeometry(r, 20, 14), color, parent, x, y, z); if (scale) m.scale.set(...scale); return m;
  }
  private beam(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
    const m = this.mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 12), color, parent, 0, 0, 0);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
  }
  private buildWorld() {
    // The 16×16 XZ surface projects into a diamond without faking 3D sprites.
    this.box(this.root, 0, -.38, 0, 16, .7, 16, '#c8d4b2', .25);
    this.box(this.root, 0, -.035, 0, 15.94, .18, 15.94, colors.grass, .2);
    this.box(this.root, 0, -.46, 0, 15.8, .12, 15.8, '#b1bda1', .08);
    const floor = this.mesh(new THREE.PlaneGeometry(200, 200), '#eeeee4', this.scene, 0, -.79, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
    const plaza = this.mesh(new THREE.CylinderGeometry(1.6, 1.6, .04, 48), '#e9dfc3', this.root, -.3, .09, 1.25);
    plaza.receiveShadow = true;
    this.root.add(this.grid); this.grid.visible = false;
    const points: number[] = [];
    for (let i = -8; i <= 8; i++) points.push(-8, .19, i, 8, .19, i, i, .19, -8, i, .19, 8);
    this.grid.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)), new THREE.LineBasicMaterial({ color: '#687c54', transparent: true, opacity: .24 })));
    // Picnic blanket, basket, a tiny cup.
    this.box(this.root, -3.5, .09, 4.4, 2, .035, 1.55, '#d4a998', .025);
    for (let i = 0; i < 6; i++) this.box(this.root, -4.35 + i * .34, .112, 4.4, .045, .01, 1.5, '#f3d6bc', .003);
    for (let i = 0; i < 4; i++) this.box(this.root, -3.5, .116, 3.83 + i * .38, 1.96, .01, .035, '#f3d6bc', .003);
    this.box(this.root, -4, .34, 4, .58, .45, .42, '#b18c63', .07);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.18, .025, 6, 20, Math.PI), this.material('#8f704d')); handle.position.set(-4, .55, 4); this.root.add(handle);
    this.mesh(new THREE.CylinderGeometry(.13, .11, .23, 16), '#ffefda', this.root, -3.2, .24, 4.3);
    // Small irregular stones and tufts, deterministic layout.
    for (let i = 0; i < 32; i++) {
      const x = Math.sin(i * 12.9898) * 6.9, z = Math.sin(i * 4.714) * 6.8;
      if (Math.abs(x + .3) < 1.2 || Math.abs(z - 1.25) < 1.1 || (z < .4 && Math.abs(x) < 5.5)) continue;
      this.sphere(this.root, x, .08, z, .09, i % 2 ? '#d0dbaa' : '#f1e1b8', [1.3, .45, 1]);
    }
    // Welcome sign at the rear edge.
    this.box(this.root, -.1, .65, -6.2, .11, 1.3, .11, '#aa926d');
    this.box(this.root, -.1, 1.13, -6.15, 1.7, .7, .12, '#e9ddba', .08);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 200;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#e9ddba'; ctx.fillRect(0, 0, 512, 200); ctx.fillStyle = '#6b805e'; ctx.textAlign = 'center'; ctx.font = '30px Georgia'; ctx.fillText('LITTLE GARDEN', 256, 98); ctx.font = '17px sans-serif'; ctx.fillText('a little place to rest', 256, 140);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.56, .61), new THREE.MeshBasicMaterial({ map: texture })); sign.position.set(-.1, 1.13, -6.08); this.root.add(sign);
  }
  private fence() {
    const f = new THREE.Group();
    for (const x of [-.95, -.32, .32, .95]) this.box(f, x, .5, 0, .12, .95, .12, '#e1d2ab', .035);
    this.box(f, 0, .43, 0, 2, .1, .1, '#cbb991', .025); this.box(f, 0, .73, 0, 2, .1, .1, '#cbb991', .025);
    return f;
  }  private tree(x: number, z: number, size: number) {
    const t = new THREE.Group(); t.position.set(x, .04, z); t.scale.setScalar(size);
    this.mesh(new THREE.CylinderGeometry(.15, .23, 1.8, 10), '#b4916c', t, 0, .9, 0);
    this.beam(t, new THREE.Vector3(0, 1.05, 0), new THREE.Vector3(.45, 1.65, .1), .09, '#b4916c');
    this.sphere(t, 0, 2.18, 0, 1.04, '#93af7c', [1, 1.04, 1]);
    this.sphere(t, -.43, 2.35, .16, .73, '#a9c18d'); this.sphere(t, .4, 2.53, -.12, .73, '#a0bb84'); this.sphere(t, -.1, 2.91, 0, .66, '#b1c895');
    return t;
  }
  private flowerBed(x: number, z: number, w: number, d: number) {
    const bed = new THREE.Group();
    this.box(bed, x, .15, z, w, .23, d, '#b7c18e', .18);
    this.box(bed, x, .26, z, w - .16, .12, d - .16, '#94ac77', .14);
    for (let i = 0; i < 9; i++) {
      const fx = x + ((i % 3) - 1) * w * .28, fz = z + (Math.floor(i / 3) - 1) * d * .25;
      this.mesh(new THREE.CylinderGeometry(.014, .014, .18, 5), '#81965d', bed, fx, .4, fz);
      for (let j = 0; j < 5; j++) this.sphere(bed, fx + Math.cos(j * Math.PI * .4) * .055, .5, fz + Math.sin(j * Math.PI * .4) * .055, .055, i % 2 ? '#f5d0b5' : '#f9edcd', [1, .5, 1]);
      this.sphere(bed, fx, .515, fz, .036, '#d9ae62');
    }
    return bed;
  }
  private selectable(group: THREE.Group, id: Selection, center: THREE.Vector3) {
    // Generous invisible pick volumes make thin ropes/frames easy to select.
    const kind = group.userData.kind as ItemKind | undefined;
    const dims = kind ? CATALOG[kind] : null;
    const [w, h, d] = !kind ? [1.05, 2, 1.05] : kind === 'bench' ? [2.9, 1.65, 1.05] : kind === 'swing' ? [3.1, 2.95, 1.9] : [dims!.w, kind === 'tree' ? 3.5 : kind === 'fence' ? 1 : kind === 'flower' ? .6 : .06, dims!.d];
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = h / 2; group.add(hit);
    group.userData.selection = id; this.pickables.push(group); this.targets.set(id, center);
  }
  private disposeObject(group: THREE.Object3D) {
    group.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m.dispose()); } });
    group.removeFromParent();
  }
  private createItem(item: PlacedItem) {
    let group: THREE.Group, pivot: THREE.Group | undefined;
    if (item.kind === 'bench') {
      group = this.buildBench();
      this.box(group, 0, -.1, 0, 4.3, .08, 3.2, '#ddceaa', .13);
      this.box(group, 0, -.05, 0, 4.05, .08, 2.95, '#e9dec0', .14);
    } else if (item.kind === 'swing') {
      const built = this.buildSwing(); group = built.group; pivot = built.pivot;
      this.box(group, 0, -.1, 0, 4.2, .08, 4.1, '#aec292', .18);
      this.box(group, 0, -.05, 0, 3.95, .08, 3.85, '#d5d3a5', .18);
    } else if (item.kind === 'tree') group = this.tree(0, 0, 1);
    else if (item.kind === 'flower') group = this.flowerBed(0, 0, item.w ?? 2, item.d ?? 1);
    else if (item.kind === 'fence') group = this.fence();
    else { group = new THREE.Group(); group.position.y = .07; this.box(group, 0, 0, 0, .99, .035, .99, '#e5d8b8', .015); }
    group.position.x = item.x; group.position.z = item.z; group.rotation.y = item.turn * Math.PI / 2; group.userData.kind = item.kind;
    return { group, pivot };
  }
  private rebuildFurniture() {
    // A rider must leave its visual parent before that piece of furniture is disposed.
    for (const rig of this.rigs.values()) if (rig.root.parent !== this.root) this.root.attach(rig.root);
    for (const group of [...this.furniture.children]) this.disposeObject(group);
    this.itemGroups.clear(); this.swingPivots.clear();
    for (const id of this.targets.keys()) if (!this.life.avatars.has(id as AvatarId)) this.targets.delete(id);
    this.pickables = this.pickables.filter(g => this.life.avatars.has(g.userData.selection));
    const items = this.editor.active ? this.editor.draft.items : this.life.layout;
    for (const item of items) {
      if (this.editor.active && this.editor.pending?.id === item.id) continue;
      const { group, pivot } = this.createItem(item); this.furniture.add(group); this.itemGroups.set(item.id, group);
      if (pivot) this.swingPivots.set(item.id, pivot);
      this.selectable(group, item.id, new THREE.Vector3(item.x, .2, item.z));
    }
    this.rebuildGhost();
    if (this.editor.active && this.halo) this.highlightEditorSelection();
  }
  private rebuildGhost() {
    if (this.ghost) { this.disposeObject(this.ghost); this.ghost = null; }
    if (!this.editor.pending) return;
    this.ghost = this.createItem(this.editor.pending).group;
    const p = this.editor.pending, asset = CATALOG[p.kind];
    const area = new THREE.Mesh(new THREE.BoxGeometry(p.w ?? asset.w, .025, p.d ?? asset.d), this.material('#8bbb7a'));
    area.position.y = .2 - this.ghost.position.y; this.ghost.add(area);
    this.root.add(this.ghost); this.syncGhost();
  }
  private syncGhost() {
    const pending = this.editor.pending; if (!pending || !this.ghost) return;
    this.ghost.position.x = pending.x; this.ghost.position.z = pending.z; this.ghost.rotation.y = pending.turn * Math.PI / 2;
    const error = this.editor.error;
    this.ghost.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = false; const m = o.material as THREE.MeshStandardMaterial; m.color.set(error ? '#d37d70' : '#8bbb7a'); m.transparent = true; m.opacity = .58; m.depthWrite = false; } });
  }
  private highlightEditorSelection() {
    const item = this.editor.draft.items.find(i => i.id === this.editor.selected);
    this.halo.visible = !!item && !this.editor.pending;
    if (item) { const area = footprint(item); this.halo.position.set(item.x, .21, item.z); this.halo.scale.setScalar(Math.max(area.w, area.d) / 1.25); }
  }
  enterEdit() { if (this.focusedAvatar) this.reset(); this.editor.enter(); for (const rig of this.rigs.values()) rig.root.visible = false; this.halo.visible = false; this.grid.visible = true; this.rebuildFurniture(); }
  restoreLayout(layout: Layout) { this.editor.committed = cloneLayout(layout); this.editor.enter(); return this.applyEdit(); }
  cancelEdit() { this.editor.cancel(); this.rebuildFurniture(); this.grid.visible = this.gridSetting; for (const rig of this.rigs.values()) rig.root.visible = true; this.halo.visible = true; this.select(this.selectedAvatar); }
  applyEdit(): string | null {
    const error = this.editor.apply(); if (error) return error;
    this.life.applyLayout(this.editor.committed.items); this.rebuildFurniture(); this.grid.visible = this.gridSetting;
    for (const rig of this.rigs.values()) rig.root.visible = true; this.halo.visible = true; this.select(this.selectedAvatar); return null;
  }
  beginPlacement(kind: ItemKind) { const error = this.editor.begin(kind); if (!error) this.rebuildFurniture(); return error; }
  moveItem() { if (this.editor.selected) this.editor.move(this.editor.selected); this.rebuildFurniture(); }
  rotateItem() { this.editor.rotate(); this.rebuildFurniture(); }
  placeItem() { const error = this.editor.place(); if (!error) this.rebuildFurniture(); return error; }
  cancelPlacement() { this.editor.cancelPlacement(); this.rebuildFurniture(); }
  storeItem() { const error = this.editor.store(); if (!error) this.rebuildFurniture(); return error; }
  restoreItem(id: string) { this.editor.restore(id); this.rebuildFurniture(); }
  positionItem(x: number, z: number) { this.editor.position(x, z); this.syncGhost(); }
  private buildBench() {
    const b = new THREE.Group(); b.position.y = .18;
    for (const x of [-1.05, 1.05]) {
      this.box(b, x, .42, 0, .13, .78, .68, colors.frame, .035);
      this.box(b, x, .82, -.36, .12, 1.3, .12, colors.frame, .025);
      this.box(b, x * 1.15, .98, .05, .1, .12, .87, '#799080', .03);
    }
    for (let i = 0; i < 4; i++) this.box(b, 0, .73, -.31 + i * .22, 2.75, .13, .19, colors.wood, .045);
    for (let i = 0; i < 3; i++) this.box(b, 0, .99 + i * .23, -.37, 2.75, .18, .11, i === 2 ? '#deb88e' : colors.wood, .04);
    return b;
  }
  private buildSwing() {
    const s = new THREE.Group(); s.position.y = .18;
    for (const x of [-1.34, 1.34]) for (const side of [-1, 1]) this.beam(s, new THREE.Vector3(x, .02, side * .88), new THREE.Vector3(x, 2.8, 0), .085, colors.frame);
    this.beam(s, new THREE.Vector3(-1.5, 2.8, 0), new THREE.Vector3(1.5, 2.8, 0), .105, '#789383');
    for (const x of [-1.34, 1.34]) this.beam(s, new THREE.Vector3(x, .7, -.66), new THREE.Vector3(x, .7, .66), .045, '#9eaf96');
    const pivot = new THREE.Group(); pivot.position.y = 2.76; s.add(pivot);
    for (const x of [-.52, .52]) this.beam(pivot, new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, -2.02, 0), .018, '#ad9673');
    this.box(pivot, 0, -2.04, 0, 1.25, .13, .53, '#c99e70', .07);
    return { group: s, pivot };
  }
  private buildCharacter(id: AvatarId, index: number) {
    if (id === 'character') {
      const rig = createScarlet(), friend = FRIENDS[index];
      rig.root.position.set(friend.start.x,.06,friend.start.z); rig.root.rotation.order='YXZ'; rig.root.rotation.y=Math.PI/4;
      this.root.add(rig.root); this.selectable(rig.root,id,rig.root.position.clone()); this.rigs.set(id,rig); return;
    }
    const c = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group(), rightArm = new THREE.Group(), legs: THREE.Group[] = [];
    const friend = FRIENDS[index]; c.position.set(friend.start.x, .06, friend.start.z); c.rotation.order = 'YXZ'; c.rotation.y = Math.PI / 4; this.root.add(c);
    c.add(torso); torso.position.y = .05;
    // Approximately two heads high: head including hair ~0.95, whole body ~1.9.
    for (const x of [-.18, .18]) {
      const leg = new THREE.Group(); leg.position.set(x, .37, 0); torso.add(leg); legs.push(leg);
      this.box(leg, 0, -.17, 0, .23, .34, .26, colors.skin, .08);
      this.box(leg, 0, -.29, .06, .27, .18, .38, '#74624f', .07);
    }
    this.sphere(torso, 0, .53, 0, .42, friend.color, [.88, 1.03, .68]);
    this.box(torso, 0, .72, .225, .39, .23, .1, colors.shirt, .06);
    for (const x of [-.11, .11]) this.sphere(torso, x, .48, .285, .025, '#ead6a5');
    const leftArm = new THREE.Group(); leftArm.position.set(-.37, .76, 0); leftArm.rotation.z = .12; torso.add(leftArm);
    rightArm.position.set(.37, .76, 0); rightArm.rotation.z = -.12; torso.add(rightArm);
    for (const arm of [leftArm, rightArm]) { this.sphere(arm, 0, -.12, 0, .13, colors.shirt, [1, 1.4, 1]); this.sphere(arm, 0, -.28, .01, .12, colors.skin); }
    head.position.y = 1.26; torso.add(head);
    this.sphere(head, 0, .1, -.035, .5, colors.hair, [1.02, 1.04, .95]);
    this.sphere(head, 0, .015, .09, .43, colors.skin, [1, .95, .92]);
    this.sphere(head, -.26, .36, .2, .29, '#71604e', [1.13, .63, .65]);
    this.sphere(head, .16, .39, .23, .32, '#71604e', [1, .55, .62]);
    this.sphere(head, -.43, -.08, 0, .13, colors.hair, [.7, 1.7, 1]); this.sphere(head, .43, -.08, 0, .13, colors.hair, [.7, 1.7, 1]);
    for (const x of [-.14, .14]) {
      this.sphere(head, x, .045, .463, .032, '#433e36', [.85, 1.4, .5]);
      this.sphere(head, x - .009, .06, .477, .009, '#fff9e8');
      this.sphere(head, x * 1.67, -.055, .426, .052, '#eaa995', [1, .5, .2]);
    }
    const smile = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.045, -.065, .484), new THREE.Vector3(0, -.11, .495), new THREE.Vector3(.045, -.065, .484));
    this.mesh(new THREE.TubeGeometry(smile, 12, .009, 5, false), '#a37360', head, 0, 0, 0);
    for (let j = 0; j < 5; j++) this.sphere(head, .36 + Math.cos(j * Math.PI * .4) * .07, .28 + Math.sin(j * Math.PI * .4) * .07, .33, .062, '#f7e3ad', [1, 1, .45]);
    this.sphere(head, .36, .28, .37, .037, '#d7aa5c');
    this.selectable(c, id, c.position.clone());
    this.rigs.set(id, { root: c, torso, head, rightArm, leftArm, legs });
  }
  private resize() {
    if (this.disposed) return;
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight), aspect = w / h;
    // Fit the diamond's width on narrow canvases and its height on wide canvases.
    const span = Math.max(BASE_SPAN, 26 / aspect);
    Object.assign(this.camera, { left: -span * aspect / 2, right: span * aspect / 2, top: span / 2, bottom: -span / 2, near: .1, far: 150 });
    this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
  }
  private onCameraChange = () => {
    // Bound panning to the garden; translate camera along with target.
    const target = this.controls.target, limit = this.focusedAvatar ? 7.5 : 5, x = THREE.MathUtils.clamp(target.x, -limit, limit), z = THREE.MathUtils.clamp(target.z, -limit, limit);
    this.camera.position.x += x - target.x; this.camera.position.z += z - target.z; target.x = x; target.z = z;
    this.callbacks.zoom(Math.round(this.camera.zoom * 100));
  };
  private onPointerDown = (e: PointerEvent) => { if (e.button === 2 || this.panMode) this.focusedAvatar = null; this.pointerStart = { x: e.clientX, y: e.clientY, button: e.button }; };
  private hit(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const eligible = this.pickables.filter(g => g.visible && (this.editor.active || this.life.avatars.has(g.userData.selection) || ['bench', 'swing'].includes(g.userData.kind)));
    let object: THREE.Object3D | undefined = this.raycaster.intersectObjects(eligible, true)[0]?.object;
    while (object && !object.userData.selection) object = object.parent ?? undefined;
    return object?.userData.selection as Selection | undefined;
  }
  private onPointerUp = (e: PointerEvent) => {
    if (this.panMode || e.button !== 0 || this.pointerStart.button !== 0 || Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 6) return;
    const id = this.hit(e);
    if (this.editor.active) {
      if (this.editor.pending) {
        const target = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.12), target)) { this.editor.position(target.x, target.z); this.syncGhost(); }
      } else this.editor.selected = id && this.itemGroups.has(id) ? id : null;
      this.highlightEditorSelection();
      this.callbacks.notice(this.editor.pending ? this.editor.error ?? '위치를 고정했어요. «여기에 놓기»를 눌러주세요.' : this.editor.selectedName);
      return;
    }
    if (id) {
      this.select(id);
      if (this.life.layout.some(i => i.id === id && ['bench', 'swing'].includes(i.kind))) this.commandUse(id);
    } else {
      const target = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.12), target)) {
        const error = this.life.moveTo(this.selectedAvatar, { x: target.x, z: target.z });
        this.callbacks.notice(error ?? `${this.life.avatars.get(this.selectedAvatar)!.name}에게 이동을 부탁했어요.`);
      }
    }
  };
  private onPointerMove = (e: PointerEvent) => {
    if (e.buttons) return;
    const hit = this.hit(e); this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    if (this.editor.active && this.editor.pending && !this.panMode) {
      const target = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.12), target)) { this.editor.followPointer(target.x, target.z); this.syncGhost(); }
    }
  };
  private onContextLost = (e: Event) => { e.preventDefault(); this.contextLost = true; this.callbacks.error(); };
  private onContextRestored = () => { window.location.reload(); };
  select(id: Selection) {
    this.selection = id;
    if (this.focusedAvatar && this.life.avatars.has(id as AvatarId)) this.focusedAvatar = id as AvatarId;
    if (this.life.avatars.has(id as AvatarId)) this.selectedAvatar = id as AvatarId;
    this.halo.scale.setScalar(this.life.avatars.has(id as AvatarId) ? 1 : 1.85); this.callbacks.select(id);
  }
  commandUse(id: EquipmentId) { const error = this.life.use(this.selectedAvatar, id); const item = this.life.layout.find(i => i.id === id); this.callbacks.notice(error ?? `${this.life.avatars.get(this.selectedAvatar)!.name}가 ${item ? CATALOG[item.kind].name : '기구'}로 가요.`); }
  commandKind(kind: 'bench' | 'swing') {
    const seats = this.life.seats.filter(s => s.kind === kind && !this.life.reservations.has(s.id));
    if (!seats.length) { this.callbacks.notice('이용할 수 있는 빈자리가 없어요.'); return; }
    for (const seat of seats) if (!this.life.use(this.selectedAvatar, seat.equipment)) { this.callbacks.notice('친구가 빈자리로 가요.'); return; }
    this.callbacks.notice('기구까지 갈 수 없거나 먼저 내려와야 해요.');
  }
  leaveSeat() { this.life.leave(this.selectedAvatar); }
  resume() { this.life.resume(this.selectedAvatar); this.callbacks.notice('자유롭게 놀도록 했어요.'); }
  zoomBy(factor: number) { this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom * factor, .65, 5); this.camera.updateProjectionMatrix(); this.controls.update(); this.callbacks.zoom(Math.round(this.camera.zoom * 100)); }
  focusFriend() {
    this.focusedAvatar = this.selectedAvatar;
    this.controls.enableDamping=false; this.controls.update();
    const target=this.rigs.get(this.selectedAvatar)!.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.05,0));
    const offset=new THREE.Vector3(1.8,2.7,6).applyAxisAngle(new THREE.Vector3(0,1,0),this.life.avatars.get(this.selectedAvatar)!.yaw);
    this.controls.target.copy(target); this.camera.position.copy(target).add(offset);
    this.camera.zoom = 5; this.camera.updateProjectionMatrix(); this.controls.update(); this.controls.enableDamping=true; this.callbacks.zoom(500);
  }
  setGrid(show: boolean) { this.gridSetting = show; this.grid.visible = this.editor.active || show; }
  setPanMode(enabled: boolean) { this.panMode = enabled; this.controls.mouseButtons.LEFT = enabled ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; }
  setShadows(show: boolean) { this.sun.castShadow = show; this.renderer.shadowMap.needsUpdate = true; }
  wave() { const error = this.life.wave(this.selectedAvatar); this.callbacks.notice(error ?? '반가워요! 오늘도 좋은 하루 보내요 ♡'); }
  reset() {
    this.focusedAvatar = null;
    this.controls.enableDamping = false; this.controls.update();
    this.controls.target.set(0, .3, 0); this.camera.position.set(25, 25.3, 25); this.camera.zoom = 1;
    this.camera.lookAt(this.controls.target); this.camera.updateProjectionMatrix(); this.controls.update(); this.callbacks.zoom(100);
    this.controls.enableDamping = true;
  }
  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const now = performance.now(), dt = Math.min(.1, (now - this.lastFrame) / 1000); this.lastFrame = now;
    if (this.contextLost || document.hidden) return;
    if (!this.editor.active) {
    this.life.update(dt);
    const t = this.life.time, still = this.reducedMotion.matches;
    const rider = [...this.life.avatars.values()].some(a => a.phase === 'swinging');
    this.swingAmplitude += ((rider ? .28 : .04) - this.swingAmplitude) * (1 - Math.exp(-dt * 4));
    for (const pivot of this.swingPivots.values()) { pivot.rotation.x = still ? 0 : Math.sin(t * 1.8) * this.swingAmplitude; pivot.updateWorldMatrix(true, false); }
    for (const a of this.life.avatars.values()) {
      const rig = this.rigs.get(a.id)!, s = this.life.seatOf(a);
      const pivot = s?.kind === 'swing' ? this.swingPivots.get(s.equipment) : undefined;
      const sitting = s && ['boarding', 'seated', 'swinging', 'leaving'].includes(a.phase) ? a.progress : 0;
      const moving = a.phase === 'walking';
      if (a.phase === 'swinging' && pivot) {
        if (rig.root.parent !== pivot) pivot.add(rig.root);
        rig.root.position.set(0, -2.355, 0); rig.root.rotation.set(0, 0, 0);
      } else {
        if (rig.root.parent !== this.root) this.root.add(rig.root);
        rig.root.position.set(a.x, .06 + sitting * ((s?.height ?? .06) - .44), a.z);
        rig.root.rotation.x = 0;
        if (pivot && sitting && s) {
          const anchor = pivot.localToWorld(new THREE.Vector3(0, -2.355, 0));
          rig.root.position.set(a.x + (anchor.x - s.x) * sitting, .06 + (anchor.y - .06) * sitting, a.z + (anchor.z - s.z) * sitting);
          rig.root.rotation.x = pivot.rotation.x * sitting;
        }
        const turn = Math.atan2(Math.sin(a.yaw - rig.root.rotation.y), Math.cos(a.yaw - rig.root.rotation.y));
        rig.root.rotation.y += turn * (1 - Math.exp(-dt * 10));
      }
      if(rig.animate){rig.animate(a.phase,dt,sitting,still);continue;}
      rig.torso.position.y = .05 + (still || sitting ? 0 : Math.sin(t * (moving ? 15 : 2.1)) * (moving ? .035 : .02));
      rig.head.rotation.z = still ? 0 : Math.sin(t * .8) * .025;
      rig.legs.forEach((leg, i) => { leg.rotation.x = sitting ? -Math.PI / 2 * sitting : moving ? Math.sin(t * 11 + i * Math.PI) * .46 : 0; });
      rig.rightArm.rotation.set(moving ? Math.sin(t * 11) * .38 : sitting ? -1 : 0, 0, -.12);
      rig.leftArm.rotation.set(moving ? -Math.sin(t * 11) * .38 : sitting ? -1 : 0, 0, .12);
      if (a.phase === 'swinging') { rig.rightArm.rotation.set(0, 0, 2.65); rig.leftArm.rotation.set(0, 0, -2.65); }
      if (a.phase === 'waving') rig.rightArm.rotation.set(-.25, 0, -2.5 + (still ? 0 : Math.sin(t * 12) * .2));
    }
    if (this.life.avatars.has(this.selection as AvatarId)) {
      const a = this.life.avatars.get(this.selection as AvatarId)!; this.halo.position.set(a.x, .2, a.z);
    } else { const p = this.targets.get(this.selection); if (p) this.halo.position.set(p.x, .205, p.z); }
    this.halo.material instanceof THREE.Material && (this.halo.material.opacity = still ? .85 : .65 + Math.sin(t * 2) * .12);
    }
    if (this.focusedAvatar && !this.editor.active) {
      const rig=this.rigs.get(this.focusedAvatar)!, position=rig.root.getWorldPosition(new THREE.Vector3());
      const target=position.clone().add(new THREE.Vector3(0,1.05,0));
      const yaw=this.life.avatars.get(this.focusedAvatar)!.yaw;
      const offset=new THREE.Vector3(1.8,2.7,6).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
      this.controls.target.lerp(target,1-Math.exp(-dt*8)); this.camera.position.lerp(target.clone().add(offset),1-Math.exp(-dt*8));
    }
    this.controls.update(); this.renderer.render(this.scene, this.camera);
  };
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.resizeObserver.disconnect(); this.controls.dispose();
    this.host.removeEventListener('pointerdown', this.onPointerDown); this.host.removeEventListener('pointerup', this.onPointerUp); this.host.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost); this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.Sprite) { if(!(o instanceof THREE.Sprite))o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => { const tex = (m as THREE.MeshBasicMaterial).map; tex?.dispose(); m.dispose(); }); } });
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}


