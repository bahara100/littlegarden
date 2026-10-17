# NE V9 · 4번 칼집 도트 미세 복원

**2026-10-17 사용자 최종 승인**: “좋아. 여기까지 캐릭터 걷기 모션은 완성이야.” 이 NE 시트와 SE V1, 그 반전 방향을 최종 걷기로 확정했다. ../SCARLET_INGAME_WALK_APPROVED.md 및 ../scarlet-ingame-walk-approved.json을 따른다. 메인 게임 적용은 별도 후속 작업이다.

사용자는3번에 이어4번 칼모양의 깨진 도트도 수정하라고 요청했다. 칼집 연결부의 검은 끊김/빈 점과 아래 가장자리가 잘린 부분만 기존 칼집 원본 픽셀로 복원했다.

- 1~3번 PNG는 V8과 바이트 동일.3번의26픽셀 복원 유지.
- 4번은 repair.json의24점만 변경. 그 밖의 픽셀은 V8과 동일.
- 기준은 실제2번의 칼집을(+2,0)로 맞춘 기존V7 복원 위치다. 칼 길이/각도/디자인을 새로 만들지 않았다.
- 캐릭터 자세와 다리, 얼굴, 갓, 의상은 유지했다.
- 스크립트: tools/art/repair-scarlet-ne-sword-v9.ps1. 새 이미지 생성 없이 기존 자산 원본값을 복원한다.

pose4-before-after.png와 sword-before-after.png는 왼쪽V8/오른쪽V9의 실제 프레임 비교다. pose4-preview-6x.png는 실제4번 확대다. source-keys.png와 walk-preview-2x2.png는 최종 네 컷의 최근접4배 조합이다.

walk.png는384×96,96×96 네 컷,6 FPS, 공유24색 이하다. GIF와2×2 미리보기는 실제 시트와 모든 픽셀이 일치한다. 메인 게임에는 미연결이다.

검수 화면 http://127.0.0.1:4184/ 은 ../scarlet-ingame-walk-se-v1/index.html의 ne/walk-v9.png, ne/walk-preview-v9-2x2.png, ne/walk-preview-v9.gif를 사용한다. NW는 동일 시트의 컷별 반전이다. 실제 시트에서 만든 표시본만 최종으로 안내한다.
