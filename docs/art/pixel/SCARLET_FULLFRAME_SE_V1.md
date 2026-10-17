# 홍련 SE 전신 프레임 초안 V1

## 제작 결과와 범위
- 최신 사용자 결정에 따라 전신 완성 컷 → 스프라이트 시트 → 사각형을 잘라 재생하는 방식을 적용했다.
- 앞오른쪽(SE) 한 방향, 주요 자세 4개만 제작했다. 중간 자세/8프레임/다른 방향은 아직 제작하지 않는다.
- 원본 생성 후 1·3번 팔의 타이밍을 이미지 생성 도구로 수정했다. 블랙 교차 끈은 캐릭터 왼다리, 흰 스타킹은 오른다리다.
- 생성 초안의 모자·몸통 윤곽 및 발 높이에는 컷별 편차가 남는다. 관절 시뮬레이션이 아니라 실제 전신 이미지 간 연결을 검토하는 후보이며, 완성 보행으로 승인된 상태가 아니다.
- 공통 크롭/공통 축소율을 사용했다. 각 컷을 따로 확대/축소하거나 부품 회전으로 재생하지 않는다. 발 기준선 y=88은 공통 캔버스 기준이며 모든 발이 동일한 행에 접지했다는 보장은 아니다.
- 다음 보정은 캐릭터 크기·모자 윤곽·접지 및 3→4→1의 체중 이동을 먼저 맞추는 것이다. 반복 재생에서 확인한 뒤 중간 컷을 늘린다.

