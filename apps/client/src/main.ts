import './style.css';
import './garden-ui.css';
import { PixelGarden, type Selection } from './pixelGarden';
import type { PhaserGarden } from './phaserGarden';
import { FRIENDS, activityLabel, clockLabel, dayPart, type AvatarId, type DayPart } from './simulation';
import { CATALOG, DEFAULT_LAYOUT, type Layout, type ItemKind } from './layout';
import { loadGarden, saveGarden, encodeSave, decodeGarden, loadSettings, saveSettings, MAX_SAVE_BYTES, type GardenSave } from './persistence';
import { affinityLevel, nextUnlock, todayKey, unlockedFor } from './affinity';
import { SCARLET_SD } from './scarletApproved';
import { REGIONS, region, type RegionId } from './regions';
import { SEASONS, season, seasonGround, type SeasonId } from './seasons';
import { TRACKS, nextTrack, trackLabel, type Track } from './music';
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function setText(id: string, value: string) { const node = el(id); if (node.textContent !== value) node.textContent = value; }
// Phaser is the default renderer; ?renderer=canvas keeps the Canvas renderer.
const params = new URLSearchParams(location.search);
const usePhaser = params.get('renderer') !== 'canvas';
let garden: PixelGarden | PhaserGarden | undefined, selected: Selection = 'character';
let toastUntil = 0, panelKey = '';
let inventoryKey = '';
// View settings remembered in this browser. Changes reported before the garden has applied them are its start-up defaults and are ignored.
const settings = loadSettings(window.localStorage);
let settingsReady = false;
function remember(change: Partial<typeof settings>) { if (settingsReady) { Object.assign(settings, change); saveSettings(window.localStorage, settings); } }
/** Song settings only ever change by the player's hand (or the song itself), so they are kept even before the garden is ready. */
function rememberMusic(change: Partial<typeof settings>) { Object.assign(settings, change); saveSettings(window.localStorage, settings); }
// Each region keeps its own layout (persistence.ts). The garden shows the current region's; the others wait here.
let currentRegion: RegionId = settings.region, regionLayouts: GardenSave['regions'] = {};
/** The stored save could not be read: automatic saves leave it alone until the player applies, loads or resets on purpose. */
let saveUnreadable = false;
/** Short messages (a move was asked for, no path, a pat…) are not shown on screen; screen readers announce them. */
function notice(message: string) { setText('announcer', message); toastUntil = performance.now() + 3500; }
function details(rows: [string, string][]) {
  const key = JSON.stringify(rows); if (key === panelKey) return; panelKey = key;
  el('selection-details').replaceChildren(...rows.map(([label, value]) => { const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; row.append(dt, dd); return row; }));
}
function refresh() {
  if (!garden) return;
  // Unlocked lines also show as a notice, so a long one can be read in full.
  for (const { id, text } of garden.life.drainSpoken()) notice(`${garden.life.avatars.get(id)!.name}: "${text}"`);
  const editing = garden.editor.active;
  el<HTMLButtonElement>('import-save').disabled = editing;
  el<HTMLButtonElement>('reset-layout').disabled = editing;
  document.querySelector('.workspace')!.classList.toggle('is-editing', editing);
  el('editor-panel').hidden = !editing;
  setText('edit-mode', editing ? '꾸미기 취소' : '✿ 놀이터 꾸미기');
  setText('mode-label', editing ? '꾸미기 모드' : '생활 모드');
  setText('mode-note', editing ? '친구들은 잠시 쉬는 중' : '친구들의 하루');
  setText('equipment-count', String(garden.life.layout.filter(i => ['bench', 'swing'].includes(i.kind)).length));
  showDay(garden.life.dayFraction(), garden.life.dayCycle);
  if (editing) { refreshEditor(); return; }
  const life = garden.life, active = life.avatars.get(garden.selectedAvatar)!;
  FRIENDS.forEach(f => {
    const a = life.avatars.get(f.id)!;
    setText(`status-${f.id}`, activityLabel(a));
    el(`friend-${f.id}`).setAttribute('aria-pressed', String(garden!.selectedAvatar === f.id));
  });
  setText('command-target', `지시할 친구 · ${active.name}`);
  const friend = life.avatars.get(selected as AvatarId), using = ['boarding', 'seated', 'swinging', 'leaving'].includes(active.phase);
  el('friend-actions').hidden = !friend; el('equipment-actions').hidden = !!friend;
  el<HTMLButtonElement>('wave').disabled = using;
  el<HTMLButtonElement>('leave-seat').disabled = !using;
  for (const equipment of ['bench', 'swing'] as const) {
    const slots = life.seats.filter(s => s.kind === equipment), free = slots.filter(s => !life.reservations.has(s.id)).length;
    el<HTMLButtonElement>(`request-${equipment}`).disabled = using || !free;
    setText(`request-${equipment}`, `${equipment === 'bench' ? '벤치' : '그네'} 이용 · ${free}자리`);
  }
  if (friend) {
    el('model-review').hidden = false;
    setText('model-review', friend.id === 'character' ? '홍련 외형·동작 살펴보기 ↗' : '모모·루루 걷기 비교하기 ↗');
    setText('selection-kind', 'CHARACTER'); setText('selection-icon', '☺'); setText('selection-title', friend.name);
    el('selection-icon').dataset.friend = friend.id;
    setText('selection-subtitle', '우리 정원의 작은 친구');
    setText('selection-description', '자유롭게 산책하고 빈 기구를 찾아 쉬어요. 바닥이나 기구를 눌러 이 친구에게 부탁할 수도 있어요.');
    if (friend.id === 'character') {
      setText('selection-subtitle', '오늘도 정원에서 함께 쉬어요');
      setText('selection-description', '바닥을 누르면 그곳으로 걸어가요. 벤치에서 쉬거나, 가까이 다가가 작은 인사를 건네보세요.');
      el<HTMLAnchorElement>('model-review').href = `${import.meta.env.BASE_URL}${SCARLET_SD.review}`;
    } else {
      el<HTMLAnchorElement>('model-review').href = `${import.meta.env.BASE_URL}friends-base-walk-v1/index.html`;
    }
    const points = life.affinity[friend.id], today = life.petted[friend.id] === todayKey();
    details([['지금은', activityLabel(friend)], ['행동', friend.directed ? '부탁한 일 하는 중' : '자유롭게 생활 중'], ['친밀도', `♥ ${points} · ${affinityLevel(points).level.name}`], ['오늘 쓰다듬기', today ? '했어요 ♡' : '아직이에요'], ['해금', unlockSummary(life.unlocks, friend.id, points)]]);
    setText('selection-note', '부탁한 일을 마치면 다시 자유롭게 놀아요.');
  } else {
    el('selection-icon').removeAttribute('data-friend');
    const equipment = life.layout.find(i => i.id === selected)?.kind === 'bench' ? 'bench' : 'swing', slots = life.seats.filter(s => s.equipment === selected);
    setText('selection-kind', 'FURNITURE'); setText('selection-icon', equipment === 'bench' ? '▤' : '⋂');
    setText('selection-title', equipment === 'bench' ? '햇살 나무 벤치' : '산들바람 그네');
    setText('selection-subtitle', equipment === 'bench' ? 'GARDEN BENCH / 02 SEATS' : 'GARDEN SWING / 01 SEAT');
    setText('selection-description', equipment === 'bench' ? '두 친구가 나란히 쉬는 벤치예요. 친구가 자리를 예약하고 찾아와 잠깐 쉬어갑니다.' : '바람을 타는 작은 그네예요. 한 친구씩 올라타고, 시간이 지나면 안전하게 내려옵니다.');
    details(slots.map((s, i) => { const id = life.reservations.get(s.id), a = id && life.avatars.get(id); return [`자리 ${i + 1}`, a ? `${a.name} · ${a.phase === 'walking' ? '오는 중' : a.phase === 'leaving' ? '내려오는 중' : '이용 중'}` : '비어 있어요']; }));
    el<HTMLButtonElement>('use-equipment').disabled = using || slots.every(s => life.reservations.has(s.id) && life.reservations.get(s.id) !== active.id);
    setText('use-equipment', `${active.name}에게 이용 부탁하기`);
    setText('selection-note', '친구 목록에서 지시할 대상을 바꿀 수 있어요.');
  }
  if (performance.now() > toastUntil) setText('announcer', '');
}
const UNLOCK_KIND = { line: '대사', emote: '감정', action: '행동' } as const;
/** Unlocked lines, emotions and actions for a friend, and how many points the next one needs. */
function unlockSummary(list: Parameters<typeof unlockedFor>[0], id: AvatarId, points: number) {
  const have = unlockedFor(list, id, points), next = nextUnlock(list, id, points);
  const counts = (Object.keys(UNLOCK_KIND) as (keyof typeof UNLOCK_KIND)[]).map(k => [k, have.filter(u => u.kind === k).length] as const).filter(([, n]) => n);
  const now = counts.length ? counts.map(([k, n]) => `${UNLOCK_KIND[k]} ${n}`).join(' · ') : '아직 없어요';
  return next ? `${now} (다음: ♥ ${next.at} ${UNLOCK_KIND[next.kind]})` : now;
}
function showSelection(id: Selection) { selected = id; if (garden?.life.avatars.has(id as AvatarId)) remember({ selected: id as AvatarId }); refresh(); }
const DAY_TEXT: Record<DayPart, [string, string]> = { morning: ['☀', '맑은 아침'], afternoon: ['☀', '포근한 오후'], evening: ['☼', '노을 지는 저녁'], night: ['☾', '고요한 밤'] };
/** Colour laid over the scene through the day (multiplied, so white light leaves the pixels as drawn). */
const DAY_TINT: [number, [number, number, number, number]][] = [
  [0, [62, 72, 142, .42]], [4.5, [62, 72, 142, .42]], [6.5, [255, 196, 170, .16]], [8.5, [255, 255, 255, 0]], [16, [255, 255, 255, 0]],
  [18, [255, 158, 96, .22]], [19.5, [150, 108, 172, .3]], [21, [62, 72, 142, .42]], [24, [62, 72, 142, .42]],
];
let tintKey = '';
function showDay(fraction: number, cycle: boolean) {
  const [icon, label] = DAY_TEXT[dayPart(fraction)];
  setText('day-icon', icon); setText('day-label', label); setText('day-clock', cycle ? clockLabel(fraction) : '시간이 멈춰 있어요');
  const h = fraction * 24, i = DAY_TINT.findIndex(([at]) => at > h), [h0, c0] = DAY_TINT[i - 1], [h1, c1] = DAY_TINT[i], t = (h - h0) / (h1 - h0);
  const c = c0.map((v, k) => v + (c1[k] - v) * t), key = c.map(v => v.toFixed(3)).join();
  if (key !== tintKey) { tintKey = key; el('day-tint').style.background = `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`; }
}
function pet(id: AvatarId) {
  if (!garden || garden.editor.active) return;
  const result = garden.life.pet(id, todayKey()); if (!result) return;
  const a = garden.life.avatars.get(id)!, who = `${a.name}${batchim(a.name) ? '이' : '가'}`;
  if (result.gained) persist(true);
  const message = result.levelUp ? `${who} 기분 좋아해요 ♡ 이제 '${result.levelUp.name}'${batchim(result.levelUp.name) ? '이에요' : '예요'}! 친밀도 ${garden.life.affinity[id]}`
    : result.gained ? `${who} 기분 좋아해요 ♡ 친밀도 ${garden.life.affinity[id]}` : `${who} 기분 좋아해요 ♡ 오늘 친밀도는 이미 올랐어요. 내일 또 쓰다듬어 주세요.`;
  // A line unlocked for the pat goes first, in the same notice.
  const said = garden.life.drainSpoken().filter(s => s.id === id).at(-1);
  notice(said ? `${a.name}: "${said.text}" · ${message}` : message);
  refresh();
}
function refreshEditor() {
  if (!garden) return;
  const editor = garden.editor, item = editor.selectedItem, pending = !!editor.pending, error = pending ? editor.error : null;
  setText('editor-selection', editor.selectedName);
  setText('editor-feedback', pending ? error ?? (editor.positionLocked ? '위치를 고정했어요. «여기에 놓기»로 확정하세요. 다른 곳을 클릭하면 위치를 바꿀 수 있어요.' : '놓을 수 있어요. 바닥을 클릭해 위치 고정 후 «여기에 놓기»로 확정하세요.') : item ? '이동·회전하거나 보관함에 넣을 수 있어요.' : '목록에서 고르거나 놀이터의 기구를 눌러보세요.');
  el('editor-feedback').classList.toggle('invalid', !!error);
  el('editor-position').hidden = !pending;
  for (const axis of ['x', 'z'] as const) { const input = el<HTMLInputElement>(`item-${axis}`); if (document.activeElement !== input) input.value = String(item?.[axis] ?? 0); }
  setText('item-angle', `${(item?.turn ?? 0) * 90}°`);
  el<HTMLButtonElement>('item-place').disabled = !pending || !!error;
  el<HTMLButtonElement>('item-move').disabled = pending || !editor.selected;
  el<HTMLButtonElement>('item-rotate').disabled = !item;
  el<HTMLButtonElement>('item-store').disabled = !editor.selected;
  el<HTMLButtonElement>('item-cancel').disabled = !pending;
  el<HTMLButtonElement>('editor-apply').disabled = pending;
  el<HTMLButtonElement>('edit-undo').disabled = !pending && !editor.canUndo;
  el<HTMLButtonElement>('edit-redo').disabled = !editor.canRedo;
  setText('draft-count', `${editor.draft.items.length}개 배치 · ${editor.draft.stored.length}개 보관`);
  const key = JSON.stringify(editor.draft.stored.map(i => [i.id, i.kind]));
  if (key !== inventoryKey) {
    inventoryKey = key;
    const buttons = editor.draft.stored.map((i, n) => { const button = document.createElement('button'); button.textContent = `${CATALOG[i.kind].icon} ${CATALOG[i.kind].name} ${n + 1} · 다시 놓기`; button.onclick = () => { garden?.restoreItem(i.id); refresh(); }; return button; });
    el('stored-items').replaceChildren(...buttons); el('stored-empty').hidden = buttons.length > 0;
  }
  if (performance.now() > toastUntil) setText('announcer', '');
}
el('help').onclick = () => el<HTMLDialogElement>('help-dialog').showModal();
el('close-help').onclick = () => el<HTMLDialogElement>('help-dialog').close();
el('retry').onclick = () => location.reload();
try {
  const callbacks = { select: showSelection, notice, pet, zoom: (percent: number) => { el('viewport').dataset.zoom = String(percent); if (!garden?.focus) remember({ zoom: percent / 100 }); /* a friend close-up is not the player's zoom */ }, error: () => { el('render-error').hidden = false; } };
  // Phaser (about 1.2 MB) is its own chunk, loaded after the page and its controls are up; ?renderer=canvas never loads it.
  const created = usePhaser ? import('./phaserGarden').then(m => new m.PhaserGarden(el('game'), callbacks)) : Promise.resolve(new PixelGarden(el('game'), callbacks));
  created.then(created => {
    garden = created;
    try {
      const saved = loadGarden(window.localStorage);
      if (saved) {
        regionLayouts = saved.regions; Object.assign(garden.life.affinity, saved.affinity); Object.assign(garden.life.petted, saved.petted); garden.life.setClock(saved.clock);
        setText('save-status', '저장된 놀이터를 복원했어요.');
      }
      // A region never saved yet keeps the fresh start (friends head for their first seats).
      const start = regionLayouts[currentRegion]; if (start) garden.restoreLayout(start);
    } catch { saveUnreadable = true; setText('save-status', '저장 데이터를 읽지 못했어요. 원본은 유지했으며 기본 놀이터를 열었어요. 백업 파일을 불러오거나 새 배치를 적용해주세요.'); }
    // Remembered view settings.
    el<HTMLInputElement>('grid-toggle').checked = settings.grid; garden.setGrid(settings.grid);
    el<HTMLInputElement>('day-toggle').checked = settings.dayCycle; garden.life.dayCycle = settings.dayCycle;
    el<HTMLInputElement>('fps-toggle').checked = settings.fps; showFps(settings.fps);
    showRegion(settings.region); showSeason(settings.season);
    garden.zoomBy(settings.zoom / garden.zoom); garden.select(settings.selected);
    settingsReady = true;
    el('loading').hidden = true; refresh();
  }, () => { el('render-error').hidden = false; });
  FRIENDS.forEach(f => { el(`friend-${f.id}`).onclick = () => { garden?.select(f.id); refresh(); }; });
  el<HTMLInputElement>('grid-toggle').onchange = e => { const on = (e.target as HTMLInputElement).checked; garden?.setGrid(on); remember({ grid: on }); };
  el<HTMLInputElement>('day-toggle').onchange = e => { const on = (e.target as HTMLInputElement).checked; if (garden) garden.life.dayCycle = on; remember({ dayCycle: on }); refresh(); };
  el<HTMLInputElement>('fps-toggle').onchange = e => { const on = (e.target as HTMLInputElement).checked; showFps(on); remember({ fps: on }); };
  el('pet').onclick = () => { if (garden) pet(garden.selectedAvatar); };
  el('edit-undo').onclick = () => { if (garden?.editor.undo()) notice('한 단계 되돌렸어요.'); refresh(); };
  el('edit-redo').onclick = () => { if (garden?.editor.redo()) notice('다시 했어요.'); refresh(); };
  el('wave').onclick = () => garden?.wave();
  el('focus-friend').onclick = () => { garden?.focusFriend(); notice('친구를 가까이 살펴봐요. 화면을 끌면 따라보기가 풀려요.'); };
  el('resume').onclick = () => garden?.resume();
  el('leave-seat').onclick = () => garden?.leaveSeat();
  el('request-bench').onclick = () => garden?.commandKind('bench');
  el('request-swing').onclick = () => garden?.commandKind('swing');
  el('use-equipment').onclick = () => garden?.commandUse(selected);
  el('edit-mode').onclick = () => {
    if (!garden) return;
    if (garden.editor.active) garden.cancelEdit();
    else { garden.enterEdit(); garden.zoomBy(settings.zoom / garden.zoom); }  // back from a close-up to the player's zoom
    toastUntil = 0; refresh();
  };
  document.querySelectorAll<HTMLButtonElement>('[data-catalog]').forEach(button => { button.onclick = () => { const error = garden?.beginPlacement(button.dataset.catalog as ItemKind); if (error) notice(error); refresh(); }; });
  el('item-move').onclick = () => { garden?.moveItem(); refresh(); };
  el('item-rotate').onclick = () => { garden?.rotateItem(); refresh(); };
  el('item-place').onclick = () => { const error = garden?.placeItem(); notice(error ?? '여기에 놓았어요. 변경사항 적용을 누르면 생활에 반영돼요.'); refresh(); };
  el('item-cancel').onclick = () => { garden?.cancelPlacement(); refresh(); };
  el('item-store').onclick = () => { const error = garden?.storeItem(); notice(error ?? '보관함에 넣었어요.'); refresh(); };
  el('editor-cancel').onclick = () => { garden?.cancelEdit(); notice('변경을 취소하고 원래 놀이터로 돌아왔어요.'); refresh(); };
  el('editor-apply').onclick = () => { const error = garden?.applyEdit(); if (!error) persist(); notice(error ?? '새 배치에서 친구들이 다시 놀기 시작해요.'); refresh(); };
  for (const axis of ['x', 'z']) el<HTMLInputElement>(`item-${axis}`).oninput = () => { garden?.positionItem(Number(el<HTMLInputElement>('item-x').value), Number(el<HTMLInputElement>('item-z').value)); refresh(); };
} catch (error) { el('loading').hidden = true; el('render-error').hidden = false; console.error('Pixel scene initialization failed', error); }
/** Everything the save keeps: every region's layout (the current one as applied), friends and the time of day. */
function snapshot(): GardenSave | null {
  if (!garden) return null;
  const life = garden.life;
  return { regions: { ...regionLayouts, [currentRegion]: garden.editor.committed }, affinity: { ...life.affinity }, petted: { ...life.petted }, clock: life.clock() };
}
/**
 * Saves to this browser. `quiet` saves (the regular clock save, a pat, a region change) leave the status line alone
 * unless they fail, and never overwrite a save that could not be read; only a deliberate apply, load or reset does.
 */
