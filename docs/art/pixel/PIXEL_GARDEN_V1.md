# 전체 2D 도트 놀이터 전환

2026-10-16. 기본 진입 화면을 Canvas 2D로 변경했다. 마름모 바닥 타일, 벤치·그네·나무·화단·울타리, 홍련·모모·루루를 모두 2D로 표시한다. 기본 게임은 Three.js/WebGL을 불러오지 않는다. 과거 3D 검수 페이지와 소스는 보존했다.

## 아트와 규격

- 내장 image_gen 사용, CLI 미사용.
- 기구 시트: `apps/client/public/sprites/garden/playground-props-v1.png`
- 친구 시트: `apps/client/public/sprites/garden/garden-friends-v1.png`
- 홍련: 기존 `apps/client/public/sprites/scarlet/scarlet-pixel-sheet-v2-iso.png` 재사용.
- 기구 시트는 4열×2행으로 분할하고 투명 여백을 제거한 뒤 128×128 셀로 샘플링한다. 캐릭터는 96×96 셀이다. 바닥 타일과 피크닉 매트·안내판은 캔버스에서 그린다.
- 2:1 마름모 투영과 역투영으로 그림과 클릭 좌표를 맞춘다. 논리 픽셀을 약 2배 확대하고 최근접 보간을 사용한다.
- 기구와 캐릭터는 바닥 좌표 x+z 순서로 그린다. 투명한 기구 여백은 클릭을 통과시킨다. 바닥 타일은 편집 모드에서 바닥 좌표로 선택한다.
- 벤치·그네의 두 방향 이미지를 사용한다. 반대 방향은 좌우 반전한 임시 표현이며, 정확한 뒤쪽 전용 그림이 아니다. 나무·화단은 별도 방향 아트가 없다.

## 기능과 한계

- 기존 A* 경로, 충돌, 자동 산책, 좌석 예약·접근·하차, 편집 검증, 위치 고정, 회전, 보관함, localStorage 및 JSON 백업 형식을 재사용했다. 저장 스키마는 바꾸지 않았다.
- 이동·확대·드래그·선택·꾸미기는 2D 캔버스 입력으로 교체했다. 터치 탭은 지시, 터치 드래그는 화면 이동이다. 모바일 실기기 검증은 하지 않았다.
- 캐릭터는 현재 오른쪽 아래 한 방향이다. 프레임 사이 의상·외형 차이가 남는다.
- 앉기와 인사 전용 프레임은 없다. 이용 시 높이 변화와 상태 기호로 표현하며, 그네 이용자는 조금 움직이지만 그네 이미지의 줄·좌석은 아직 고정이다. 실제 기구 접촉 자세와 앞쪽 부품의 세부 가림은 후속 아트 작업이다.
- 원본 생성 시트는 완전히 정돈된 수작업 제한 팔레트 도트가 아니다.

## 확인

- TypeScript 및 Vite 배포 빌드 통과.
- 테스트 22개 통과: 기존 생활·편집·저장 20개 및 투영/역투영·가림 순서 2개.
- 실제 브라우저에서 도트 에셋 로드, 생활 상태, 기구 배치 좌표 입력 → 위치 고정 → 놓기 → 전체 취소를 확인했다. 검수용 추가 나무는 저장하지 않았다.
- 실제 화면: `pixel-garden-all-v1.jpg`.

## 기구 최종 프롬프트

```text
Create a production game sprite atlas: exactly FOUR columns and TWO rows of equal SQUARE cells. True transparent background. Each cell contains ONE isolated pixel-art isometric playground prop, completely inside its cell with generous margins. Consistent 2:1 diamond isometric camera looking down about 30 degrees, crisp chunky square pixel clusters, dark muted purple outlines, soft sage grass accents, warm cream and honey wood, dusty lavender and peach accents. Cozy detailed but readable Japanese chibi RPG pixel art, not smooth vector or 3D. Layout exact: top row cells left to right: 1 wooden garden BENCH facing screen lower right, 2 same BENCH facing screen lower left, 3 wooden A-frame SWING SET with ropes and single wide seat facing lower right, 4 same SWING SET facing lower left. Bottom row left to right: 5 round leafy green TREE with visible short trunk, 6 small rectangular raised FLOWER BED with pink white yellow flowers, 7 short white wooden PICKET FENCE aligned diagonal upper-left to lower-right, 8 same fence aligned upper-right to lower-left. No ground tiles under objects, no environment, no characters, no text, no numbers, no grid, no checkerboard pattern, no shadows outside the object. Entire tree canopy and swing top must fit, no cropping. All objects aligned near bottom center of their own square cell. 4x2 atlas clean separation. Pixel aesthetic suited to native 128px square cells.
```

## 친구 최종 프롬프트

```text
Use case: stylized-concept. Asset: 2D pixel-art game character sprite atlas, transparent background, exactly FOUR columns by TWO rows equal square cells. Two ORIGINAL cute two-head-tall chibi garden friends viewed from elevated 30 degree three-quarter isometric camera, facing screen lower right, full body visible with generous transparent margin. Top row: same girl Momo with short warm peach-brown bob hair, small cream flower hairpin, pale peach dress with cream collar and brown little boots, golden-brown eyes. Four frames: idle, walk left foot, walk passing, walk right foot. Bottom row: same girl Lulu with short lilac bob hair and cream bow, sage and lavender dress, white socks and dark little boots, purple eyes. Four frames same motions. Both same proportions, height, eye style and anchored foot baseline. Adorable large rounded heads, expressive faces, tiny bodies. Genuine crisp chunky square-pixel clusters suitable for native 64x64 sprites, dark purple outlines, simple broad color areas, clean restrained detail, no painterly rendering, no smooth 3D, no text, no grid lines, no numbers, no ground, no shadows, no extra objects, no checkerboard background. Each cell exactly one complete character, consistent outfit and head size across row.
```