## 파일
- 참고: apps/client/public/sprites/scarlet/scarlet-se-idle-base-v3-4x.png
- 의상 참고: apps/client/public/sprites/scarlet/scarlet-se-idle-base-v3-source.png
- 자세/좌우 소유권 가이드: docs/art/pixel/scarlet-se-fullframe-plan.png
- 첫 생성: apps/client/public/sprites/scarlet/fullframe-se-v1/source.png
- 팔 수정 후 선택한 원본: apps/client/public/sprites/scarlet/fullframe-se-v1/source-arm-fixed.png
- 개별 컷: 동일 폴더 frame-1.png ~ frame-4.png (96×96)
- 시트: 동일 폴더 walk-keyframes.png (384×96), walk-keyframes-4x.png (1536×384)
- 변환 메타데이터: 동일 폴더 walk-keyframes.json
- 팔레트: tools/art/scarlet-palette.json (32색)
- 변환: tools/art/export-scarlet-fullframes.ps1, ScarletSequence.cs
- 검수 페이지: /scarlet-frames.html
- 놀이터 시험: /?scarlet=frames-se-v1 (SE에서만 새 걷기, 다른 방향은 기본 자세)
- 화면 기록: docs/art/pixel/scarlet-fullframes-se-v1-review.png

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-fullframes.ps1 -Source apps/client/public/sprites/scarlet/fullframe-se-v1/source-arm-fixed.png
npm.cmd run build
npm.cmd test
```

투명도 180 이상인 최대 연결 성분을 각 셀에서 찾고, 네 셀의 합집합 크롭을 사용한다. 동일한 최근접 축소와 팔레트 매핑을 적용하며 픽셀을 회전시키지 않는다. 기계 검사는 파일 규격 검사이며 작화 품질 검사가 아니다.

## 생성 도구와 원본
built-in image_gen.imagegen, transparent_background=true. 최초 호출은 위 3개 참고 이미지, 수정 호출은 첫 생성 PNG를 입력했다. 모델/seed는 도구에서 제공하지 않았다. 생성 원본은 기본 generated_images 위치에 보존하고 프로젝트에 복사했다.

## 최초 생성 전체 프롬프트
```text
Use case: identity-preserve. Make FOUR finished full-body pixel-art walk KEY POSES for one coherent Scarlet character in a transparent 2x2 sprite sheet, read row-major 1,2,3,4. These are complete hand-drawn-style animation cels, NOT separated puppet parts or rotated limbs.
Image 1 is approved 96px pixel character/style reference. Image 2 supplies costume details. Image 3 is a schematic of FOUR poses and permanent leg identities; copy its leg assignment and foot tracks, NOT its gray drawing style or long legs.
Camera fixed front three-quarter facing LOWER RIGHT southeast in every cell. Short SD proportions, same hat/head/body scale, same costume and face across the four cels. Clean pixel clusters and restrained shading for 96x96 reduction, no blurred or painted edges.
CRITICAL IDENTITY: anatomical LEFT leg is attached to the SCREEN-RIGHT hip and ALWAYS has BLACK CRISSCROSS STRAPS over white stocking. Anatomical RIGHT leg attached SCREEN-LEFT hip is ALWAYS PLAIN WHITE with a small pink zigzag. Never move the straps onto the plain leg when poses change. Never mirror the character. Both boot toes keep pointing LOWER RIGHT in every pose.
Frame 1 top-left: black-strapped LEFT foot forward/down-right, plain RIGHT foot back/up-left. Right near arm swings gently forward, left far arm back; small weight shift over the forward left foot.
Frame 2 top-right: LEFT black leg supports under its screen-right hip; RIGHT plain white foot passes slightly lifted under screen-left hip. Small knee bend, NO high-knee march. Pelvis/head about one logical pixel higher, arms passing neutral.
Frame 3 bottom-left: RIGHT PLAIN WHITE foot moves forward/down-right from its screen-left hip and overlaps in FRONT of the trailing LEFT black leg. LEFT black leg stays attached to screen-right hip, behind, still with its own black straps. Left far arm gently forward, right near arm back. Do not paint black straps on the forward white calf!
Frame 4 bottom-right: RIGHT plain white leg supports screen-left hip; LEFT black-strapped foot passes slightly lifted under screen-right hip. Opposite leg from frame 2. Same modest whole-body rise and neutral passing arms. Small step into frame 1.
Every pose must show coherent pelvis, torso, shoulder and arm response, not a frozen upper body. Subtle changes, no wild head rotation. Preserve ivory hat with two gold horns/purple ring/tassels, amber eyes, one loose lavender hair curtain tied only at low BACK CENTER (hidden here), white purple gold robe, red sash, single sheathed sword at anatomical left waist on screen right. No side ponytail. No missing/duplicated sword.
Uniform four equal square cells, exact matching registration: same hat center and planted-foot baseline, ample transparent margins inside each cell, no cut off parts, no floor shadows, no text, no numbers, no guides in final output. True transparency.
```

## 팔 수정 전체 프롬프트
```text
Use case: precise-object-edit. Edit this existing transparent 2x2 Scarlet southeast walk sheet. KEEP head/hat/hair/costume/torso/legs/feet/sword positions and identities as unchanged as possible. Keep same four square cells and same registration.
Change ONLY ARM SWING in TOP LEFT frame 1 and BOTTOM LEFT frame 3 so arms oppose the forward leg.
FRAME 1 top-left: black-strapped LEFT foot is forward; RIGHT ARM (near arm attached at SCREEN LEFT shoulder, white bell sleeve) must swing gently FORWARD toward LOWER RIGHT, hand nearer belly/front of red sash. LEFT ARM (far arm at SCREEN RIGHT shoulder) swings BACK toward upper-left, tucked near waist.
FRAME 3 bottom-left: plain white RIGHT foot is forward; RIGHT ARM (near SCREEN LEFT shoulder) must swing BACK toward lower-left/outside the left coat edge, hand to left of its own shoulder, away from belly. LEFT ARM (far SCREEN RIGHT shoulder) swings FORWARD toward lower-right just outside right side of torso.
In short, move the near arm FORWARD across the belly in frame1, and BACK outside the screen-left coat edge in frame3. These two near-arm actions must be opposite; do not keep the original timing.
Keep passing-arm poses in frames2 and4 neutral, and do not change ANY leg: black straps permanently on anatomical LEFT leg, plain white permanently RIGHT. Keep both boot toes down-right. No arm duplicated on torso. Full character finished pixel-art cels, not cutouts. Same source pixel-art style, no new accessories or tied side hair. No labels, no shadows. True transparent background.
```

