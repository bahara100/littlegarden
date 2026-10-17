# NE V7 · 4번 접힌 발과 기존 칼집 복원

사용자 최신 요구: V6의 화면 왼쪽 접힘/오른쪽 지지는 유지하면서, 접힌 발을2번 같은 느낌으로 다듬고 사라진 칼을 복원한다. 사용자 검수 전이다.

- 1~3번은V6/V5와 PNG 바이트 동일.
- 4번 화면 오른쪽 지지 다리는V6와 픽셀 동일.
- 접힌 화면 왼쪽 발만 x33~49/y73~95의 좁은 영역에서 보완했다(50픽셀).
- 기존 칼집은 실제2번 그림에서 가져와(+2,0) 인물의 투명한 뒤쪽 영역에55픽셀 복원했다. 새로운 무기 디자인을 만들지 않았다.
- 머리/갓/몸통/허리 장비 등은 수정 영역 밖에서 유지한다. 편집 영역 밖 픽셀 불일치0을 확인했다.

## 제작과 파일

내장 image_gen으로 V6 생성 원본과2번 확대본을 참고해 접힌 발 수정 후보를 만들었다. 요청문은 prompt-pose4.txt, 원본은 source-pose4-edit.png다. 생성된 상체/칼 전체를 채택하지 않았다. tools/art/finalize-scarlet-ne-walk-v7.ps1이 기존 도트 크기/팔레트에 맞춘 뒤 왼쪽 접힌 다리 영역만 합성하고,2번의 실제 칼집을 인물 뒤에 복원했다. repair.json / sword-restore.json에 합성 범위와 복원 기록이 있다. Pixelorama 수작업본은 아니다.

walk.png는384×96,96×96 네 컷·6 FPS다. source-keys.png와 walk-preview-2x2.png는 실제 재생 네 컷의4배 조합이다. pose4-preview-6x.png는 실제4번 확대, pose4-before-after.png는 왼쪽V6/오른쪽V7이다. GIF와2×2는 실제 시트와 모든 픽셀이 일치한다.

검수 화면 http://127.0.0.1:4184/ 는 ../scarlet-ingame-walk-se-v1/index.html이며 ne/walk-v7.png, ne/walk-preview-v7-2x2.png, ne/walk-preview-v7.gif를 읽는다. 버전 파일명을 명시해 현재 표시본을 식별한다. NW는 같은 시트의 각 컷을 좌우 반전한다. 메인 게임에는 미연결이며 자동 검사와 사용자 승인을 구분한다.
