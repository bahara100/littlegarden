# 홍련 NE 주요 전신 자세 V1

> 이후 사용자가 좌우 다리 디자인이 바뀌는 오류를 지적한 이전 버전이다. 컷 재정렬만으로 해결되지 않았다. 후속 기준은 SCARLET_NE_LEGS_V2.md 및 fullframe-ne-v2/source-keys-grounded.png로 교체한다.

SW 8프레임을 사용자가 확인하고 다른 방향 진행을 요청했다. 순서에 따라 NE(뒤오른쪽)의 주요 네 자세를 제작했다. 현재는 4컷 검수본이며 NE 중간 자세나 NW 방향은 아직 제작하지 않는다.

## 파일과 제작
폴더: apps/client/public/sprites/scarlet/fullframe-ne-v1/
- source-keys.png: 생성된 1254×1254 원본 2×2. **원본 행 순서는 기존 접지 기준과 반대 반주기에서 시작한다.**
- source-keys-ordered.png: 원본 셀을 [3,4,1,2] 순서로 재포장한 고해상도 2×2. **다음 NE 중간 컷 생성/8컷 확장에는 이 정렬된 원본을 기준으로 사용할 것.** 셀 내용은 회전/반전/재작화하지 않았다.
- frame-1.png ~ frame-4.png: 정렬 후 투명 96×96 전신 컷.
- walk.png: 정렬 후 384×96 가로 시트.
- walk-contact-4x.png: 정렬 후 네 컷 4배 확대 비교.
- walk.json: 원본 셀 번호 대응, 크롭·단일 축소율, 정수 정렬 이동량, 픽셀 해시, 색 수.
검수: /scarlet-frames.html?direction=ne
놀이터: /?scarlet=frames-ne-v1 (SE8/SW8/NE4, NW는 기존 정지 자세)
화면 기록: docs/art/pixel/scarlet-ne-keys-v1-review.png
변환: tools/art/export-scarlet-ne-keys.ps1 → ScarletFullWalk.cs.

## 외형과 순서
후면 좌측에서 본 카메라, 이동 방향 ↗. 풀어진 보라 머리의 낮은 끝만 등 뒤 중앙 한곳에서 묶는다. 근위 왼다리 검은 끈, 원위 오른다리 흰 스타킹, 왼쪽 허리의 단일 칼집을 유지하도록 생성했다. 칼은 허리 높이에서 머리카락에 일부 가려지고, 칼집은 뒤/아래왼쪽으로 이어지며 자루는 앞/위오른쪽으로 향한다.

생성 원본은 오른발 접지/왼발 통과/왼발 접지/오른발 통과 순서로 시작하므로, **전신 컷 전체를 [3,4,1,2]로 순환 이동**해 기존 왼발 접지 → 오른발 통과 → 오른발 접지 → 왼발 통과에 맞췄다. 텍스처를 다른 다리에 옮긴 것이 아니며, 엔진은 이 정렬된 전신 프레임만 잘라 재생한다.

후면에서 가려지는 다리/칼집 구간, 컷별 머리 높이와 발 접지·체중 이동은 추가 확인 대상이다. 바닥 최하단 정렬은 물리적인 발 접지나 자연스러운 보행을 보장하지 않는다. 현재 주요 4컷을 확인한 후에만 중간 자세를 늘린다.

