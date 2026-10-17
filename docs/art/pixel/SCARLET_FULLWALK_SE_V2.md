# 홍련 SE 전신 걷기 V2 — 8프레임

## 결과
사용자가 V1 전신 4컷의 개선을 확인한 후 승인한 후속 작업이다. 기준 자세의 얼굴 방향·모자 형태를 보정하고 전신 중간 자세 4컷을 생성했다. 출력은 완성 전신 PNG 8개를 잘라 재생하며 런타임 관절 회전/크로스페이드/자동 중간 보간을 사용하지 않는다.

순서: 기준1 → 사이1·2 → 기준2 → 사이2·3 → 기준3 → 사이3·4 → 기준4 → 사이4·1. 새 1·3·5·7번은 이전 1·2·3·4번에 대응한다. 왼다리 검은 교차 끈, 오른다리 분홍 지그재그 흰 스타킹을 유지한다. 중간 생성의 B컷에서 빠진 칼자루를 별도 수정했다.

## 저장 파일
모든 새 원본/결과는 apps/client/public/sprites/scarlet/fullframe-se-v2/ 에 저장했다.
- source-keys.png: 모자·얼굴 방향을 보정한 2×2 기준 자세 원본.
- source-inbetweens.png: 중간 자세 최초 생성 (칼자루 누락 비교용).
- source-inbetweens-fixed.png: 칼자루 수정 후 선택한 중간 자세 원본.
- frame-1.png ~ frame-8.png: 96×96 투명 전신 개별 컷.
- walk.png: 768×96, 가로 8셀 시트.
- walk-contact-4x.png: 4열×2행, 4배 최근접 확대 비교용.
- walk.json: 셀 범위, 원본 셀 대응, 공통 크롭·축소율, 정수 이동량, 색 수, SHA256.
- walk-preview.gif: 288×288, 8프레임, 약 12 FPS, PNG와 동일한 픽셀의 미리보기.

제작/패키징: tools/art/ScarletFullWalk.cs, export-scarlet-fullwalk.ps1, pack-scarlet-fullwalk-gif.ps1.
고정 팔레트: tools/art/scarlet-palette.json (32색).
검수 화면: /scarlet-frames.html — 새 8컷/이전 4컷 전환, 속도, 정지·한 컷 이동, 이전 컷 겹치기, 기준선.
놀이터 시험: /?scarlet=frames-se-v2 — SE 걷기에만 새 시트 사용. 다른 방향은 기존 정지 자세.
화면 기록: docs/art/pixel/scarlet-fullwalk-se-v2-review.png.

## 정렬과 검증
두 원본은 동일한 1254×1254, 셀은 627×627이다. 8셀의 최대 연결 불투명 성분을 모아 공통 크롭 [109,20,418,595], 단일 축소율 0.13781512605042018을 사용했다. 최근접 픽셀 선택 후 공통 32색으로 매핑했다. 개별 프레임 확대/축소 없이 모자 상단 실루엣의 가로 중심을 x=48에 맞추고 가장 낮은 불투명 픽셀을 y=87로 정수 이동했다. 발 기준점은 (48,88). 이 정렬은 모든 발이 물리적으로 정확히 접지하거나 이동 중 미끄러지지 않음을 보증하지 않는다.

- 8컷 모두 서로 다른 픽셀 해시, 96×96, 32색, 투명 배경, 최하단 y=87, 내용 잘림 없음.
- GIF 디코드 8프레임과 PNG의 3배 최근접 픽셀 비교: 불일치 0.
- npm.cmd run build: 성공 (기존 character 3D 번들 크기 경고 유지).
- npm.cmd test: 28개 통과. 신규 검사는 후반 5~8번까지 재생 및 8→1 반환, 이전 4컷과 주기 일치를 확인한다.
- 실제 브라우저: 1→…→8→1, 비교 시트 전환, 겹쳐 보기·기준선·느린 재생, 놀이터 V2 표시 확인. 검수/놀이터 오류 로그 없음.

