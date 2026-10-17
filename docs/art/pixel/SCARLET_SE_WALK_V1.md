# 홍련 앞오른쪽 걷기 01

내장 image_gen으로 승인된 앞오른쪽 기본 자세를 참조하여 2×2 걷기 시트를 생성했다. CLI/API 생성은 사용하지 않았다. 기존 기본 자세·네 방향 시트는 보존했다.

## 결과

공통 폴더: `apps/client/public/sprites/scarlet/`

- 생성 원본: `scarlet-se-walk-v1-source.png`.
- 분할 원본: `scarlet-se-walk-v1-frame-0-source.png`부터 3까지.
- 게임용 컷: `scarlet-se-walk-v1-frame-0.png`부터 3까지.
- 게임용 시트: `scarlet-se-walk-v1.png` (384×96).
- 4배 확대 시트: `scarlet-se-walk-v1-4x.png`.
- 프레임 좌표/재생 속도: `scarlet-se-walk-v1.json`.
- 원본은 왼발 앞으로 / 교차 / 오른발 앞으로 / 반대 교차 순으로 2×2 분할하고, 고정 팔레트로 규격화하여 가로 네 컷으로 묶었다.
- `tools/art/export-scarlet-walk.ps1`가 분할·기존 export·묶기와 알파/팔레트/발 기준 검사를 수행한다.
- 네 컷 모두 96×96, 알파 0/255, 마지막 발 픽셀 행 87(기준선 y=88), 각 컷 31~32색이다.

## 재생

- `/scarlet-walk.html`: 반복 재생, 정지, 한 컷 이동, 프레임 선택, 4/6/8 FPS, 기존 기본 자세와 비교, 발·중심 기준선.
- 기본 재생 속도 6 FPS. 동작 줄이기 설정이면 검수 화면은 멈춰 시작한다.
- `/?scarlet=walk-se-v1`: 홍련이 ↘ 방향으로 이동 중일 때만 새 걷기를 재생한다. 다른 방향과 멈춘 상태는 네 방향 기본 자세다. 맵의 동작 줄이기 설정에서는 걷기 프레임을 재생하지 않는다.
- 에디터 진입·정지·다른 방향에서는 걷기 시간을 초기화한다.
- 다른 세 방향 걷기·앉기·인사는 이번 범위가 아니다.
- 생성 프레임 사이 머리/모자 윤곽과 몸 비율의 미세한 차이, 좁은 교차 자세, 접지 보정이 남아 있다. 수작업으로 모든 픽셀을 정리한 완성본으로 설명하지 않는다.

## 확인

- TypeScript 및 Vite 빌드 통과.
- 자동 테스트 24개 통과. 추가 검사는 네 프레임의 시간 순서와 반복 경계를 확인한다.
- 브라우저에서 네 컷 로드, 정지 상태 2→3→4→1 순환, 기본 자세 비교, 속도 선택과 재생을 확인했다.
- 실제 화면: `scarlet-se-walk-v1-preview.jpg`.

## 최종 생성 프롬프트

```text
Create a FOUR-FRAME WALK CYCLE sprite sheet of this EXACT approved Scarlet, NOT a new design. EXACT layout TWO COLUMNS x TWO ROWS of equal SQUARE cells. Transparent background, no text, numbers, grid, shadows or floor. One whole character per cell, generous transparent margins. EVERY frame same camera facing screen LOWER RIGHT / southeast at elevated 30 degree isometric view, same head/hat size, same feet ground baseline, same character center. DO NOT turn or mirror any frame. Upper body/head/face/hat must remain almost identical, only tiny natural motion. Keep ivory kasa hat with two gold horns, violet cord and HAT tassels, amber eyes, compact silver-lavender loose back hair gathering ONLY at its bottom on rear SPINAL CENTER, tie occluded behind torso, NO side ponytail or side hair tie. White/purple outfit, red waist sash, sword sheathed on HER ANATOMICAL LEFT hip and dark BLACK WRAPS on HER ANATOMICAL LEFT leg, white boot on the other leg; these identifiers stay on same limbs and side in ALL frames.
Four frames row-major:
TOP LEFT frame 1 LEFT-LEG CONTACT: anatomical LEFT black-wrapped leg advances in walking direction SCREEN LOWER RIGHT, left boot extended forward, anatomical right white leg trails back upper-left. Right arm swings forward and left arm back.
TOP RIGHT frame 2 PASSING: left leg bears weight under hip; right knee swings forward past it, right foot lifted slightly; arms pass neutral.
BOTTOM LEFT frame 3 RIGHT-LEG CONTACT: anatomical RIGHT white leg extends forward screen lower-right and left black-wrapped leg trails back upper-left. Left arm swings forward and right arm back. THIS MUST CLEARLY BE THE OPPOSITE LEG POSITION FROM FRAME 1, not the same pose copied.
BOTTOM RIGHT frame 4 OPPOSITE PASSING: right leg bears weight under hip; left black-wrapped knee swings forward past it, left foot slightly lifted; arms pass neutral opposite frame 2.
Clear separation and alternating readable boots. Gentle ordinary walk, NO running, jumping, kicking or feet sliding sideways. Each leg moves from hip, never duplicate legs or remove boots. Both contact frames same total height, passing frames only a tiny body rise; head must NOT sway sideways or change expression, hat shape or hair volume. Moderate step length for a tiny cozy game. Crisp coarse square pixel clusters and dark-purple outlines, clean palette suited to native96x96 export, avoid painterly fine detail. Full hat and feet within each cell, consistent 10 percent margins. This is a loop of 1-2-3-4-1. Prioritize actual alternating left/right leg movement and stable identity over extra detail.
```

