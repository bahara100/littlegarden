# 뒤오른쪽 V5 · 3번 보폭 축소, 4번 두 다리 자세 교체

사용자 요청: 3번은 보폭만 조금 줄이고, 4번은 두 다리 모습을 바꾸기. 확인 질문에서 사용자가 **펴진 다리와 접힌 다리의 자세를 서로 바꾸기**라고 답했다. 의상만 서로 바꾸라는 의미가 아니다.

- 1·2번 PNG: V4와 바이트 동일.
- 3번: 기존 오른발 접지/왼발 뒤쪽 보폭을 유지하면서 두 발을 몸 쪽으로 모았다.
- 4번: V4에서 길게 펴진 매끈한 오른다리를 접고, 접힌 주름 왼다리를 내려 펴도록 자세를 교체했다. 의상은 해당 다리에 유지했다.
- 3·4번 상체 y0~72는 V4와 픽셀 동일. 머리/갓/허리 장비/칼은 원래 그림을 유지한다.
- 실제 walk.png는384×96, 전신96×96 네 컷,6 FPS, 공유24색 이하. 메인 게임 미연결, 사용자 검수 전이다.

## 제작

내장 image_gen으로 V4 생성 원본의3번과4번을 각각 수정했다. prompt-pose3.txt / prompt-pose4.txt에 요청문, source-pose3-before.png / source-pose4-before.png에 입력 크롭, source-pose3-edit.png / source-pose4-edit.png에 생성 원본을 보존했다. 생성 이미지 전체를 최종 프레임으로 쓰지 않는다.

tools/art/finalize-scarlet-ne-walk-v5.ps1로 모자 폭/높이를 기준으로 기존 도트에 맞춰 축소·공유 팔레트 변환 후 x33~70/y73~95의 하체만 채택했다. 합성 변경은3번292픽셀,4번169픽셀이며 repair.json에 기록했다. Pixelorama 수작업본은 아니다.

## 실제 시트에서 만든 표시본

walk-preview-2x2.png와 source-keys.png는 실제 네 컷의4배 조합이다. poses3-4-before-after.png는 위 행3번/아래 행4번, 왼쪽V4/오른쪽V5다. contacts-1-3.png / passes-2-4.png도 실제 프레임만 잘라 조합했으며 후자의 파일명은 기존 검수 도구 이름이다. V5의4번을 이전 “왼발 통과”로 다시 해석하지 않는다.

walk-preview.gif는 실제 시트의6 FPS 반복이다. 네 컷 미리보기 및 GIF는 시트와 픽셀 일치한다. onion-diagnostic.png / legs-diagnostic.png도 최종 시트에서 만들었다.

http://127.0.0.1:4184/의 소스는 ../scarlet-ingame-walk-se-v1/index.html이며 ne/ 캐시를 V5로 바꿨다. NE4번 표시를 “다리 교체 자세”로 갱신했고 SE 명칭/그림은 유지한다. NW도 이 새 시트를 컷별 좌우 반전한다. 자동 픽셀 검사와 사용자 모션 승인은 구분한다.
