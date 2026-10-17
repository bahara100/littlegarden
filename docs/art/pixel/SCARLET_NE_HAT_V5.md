# 홍련 NE V5 — 갓 뿔 배치 방향 수정

사용자가 뒤오른쪽 갓의 뿔 방향 오류를 지적했다. 앞오른쪽 배치를 그대로 복제한 두 뿔의 배치축을 후면 시점에 맞춰 고쳤다. NE에서는 화면 왼쪽 뿔의 밑동이 위/뒤쪽, 오른쪽 뿔의 밑동이 아래/앞쪽으로 보이며 두 밑동을 잇는 축이 좌상→우하로 향하도록 편집했다. 뿔은 여전히 위로 솟고, 주변 보라색 줄의 가림 관계도 이에 맞췄다.

## 결과와 보존 범위
모든 결과: apps/client/public/sprites/scarlet/fullframe-ne-v5/
- source-horn-edit.png: 내장 이미지 도구가 표시한 중간 편집 결과. 전체 몸을 최종본으로 채택하지 않는다.
- **source-keys.png: 최종 합성 고해상도 2×2. 모자 윗부분만 편집 결과를 쓰고 아래는 V4 원본 픽셀을 유지했다.**
- frame-1.png ~ frame-4.png, walk.png(384×96), walk-contact-4x.png.
- **walk-preview-2x2.png(768×768): 실제 재생 컷의 최근접 4배 확대 최종 미리보기. 사용자에게 보여주는 결과는 이 파일이다.**
- walk.json: 버전5, 유지한 등록 변환, 수정 영역 capRows [0,30], PNG 파일 해시.
내보내기: tools/art/export-scarlet-ne-hat-v5.ps1, ScarletHatReplacement.cs.
검수: /scarlet-frames.html?direction=ne.
놀이터: /?scarlet=frames-ne-v5. 이전 NE URL도 최신 시트를 사용한다.

기존 V4의 공통 축소율과 각 프레임의 등록 이동량을 그대로 사용했다. 렌더 캔버스 y=0..30 영역만 교체하고 y=31..95는 PNG 원본을 복사했다. 새로운 뿔 모양을 기준으로 캐릭터를 다시 확대/축소하거나 위치를 맞추지 않았다. 따라서 다리 무늬, 1번 초기 자세, 방향을 고친 3번, 몸통/머리카락/칼집/팔은 바뀌지 않았다.

## 검증
각 컷의 기존 대비 모자 윗부분 변경 픽셀 수는 418/552/466/505, 아래 부분 변경 픽셀 수는 모두 0. 각32색, 알파0/255.
tools/art/verify-scarlet-preview.ps1로 실제 walk.png와 최종 2×2 미리보기 모든 픽셀 비교 불일치0.
빌드 성공. 브라우저 새로고침 후 실제 시트와 정지 미리보기 링크가 모두 V5를 가리키는 것을 확인했고 오류 로그 없음.
뿔 배치 수정의 시각 확인과 보존 범위 검사이며, 전체 보행/해부학 완성 판정은 아니다. NE는 여전히 주요 4컷 검수 단계, 8컷/NW는 미완료다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-ne-hat-v5.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/verify-scarlet-preview.ps1 -Folder apps/client/public/sprites/scarlet/fullframe-ne-v5
npm.cmd run build
```

## 이미지 편집 도구·입력
built-in image_gen.imagegen, transparent_background=true.
입력1: NE V4/source-keys.png(최종 조합 편집 대상).
입력2: SE V2/source-keys.png(물체 형태/외형 참고, SE 배치 방향을 NE에 복제하지 않도록 명시).
기본 generated_images 원본 보존 후 프로젝트로 복사했다. 모델/seed는 도구가 제공하지 않았다. raw 편집본은 중간 결과이며, 최종 표시에는 실제 게임 PNG에서 패키징한 2×2만 사용한다.

## 전체 프롬프트
```text
Use case: precise-object-edit.
EDIT TARGET image1: the FINAL COMPOSITED Scarlet NE rear-view four-cel sheet. Image2: approved SE front-right sheet, reference only for the physical ivory hat / purple ring / two gold horns; DO NOT copy its front-view horn arrangement into the rear view.
Correct ONLY the TWO GOLD HORNS AND THEIR LOCAL PURPLE-RING OCCLUSION in ALL FOUR cells of image1. The current horn pair sits on the WRONG DIAGONAL copied from SE front view. The character walks NORTHEAST upper-right, so the hat's LEFT-RIGHT horn mounting axis must project upper-LEFT to lower-RIGHT, not lower-left to upper-right.
NE CORRECT SPATIAL ORDER:
- SCREEN-LEFT horn is FARTHER from viewer: place its BASE farther BACK / HIGHER on the hat/purple ring, slightly smaller from perspective. It rises from upper-left/back arc of purple ring.
- SCREEN-RIGHT horn is NEARER viewer: place its BASE farther FORWARD / LOWER on ring, slightly larger/taller. It rises from lower-right/front arc of purple ring, overlapping in front of front ring strand naturally.
- The line joining horn BASES must clearly slope DOWN TO THE RIGHT (left base above right base). The old version has the opposite slope; do not keep it.
Keep two gold upward tapered horns with subtle same backward lean and matching gold shading. Do NOT turn them into horizontal tusks or sideways arrows. This is changing the mounting positions/front-back perspective, not flipping the whole hat. Near right horn can partly overlap the front purple rope; far left horn emerges behind back rope. Keep only two horns, both properly rooted, no floating horns or extra stumps.
Approximate relative target on each 627x627 cell: far LEFT base around(x305,y135); near RIGHT base around(x410,y180). Preserve each cell's existing vertical registration/bob; these coordinates are conceptual relative to first cell and should shift with existing hat on other cells. Don't impose a new hat center or rescale. Both tips point upward with very slight backward bend, left tip higher/farther, right horn foreground. Keep head direction NE fixed.
ABSOLUTE PRESERVE: hat ivory brim/surface/flower/tassels, head, back hair and its SINGLE low center hair-end tie, torso, sword, arms, coat, red sash, legs/stocking textures/feet, original poses, pixel-art style, exact existing cell registration/scale. In pose1 long foreground RIGHT calf remains PLAIN WHITE, short rear LEFT calf BLACK STRAPS. Pose3 must retain its corrected leg orientation. Do not touch any lower-body art.
Output same four full-body cels in transparent equal-square 2x2 grid, same margins, no labels/shadows/background. Only horn pair mounting and small adjacent purple cord areas may change.
```