## 검증
- 공통 셀 627×627, 공통 크롭 [135,35,393,581], 단일 축소율 0.14113597246127366.
- 모든 컷 최근접 축소, 기존 고정 팔레트, 31~32색. 모자 가로 중심 x=48, 최하단 픽셀 y=87. 기준 (48,88).
- 네 컷 서로 다른 픽셀 해시, 내용 잘림 없음. 각 컷 따로 확대/축소하지 않음.
- 내보내기에 선택적 cellOrder 인자를 추가. 기존 SE 8컷 내보내기 재실행 후 walk.png 해시 동일.
- 런타임은 로드한 시트의 실제 셀 수에 맞춰 4컷은 6 FPS/8컷은 12 FPS로 재생. NE에서 앞쪽 8컷 인덱스를 잘못 사용하지 않음.
- 빌드 성공, 기존 테스트 28개 통과. 기존 3D character 번들 경고 유지.
- 브라우저에서 NE 1→2→3→4→1, 어니언 스킨/기준선, SW8 전환, NE 놀이터 표시/검수 링크 확인. 검수/놀이터 오류 로그 없음.
- 이 검증은 이미지 규격/재생 동작에 관한 것이며 해부학·작화 품질의 자동 판정이 아니다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-ne-keys.ps1
npm.cmd run build
npm.cmd test
```

## 이미지 생성 도구와 입력
built-in image_gen.imagegen, transparent_background=true.
입력1: fullframe-se-v2/source-keys.png (외형/품질/전신 자세 참고).
입력2: scarlet-ne-idle-four-v2.png (과거 후면 머리 묶음/의상 참고만, 작화 품질·다리 디자인의 기준 아님).
기본 generated_images의 원본은 보존하고 프로젝트로 복사했다. 모델/seed는 도구가 제공하지 않았다.

## 전체 프롬프트
```text
Use case: identity-preserve.
Image1 is approved Scarlet full-body front walking sprite sheet: use as EXACT identity, chibi proportions, costume, pixel-art quality and four-phase timing reference. Image2 is an OLD tiny back-right view: use only as secondary clue for the single center hair tie and back-side costume, NOT as rendering-quality target or authoritative limb design.
Create FOUR NEW whole-body walk KEY POSES in REAR THREE-QUARTER view walking toward UPPER RIGHT (northeast, away from viewer). Transparent 2x2 equal-square grid row-major 1,2,3,4, same registration/scale/baseline all cells, generous transparent margins. Same short SD proportions and ivory/gold/purple/red/lavender palette as Image1. Clean pixel clusters intended for 96x96, restrained shading, no blur. No mirror.
CAMERA: slightly elevated isometric BACK-LEFT camera looking at the character's BACK and LEFT side, with direction of travel UPPER RIGHT. Show mostly back of hat/hair and back/left shoulder. A tiny edge of cheek may appear at screen-right but NO frontal face, no two eyes looking at viewer. Same hat angle/size in all frames: ivory hat, two gold horns, purple ring/tassels.
HAIR CRITICAL: a single restrained lavender curtain of LOOSE LONG HAIR down the back, narrowing only at its LOW ENDS into ONE SMALL TIE at anatomical SPINE/BACK CENTER. This is loose hair with one low center end tie, NOT a ponytail emerging from a high tie. NO twin tails, no two side bundles, no side ponytail, no second tie. Tie remains centered on back through subtle walk sway. Keep enough leg/boot visible below hair and robe to read leg identities and gait.
PERMANENT ANATOMY for BACK VIEW: LEFT leg attaches to SCREEN-LEFT/NEAR hip and wears BLACK CRISSCROSS stocking. RIGHT leg attaches SCREEN-RIGHT/FAR hip and is PLAIN WHITE with small pink zigzag (back may be plain). Same legs as front reference, NOT swapped according to which foot leads. All boot toes point UPPER RIGHT and heels face toward viewer lower-left.
SWORD: ONE sheathed sword on anatomical LEFT waist, nearer SCREEN-LEFT side, visible along OUTSIDE LEFT edge of hair/coat. Short dark grip with round GOLD pommel points forward UPPER RIGHT, gold guard at left waist, thin DARK SCABBARD with gold end cap trails backward LOWER LEFT. Hilt-guard-scabbard one continuous diagonal axis at HIP level. Hair may occlude middle portion naturally but visible ends align. Do NOT hang a sword across the back/shoulders, do not put sword on screen-right hip, do not expose blade or duplicate sword.
Four poses:
1 TOP LEFT LEFT BLACK FOOT CONTACT: black LEFT foot steps forward/up-right from near screen-left hip, right PLAIN foot trails back/down-left from far screen-right hip. LEFT near arm back/down-left outside left coat, RIGHT far arm forward/up-right. Soft weight transfer, modest stride.
2 TOP RIGHT RIGHT FOOT PASSING: LEFT BLACK foot planted beneath near screen-left hip; RIGHT PLAIN foot passes slightly lifted beneath far screen-right hip. Small bent knee, not marching. Arms near neutral, coherent slight pelvis/torso rise.
3 BOTTOM LEFT RIGHT PLAIN FOOT CONTACT: RIGHT PLAIN foot reaches forward/up-right from far screen-right hip, LEFT BLACK foot trails back/down-left from near screen-left hip. LEFT near arm forward/up-right, RIGHT far arm backward/down-left. Black straps stay on near left calf, not the forward white calf.
4 BOTTOM RIGHT LEFT FOOT PASSING: RIGHT PLAIN foot supports beneath far screen-right hip; LEFT BLACK foot passes slightly lifted beneath near screen-left hip. Opposite passing leg from2, arms near neutral. Connect gently back to1.
Each cel a complete drawn whole-body pose with coherent pelvis/torso/shoulder/opposite arm/hair/sleeve/robe response, not isolated rotating legs. Uniform hat/head size, subtle bob only, no zoom or head turn between cels. Same single low hair tie and same coherent sheathed sword all four. No labels/text/numbers/guides/shadows/floor. True transparent background, exactly four cells.
```

