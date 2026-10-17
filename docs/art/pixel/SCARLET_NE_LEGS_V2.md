# 홍련 NE V2 — 뒷모습 다리 디자인 수정

사용자가 NE V1에서 좌우 다리 디자인이 계속 바뀐다고 지적했다. 이전 보고의 '컷 재정렬로 기준 보행 순서를 맞췄다'는 설명은 다리 소유권 오류의 해결이 아니었다. **V1/source-keys-ordered.png는 새 제작의 기준으로 사용하지 않는다.**

## 원인과 수정
V1은 앞에 크게 보이는 종아리에 검은 끈/흰 스타킹이 번갈아 붙고, 골반부터 발까지의 연결이 불명확했다. 전신 컷을 재정렬해도 이 작화 오류는 없어지지 않는다.
이번에는 NE 카메라에서 캐릭터 자신의 LEFT(가까운 화면 왼쪽 골반) → 검은 교차 끈 종아리 → 왼발과 RIGHT(먼 화면 오른쪽 골반) → 흰 스타킹 → 오른발을 각 컷에 고정해 하반신을 다시 그렸다. 서로의 골반 경로를 가로질러 텍스처가 이동하지 않게 했다. 다른 방향은 해당 카메라의 해부학적 좌우를 따르며 화면 좌우 규칙을 모든 방향에 일반화하지 않는다.

1차 수정에서 네 컷의 좌우 디자인을 분리했다. 1번의 앞뒤 발이 3번과 비슷한 문제를 추가 수정했고, 그 과정에서 발을 지나치게 들던 부분을 다시 낮췄다. 머리/모자/중앙 머리 끝 묶음/상체/팔/칼집 외형은 최대한 유지하는 편집으로 진행했다. 최종 선택 원본은 source-keys-grounded.png이며 행 순서 1·2·3·4 그대로 사용한다. **이전 [3,4,1,2] 재정렬을 새 원본에 적용하지 않는다.**

## 저장 파일
폴더 apps/client/public/sprites/scarlet/fullframe-ne-v2/
- source-keys.png: 첫 하반신 수정 결과 (중간 후보).
- source-keys-fixed.png: 1번 앞뒤 발 수정 결과 (과도한 들림이 있어 최종본으로 쓰지 않음).
- **source-keys-grounded.png: 최종 선택 2×2 원본. 후속 중간 자세 생성에는 이것을 참고한다.**
- frame-1.png ~ frame-4.png: 투명 96×96 개별 컷.
- walk.png: 384×96 가로 시트.
- walk-contact-4x.png: 네 컷 4배 확대 비교.
- walk.json: 원본 셀 대응, 공통 크롭·축소율·이동량·색 수·해시.
- 보조 그림 docs/art/pixel/scarlet-ne-leg-tracks.png: 새로 그린 해부학 경로/자세 설명도. 게임 작화가 아니며 cyan=LEFT, orange=RIGHT.
- 화면 기록 docs/art/pixel/scarlet-ne-legs-v2-review.png (전체), scarlet-ne-legs-v2-row.png (네 컷 하반신 비교).

검수 /scarlet-frames.html?direction=ne 는 기본적으로 수정된 V2를 표시한다.
놀이터 /?scarlet=frames-ne-v2 에서 NE 수정 4컷 사용. 과거 frames-ne-v1 URL도 수정 시트를 사용하도록 호환한다.
다리 확대 체크는 **같은 PNG 프레임**의 x24,y56,w48,h40 영역을 최근접 2배로 보여준다. 별도 다리 부품이나 보정 그림을 재생하는 기능이 아니다. 기준선도 확대 좌표로 변환한다.

## 패키징과 검증
tools/art/export-scarlet-ne-keys-v2.ps1 → ScarletFullWalk.cs, cellOrder 없음.
공통 크롭 [133,32,398,565], 단일 축소율 0.14513274336283186, 모든 컷 기존 32색 팔레트, 투명/불투명 알파, 최하단 y87, 기준 (48,88). 정수 이동으로 모자 가로 중심/캔버스 발 기준을 맞췄다.
- 원본과 96픽셀 출력에서 네 컷의 왼쪽 검은 끈/오른쪽 흰 스타킹을 눈으로 비교했다.
- 네 컷 서로 다른 해시, 96×96/각32색, 잘림 없음.
- npm.cmd run build 성공, npm.cmd test 28개 통과.
- 브라우저 NE1→2→3→4→1, 다리 확대, 이전 컷 겹치기, 확대 좌표의 기준선, 전신 보기 복귀, 새 시트 다운로드 경로 및 놀이터 검수 링크 확인. 검수/놀이터 오류 로그 없음.
이 테스트들은 규격과 재생 동작의 검증이다. 다리 디자인의 확인은 시각 검토이며 자동 해부학 검사나 보행 완성 판정으로 간주하지 않는다.

