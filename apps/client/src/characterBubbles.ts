import { reactionLabel, speaking, type Avatar } from './simulation';

/** Presentation only: keep unlock content, timing and existing reactions in the simulation. */
export function bubbleContent(a: Avatar, time: number, seat?: 'bench' | 'swing') {
  const value = reactionLabel(a, time) || (seat ? seat === 'swing' ? '♪' : '···' : '');
  return { value, kind: speaking(a, time) ? 'speech' : 'emote' } as const;
}

/** Emotions drawn as pixel icons (tools/art/make-emote-icons.py); any other emotion shows as text. */
export const EMOTE_ICONS: Readonly<Record<string, string>> = { '♡': 'heart', '♪': 'note', '👋': 'wave', '!': 'exclaim', '···': 'dots' };
/** Screen pixels per tile at which an emotion icon shows at 1x; one more step per this many pixels. */
export const EMOTE_TILE = 24;
export function emoteScale(tile: number) { return Math.max(1, Math.min(3, Math.round(tile / EMOTE_TILE))); }
const iconUrl = (name: string) => `${import.meta.env.BASE_URL}sprites/ui/emotes/${name}.png`;

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

  /**
   * `tile` is how many screen pixels one floor tile spans right now. Emotion icons grow with the map in whole steps
   * (16 px art at 1x, 2x, 3x) so they stay sharp and in proportion to the friends; lines keep their readable size.
   */
  begin(width: number, height: number, hidden: boolean, tile = EMOTE_TILE) {
    this.width = width; this.height = height; this.layer.hidden = hidden;
    const scale = emoteScale(tile);
    if (this.layer.style.getPropertyValue('--emote-scale') !== String(scale)) this.layer.style.setProperty('--emote-scale', String(scale));
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
    const icon = kind === 'emote' ? EMOTE_ICONS[value] : undefined;
    if (view.dataset.value !== value) {
      view.dataset.value = value; view.setAttribute('aria-label', `${a.name}: ${value}`);
      if (icon) {
        const img = document.createElement('img');
        img.className = 'emote-icon'; img.src = iconUrl(icon); img.alt = value; img.draggable = false;
        view.replaceChildren(img);
      } else view.textContent = value;
      if (icon) view.dataset.emote = icon; else delete view.dataset.emote;
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
