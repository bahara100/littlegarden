/**
 * Songs for the little player above the map. Add a song by putting its file under public/music/ and one entry
 * here; `src` is relative to the page (e.g. 'music/afternoon.mp3'). Name files with English letters, numbers, - _ .
 * only: the build keeps a public file when its exact path appears in the code.
 * Themes are composed locally and rendered with FluidSynth; editable scores live in docs/audio/.
 */
export interface Track { id: string; title: string; artist?: string; src: string }
export const TRACKS: readonly Track[] = [
  { id: 'sunlit-park', title: '햇살이 쉬어가는 공원', src: 'music/sunlit-park.mp3' },
  { id: 'sweet-park-walk', title: '너와 나란히, 공원 산책', src: 'music/sweet-park-walk.mp3' },
  { id: 'family-picnic', title: '웃음꽃 피는 나들이', src: 'music/family-picnic.mp3' },
];

/** The song after `current` in the list, wrapping round; the first song when nothing is playing. */
export function nextTrack(tracks: readonly Track[], current: string | null): Track | null {
  if (!tracks.length) return null;
  const i = tracks.findIndex(t => t.id === current);
  return tracks[(i + 1) % tracks.length];
}
/** What the scrolling title shows. */
export function trackLabel(track: Track | null, playing: boolean, tracks: readonly Track[]): string {
  if (!tracks.length) return '♪ 노래 준비 중 · 곧 놀이터에 노래가 흘러요';
  if (!track) return '♪ 눌러서 노래를 골라 보세요';
  return `${playing ? '♪' : '❚❚'} ${track.title}${track.artist ? ` — ${track.artist}` : ''}`;
}
