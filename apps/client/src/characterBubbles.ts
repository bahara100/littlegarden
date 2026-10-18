import { reactionLabel, speaking, type Avatar } from './simulation';

/** Presentation only: keep unlock content, timing and existing reactions in the simulation. */
export function bubbleContent(a: Avatar, time: number, seat?: 'bench' | 'swing') {
  const value = reactionLabel(a, time) || (seat ? seat === 'swing' ? '♪' : '···' : '');
  return { value, kind: speaking(a, time) ? 'speech' : 'emote' } as const;
}

/** Shared screen-space overlay: text stays readable at every map zoom in either renderer. */
export class CharacterBubbles {
  private layer = document.createElement('div');
  private views = new Map<string, HTMLDivElement>();
  private width = 0;
  private height = 0;

  constructor(host: HTMLElement) {
    this.layer.className = 'character-bubbles';
    host.append(this.layer);
  }

  begin(width: number, height: number, hidden: boolean) {
    this.width = width; this.height = height; this.layer.hidden = hidden;
  }

  update(a: Avatar, time: number, x: number, headY: number, seat?: 'bench' | 'swing') {
    let view = this.views.get(a.id);
    if (!view) {
      view = document.createElement('div');
      view.className = 'character-bubble'; view.dataset.friend = a.id;
      this.layer.append(view); this.views.set(a.id, view);
    }
    const { value, kind } = bubbleContent(a, time, seat);
    // Hide off-screen speakers rather than pinning their bubbles to the map edge.
    view.hidden = !value || x < 0 || x > this.width || headY < 18 || headY > this.height;
    if (view.hidden) return;
    if (view.textContent !== value) {
      view.textContent = value; view.setAttribute('aria-label', `${a.name}: ${value}`);
    }
    view.dataset.kind = kind;
    const half = view.offsetWidth / 2;
    const center = Math.max(half + 8, Math.min(this.width - half - 8, x));
    view.style.left = `${Math.round(center)}px`;
    view.style.top = `${Math.round(headY - 9)}px`;
    view.style.setProperty('--tail-offset', `${Math.max(-half + 12, Math.min(half - 12, x - center))}px`);
  }

  dispose() { this.layer.remove(); this.views.clear(); }
}
