# 공통 몸체 NE 걷기 V3 · 사용자 지정 원본 조합

2026-10-18 사용자 지시: **첫 번째 첨부 이미지의 1·3·4번 + 두 번째 첨부 이미지의 2번**을 사용한다. 번호는 왼쪽 위부터 1·2·3·4다.

| 최종 컷 | 사용한 원본 |
| --- | --- |
| 1 | 첫 이미지 1번 |
| 2 | 두 번째 이미지 2번 |
| 3 | 첫 이미지 3번 |
| 4 | 첫 이미지 4번 |

첨부 원본은 `source-selection-1.png` / `source-selection-2.png`로 보존했다. 각각 V2 폴더의 `source-first-draft.png` / `source-cycle.png`와 디코딩한 RGBA 픽셀이 동일함을 확인했다. **V2의 단독 재수정 이미지 `source-pose2-fixed.png`는 이번 조합에서 사용하지 않는다.**

새 이미지를 생성하거나 팔/다리/의상/자세를 고치지 않았다. 선택한 전신을 통째로 축소·정렬해 96×96/공유32색으로 출력했으며 이전과 같은 머리 폭46px 기준이다. 전신을 나눈 머리/몸 레이어와 네 프레임·6 FPS Pixelorama 원본 `garden-body-walk-ne-v3.pxo`를 제공한다.

NE는 `walk.png`의 1→2→3→4 반복이고, NW는 `garden-body-walk-nw-v3/walk.png`의 정확한 컷별 반전이다. 미리보기/GIF는 실제 시트의 네 컷만 사용한다. 출처와 배율은 `source-layout.json`에 기록했다. NE V2와 승인 SE V20/실제 게임은 보존했다. 조합의 사용자 검수는 아직이다.

- 네이티브 샘플링: `tools/art/garden-body-ne-v3-sample.gd` (Pixelorama MCP에서 컷 번호를 지정).
- 출력: `python tools/art/build-garden-body-walk-ne-v3.py`.
- 검수: `apps/client/public/body-walk-ne-v3/index.html` (NE/NW 선택).
