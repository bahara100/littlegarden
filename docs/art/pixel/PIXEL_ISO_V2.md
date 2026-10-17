# 홍련 대각선 도트 v2

2026-10-16. 내장 image_gen으로 v1 시트를 참조하여 편집했다. CLI는 사용하지 않았다.

- 저장 파일: `apps/client/public/sprites/scarlet/scarlet-pixel-sheet-v2-iso.png`
- 맵에 맞춰 위에서 내려다보는 오른쪽 아래 대각선으로 변경했다. 삿갓 윗면과 어깨가 보이며 몸과 발도 같은 방향이다.
- 4열×2행: 위 대기 4컷, 아래 걷기 4컷. 기존 96×96 런타임 샘플링과 최근접 필터를 사용한다.
- `/pixel.html`과 `/?art=pixel`에 적용했다. 정면 v1 파일은 보존했다.
- 현재 한 방향이다. 이동 방향별 회전, 인사와 앉기 전용 그림은 아직 없다. 생성 프레임 사이 외형 차이와 가장자리 잡색도 남는다.
- `npm.cmd run build` 통과. 브라우저에서 미리보기와 실제 놀이터 적용 확인.
- 확인 화면: `pixel-preview-v2-iso.jpg`, `pixel-garden-v2-iso.jpg`.

## 최종 생성 프롬프트

```text
Edit this Scarlet pixel sprite sheet to match a diamond isometric playground viewed from ABOVE. Preserve character identity, outfit, palette, two-head-tall chibi proportions, and pixel art style. CRITICAL CHANGE IN ALL EIGHT CELLS: redraw the entire character in a consistent THREE-QUARTER DIAGONAL view facing SCREEN LOWER RIGHT / southeast, about 45 degrees yaw from frontal, with camera elevated 30 degrees looking down. We must see significantly MORE TOP SURFACE of her kasa hat, top of shoulders and boots. Face is visibly turned toward screen right with foreshortened far eye; nose, chest, hips, knees, boots ALL face the same southeast diagonal. NOT frontal character with only head tilted, NOT an image rotated clockwise in its plane. Body remains upright vertical. True isometric RPG sprite perspective matching a 2:1 diamond ground grid. Hat must not hide the cute golden eyes. Slightly compact hat to keep face readable. All 8 cells same direction and same camera, same size, same foot anchor. EXACTLY 4 columns by 2 rows, equal square cells, full character completely within each cell with generous transparent margins. TOP ROW 4 idle frames: neutral, tiny breathing, blink closed eyes, neutral. BOTTOM ROW 4 walking southeast frames with alternating near/far boot steps and opposite arm swing. Keep frame-to-frame hat size, hairstyle, costume details and face consistent. Silver lavender compact long hair, off-white broad kasa hat with gold horns and violet cord/tassels, white/purple outfit, red sash, asymmetrical white boots with black leg wraps and sheathed sword. Crisp chunky square pixels suitable for 96x96 per frame, simple clean pixel clusters and dark violet outline, NO smoothing/painting/3D rendering. Transparent alpha background, no checkerboard baked in, no text, no grid lines, no shadows, no ground, no extra objects.
```
