# 스노우화이트 정지 V1

사용자가 제공한 인게임 SD 앞·뒤·양옆 캡처와 공통 정지 베이스의 비율/자세를 참고했다. ImageGen 내장 도구로 앞 SE·뒤 NE의 이어진 전신을 한 시트로 생성한 뒤 Pixelorama에서 128px로 정렬하고 재질별 48색 팔레트로 정리했다. SW/NW는 전신 반전이다. 비대칭 장식/붕대도 반전되는 기존 두 방향 제작 방식을 따른다.

머리와 몸을 서로 다른 캐릭터 조각으로 붙이지 않았으며 베이스의 실루엣과 정확히 같은 작화라고 주장하지 않는다. 두 방향의 생성 원화에서 장식의 입체 위치까지 정확히 같은지는 사용자 검수가 필요하다. 기존 홍련2/모모/루루/공통 베이스와 게임 연결은 수정하지 않았다.

원본 `source-ai.png`, 실제 도트 `idle-se.png`, `idle-ne.png`, 편집 원본 `snow-white-idle-{se,ne}-v1.pxo`, 팔레트 `palette.json`, 생성 프롬프트 `prompt.txt`. `.pxo`는 전신을 정렬한 후 y80에서 편집 영역을 나눈 2레이어이며 재사용 가능한 관절 리그는 아니다. 접지 원점은115/128.

재현: Pixelorama 새128px 캔버스에서 `tools/art/build-snow-white-idle-v1.gd`를 dir=se/ne, part=body/head로 각 레이어에 실행한 후 .pxo/PNG를 저장한다. `py tools/art/package-snow-white-idle-v1.py`는 알파/팔레트/반전/레이어 합성/편집기 출력 일치/바닥 높이를 검사하고 검수 자료를 포장한다. 이 검사는 작화 승인과 다르다.
