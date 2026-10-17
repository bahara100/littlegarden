# 홍련 SW 주요 전신 자세 V1

사용자는 앞오른쪽(SE) 8프레임의 개선을 확인했고 이를 품질 기준으로 삼아 앞왼쪽(SW) → 뒤오른쪽 → 뒤왼쪽으로 확장하는 방식을 승인했다. 이번 결과는 SW 주요 자세 **4컷 검수본**이다. 중간 컷/뒤쪽 두 방향은 아직 제작하지 않는다.

## 결과/파일
- 입력 외형·품질 참고: apps/client/public/sprites/scarlet/fullframe-se-v2/source-keys.png
- 새 원본: apps/client/public/sprites/scarlet/fullframe-sw-v1/source-keys.png
- 칼자루 연결 보정 후 선택 원본: 동일 폴더 source-keys-fixed.png
- 96×96 개별 컷: 동일 폴더 frame-1.png ~ frame-4.png
- 가로 384×96 시트: 동일 폴더 walk.png
- 4배 확대 4컷 비교: 동일 폴더 walk-contact-4x.png
- 메타데이터: 동일 폴더 walk.json
- 검수 화면: /scarlet-frames.html?direction=sw
- 놀이터 시험: /?scarlet=frames-front-v1 (SE 8컷 / SW 4컷, 뒤쪽 정지 자세)
- 화면 기록: docs/art/pixel/scarlet-sw-keys-v1-review.png
- 생성 도구: built-in image_gen.imagegen, transparent_background=true. 원본은 기본 generated_images에 보존 후 프로젝트에 복사. 모델/seed는 도구가 제공하지 않음.

## 작화 기준과 검토
단순 좌우 반전하지 않고 반대 카메라에서 전신 자세를 새로 생성했다. SW에서는 캐릭터 왼쪽이 가까워진다. LEFT 검은 교차 끈, RIGHT 분홍 지그재그 흰 스타킹, LEFT 허리 칼을 유지하도록 제작했다. 1번 검은 왼발 접지 → 2번 흰 오른발 통과 → 3번 흰 오른발 접지 → 4번 검은 왼발 통과 순서다. 칼집은 가까운 왼쪽 허리에서 뒤로 이어지고 칼자루를 전방에 보정했다. 3번에서는 가까운 팔/소매가 일부를 가린다.

현재 96픽셀에서 무릎/칼자루가 작게 보이고, 컷별 도트 클러스터와 상체 변화/발 접지는 추가 확인 대상이다. 네 컷의 좌우 의상과 3→4→1 연결을 확인한 다음 중간 자세를 추가한다. 자동 규격 검사를 자연스러운 보행/해부학/작화의 완성 판정으로 취급하지 않는다.

