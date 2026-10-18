import { MAX_ITEMS, CATALOG, DEFAULT_LAYOUT, HUB, cloneLayout, geometryError, snapToTiles, worldFrom, type Layout, type PlacedItem, type ItemKind } from './layout';
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
  /** Drafts before each placement or storing, for undo; redo holds what undo took back. Cleared when editing ends. */
  private undoStack: Layout[] = [];
  private redoStack: Layout[] = [];
  static readonly HISTORY = 50;
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
  private remember() {
    this.undoStack.push(cloneLayout(this.draft));
    if (this.undoStack.length > LayoutEditor.HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }
  /** Back one placement or storing (an unplaced preview is dropped first and counts as no step). */
  undo() {
    if (this.pending) { this.pending = null; return true; }
    const previous = this.undoStack.pop(); if (!previous) return false;
    this.redoStack.push(cloneLayout(this.draft)); this.draft = previous; this.selected = null; return true;
  }
  redo() {
    const next = this.redoStack.pop(); if (!next) return false;
    this.undoStack.push(cloneLayout(this.draft)); this.draft = next; this.pending = null; this.selected = null; return true;
  }
  private forget() { this.undoStack = []; this.redoStack = []; }
  enter() { this.draft = cloneLayout(this.committed); this.selected = null; this.pending = null; this.active = true; this.forget(); }
  cancel() { this.draft = cloneLayout(this.committed); this.pending = null; this.selected = null; this.active = false; this.forget(); }
  begin(kind: ItemKind): string | null {
    if (this.draft.items.length + this.draft.stored.length >= MAX_ITEMS) return `기구와 장식은 보관함을 포함해 최대 ${MAX_ITEMS}개까지 만들 수 있어요.`;
    let id: string; do { id = `placed-${this.sequence++}`; } while ([...this.draft.items, ...this.draft.stored].some(i => i.id === id));
    this.source = 'new'; this.pending = snapToTiles({ id, kind, x: 0, z: 4.5, turn: 0 }); this.positionLocked = false; this.selected = null; return null;
  }
  move(id: string) { const item = this.draft.items.find(i => i.id === id); if (!item) return; this.pending = { ...item }; this.positionLocked = false; this.source = 'move'; this.selected = id; }
  restore(id: string) { const item = this.draft.stored.find(i => i.id === id); if (!item) return; this.pending = { ...item }; this.positionLocked = false; this.source = 'stored'; this.selected = null; }
  /** Positions snap so the footprint covers whole floor tiles. */
  position(x: number, z: number, lock = true) { if (this.pending) { this.pending = snapToTiles({ ...this.pending, x, z }); this.positionLocked = lock; } }
  followPointer(x: number, z: number) { if (!this.positionLocked) this.position(x, z, false); }
  rotate() { if (!this.pending && this.selected) this.move(this.selected); if (this.pending) this.pending = snapToTiles({ ...this.pending, turn: (this.pending.turn + 1) % 4 }); }
  candidates() { return this.pending ? [...this.draft.items.filter(i => i.id !== this.pending!.id), this.pending] : this.draft.items; }
  get error() { const items = this.candidates(), key = JSON.stringify(items); if (key !== this.validationKey) { this.validationKey = key; this.validationResult = layoutError(items); } return this.validationResult; }
  place(): string | null {
    if (!this.pending) return '먼저 놓을 기구나 장식을 선택해주세요.';
    const error = this.error; if (error) return error;
    this.remember();
    const item = { ...this.pending }; this.draft.items = this.candidates().map(i => ({ ...i }));
    if (this.source === 'stored') this.draft.stored = this.draft.stored.filter(i => i.id !== item.id);
    this.pending = null; this.selected = item.id; return null;
  }
  cancelPlacement() { this.pending = null; }
  store(): string | null {
    const id = this.pending && this.source === 'move' ? this.pending.id : this.selected;
    const item = this.draft.items.find(i => i.id === id); if (!item) return '보관할 기구를 먼저 선택해주세요.';
    const items = this.draft.items.filter(i => i.id !== id), error = layoutError(items); if (error) return error;
    this.remember();
    this.draft.items = items; this.draft.stored.push({ ...item }); this.selected = null; this.pending = null; return null;
  }
  apply(): string | null {
    if (this.pending) return '배치 중인 기구를 놓거나 배치를 취소해주세요.';
    const error = layoutError(this.draft.items); if (error) return error;
    this.committed = cloneLayout(this.draft); this.active = false; this.selected = null; this.forget(); return null;
  }
  get selectedItem() { return this.pending ?? this.draft.items.find(i => i.id === this.selected); }
  get selectedName() { return this.selectedItem ? CATALOG[this.selectedItem.kind].name : '기구나 장식을 선택하세요'; }
}
