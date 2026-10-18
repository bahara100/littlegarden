/**
 * Songs for the little player above the map. Add a song by putting its file under public/music/ and one entry
 * here; `src` is relative to the page (e.g. 'music/afternoon.mp3'). Name files with English letters, numbers, - _ .
 * only: the build keeps a public file when its exact path appears in the code. The list starts empty: the player
 * shows that songs are on their way and plays nothing.
 */
export interface Track { id: string; title: string; artist?: string; src: string }
export const TRACKS: readonly Track[] = [];

/** The song after `current` in the list, wrapping round; the first song when nothing is playing. */
export function nextTrack(tracks: readonly Track[], current: string | null): Track | null {
  if (!tracks.length) return null;
  const i = tracks.findIndex(t => t.id === current);
  return tracks[(i + 1) % tracks.length];
}
/** What the scrolling title shows. */
export function trackLabel(track: Track | null, playing: boolean, tracks: readonly Track[]): string {
  if (!tracks.length) return '♪ 노래 준비 중 · 곧 놀이터에 노래가 흘러요';
  if (!track) return '♪ 목록에서 노래를 골라 보세요';
  return `${playing ? '♪' : '❚❚'} ${track.title}${track.artist ? ` — ${track.artist}` : ''}`;
}
