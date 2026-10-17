# NE V8 · 3번 칼집 도트 미세 복원

사용자가 V7에 “좋아”라고 확인한 뒤3번 칼모양 도트의 깨진 부분만 보완하라고 요청했다. 걷기 자세·다리·의상·몸통·무기 길이/각도는 유지한다.

3번은 V5에서 하체를 채택한 경계(y73 이후)가 칼집에 겹쳐 중간에 빈 점과 아래쪽 돌출점을 만들었다. V4의 같은 칼집 좌표 픽셀을 사용해 해당26픽셀만 복원했다. 새 이미지 생성이나 새 무기 디자인 없이 기존 자산의 원본 픽셀을 복구했다.

- 1·2·4 PNG는 V7과 바이트 동일.
- 3번은 repair.json에 기록한26점 외 모든 픽셀이 V7과 동일.
- 스크립트: tools/art/repair-scarlet-ne-sword-v8.ps1.
- repair.json에는 좌표와 전후 ARGB 색상, 기준 V4가 기록되어 있다.
- pose3-before-after.png와 sword-before-after.png는 왼쪽V7/오른쪽V8의 실제 프레임 비교다.
- pose3-preview-6x.png는 실제3번을 최근접6배 확대했다.

walk.png는384×96,96×96 네 컷,6 FPS, 공유24색 이하이며 메인 게임 미연결이다. source-keys.png / walk-preview-2x2.png / GIF / 접지·통과 비교 등은 최종 실제 시트에서 만들었고2×2 및GIF의 시트 픽셀 대조는 불일치0이다.

검수 화면 http://127.0.0.1:4184/ 은 ../scarlet-ingame-walk-se-v1/index.html에서 ne/walk-v8.png, ne/walk-preview-v8-2x2.png, ne/walk-preview-v8.gif를 읽는다. NW는 같은 시트의 컷별 반전이다. 이전 정상 원본 픽셀의 정확한 복원이며 Pixelorama 수작업 보정본이나 AI 재생성본으로 안내하지 않는다.
