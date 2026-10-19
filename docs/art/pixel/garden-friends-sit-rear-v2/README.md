# 모모·루루 공통 베이스 뒤쪽 앉기 V2 · 사용자 검수 전

사용자가 새 공통 뒤 앉기 베이스를 모모와 루루에게 적용해 달라고 했다. 이전 `seesaw-sit-v1`의 서 있는 뒤 의상에 발만 올린 대체 그림을, `garden-body-sit-ne-v1`의 접힌 다리 기반으로 교체했다.

내장 image_gen 의상 초안(`source-tailored-ai.png`)은 **기존 머리를 그리는 용도가 아니다**. 같은 회색 앉기 베이스에 모모의 살구색 원피스·갈색 허리 리본, 루루의 보라색 원피스·연두색 소매·자주색 허리 리본을 앉은 형태에 맞춘 참고다. 실제 지시문은 `prompt.txt`에 있다. Pixelorama에서 전신 비율에 맞춰 축소·팔레트 정리하고 의상 레이어를 만들었다.

- 공통 베이스의 무릎·정강이·신발을 쓰고 피부/양말/갈색 신발을 입혔다. 행77 이후의 알파 실루엣은 베이스와 같다.
- 머리는 게임 V2 `idle-ne-head.png`를 **x+4px, y변경 없이** 새 목 중심에 맞춰 옮겼다. 원래 머리 픽셀의 색·형태·크기를 바꾸지 않았다. 서 있기/걷기 원본의 머리는 이동하지 않았다.
- 새 각 캐릭터의 `.pxo`는 96×96 한 프레임, 다리·의상·머리 3레이어다. NW는 NE 전신과 각 레이어의 정확한 좌우 반전이다.
- 제작: `tools/art/build-garden-friends-sit-rear-v2.gd` (Pixelorama, `params.who` / `params.part`)
- 포장: `py tools/art/package-garden-friends-sit-rear-v2.py`
- 검수: `/friends-sit-rear-v2/index.html`
- 게임: `sprites/garden/friends-sit-rear-v2/` + `friendSittingArt.ts`, 두 렌더러의 뒤쪽 시소/테이블 좌석에 연결했다.
- 앞쪽 앉기, 모든 걷기 V2, 수동 수정 V8 베이스, 앞뒤 정렬·좌석 높이는 보존했다.

기술 검사는 원본 머리 보존·레이어 합성·미러·베이스 발 실루엣·투명도를 확인한다. 의상과 자세의 작화 승인을 대신하지 않는다.
