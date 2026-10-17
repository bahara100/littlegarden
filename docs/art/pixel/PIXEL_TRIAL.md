# 홍련 도트 시제품 v1

2026-10-16. 내장 image_gen 사용. 참조: `../scarlet-sd-target-v3.png`.

생성 원본: `apps/client/public/sprites/scarlet/scarlet-pixel-sheet-v1.png` (1774×887 RGBA). 원본을 덮어쓰지 않는다. 처음부터 정확한 96×96 파일로 생성된 것은 아니며, 런타임에서 4열×2행을 나누어 96×96 셀에 최근접 샘플링한다. 출력은 도트 스타일 시제품이며 정돈된 제한 팔레트의 수작업 도트와는 다르다.

- 위 행: 정면 대기/숨쉬기/눈깜박임 4컷. 아래 행: 정면 걷기 4컷.
- `/pixel.html`: 대기·걷기 선택, 일시 정지, 1/2/3배 표시.
- `/?art=pixel`: 기존 3D 놀이터에 정면 2D 스프라이트로 표시. 원래 주소의 3D 캐릭터는 유지한다.
- 측면/후면과 인사/앉기 전용 그림은 없다. 다른 행동에서는 대기 컷을 사용한다. 방향과 자세 제작은 후속 범위다.
- AI 생성 프레임별 의상/얼굴/삿갓 크기의 차이, 투명 가장자리 잡색이 남는다. 걷기 좌우 다리 변화도 더 다듬어야 한다.
- 빌드 및 기존 테스트 20개 통과. 브라우저에서 시트 로드, 걷기 버튼, 놀이터 캐릭터 로드 확인.
- 실제 화면: `pixel-preview-v1.jpg`, `pixel-garden-v1.jpg`.

## 최종 생성 프롬프트

```text
Create a usable 2D PIXEL ART GAME SPRITE SHEET of Scarlet based on this approved design reference. The reference is identity/costume only; output must be genuine crisp low-resolution pixel art, NOT a painting, NOT 3D. EXACT layout: 4 equal columns x 2 equal rows, eight equal SQUARE cells, no lines or text. Transparent background. Every cell contains exactly one COMPLETE front-facing two-head-tall chibi Scarlet, same scale and same baseline, wide off-white kasa hat entirely inside the cell, two gold horns, slim violet cord and tassels, silver-lavender hair with reduced rear volume, golden eyes, simple white/violet outfit, red waist sash, white boots with asymmetrical black wraps, small sheathed sword. Cute readable face and beautiful compact silhouette. Simplify costume to broad readable shapes and a limited roughly 24-color palette. Design each cell as a native 96x96 pixel sprite enlarged with nearest neighbor square pixels; consistent chunky square pixel grid, strong dark-purple 1-pixel outline, no smooth antialiasing, no gradients. All cells identical camera FRONT and character identity. Top row four IDLE frames: neutral open eyes, slight breathing down, closed-eye blink, neutral open eyes. Bottom row four WALK TOWARD CAMERA frames: left foot forward/right arm forward, feet passing, right foot forward/left arm forward, feet passing. Make feet movement visible while the torso, face and hat stay consistent, subtle tassel sway. Each character centered in its cell with at least 8 percent transparent margins in both axes; feet baseline 90 percent down each cell. No shadows, no ground plane, no checkerboard painted into background, no letters, no labels, no additional objects, no cropped hats/feet. Production sprite sheet, uniform spacing and fixed pivot.
```