아직 4컷 검수 단계다. 이번 수정은 다리 소유권 오류 해결에 초점을 두었다. 1번 보폭/접지, 컷 간 높낮이 및 3→4→1 연결의 자연스러움은 후속 보행 보정 대상이다. 현재 원본을 확인한 뒤 중간 자세를 추가한다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-ne-keys-v2.ps1
npm.cmd run build
npm.cmd test
```

## 생성 도구·입력과 전체 프롬프트
built-in image_gen.imagegen, 모든 호출 transparent_background=true. 첫 편집 입력은 V1/source-keys-ordered.png(편집 대상)와 새 경로 설명도(포즈 보조)다. 후속 편집은 직전 후보 이미지를 입력했다. 기본 generated_images 원본은 보존하고 프로젝트에 복사했다. 모델/seed는 도구가 제공하지 않았다.

### 하반신 좌우 경로 수정
```text
Use case: precise-object-edit.
Image1 EDIT TARGET: Scarlet northeast rear-view four-frame sheet, 2x2 row-major canonical poses1,2,3,4. Its leg design swaps are WRONG. Image2 is a newly drawn ANATOMICAL TRACK GUIDE, NOT an appearance/style reference. Correct the LOWER BODY of all four cells in Image1 by following Image2's hip/leg assignment.
Preserve the existing beautiful head/hat/hair/single low BACK CENTER hair-end tie, torso, arms, sleeves, red sash, coat, sheathed sword, camera angle, chibi scale, transparency, cell layout and margins as much as possible. Change legs/boots/partially necessary hip/coat openings to make clear permanent leg ownership and four readable poses. No whole-image mirroring, no mere swapping frame order, no puppet parts.
CRITICAL BACK-VIEW TRACKS: character's anatomical LEFT HIP is SCREEN LEFT / near side. ONLY this leg has BLACK CRISSCROSS straps on white stocking, continuously from its own thigh through knee/calf. Anatomical RIGHT HIP is SCREEN RIGHT / far side. ONLY this leg is PLAIN WHITE stocking (small pink edge permitted), NO black bands or X on this leg. BOTH boots same dark/gold/white design. Keep separate lateral tracks: LEFT black calf on LEFT track, RIGHT plain calf on RIGHT track IN ALL FOUR CELLS, never crossing across the other hip/leg. The old image has a large foreground plain leg in pose1 and straps alternating onto the foreground calf: do NOT preserve this mistake.
Use Image2 exact relative foot/hip locations as a 96x96 conceptual coordinate guide; adapt drawing to the existing scale:
LEFT HIP(43,63), RIGHT HIP(54,63), fixed both.
1 TOP LEFT: LEFT BLACK foot FORWARD UP-RIGHT, its ankle around(46,78); RIGHT PLAIN foot TRAILING lower-right track around(52,86). Black leg remains LEFT of white leg, forward black foot appears HIGHER in image. White trailing foot appears lower but stays on RIGHT track. 
2 TOP RIGHT: LEFT BLACK supports near(43,85) on LEFT; RIGHT PLAIN passes gently raised near(54,80) on RIGHT. Black left grounded, white right lifted. Modest knee bend, not marching.
3 BOTTOM LEFT: LEFT BLACK trails near(40,86) on LEFT; RIGHT PLAIN steps FORWARD UP-RIGHT near(57,78) on RIGHT. Black trailing foot appears lower, white forward foot higher. Black straps NEVER move to right forward calf.
4 BOTTOM RIGHT: LEFT BLACK passes gently raised near(43,80) on LEFT; RIGHT PLAIN supports near(54,85) on RIGHT. Opposite passing leg from pose2. Near black calf left, far plain white calf right.
ALL toes point UPPER RIGHT, heels face lower-left toward viewer. Boots must look like rear view, no front-facing toes, no high knee lift. Maintain natural knee/hip connections and small walk, do not merely recolor detached boots. Make both legs sufficiently visible below hair/coat to verify identities. Do not force long legs from schematic; retain original short SD proportions.
DO NOT alter other body artwork except subtle lower coat edge occlusion necessary for corrected hips. Exactly FOUR completed full-body pixel-art cels, 2x2, same style and palette. Guide cyan/orange lines and words are NOT in output. No labels/text/shadows/floor. True transparent background.
```

### 1번 앞뒤 발 보정
```text
Use case: precise-object-edit. This transparent 2x2 northeast rear-view Scarlet sheet NOW has CORRECT leg textures: black X on screen-LEFT leg, plain white on screen-RIGHT leg in ALL cells. Preserve that identity exactly. Edit ONLY the LEGS IN TOP LEFT CELL (pose1). Keep EVERY PIXEL/pose/leg design of top-right, bottom-left, bottom-right as unchanged as possible. Keep all head/hat/hair/single center hair-end tie/torso/arms/coat/sword unchanged in every cell.
PROBLEM: top-left currently still has black LEFT foot behind/lower than plain RIGHT foot, almost same trailing-leg stance as bottom-left. TOP LEFT must be opposite contact: LEFT BLACK forward, RIGHT WHITE trailing.
In TOP LEFT ONLY redraw complete lower-body posture with BLACK LEFT calf staying on SCREEN-LEFT track and WHITE RIGHT calf staying SCREEN-RIGHT track, NEVER crossing:
- MOVE BLACK LEFT BOOT about 55 source pixels UP and slightly RIGHT from its current position, so black left foot is FORWARD in upper-right direction, visually HIGHER than white right foot. Bend/foreshorten black left leg naturally, keep black crisscross texture from left thigh to left calf. Black left boot sole/contact should end about y=515 within the top-left cell, around x=350. Keep boot toes UPPER RIGHT. Do not expose bare skin by erasing black bands.
- MOVE PLAIN WHITE RIGHT BOOT about 35 source pixels DOWN from current, so it trails BACK and looks LOWER than black boot, around x=420,y=580 in top-left cell. Extend plain right leg naturally from SCREEN-RIGHT hip with no black straps. Keep it clearly separate to the RIGHT of black left calf.
Result top-left: BLACK LEFT foot HIGHER/forward, WHITE RIGHT foot LOWER/trailing. Difference around 60 pixels vertical, clear opposite of bottom-left where black trails lower and white goes forward/higher. Do NOT merely recolor existing calves; geometry must change in top-left.
Preserve short chibi proportions, restrained walking stance, not high-knee marching, not long-legged adult anatomy. Keep rear-view boots pointing upper-right, heel toward viewer. Tiny lower coat occlusion adjustment is allowed only if necessary for corrected hips. Same pixel-art finish, same transparent 2x2 sheet, no labels/shadows/floor/new objects.
```

### 1번 과도한 들림 완화
```text
Use case: precise-object-edit. Edit this transparent 2x2 Scarlet northeast rear walking sheet. Preserve ALL leg identities: black X permanently SCREEN-LEFT/anatomical left, plain white permanently SCREEN-RIGHT/anatomical right. Preserve all artwork and all other 3 cells exactly as much as possible.
Change ONLY TOP-LEFT BLACK LEFT LOWER LEG/BOOT to reduce its excessive lifted/kicking pose. It is the forward CONTACT foot, so it should rest on the ground, not show its whole upturned sole. Keep right plain white leg/boot on right unchanged. Keep left hip/knee attached.
Use the normal PLANTED black boot shape from TOP RIGHT cell as reference for boot orientation, not its location. Top-left left boot should point UPPER RIGHT and look grounded from behind, only narrow heel/back visible, NOT a large oval sole facing camera. Lower that top-left black ankle slightly (about 20-25 source pixels from current) and extend calf naturally so black boot bottom is about y=550 in the top-left cell while plain white right boot bottom remains around y=575. Black left boot is still slightly HIGHER/forward than white trailing right, but only ~25 pixels higher, small walking stride. Do not lift knee high or splay foot sideways. Do not swap or repaint other leg textures.
Absolutely preserve head/hat/hair center low tie, torso/arms, coat, sword, overall scale and transparent 2x2 layout. Other three poses unchanged. Same pixel art, true transparency, no ground plane/shadows/text/guides.
```