function persist(quiet = false) {
  const save = snapshot(); if (!save || (quiet && saveUnreadable)) return;
  try { saveGarden(window.localStorage, save); saveUnreadable = false; if (!quiet) setText('save-status', `이 브라우저에 저장했어요 · ${new Date().toLocaleTimeString('ko-KR')}`); }
  catch { setText('save-status', '브라우저에 저장하지 못했어요. 현재 배치는 유지돼요. 새로고침 전에 파일로 백업해주세요.'); }
}
// The time of day is saved now and then, and when the page is hidden or closed.
setInterval(() => { if (settingsReady) persist(true); }, 30_000);
document.addEventListener('visibilitychange', () => { if (document.hidden && settingsReady) persist(true); });
window.addEventListener('pagehide', () => { if (settingsReady) persist(true); });
/** What the replace dialog will apply: a whole backup, or a fresh layout for the current region only. */
let replacement: { layout: Layout; backup: GardenSave | null } | null = null;
el('export-save').onclick = () => {
  if (!garden) return;
  const url = URL.createObjectURL(new Blob([encodeSave(snapshot()!)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `little-garden-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function propose(layout: Layout, backup: GardenSave | null) {
  replacement = { layout, backup };
  const here = region(currentRegion).name, regions = backup ? Object.keys(backup.regions).length : 0;
  setText('replace-title', backup ? '이 백업을 불러올까요?' : `${here}${batchim(here) ? '을' : '를'} 처음 배치로 돌릴까요?`);
  setText('replace-description', backup
    ? `지역 ${regions}곳 · ${here} ${layout.items.length}개 배치 · ${layout.stored.length}개 보관. 모든 지역의 배치와 친구 친밀도, 하루 시각을 바꾸고 자동 저장합니다. 필요하면 먼저 파일로 백업해주세요.`
    : `${here}의 배치와 보관함을 처음으로 바꾸고 자동 저장합니다(${layout.items.length}개 배치). 다른 지역은 그대로예요.`);
  el<HTMLDialogElement>('replace-dialog').showModal();
}
el('import-save').onclick = () => el<HTMLInputElement>('save-file').click();
el<HTMLInputElement>('save-file').onchange = async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = '';
  if (!file || !garden || garden.editor.active) return;
  try {
    if (file.size > MAX_SAVE_BYTES) throw new Error('파일이 너무 커요. 200KB 이하의 백업을 골라주세요.');
    const backup = decodeGarden(await file.text());
    if (!garden.editor.active) propose(backup.regions[currentRegion] ?? DEFAULT_LAYOUT, backup);
  } catch (error) { setText('save-status', `불러오지 못했어요. 현재 놀이터는 유지돼요. ${error instanceof SyntaxError ? 'JSON 백업 파일을 확인해주세요.' : error instanceof Error ? error.message : ''}`); }
};
el('reset-layout').onclick = () => propose(DEFAULT_LAYOUT, null);
el('replace-cancel').onclick = () => { replacement = null; el<HTMLDialogElement>('replace-dialog').close(); };
el('replace-confirm').onclick = () => {
  if (!replacement || !garden || garden.editor.active) return;
  const { layout, backup } = replacement; replacement = null;
  if (backup) {
    regionLayouts = backup.regions; const life = garden.life;
    Object.assign(life.affinity, backup.affinity); for (const id of Object.keys(life.petted) as AvatarId[]) delete life.petted[id];
    Object.assign(life.petted, backup.petted); life.setClock(backup.clock);
  }
  garden.restoreLayout(layout); el<HTMLDialogElement>('replace-dialog').close(); persist(); refresh();
};
const refreshTimer = setInterval(refresh, 150);
// FPS: browser frames counted over half a second while the readout is on.
let fpsOn = false, fpsFrames = 0, fpsSince = performance.now();
function showFps(on: boolean) { fpsOn = on; el('fps').hidden = !on; fpsFrames = 0; fpsSince = performance.now(); }
function countFrame(now: number) {
  if (fpsOn) {
    fpsFrames++;
    if (now - fpsSince >= 500) { setText('fps', `${Math.round(fpsFrames * 1000 / (now - fpsSince))} FPS`); fpsFrames = 0; fpsSince = now; }
  }
  requestAnimationFrame(countFrame);
}
requestAnimationFrame(countFrame);
// Map label menus: the region picker and the song list. One open at a time; outside click or Esc closes.
const MENUS = [['region-button', 'region-menu'], ['season-button', 'season-menu'], ['music-button', 'music-menu']] as const;
function openMenu(menu: string | null) {
  for (const [button, id] of MENUS) { const open = id === menu; el(id).hidden = !open; el(button).setAttribute('aria-expanded', String(open)); }
}
for (const [button, id] of MENUS) el(button).onclick = () => { openMenu(el(id).hidden ? id : null); if (!el(id).hidden) el(id).querySelector<HTMLButtonElement>('[aria-checked="true"], button')?.focus(); };
document.addEventListener('pointerdown', e => { if (!(e.target instanceof Element && e.target.closest('.scene-menu'))) openMenu(null); });
window.addEventListener('keydown', e => {
  const open = MENUS.find(([, id]) => !el(id).hidden);
  if (open && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); openMenu(null); el(open[0]).focus(); }
}, true);
/** Whether a Korean word ends in a final consonant (for 은/는, 으로/로). */
const batchim = (word: string) => { const c = word.charCodeAt(word.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0; };
// Regions (regions.ts): the label names the current one; regions without their own art yet only change the ground colours.
/** Goes to another region: the current layout is kept for coming back, and the new region's own layout comes out. */
function enterRegion(id: RegionId) {
  if (!garden || id === currentRegion) return;
  regionLayouts[currentRegion] = garden.editor.committed;
  currentRegion = id; garden.restoreLayout(regionLayouts[id] ?? DEFAULT_LAYOUT);
  showRegion(id); persist(true);
}
function showRegion(id: RegionId) {
  const r = region(id);
  garden?.setRegion(r.id); remember({ region: r.id });
  setText('region-label', r.name); setText('region-number', r.number);
  el('region-button').title = `${r.name} · 다른 지역 고르기`;
  el('viewport').style.background = seasonGround(r.ground, settings.season).background;
  el('region-list').querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.region === r.id)));
}
el('region-list').replaceChildren(...REGIONS.map(r => {
  const b = document.createElement('button');
  b.setAttribute('role', 'menuitemradio'); b.dataset.region = r.id; b.setAttribute('aria-checked', String(r.id === settings.region));
  b.innerHTML = `<i style="background:${r.ground.tiles[0]}"></i><span><strong></strong><small></small></span>${r.ready ? '' : '<em>준비 중</em>'}`;
  b.querySelector('strong')!.textContent = `${r.number} · ${r.name}`; b.querySelector('small')!.textContent = r.note;
  b.onclick = () => {
    openMenu(null); el('region-button').focus();
    if (garden?.editor.active) { notice('꾸미기를 마친 뒤 지역을 바꿀 수 있어요.'); return; }
    enterRegion(r.id);
    notice(r.ready ? `${r.name}${batchim(r.name) ? '으로' : '로'} 왔어요.` : `${r.name}${batchim(r.name) ? '은' : '는'} 그림을 준비 중이에요. 지금은 바닥 색만 바뀌어요.`);
  };
  return b;
}));
// Seasons (seasons.ts): recolour the ground of every region; their own trees, flowers and snow come later.
/** A season's pixel icon (flower, sun, maple leaf, snowman: tools/art/make-emote-icons.py). */
function seasonArt(id: SeasonId) {
  const img = document.createElement('img');
  img.className = 'pixel-icon'; img.src = `${import.meta.env.BASE_URL}sprites/ui/seasons/${id}.png`; img.alt = ''; img.width = 16; img.height = 16; img.draggable = false;
  return img;
}
function showSeason(id: SeasonId) {
  const s = season(id);
  garden?.setSeason(s.id); remember({ season: s.id });
  const icon = el('season-icon'); if (icon.dataset.season !== s.id) { icon.dataset.season = s.id; icon.replaceChildren(seasonArt(s.id)); }
  setText('season-label', s.name);
  el('season-button').title = `${s.name} · 계절 고르기`;
  el('viewport').style.background = seasonGround(region(settings.region).ground, s.id).background;
  el('season-list').querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.season === s.id)));
}
el('season-list').replaceChildren(...SEASONS.map(s => {
  const b = document.createElement('button');
  b.setAttribute('role', 'menuitemradio'); b.dataset.season = s.id; b.setAttribute('aria-checked', String(s.id === settings.season));
  b.innerHTML = '<span><strong></strong><small></small></span>';  // the pixel icon in the name is the season's mark
  b.querySelector('strong')!.replaceChildren(seasonArt(s.id), ` ${s.name}`); b.querySelector('small')!.textContent = s.note;
  b.onclick = () => { showSeason(s.id); openMenu(null); el('season-button').focus(); notice(`${s.name}${batchim(s.name) ? '이' : '가'} 왔어요. ${s.note}.`); };
  return b;
}));
// Songs (music.ts): the title scrolls right to left beside the label; the list picks one to play, then the next follows.
// Volume, mute and the song last heard (with its place) are remembered; that song carries on at the next visit.
const audio = new Audio();
audio.preload = 'metadata'; audio.volume = settings.volume; audio.muted = settings.muted;
let track: Track | null = TRACKS.find(t => t.id === settings.track) ?? null, savedAt = 0;
if (track) {
  audio.src = track.src;
  const at = settings.trackTime;
  audio.addEventListener('loadedmetadata', () => { if (at < audio.duration) audio.currentTime = at; }, { once: true });
  // Browsers only start sound after the player has touched the page; until then the song waits, paused.
  if (settings.playing) audio.play().catch(() => {
    const go = () => { document.removeEventListener('pointerdown', go); document.removeEventListener('keydown', go); if (track && audio.paused) audio.play().catch(() => {}); };
    document.addEventListener('pointerdown', go); document.addEventListener('keydown', go);
  });
}
function showVolume() {
  const level = Math.round(audio.volume * 100), silent = audio.muted || level === 0;
  setText('music-mute', silent ? '🔇' : '🔈'); el('music-mute').setAttribute('aria-pressed', String(audio.muted));
  el('music-mute').title = audio.muted ? '소리 켜기' : '음소거';
  el<HTMLInputElement>('music-volume').value = String(level); setText('music-volume-value', String(level));
}
el<HTMLInputElement>('music-volume').oninput = e => { audio.volume = Number((e.target as HTMLInputElement).value) / 100; if (audio.muted && audio.volume > 0) audio.muted = false; };
el('music-mute').onclick = () => { audio.muted = !audio.muted; };
audio.addEventListener('volumechange', () => { showVolume(); rememberMusic({ volume: audio.volume, muted: audio.muted }); });
audio.addEventListener('timeupdate', () => { if (track && Math.abs(audio.currentTime - savedAt) >= 3) { savedAt = audio.currentTime; rememberMusic({ trackTime: audio.currentTime }); } });
window.addEventListener('pagehide', () => { if (track) rememberMusic({ trackTime: audio.currentTime }); });
showVolume();
function showMusic() {
  const playing = !!track && !audio.paused, text = trackLabel(track, playing, TRACKS), title = el('track-title');
  title.classList.toggle('is-idle', !track);
  if (title.textContent !== text) { title.textContent = text; title.style.animationDuration = `${Math.max(9, text.length * .45)}s`; }
  el('music-list').replaceChildren(...(TRACKS.length ? TRACKS.map(t => {
    const b = document.createElement('button');
    b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', String(t.id === track?.id));
    b.textContent = `${t.id === track?.id && playing ? '♪' : '▷'} ${t.title}${t.artist ? ` — ${t.artist}` : ''}`;
    b.onclick = () => { if (t.id === track?.id && playing) audio.pause(); else play(t); };
    return b;
  }) : [Object.assign(document.createElement('p'), { className: 'pop-empty', textContent: '아직 노래가 없어요. 곧 추가할게요.' })]));
  el<HTMLButtonElement>('music-stop').disabled = !track;
}
function play(next: Track | null) {
  track = next;
  if (!next) { audio.pause(); audio.removeAttribute('src'); audio.load(); rememberMusic({ track: null, trackTime: 0, playing: false }); showMusic(); return; }
  if (next.id !== settings.track) { savedAt = 0; rememberMusic({ track: next.id, trackTime: 0 }); }
  if (!audio.src.endsWith(next.src)) audio.src = next.src;
  audio.play().catch(() => notice('노래를 재생하지 못했어요.'));
  showMusic();
}
audio.addEventListener('ended', () => play(nextTrack(TRACKS, track?.id ?? null)));
audio.addEventListener('play', () => { rememberMusic({ playing: true }); showMusic(); });
audio.addEventListener('pause', () => { if (track) rememberMusic({ playing: false, trackTime: audio.currentTime }); showMusic(); });
audio.addEventListener('error', () => { if (track) notice(`'${track.title}'을(를) 불러오지 못했어요.`); });
el('music-stop').onclick = () => play(null);
showMusic();
const editKeys = (event: KeyboardEvent) => {
  if (!garden?.editor.active || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')) return;
  const key = event.key.toLowerCase(), command = event.ctrlKey || event.metaKey;
  if (command && (key === 'y' || (key === 'z' && event.shiftKey))) { event.preventDefault(); if (garden.editor.redo()) notice('다시 했어요.'); refresh(); return; }
  if (command && key === 'z') { event.preventDefault(); if (garden.editor.undo()) notice('한 단계 되돌렸어요.'); refresh(); return; }
  if (command) return;
  if (key === 'r') { event.preventDefault(); garden.rotateItem(); }
  if (event.key === 'Escape') { event.preventDefault(); garden.cancelPlacement(); }
  refresh();
};
document.addEventListener('keydown', editKeys);
if (import.meta.hot) import.meta.hot.dispose(() => { clearInterval(refreshTimer); audio.pause(); document.removeEventListener('keydown', editKeys); garden?.dispose(); });




