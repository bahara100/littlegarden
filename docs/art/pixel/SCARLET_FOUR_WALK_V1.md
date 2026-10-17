# 홍련 네 방향 걷기 v1

내장 image_gen 도구 사용. CLI/API 키 사용 없음.

SE는 기존 승인된 v2를 그대로 유지한다. 새 SW/NW/NE는 2×2 원본을 각 96×96, 기준점 (48,88), 최대 32색, 이진 알파로 내보낸다. 게임 모드는 `?scarlet=walk-four-v1`, 검수 화면은 `scarlet-walk.html`.

## 저장 경로

SW와 NE의 최종 내보내기 입력은 `scarlet-sw-walk-v1-corrected-source.png`, `scarlet-ne-walk-v1-corrected-source.png`이다. 최초 원본은 비교용으로 보존했다. NW는 최초 원본을 사용한다. 기존 SE `scarlet-se-walk-v2.png`는 수정하지 않았다.

검증: TypeScript 검사 및 프로덕션 빌드 성공, 기존 테스트 24개 성공. 내보내기 과정에서 새 12컷 각각 96×96, 최대 32색, 이진 알파, 마지막 불투명 행 87을 검사했다. 브라우저에서 총 16컷 로드, SW 3→4→1 한 컷 전환, NW/NE 방향 선택과 다운로드 링크, 맵의 수동 이동 지시를 확인했다. 화면 증거는 `scarlet-four-walk-v1-preview.jpg`에 저장했다.

생성 기반 초안이므로 방향 전환 시 모자·머리 크기 및 다리 장식의 프레임 간 미세한 차이는 남아 있다. 특히 새 방향의 발 교차와 접지는 기존 SE처럼 실제 반복 재생을 보며 추가 보정할 수 있다. 앉기·손 흔들기 전용 그림은 이번 작업 범위에 포함하지 않는다.

`apps/client/public/sprites/scarlet/scarlet-{sw,nw,ne}-walk-v1-source.png` (최초 원본)

`apps/client/public/sprites/scarlet/scarlet-{sw,nw,ne}-walk-v1.png` (방향별 384×96 걷기 시트), `-4x.png`, `-frame-{0..3}.png`, `.json`.

## 최초 생성 프롬프트

### sw

```text
Use case: identity-preserve. Asset type: isometric game sprite walk cycle, FOUR full-body poses in a precise 2 by 2 grid, transparent background, no text or cell borders.
Image 1 is character identity and exact camera direction reference. Image 2 is supporting four-step walk rhythm/pixel style reference ONLY; do not copy its southeast camera angle.
Create Scarlet matching image 1 exactly in front three-quarter facing LOWER LEFT (southwest). Both amber eyes visible. Sword on anatomical left waist, on viewer right. Black wrapped LEFT leg appears viewer right.
All FOUR cells face this SAME direction. Top left frame 1: anatomical left leg forward contact, right leg behind. Top right frame 2: left planted under pelvis, right knee bent passing underneath, right boot lifted. Bottom left frame 3: right leg forward contact, left leg behind. Bottom right frame 4: right planted under pelvis, LEFT KNEE BENT and LEFT BOOT LIFTED CLOSE UNDER PELVIS, moving forward toward frame 1. No extended backward left leg in frame 4. Exactly two legs each frame, clear alternating contacts and compact passing poses, subtle opposing arm swing, same hat/head size, same center and baseline each cell. Keep body at same position for in-place loop, minimal vertical bob.
Keep ivory broad hat with two gold horns and purple ring/tassels, lavender hair, white purple gold robe, red sash, asymmetric black leg wraps and one katana. Hair is ONE loose long curtain, gathered ONLY at low ends by ONE small central bow on spinal center at back; no side ponytails, no twin tails. Rear poses must show that single low central tie. Keep hilt guard sheath and gold end in one continuous axis attached to waist, no missing/doubled/floating sword. Simplified clean pixel-friendly SD art suitable for 96x96 reduction, short chibi proportions. Transparent empty margins in EVERY square cell at least 8 percent, all hats/boots/sheaths wholly inside their own cell. No floor shadow, no labels, no extra parts, no checkerboard drawn into art.
```

### nw

