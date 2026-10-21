# 홍련2 걷기 V1 · 사용자 검수 전

- 검수: http://127.0.0.1:4185/scarlet2-walk-v1/index.html
- SE/NE 각 4프레임, 128×128, 6 FPS. SW/NW는 각 프레임 전체의 정확한 반전이다.
- 승인된 홍련2 정지 V2의 상단 머리/갓을 크기·픽셀·색 변경 없이 사용한다. 2·4번에서만 y−1px의 작은 상하 움직임을 준다.
- 공통 SE V20 / 최신 사용자 수동 NE V8의 동작을 이미지 입력으로 사용했다. 베이스 실루엣과 최종 의상의 모든 픽셀이 동일하다는 뜻은 아니다.
- 내장 ImageGen 사용. 최종 SE는 `source-se-contact-1.png` 1번 + `source-ai-se.png` 2·3·4번, 최종 NE는 `source-ai-ne.png` 1·2·3·4번이다. `source-se-first-draft.png`는 비슷한 접지 자세로 사용하지 않은 이력이다. `prompt-*.txt`에 입력 프롬프트를 보관했다. 몸통만 생성하려던 초안은 도구 오류로 결과가 없으며 사용하지 않았다.
- 생성 의상을 목부터 부츠까지 한 덩어리로 정렬한 뒤 Pixelorama에서 기존 64색으로 정리했다. 골반 아래를 베이스 다리로 잘라 교체하지 않았다. 프레임별 부츠 재질 보완은 `boot_materials()`에 기록했다.
- `scarlet2-walk-se-v1.pxo` / `scarlet2-walk-ne-v1.pxo`: 각 4프레임, 의상/머리 2레이어. 최종 PNG와 편집기 내보내기 PNG는 픽셀 동일하다.
- 재현: 새 128px·4프레임·2레이어 Pixelorama 프로젝트에서 `tools/art/build-scarlet2-walk-v1.gd`를 `dir=se/ne, frame=0..3, part=body/head`로 각 셀에 실행한다. 프로젝트 저장 및 각 프레임 `editor-{dir}-{n}.png` 내보내기 후 `py tools/art/package-scarlet2-walk-v1.py` 실행.
- `manifest.json`: 색·반전·레이어/편집기 합성·152개 원본 SHA 보존 검사. `browser-check.json`: 브라우저 한 개로 재생4컷·방향별16개 선택·실제 PNG 일치·모바일 넘침 검사.
- 기술 검사 통과는 작화 승인과 별개다. 게임 연결, 이전 홍련/모모/루루 및 기존 정지/앉기/수동 베이스 변경은 하지 않았다.
