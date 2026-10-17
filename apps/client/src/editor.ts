import { CATALOG, DEFAULT_LAYOUT, HUB, cloneLayout, geometryError, worldFrom, type Layout, type PlacedItem, type ItemKind } from './layout';
import { findPath, walkable } from './simulation';
export function layoutError(items: PlacedItem[]): string | null {
  const error = geometryError(items); if (error) return error;
  const nav = worldFrom(items);
  if (!walkable(HUB, nav)) return '친구들이 모이는 중앙 통로를 비워주세요.';
  for (const seat of nav.seats) if (!findPath(HUB, seat.approach, nav)) return '기구 앞의 접근·하차 공간과 중앙에서 이어지는 길을 확보해주세요.';
  return null;
}
export class LayoutEditor {
  committed: Layout = cloneLayout(DEFAULT_LAYOUT);
  draft: Layout = cloneLayout(DEFAULT_LAYOUT);
  active = false;
  selected: string | null = null;
  pending: PlacedItem | null = null;
  positionLocked = false;
  private source: 'new' | 'move' | 'stored' = 'new';
  private sequence = 1;
  private validationKey = '';
  private validationResult: string | null = null;
  enter() { this.draft = cloneLayout(this.committed); this.selected = null; this.pending = null; this.active = true; }
  cancel() { this.draft = cloneLayout(this.committed); this.pending = null; this.selected = null; this.active = false; }
  begin(kind: ItemKind): string | null {
    if (this.draft.items.length + this.draft.stored.length >= 160) return '기구와 장식은 보관함을 포함해 최대 160개까지 만들 수 있어요.';
    let id: string; do { id = `placed-${this.sequence++}`; } while ([...this.draft.items, ...this.draft.stored].some(i => i.id === id));
    this.source = 'new'; this.pending = { id, kind, x: 0, z: 4.5, turn: 0 }; this.positionLocked = false; this.selected = null; return null;
  }
  move(id: string) { const item = this.draft.items.find(i => i.id === id); if (!item) return; this.pending = { ...item }; this.positionLocked = false; this.source = 'move'; this.selected = id; }
  restore(id: string) { const item = this.draft.stored.find(i => i.id === id); if (!item) return; this.pending = { ...item }; this.positionLocked = false; this.source = 'stored'; this.selected = null; }
  position(x: number, z: number, lock = true) { if (this.pending) { this.pending.x = Math.round(x * 2) / 2; this.pending.z = Math.round(z * 2) / 2; this.positionLocked = lock; } }
  followPointer(x: number, z: number) { if (!this.positionLocked) this.position(x, z, false); }
  rotate() { if (!this.pending && this.selected) this.move(this.selected); if (this.pending) this.pending.turn = (this.pending.turn + 1) % 4; }
  candidates() { return this.pending ? [...this.draft.items.filter(i => i.id !== this.pending!.id), this.pending] : this.draft.items; }
  get error() { const items = this.candidates(), key = JSON.stringify(items); if (key !== this.validationKey) { this.validationKey = key; this.validationResult = layoutError(items); } return this.validationResult; }
  place(): string | null {
    if (!this.pending) return '먼저 놓을 기구나 장식을 선택해주세요.';
    const error = this.error; if (error) return error;
    const item = { ...this.pending }; this.draft.items = this.candidates().map(i => ({ ...i }));
    if (this.source === 'stored') this.draft.stored = this.draft.stored.filter(i => i.id !== item.id);
    this.pending = null; this.selected = item.id; return null;
  }
  cancelPlacement() { this.pending = null; }
  store(): string | null {
    const id = this.pending && this.source === 'move' ? this.pending.id : this.selected;
    const item = this.draft.items.find(i => i.id === id); if (!item) return '보관할 기구를 먼저 선택해주세요.';
    const items = this.draft.items.filter(i => i.id !== id), error = layoutError(items); if (error) return error;
    this.draft.items = items; this.draft.stored.push({ ...item }); this.selected = null; this.pending = null; return null;
  }
  apply(): string | null {
    if (this.pending) return '배치 중인 기구를 놓거나 배치를 취소해주세요.';
    const error = layoutError(this.draft.items); if (error) return error;
    this.committed = cloneLayout(this.draft); this.active = false; this.selected = null; return null;
  }
  get selectedItem() { return this.pending ?? this.draft.items.find(i => i.id === this.selected); }
  get selectedName() { return this.selectedItem ? CATALOG[this.selectedItem.kind].name : '기구나 장식을 선택하세요'; }
}