## 패키징과 확인
tools/art/ScarletFullWalk.cs에 기존 8컷 기본 동작을 유지하면서 4컷/방향 인자를 추가했다.
tools/art/export-scarlet-sw-keys.ps1로 출력:
- 공통 크롭 [121,8,447,617], 모든 컷 동일 축소율 0.13290113452188007.
- 최근접 축소, 공통 32색 팔레트, 모자 중심 x=48 정수 이동, 최하단 불투명 픽셀 y=87. 프레임별 독립 확대/축소 없음.
- 네 컷 서로 다른 픽셀 해시, 색 수 32, 내용 잘림 없음.
- 기존 SE 내보내기도 재실행 후 walk.png 파일 해시가 동일함을 확인했다.
- 빌드 성공, 기존 테스트 28개 통과.
- 브라우저에서 SW 1→2→3→4→1, 겹쳐 보기/기준선, SE 8컷 전환, 놀이터 시험 URL의 두 방향 모드 표시 확인. 검수/놀이터 오류 로그 없음.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-sw-keys.ps1
npm.cmd run build
npm.cmd test
```

## SW 주요 자세 전체 생성 프롬프트
```text
Use case: identity-preserve.
Reference image is the user-approved Scarlet SE pixel-art four-key-pose sprite sheet. Create the SAME character, same chibi proportions and pixel-art rendering quality, as FOUR full-body walking key poses viewed from the OTHER FRONT THREE-QUARTER CAMERA: facing LOWER LEFT southwest. A transparent 2x2 sheet, row-major 1,2,3,4, four equal square cells. This is a new anatomical view, NOT a horizontal mirror.
Camera fixed slightly above in isometric front-left three-quarter. Face/eyes/nose and BOTH boot toes point LOWER LEFT in EVERY cell. Character's anatomical LEFT side is NOW the nearer side. Head and hat identical size and direction across four cels, subtle bob only. Consistent ground and body registration; generous transparent margins. Clean pixel clusters suitable for 96x96 reduction, restrained shading, no blur.
ABSOLUTE ANATOMICAL IDENTITY: anatomical LEFT leg is at SCREEN-RIGHT hip, nearer camera, BLACK CRISSCROSS STRAPS stocking. Anatomical RIGHT leg at SCREEN-LEFT hip, farther camera, PLAIN WHITE stocking with small pink zigzag. Even while facing lower-left the black straps MUST stay on screen-right hip's leg, plain white stays on screen-left hip's leg. Never mirror the textures from the reference. Do not put black straps on whichever leg is in front.
ONE sheathed sword remains attached to anatomical LEFT waist, the nearer SCREEN-RIGHT side. It should be more clearly visible than in reference: continuous dark hilt with gold pommel/guard at left waist, scabbard trails backward toward lower-right behind near-side hip/coat; hilt points forward upper-left. Do not relocate sword to far screen-left waist. No bare blade, no second sword. Preserve ivory hat/two gold horns/purple ring/tassels, amber eyes, lavender loose single hair curtain with only its low end tied at BACK CENTER hidden behind, white-purple-gold robe/red sash. The asymmetric decorations must stay on same anatomical costume panels.
1 TOP LEFT: LEFT BLACK foot forward toward LOWER LEFT, RIGHT PLAIN foot back toward upper-right. LEFT near arm (screen-right shoulder) swings BACK toward screen-right outside coat, RIGHT far arm swings gently FORWARD toward lower-left across front. Soft weight transfer onto left.
2 TOP RIGHT: LEFT BLACK foot planted under screen-right hip; RIGHT PLAIN foot passes slightly raised under screen-left hip. Modest bent knee, no high-knee march. Both arms near neutral, pelvis one logical pixel higher.
3 BOTTOM LEFT: RIGHT PLAIN foot forward toward LOWER LEFT; LEFT BLACK foot trailing from screen-right hip, partly obscured if overlapping but retains black straps. LEFT near arm (screen-right shoulder) swings gently FORWARD toward lower-left across torso; RIGHT far arm swings BACK. Plain front foot must never acquire black straps.
4 BOTTOM RIGHT: RIGHT PLAIN foot supports under screen-left hip; LEFT BLACK foot passes slightly lifted from screen-right hip, modest knee bend. Arms near neutral, opposite leg from frame2.
Four finished whole-body cels: coherent torso/pelvis/shoulders/arms/cloth response, not static upper body with rotated legs. Preserve head appearance between frames. True transparency, no text/numbers/guides/shadows/floor. Exactly four cells 2x2, no extra characters.
```

## 칼자루 연결 보정 전체 프롬프트
```text
Use case: precise-object-edit. Edit target: this transparent 2x2 four southwest Scarlet walking keyframes. Keep ALL character poses, heads, hat scale, legs, arms, clothing and registration unchanged. Fix ONLY the single sheathed sword in each of the four cels.
The sword is mounted at anatomical LEFT waist (near side, SCREEN-RIGHT end of red sash). Each currently has a long dark scabbard trailing down-right behind near hip/coat but lacks a clear forward hilt. Keep existing scabbard trailing down-right. At its upper-left end/waist gold guard, add ONE SHORT dark wrapped HILT pointing diagonally UP-LEFT toward the front of the torso, ending in a small ROUND GOLD POMMEL. Hilt → guard at left waist → scabbard trailing down-right must form ONE continuous diagonal axis. The hand/sleeve may overlap it naturally but visible portion of grip/pommel should show on front side of guard. No exposed blade, no extra sword or extra tube, no floating gold blob. Preserve dark thin scabbard and gold end cap. Keep sword attachment at same anatomical LEFT/near waist all four frames.
Absolutely preserve legs: LEFT black-crisscross stocking, RIGHT plain white pink zigzag, same poses and boot locations. Keep all faces and toes southwest LOWER LEFT. Same pixel art style and full-body 2x2 sheet. True transparent background, no new text/guides/shadows.
```