```text
Use case: identity-preserve. Asset type: isometric game sprite walk cycle, FOUR full-body poses in a precise 2 by 2 grid, transparent background, no text or cell borders.
Image 1 is character identity and exact camera direction reference. Image 2 is supporting four-step walk rhythm/pixel style reference ONLY; do not copy its southeast camera angle.
Create Scarlet matching image 1 exactly in BACK three-quarter facing UPPER LEFT (northwest). No frontal face/eyes. Sword hilt at viewer left waist, continuous dark scabbard extends diagonally down toward viewer right with one gold tip.
All FOUR cells face this SAME direction. Top left frame 1: anatomical left leg forward contact, right leg behind. Top right frame 2: left planted under pelvis, right knee bent passing underneath, right boot lifted. Bottom left frame 3: right leg forward contact, left leg behind. Bottom right frame 4: right planted under pelvis, LEFT KNEE BENT and LEFT BOOT LIFTED CLOSE UNDER PELVIS, moving forward toward frame 1. No extended backward left leg in frame 4. Exactly two legs each frame, clear alternating contacts and compact passing poses, subtle opposing arm swing, same hat/head size, same center and baseline each cell. Keep body at same position for in-place loop, minimal vertical bob.
Keep ivory broad hat with two gold horns and purple ring/tassels, lavender hair, white purple gold robe, red sash, asymmetric black leg wraps and one katana. Hair is ONE loose long curtain, gathered ONLY at low ends by ONE small central bow on spinal center at back; no side ponytails, no twin tails. Rear poses must show that single low central tie. Keep hilt guard sheath and gold end in one continuous axis attached to waist, no missing/doubled/floating sword. Simplified clean pixel-friendly SD art suitable for 96x96 reduction, short chibi proportions. Transparent empty margins in EVERY square cell at least 8 percent, all hats/boots/sheaths wholly inside their own cell. No floor shadow, no labels, no extra parts, no checkerboard drawn into art.
```

### ne

```text
Use case: identity-preserve. Asset type: isometric game sprite walk cycle, FOUR full-body poses in a precise 2 by 2 grid, transparent background, no text or cell borders.
Image 1 is character identity and exact camera direction reference. Image 2 is supporting four-step walk rhythm/pixel style reference ONLY; do not copy its southeast camera angle.
Create Scarlet matching image 1 exactly in BACK three-quarter facing UPPER RIGHT (northeast). No frontal face/eyes. Sword hilt at viewer right waist, continuous dark scabbard extends diagonally down toward viewer left with one gold tip.
All FOUR cells face this SAME direction. Top left frame 1: anatomical left leg forward contact, right leg behind. Top right frame 2: left planted under pelvis, right knee bent passing underneath, right boot lifted. Bottom left frame 3: right leg forward contact, left leg behind. Bottom right frame 4: right planted under pelvis, LEFT KNEE BENT and LEFT BOOT LIFTED CLOSE UNDER PELVIS, moving forward toward frame 1. No extended backward left leg in frame 4. Exactly two legs each frame, clear alternating contacts and compact passing poses, subtle opposing arm swing, same hat/head size, same center and baseline each cell. Keep body at same position for in-place loop, minimal vertical bob.
Keep ivory broad hat with two gold horns and purple ring/tassels, lavender hair, white purple gold robe, red sash, asymmetric black leg wraps and one katana. Hair is ONE loose long curtain, gathered ONLY at low ends by ONE small central bow on spinal center at back; no side ponytails, no twin tails. Rear poses must show that single low central tie. Keep hilt guard sheath and gold end in one continuous axis attached to waist, no missing/doubled/floating sword. Simplified clean pixel-friendly SD art suitable for 96x96 reduction, short chibi proportions. Transparent empty margins in EVERY square cell at least 8 percent, all hats/boots/sheaths wholly inside their own cell. No floor shadow, no labels, no extra parts, no checkerboard drawn into art.
```

## sw 발 교차 수정 프롬프트

```text
Use case: precise-object-edit. Edit this FOUR cell southwest walk sheet. Keep same 2x2 layout, same camera facing lower-left, same character hat face costume color and sword. Fix two precise errors:
1. Hair ends must NOT have any visible tie on screen-right. REMOVE the round gold bead and purple side bow from ALL four cells. Hair is one loose curtain gathered at low back CENTER behind torso, hidden in this front view. No side tail, no side bow.
2. Foot phase TOP LEFT and BOTTOM LEFT currently repeat same leg. TOP LEFT keep black-wrapped anatomical LEFT leg forward contacting ground with plain white right leg behind. TOP RIGHT: left support under pelvis, plain white RIGHT knee bent and foot lifted passing underneath. BOTTOM LEFT change to plain WHITE RIGHT LEG extended FORWARD down-left contacting ground, and black-wrapped LEFT LEG BEHIND body up-right. BOTTOM RIGHT: plain white right leg support beneath body, BLACK-WRAPPED LEFT KNEE BENT/foot lifted compactly under pelvis advancing toward top-left. The black wraps must stay on same anatomical left leg in all four cells. Exactly 2 legs. Compact smooth cyclic in-place 1→2→3→4→1 poses. Keep head/hat/body size/center identical in each cell. Render clean simplified pixel-friendly chibi. Real transparent background. Add ample clear 8% empty margins inside each equal square cell so no neighboring silhouette touches border. No text/shadow.
```

## ne 발 교차 수정 프롬프트

```text
undefined
```