## 남은 작화 검토
머리·모자와 접지 위치를 보정한 8컷 검수본이다. 작은 장식/픽셀 클러스터의 컷별 차이, 보행 중 발 미끄러짐과 체중 이동은 반복 재생으로 추가 검토해야 한다. 규격/해시/GIF/단위 테스트는 외형 연속성과 자연스러운 보행의 승인 근거가 아니다. 나머지 세 방향은 이 SE 결과의 품질 확인 후 확장한다. V1 원본/시트는 유지한다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-fullwalk.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/pack-scarlet-fullwalk-gif.ps1
npm.cmd run build
npm.cmd test
```

## 이미지 생성 도구
built-in image_gen.imagegen 사용, 모든 호출 transparent_background=true. 모델/seed는 도구가 제공하지 않았다. 기본 generated_images 원본을 보존하고 선택 결과를 프로젝트로 복사했다. 입력 역할: 최초 V1 source-arm-fixed.png는 편집 대상; source-keys.png는 중간 자세 제작의 외형/자세 참고; source-inbetweens.png는 칼자루 수정 편집 대상.

## 기준 4컷 머리·모자 보정 전체 프롬프트
```text
Use case: precise-object-edit.
Edit target: the supplied transparent 2x2 Scarlet full-body pixel-art walking keyframes. User likes THIS exact appearance. Preserve these FOUR full-body poses, pixel art style, costume, arms/legs, identity and arrangement. Do not redesign or mirror. Target is stable animation cleanup, not a new illustration.
Change ONLY head/hat consistency and ground registration: In all four cells use the SAME southeast three-quarter camera angle and face direction as TOP LEFT, SAME hat/head scale, SAME eye line angle. Bottom-left frame's head currently turns more toward profile: correct it to match top-left while retaining its body/arm/leg pose. Ivory hat horns/ring/tassels maintain identical shape and placement, subtle vertical bob at most. Keep modest original chibi proportions.
All four equal cells must have same planted-boot ground line and same pelvis horizontal center; keep one foot planted in each pose. Passing poses top-right/bottom-right can raise pelvis by one logical pixel and flex knees slightly to keep planted sole at ground. Never independently resize characters to fit cell. Leave generous transparent padding.
CRITICAL preserve leg identity: anatomical LEFT leg black crisscross stocking attached to screen-right hip. Anatomical RIGHT leg plain white with pink zigzag attached to screen-left hip. Frame1 black left foot forward; frame2 plain right foot passes while black left supports; frame3 plain white right foot forward with black left behind; frame4 black left foot passes behind white right planted. Never swap leg design, never make both calves black, keep toes lower-right.
Preserve counterarm swing: frame1 near/right arm forward across belly, frame3 near/right arm backward to screen-left outside coat. Passing arms neutral. Keep subtle coherent torso/cloth/hair response. One sheathed sword left waist screen-right, loose lavender hair tied once only at BACK CENTER low end (hidden), no side ponytail. True transparent background, no labels/shadows/grid. Output exactly FOUR cells 2x2, not eight.
```

## 중간 전신 자세 4컷 생성 전체 프롬프트
```text
Use case: identity-preserve.
Reference image: approved four full-body southeast walk KEY POSES in 2x2 grid, numbered conceptually 1 top-left,2 top-right,3 bottom-left,4 bottom-right.
Create FOUR NEW full-body pixel-art IN-BETWEEN animation cels, also a transparent 2x2 grid with equal square cells. These will interleave with the reference to make an eight-frame loop: key1, NEW A, key2, NEW B, key3, NEW C, key4, NEW D, then key1.
Preserve EXACT same Scarlet character design, southeast lower-right camera angle, head/hat size/shape/face direction and expression. Use same simple pixel-art clusters, ivory hat gold horns purple ring, lavender hair, white-purple-gold outfit and red sash. Keep head nearly identical across all FOUR cels, only 1 logical pixel vertical bob, no head turn, blink, redesign or body scaling. Same pelvis horizontal center and planted sole ground line in every cell, ample transparent margins, same character scale/registration as reference cells.
PERMANENT anatomy: LEFT leg is attached to SCREEN-RIGHT hip, wears BLACK CRISSCROSS stocking. RIGHT leg attached SCREEN-LEFT hip, PLAIN WHITE stocking with small pink zigzag. Never swap textures or hips; toes ALWAYS point LOWER RIGHT. In near crossing, plain right leg can overlap in FRONT but never acquire black bands. One sword left waist screen-right, loose single lavender hair curtain only tied low at BACK CENTER, no side ponytail.
NEW A top-left = BETWEEN key1 and key2: left BLACK foot has taken weight, moves nearer under screen-right hip as body advances; right PLAIN foot is just lifting behind, slight bend. Near/right arm eases from forward toward neutral; far/left arm moves toward neutral. Small down/settle in body, restrained soft walk.
NEW B top-right = BETWEEN key2 and key3: left BLACK leg still planted behind under screen-right hip, right PLAIN leg reaches FORWARD/down-right from screen-left hip, heel almost touching ground. Near/right arm eases backward toward screen-left outside coat; far/left arm gently forward. Plain white calf IN FRONT of black calf when overlapping.
NEW C bottom-left = BETWEEN key3 and key4: right PLAIN foot has taken weight in front, left BLACK foot bends and begins lifting BEHIND while remaining attached to screen-right hip. Near/right arm eases from back toward neutral; far/left arm neutral. Subtle settle.
NEW D bottom-right = BETWEEN key4 and key1: right PLAIN foot stays planted/trailing, left BLACK leg reaches FORWARD/down-right from screen-right hip, heel almost touching ground. Near/right arm eases FORWARD across belly; far/left arm goes back. Black straps remain on left, plain white stays right.
Whole-body animated drawings including slight shoulder/pelvis/sleeve/hair response, not frozen torso with independently rotated legs. Small in-between changes, not extreme strides/high knees. All four NEW poses must differ meaningfully and connect specified neighboring keys. Return ONLY these four in-between cels (not reference keys, not eight cels). No text/numbers/guides/floor/shadows. True transparent background.
```

## 중간 자세 칼자루 복원 전체 프롬프트
```text
Use case: precise-object-edit. Edit target is this transparent 2x2 four in-between full-body Scarlet sprite sheet. Fix ONE missing accessory in TOP RIGHT CELL ONLY: restore the sheathed sword hilt and gold round pommel at anatomical LEFT waist (screen-right of red sash), matching the hilt in top-left cell. Hilt points diagonally upper-right, dark grip with round gold pommel, continuous with gold guard and the existing single scabbard extending back toward lower-left. Place it behind far/left forearm if necessary, but the upper tip of hilt must remain visible above/behind sleeve near waist. Exactly one sword. Do NOT add a second blade or sword.
Preserve EVERY OTHER part of all four cells, especially head, hat, character scale/positions, all arms and legs, foot positions, existing subtle differences among these four walking poses. Anatomical left black crisscross leg stays fixed; right plain white pink zigzag leg stays fixed. Do not change costume, head angles or hair. Keep same transparent 2x2 layout and margins. True transparent background, no shadows/labels/text.
```

