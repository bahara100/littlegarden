import './style.css';
import { PixelGarden, type Selection } from './pixelGarden';
import { PhaserGarden } from './phaserGarden';
import { FRIENDS, activityLabel, type AvatarId } from './simulation';
import { CATALOG, DEFAULT_LAYOUT, type Layout, type ItemKind } from './layout';
import { loadLayout, saveLayout, encodeSave, decodeSave, MAX_SAVE_BYTES } from './persistence';
import { SCARLET_SD } from './scarletApproved';
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function setText(id: string, value: string) { const node = el(id); if (node.textContent !== value) node.textContent = value; }
// Phaser is the default renderer; ?renderer=canvas keeps the Canvas renderer.
const params = new URLSearchParams(location.search);
const usePhaser = params.get('renderer') !== 'canvas';
let garden: PixelGarden | PhaserGarden | undefined, selected: Selection = 'character';
let toastUntil = 0, panelKey = '';
let inventoryKey = '';
const defaultHint = '친구 선택 → 바닥을 눌러 이동 · 기구를 눌러 이용';
function notice(message: string) { setText('scene-hint', message); toastUntil = performance.now() + 3500; }
function details(rows: [string, string][]) {
  const key = JSON.stringify(rows); if (key === panelKey) return; panelKey = key;
  el('selection-details').replaceChildren(...rows.map(([label, value]) => { const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; row.append(dt, dd); return row; }));
}
function refresh() {
  if (!garden) return;
  const editing = garden.editor.active;
  el<HTMLButtonElement>('import-save').disabled = editing;
  el<HTMLButtonElement>('reset-layout').disabled = editing;
  document.querySelector('.workspace')!.classList.toggle('is-editing', editing);
  el('editor-panel').hidden = !editing;
  setText('edit-mode', editing ? '꾸미기 취소' : '✿ 놀이터 꾸미기');
  setText('mode-label', editing ? '꾸미기 모드' : '생활 모드');
  setText('mode-note', editing ? '친구들은 잠시 쉬는 중' : '친구들의 하루');
  setText('equipment-count', String(garden.life.layout.filter(i => ['bench', 'swing'].includes(i.kind)).length));
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
    setText('selection-subtitle', friend.id === 'character' ? 'SCARLET / PIXEL · V2' : 'PIXEL / ORIGINAL GARDEN FRIEND');
    setText('selection-description', '자유롭게 산책하고 빈 기구를 찾아 쉬어요. 바닥이나 기구를 눌러 이 친구에게 부탁할 수도 있어요.');
    if (friend.id === 'character') {
      setText('selection-subtitle', garden.scarletModel === 'ready' ? 'SCARLET / SD · FOUR DIRECTION WALK' : 'SCARLET / LOADING');
      setText('selection-description', '새 SD 홍련이 네 방향으로 걸어요. 빈 바닥을 눌러 이동시키고, 친구 가까이 보기로 살펴보세요.');
      el<HTMLAnchorElement>('model-review').href = `${import.meta.env.BASE_URL}${SCARLET_SD.review}`;
    } else {
      el<HTMLAnchorElement>('model-review').href = `${import.meta.env.BASE_URL}friends-base-walk-v1/index.html`;
    }
    details([['지금은', activityLabel(friend)], ['행동', friend.directed ? '부탁한 일 하는 중' : '자유롭게 생활 중']]);
    setText('selection-note', '부탁한 일을 마치면 다시 자유롭게 놀아요.');
  } else {
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
  if (performance.now() > toastUntil) setText('scene-hint', defaultHint);
}
function showSelection(id: Selection) { selected = id; refresh(); }
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
  setText('draft-count', `${editor.draft.items.length}개 배치 · ${editor.draft.stored.length}개 보관`);
  const key = JSON.stringify(editor.draft.stored.map(i => [i.id, i.kind]));
  if (key !== inventoryKey) {
    inventoryKey = key;
    const buttons = editor.draft.stored.map((i, n) => { const button = document.createElement('button'); button.textContent = `${CATALOG[i.kind].icon} ${CATALOG[i.kind].name} ${n + 1} · 다시 놓기`; button.onclick = () => { garden?.restoreItem(i.id); refresh(); }; return button; });
    el('stored-items').replaceChildren(...buttons); el('stored-empty').hidden = buttons.length > 0;
  }
  if (performance.now() > toastUntil) setText('scene-hint', pending ? '바닥 클릭으로 위치 고정 · 다른 곳 클릭으로 위치 변경 · R 회전 · ESC 취소' : '기구를 눌러 선택하거나 목록에서 새 장식을 골라보세요');
}
el('help').onclick = () => el<HTMLDialogElement>('help-dialog').showModal();
el('close-help').onclick = () => el<HTMLDialogElement>('help-dialog').close();
el('retry').onclick = () => location.reload();
try {
  const callbacks = { select: showSelection, notice, zoom: (percent: number) => { setText('zoom-value', `${percent}%`); el<HTMLButtonElement>('zoom-in').disabled = percent >= 500; el<HTMLButtonElement>('zoom-out').disabled = percent <= 65; }, error: () => { el('render-error').hidden = false; } };
  garden = usePhaser ? new PhaserGarden(el('game'), callbacks) : new PixelGarden(el('game'), callbacks);
  try {
    const saved = loadLayout(window.localStorage);
    if (saved) { garden.restoreLayout(saved); setText('save-status', '저장된 놀이터를 복원했어요.'); }
  } catch { setText('save-status', '저장 데이터를 읽지 못했어요. 원본은 유지했으며 기본 놀이터를 열었어요. 백업 파일을 불러오거나 새 배치를 적용해주세요.'); }
  el('loading').hidden = true; refresh();
  FRIENDS.forEach(f => { el(`friend-${f.id}`).onclick = () => { garden?.select(f.id); refresh(); }; });
  el('zoom-in').onclick = () => garden?.zoomBy(1.15); el('zoom-out').onclick = () => garden?.zoomBy(1 / 1.15); el('reset-view').onclick = () => garden?.reset();
  el<HTMLInputElement>('grid-toggle').onchange = e => garden?.setGrid((e.target as HTMLInputElement).checked);
  el('wave').onclick = () => garden?.wave();
  el('focus-friend').onclick = () => { garden?.focusFriend(); notice('친구를 가까이 살펴봐요. ⌖ 버튼을 누르면 전체 놀이터로 돌아가요.'); };
  el('resume').onclick = () => garden?.resume();
  el('leave-seat').onclick = () => garden?.leaveSeat();
  el('request-bench').onclick = () => garden?.commandKind('bench');
  el('request-swing').onclick = () => garden?.commandKind('swing');
  el('use-equipment').onclick = () => garden?.commandUse(selected);
  el('edit-mode').onclick = () => {
    if (!garden) return;
    if (garden.editor.active) garden.cancelEdit(); else garden.enterEdit();
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
function persist() {
  if (!garden) return;
  try { saveLayout(window.localStorage, garden.editor.committed); setText('save-status', `이 브라우저에 저장했어요 · ${new Date().toLocaleTimeString('ko-KR')}`); }
  catch { setText('save-status', '브라우저에 저장하지 못했어요. 현재 배치는 유지돼요. 새로고침 전에 파일로 백업해주세요.'); }
}
let replacement: Layout | null = null;
el('export-save').onclick = () => {
  if (!garden) return;
  const url = URL.createObjectURL(new Blob([encodeSave(garden.editor.committed)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `little-garden-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function propose(layout: Layout, reset = false) {
  replacement = layout;
  setText('replace-title', reset ? '처음 놀이터로 돌아갈까요?' : '이 백업을 불러올까요?');
  setText('replace-description', `${layout.items.length}개 배치 · ${layout.stored.length}개 보관. 현재 배치와 보관함을 바꾸고 자동 저장합니다. 필요하면 먼저 파일로 백업해주세요.`);
  el<HTMLDialogElement>('replace-dialog').showModal();
}
el('import-save').onclick = () => el<HTMLInputElement>('save-file').click();
el<HTMLInputElement>('save-file').onchange = async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = '';
  if (!file || !garden || garden.editor.active) return;
  try {
    if (file.size > MAX_SAVE_BYTES) throw new Error('파일이 너무 커요. 200KB 이하의 백업을 골라주세요.');
    const layout = decodeSave(await file.text());
    if (!garden.editor.active) propose(layout);
  } catch (error) { setText('save-status', `불러오지 못했어요. 현재 놀이터는 유지돼요. ${error instanceof SyntaxError ? 'JSON 백업 파일을 확인해주세요.' : error instanceof Error ? error.message : ''}`); }
};
el('reset-layout').onclick = () => propose(DEFAULT_LAYOUT, true);
el('replace-cancel').onclick = () => { replacement = null; el<HTMLDialogElement>('replace-dialog').close(); };
el('replace-confirm').onclick = () => {
  if (!replacement || !garden || garden.editor.active) return;
  garden.restoreLayout(replacement); replacement = null; el<HTMLDialogElement>('replace-dialog').close(); persist(); refresh();
};
const refreshTimer = setInterval(refresh, 150);
const editKeys = (event: KeyboardEvent) => {
  if (!garden?.editor.active || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')) return;
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); garden.rotateItem(); }
  if (event.key === 'Escape') { event.preventDefault(); garden.cancelPlacement(); }
  refresh();
};
document.addEventListener('keydown', editKeys);
if (import.meta.hot) import.meta.hot.dispose(() => { clearInterval(refreshTimer); document.removeEventListener('keydown', editKeys); garden?.dispose(); });




