# 홍련 SW 전신 걷기 V2 — 8프레임

사용자가 SW 주요 네 자세를 확인하고 진행을 요청하여, 기존 전신 기준 자세에 중간 전신 자세 네 컷을 추가했다. 다음 방향 NE/NW는 아직 확장하지 않았다.

## 원본과 결과 경로
결과 폴더: apps/client/public/sprites/scarlet/fullframe-sw-v2/
- source-keys.png: 사용자가 확인한 fullframe-sw-v1/source-keys-fixed.png를 복사한 기준 자세. 새로 그리지 않음.
- source-inbetweens.png: 새 2×2 중간 자세 생성 원본. A=기준1→2, B=2→3, C=3→4, D=4→1.
- frame-1.png ~ frame-8.png: 투명 96×96 전신 컷.
- walk.png: 768×96 가로 8셀.
- walk-contact-4x.png: 4열×2행, 최근접 4배 확대.
- walk-preview.gif: 288×288, 약 12 FPS, PNG와 같은 픽셀을 재생.
- walk.json: 공통 크롭/축소율, 정수 이동량, 셀 대응, 픽셀 해시 및 색 수.

검수: /scarlet-frames.html?direction=sw. 같은 방향의 이전 4컷과 새 8컷 비교, SE 8컷 전환, 속도/정지/한 컷 이동/어니언 스킨/기준선.
놀이터: /?scarlet=frames-front-v2. SE/SW 모두 8컷 12 FPS. 이전 frames-front-v1은 SE8/SW4로 유지.
화면 기록: docs/art/pixel/scarlet-sw-fullwalk-v2-review.png.

## 제작 방식과 검토
기준1,A,기준2,B,기준3,C,기준4,D 순서. 캐릭터 자신의 왼다리 검은 교차 끈, 오른다리 흰 스타킹과 분홍 지그재그, 왼쪽 가까운 허리의 칼을 유지하도록 생성했다. 컷은 모두 전신 그림이며 관절 부품 회전이나 이미지 간 크로스페이드로 만들지 않았다.

기준 원본의 머리/모자/의상/칼집을 참고했고, 중간 컷에도 몸통/어깨/반대 팔과 옷 움직임을 포함했다. 칼은 같은 허리에서 이어지며 일부 컷에서 소매에 가려진다. 작은 픽셀 클러스터 차이, 발 이동 궤적/미끄러짐과 팔 스윙 정도는 반복 재생에서 추가 검토할 부분이다. 자동 규격 검사만으로 작화·해부학·보행의 완성을 판정하지 않는다.

