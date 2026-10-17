# 뒤오른쪽 걷기 V4 · 네 컷 재제작

사용자가 V2의 1·3번이 같은 걸음으로 보인다고 지적하고, 뒤오른쪽 걷기1~4 전체 재제작을 요청했다. 이 버전은 이전 프레임을 재사용하지 않고 승인 NE 정지 외형에서 새 전신 네 컷을 만들었다. 사용자 검수 전이다.

## 실제 재생과 검수 자료

- walk.png: 384×96, 96×96 전신4컷, 기본6 FPS, 공유24색 이하.
- frame-1.png~frame-4.png: 최종 실제 재생 컷.
- source-keys.png / walk-preview-2x2.png: 채택한 실제 네 컷을 최근접4배로 2×2 조합. 둘은 동일 이미지다.
- contacts-1-3.png: 실제1·3번 비교. passes-2-4.png: 실제2·4번 비교.
- walk-preview.gif: 실제 시트에서 만든 6 FPS 반복. 시트와 모든 픽셀 일치.
- onion-diagnostic.png / legs-diagnostic.png: 이전 컷 겹침과 하체 확대 검수용.

1 왼발 접지는 가까운 매끈한 오른다리가 아래·왼쪽으로 앞에서 교차하고, 먼 주름 왼다리가 뒤에서 위·오른쪽으로 내딛는 자세다. 3 오른발 접지는 매끈한 오른다리가 앞쪽 위·오른쪽, 주름 왼다리가 뒤쪽 아래·왼쪽인 반대 보폭이다. 2는 주름 왼다리 지지/매끈한 오른발 통과, 4는 매끈한 오른다리 지지/주름 왼발 통과다. 화면 좌우 영역에 의상 디자인을 고정하지 않는다. NW 반전에서는 사용자 결정대로 의상/칼도 함께 반전한다.

## 제작

내장 image_gen으로 승인 idle-ne-preview-6x.png와 새 네 컷 자세 가이드(pose-guide.png)를 참고해 전신 시트를 만들었다. 요청은 prompt.txt, 생성 원본은 source-cycle.png다. 1번이 충분한 반대 보폭으로 그려지지 않아 prompt-cross-contact1.txt로 교차 접지를 다시 요청했고 source-cross-contact1.png에서 하체만 채택했다. raw source-cycle.png나 source-cross-contact1.png 전체를 최종 네 컷으로 안내하지 않는다.

공통 배율/크롭과 공유24색으로 축소하고 머리 위치를 정렬한 뒤, 1번 하체 x33~70/y73~95만 새 교차 자세로 합성했다. 나머지1번 상체와 새2·3·4번은 유지했다. 합성281픽셀, 자세별 축소/정렬/최종 SHA256은 walk.json 및 contact1-composite.json에 기록했다. Pixelorama 수작업본이나 수치 가이드와 정확히 일치하는 보행이라고 보고하지 않는다.

재현 순서:

1. tools/art/scarlet-ne-walk-guide-v4.ps1: 분석용 네 컷 가이드.
2. tools/art/export-scarlet-ingame-walk-se-v1.ps1 -Direction ne -Version v4 -SourceName source-cycle.png: 새 기본 네 컷 출력.
3. tools/art/finalize-scarlet-ne-walk-v4.ps1: 1번 교차 접지 하체 채택, 실제 시트/미리보기 재조합.
4. tools/art/make-scarlet-walk-review-pairs.ps1 -Folder docs/art/pixel/scarlet-ingame-walk-ne-v4: 접지/통과 비교.
5. tools/art/pack-scarlet-fullwalk-gif.ps1에 이 시트, -Frames 4 -Fps 6, scarlet-ingame-sd-v1/palette.json을 지정해 GIF 출력.
6. tools/art/verify-scarlet-preview.ps1에 폴더를 지정해 실제 시트/미리보기 픽셀 대조.

## 연결 범위

http://127.0.0.1:4184/ 검수 화면에 적용했다. 그 소스는 ../scarlet-ingame-walk-se-v1/index.html이며 ne/에는 이 버전 시트·2×2·GIF 복사본만 둔다. 네 방향 선택과1·3번 나란히 비교, 컷별 정지, 어니언, 4→1 연결을 확인한다. 기존 SE 승인 시트는 SHA256 그대로이며 메인 게임에는 새 시트를 연결하지 않았다. 자동 픽셀 검사와 사용자 모션 승인을 혼동하지 않는다.
