# 홍련 기본 자세 01

2026-10-16. 방향과 걷기를 만들기 전, 앞오른쪽(↘) 기본 자세 한 컷을 다시 제작했다.

## 결과와 확인

- 실제 게임용 PNG: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v1.png`
- 4배 최근접 확대: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v1-4x.png`
- 생성 원본 보존: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v1-source.png`
- 제작은 내장 image_gen 사용. CLI/API 이미지 생성은 사용하지 않았다.
- 원본 생성 그림은 1280×1280이다. 그 원본을 96×96로 규격화하고 고정 32색 팔레트에 매핑했다. 처음부터 손으로 96×96 도트를 찍은 결과로 설명하면 안 된다.
- PNG 직접 검사: 96×96, 불투명 색 32개, 알파 값 0/255만 존재, 마지막 불투명 행 y=87(발 기준선 y=88).
- export 스크립트: `tools/art/export-scarlet-base.ps1`. 투명 여백을 제외한 실루엣을 최대 78×82 범위에 맞추고 발 기준선에 정렬한다. 팔레트는 이 스크립트에 고정했다.
- `/scarlet-base.html`: 실제 크기, 4배 확대, 기준선 토글, PNG 다운로드.
- `/?scarlet=base-v1`: 맵에서 한 컷만 표시하는 검수 모드. 이동 시에도 같은 그림이다. 기존 걷기 시제품과 기본 게임의 에셋은 덮어쓰지 않았다.
- 빌드 통과. 브라우저에서 이미지 로드·기준선 토글·맵 검수 모드 확인.
- 실제 화면: `scarlet-base-v1-preview.jpg`, `scarlet-base-v1-garden.jpg`.

## 후속 제작 기준

1. 이 한 컷에서 캐릭터 비율, 얼굴 가독성, 삿갓 크기, 뒷머리 양을 검수한다.
2. 미세한 잡색·단절된 선·검과 의상의 비대칭을 다듬는다. 특히 얼굴과 검자루는 작은 픽셀 수 때문에 일부 형태가 뭉친다.
3. 같은 96×96 크기, (48,88) 발 기준, 좌상단 광원, 고정 팔레트로 나머지 세 방향을 만든다.
4. 한 방향 걷기 네 컷을 검증한 뒤 다른 방향으로 확장한다.

현재 AI 생성 원본을 샘플링한 기준안이다. 모든 방향·걷기·앉기·인사 완성본이 아니며, 프레임별 수작업 픽셀 정리는 아직 필요하다.

## 입력과 최종 생성 프롬프트

- 참조 1: `docs/art/scarlet-sd-target-v3.png` — 승인된 의상과 캐릭터 정체성.
- 참조 2: `apps/client/public/sprites/scarlet/scarlet-pixel-sheet-v2-iso.png` — 카메라 방향.
- 투명 배경 요청.

```text
Use case: stylized-concept. Create ONE new production pixel game sprite of Scarlet from NIKKE, using reference 1 ONLY as the approved identity/costume guide and reference 2 ONLY for elevated diagonal camera. ONE character, ONE neutral standing pose, transparent background, square image, no sprite sheet. Actual visual design target: native 96x96 game sprite enlarged with nearest-neighbor into this output. Extremely crisp deliberately placed chunky square pixel clusters on ONE uniform coarse pixel grid, roughly 32 colors total, one logical pixel outline dark muted purple. Do not add fine painted detail or antialiasing. No gradients or noisy texture. Two-head-tall SD chibi, big cute readable face and amber eyes. Body, head, hips, BOTH planted boots all face southeast / screen lower right at 45 degrees yaw; camera looks DOWN 30 degrees, showing top of kasa hat, shoulders, toes. NOT frontal, NOT a flat image rotated. Calm slightly confident expression. Simplify the costume while preserving: broad ivory kasa hat with TWO slender golden horn decorations, violet braid around top and two small violet tassels; compact silver-lavender long hair with REDUCED rear volume and broad simple strands, no giant hair cloud; off-shoulder white outfit with dark purple trim and tiny gold accent, clearly readable RED waist sash; asymmetrical black wraps on one leg and white boots; sheathed katana fixed to HER left hip (on the viewer's right in this southeast view), hilt visible, no sword in hands. Arms relaxed, hands separated from silhouette, feet separated enough to read, both on the same ground plane, NO walking. Hat is not oversized enough to hide eyes. No text, no labels, no watermark, no frame, no floor, no shadow, no checkerboard drawn into background. Whole silhouette occupies central ~78px wide by ~82px tall of the 96px conceptual cell, leaving at least 6 pixels clear margin on all sides and feet near y=88. Lighting fixed from upper-left with 3 clear shades per material. Elegant minimal pixel clusters rather than a high-resolution illustration shrunk down. This will establish a reusable base for later four directions and animation; prioritize clear shape, consistent pixel scale, and understated beauty.
```