## 패키징/검증
- tools/art/export-scarlet-sw-fullwalk.ps1 → ScarletFullWalk.cs.
- tools/art/pack-scarlet-fullwalk-gif.ps1에 Output 인자를 추가하여 SW GIF도 같은 패키징 코드 사용. SE 기본 인자는 유지.
- 동일 1254×1254 원본 2개, 셀 627×627. 8컷 공통 크롭 [115,6,458,619], 단일 축소율 0.13247172859450726.
- 최근접 축소 후 기존 32색 팔레트. 모자 가로 중심 x=48, 최하단 불투명 픽셀 y=87로 정수 이동. 각 컷 별도 확대/축소 없음.
- 기준 원본은 같지만 새 8컷 전체 공통 크롭/축소율로 다시 패키징했으므로 이전 4컷 PNG와 픽셀 해시가 같다는 의미는 아니다.
- 8개의 서로 다른 전신 픽셀 해시, 96×96/각32색/잘림 없음. 발 기준 (48,88).
- GIF 8컷 디코드와 PNG 3배 픽셀 비교 불일치 0.
- npm.cmd run build 성공, npm.cmd test 28개 통과. 기존 3D character 번들 크기 경고는 유지.
- 브라우저: SW 1→…→8→1, 이전 SW4/SE8 전환 및 다운로드 링크, 겹쳐 보기/기준선, 느린 재생 확인. 놀이터 SE8·SW8 표시 및 검수/놀이터 오류 로그 없음.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-sw-fullwalk.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/pack-scarlet-fullwalk-gif.ps1 -Source apps/client/public/sprites/scarlet/fullframe-sw-v2/walk.png -Output apps/client/public/sprites/scarlet/fullframe-sw-v2/walk-preview.gif
npm.cmd run build
npm.cmd test
```

## 이미지 생성 도구와 전체 프롬프트
built-in image_gen.imagegen, transparent_background=true. 입력은 SW V1 source-keys-fixed.png, 외형 및 주요 자세 참고 역할이다. 결과는 기본 generated_images에 보존하고 프로젝트로 복사했다. 모델/seed는 도구가 제공하지 않았다.

```text
Use case: identity-preserve.
Reference is approved Scarlet SOUTHWEST front-left full-body walking KEY POSES in a transparent 2x2 sheet, row-major key1,key2,key3,key4. Make FOUR NEW complete full-body pixel-art IN-BETWEEN cels to interleave as key1,A,key2,B,key3,C,key4,D,key1. Return ONLY new A B C D in transparent equal-square 2x2 grid.
Preserve this EXACT face, head/hat size, ivory hat two gold horns/purple ring/tassels, amber eyes, lavender hair, red sash, white/purple/gold outfit. Same camera slightly above front-left, face and all boot toes point LOWER LEFT. Constant scale, hat angle, body center and planted sole ground line across cells. Ample transparent margins at same scale as reference. Clean pixel clusters for 96x96 reduction, no painterly blur. No mirror.
ANATOMY: character LEFT BLACK CRISSCROSS stocking attached to nearer SCREEN-RIGHT hip. RIGHT PLAIN WHITE with small pink zigzag attached farther SCREEN-LEFT hip. Textures stay attached to SAME legs through crossing. Black left leg may reach diagonally down-left across front but must originate screen-right hip. Never move straps to plain leg. Never give both legs black straps.
A TOP LEFT, between key1/key2: LEFT BLACK foot takes weight and moves toward under screen-right hip as body advances, RIGHT PLAIN foot just lifts from behind with modest knee bend. LEFT NEAR ARM (screen-right shoulder) eases from back/outside screen-right toward neutral; RIGHT FAR ARM eases from forward toward neutral. Subtle body settle.
B TOP RIGHT, between key2/key3: LEFT BLACK supports/trails from screen-right hip, RIGHT PLAIN reaches FORWARD LOWER LEFT from screen-left hip, heel almost contacting ground. LEFT NEAR ARM eases FORWARD lower-left across torso, RIGHT FAR ARM eases back. White foot stays plain even when overlapping black calf.
C BOTTOM LEFT, between key3/key4: RIGHT PLAIN foot takes weight in front, LEFT BLACK bends and begins lifting behind from near screen-right hip. LEFT NEAR ARM eases from forward toward neutral, RIGHT FAR ARM toward neutral. Modest body settle.
D BOTTOM RIGHT, between key4/key1: RIGHT PLAIN remains planted/trailing, LEFT BLACK reaches FORWARD LOWER LEFT from screen-right hip, heel nearly touching ground. LEFT NEAR ARM eases BACK toward screen-right outside coat, RIGHT FAR ARM forward toward lower-left. Connect back into reference key1 with restrained step.
All NEW cels are modest intermediate poses, not copies of reference keys or high-knee marching. Torso/pelvis/shoulder/cloth/hair respond subtly together, no frozen upper body and rotated legs.
SWORD invariant: exactly one SHEATHED sword on anatomical LEFT NEAR waist, screen-right end of red sash. SHORT dark HILT with round gold pommel points UP-LEFT, gold GUARD at waist, long thin dark SCABBARD with gold end trails DOWN-RIGHT behind near hip and coat, all one continuous diagonal axis. Do not reverse weapon or omit forward hilt; sleeve may occlude small portion naturally. No exposed blade/extra sword. Hair is one loose curtain only tied low BACK CENTER, hidden behind, no side ponytail.
No labels/text/numbers/guides/shadows/floor. True transparent background. Exactly four full-body new cels, A B C D.
```

