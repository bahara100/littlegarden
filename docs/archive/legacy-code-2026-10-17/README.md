# 옛 코드 정리 백업 (2026-10-17)

사용자 지시: “안쓰는 옛 코드 정리.” 이 폴더는 git 저장소가 아니라서, 지우거나 고친 파일의 원본을 같은 경로 구조로 여기에 보관했다. 되돌리려면 이 폴더의 파일을 원래 위치로 복사하고 `npm install three -w apps/client` 및 `npm install -D @types/three`를 실행한다.

## 지운 것
- **3D 시절 코드**: apps/client/src/scene.ts, scarlet.ts, scarletAsset.ts, scarletPixel.ts, characterPreview.ts, character.html, tools/art/build-scarlet.ts(GLB 제작), 테스트 scarlet.test.ts·scarletAsset.test.ts, npm 스크립트 `art:scarlet`, 의존성 `three`·`@types/three`.
- **Canvas 렌더러의 `?scarlet=` 검수 모드**(관절 리그·예전 걷기·예전 전신 프레임·기본 자세·네 방향 정지 등 이미 대체된 실험): scarletRig.ts, scarletRigRenderer.ts, scarletWalk.ts, scarletFullFrames.ts, pixelGarden.ts 안의 해당 분기, main.ts의 모드별 설명 문구, 검수 페이지 scarlet-rig/walk/frames/directions/base.html, pixel.html과 각 미리보기 TS, 테스트 scarlet-rig/walk/fullframes.
- phaserGarden.ts의 호환용 모드 플래그(walkFourMode 등), pixelAtlas.ts의 예전 홍련 시트 기본값과 pixelFrame, scarletDirections.ts의 예전 정지 그림 목록(SCARLET_DIRECTIONS).

## 남긴 것
- 기본 Phaser 게임과 `?renderer=canvas` Canvas 화면(둘 다 승인된 SD 홍련 걷기).
- public/의 그림·정적 검수 페이지(body-walk-*, scarlet-ingame-walk-* 등)와 docs의 아트 기록. 그림 파일 정리는 따로 정한다.
- apps/server, packages/shared, tests/multiplayer·world(멀티플레이 후속용, test:legacy).

확인: `npm.cmd run check` 통과, `npm.cmd test` 24개 통과(지운 테스트 5개 제외), `npm.cmd run build` 통과(진입 페이지 index.html 하나), 브라우저에서 Phaser 기본 화면과 ?renderer=canvas 모두 정상 로드.
