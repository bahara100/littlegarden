# 모모·루루 참고 공통 앉기 베이스 V1 · 사용자 검수 전

이전 독립 앉기 `garden-body-sit-se-v1/`은 사용자 요청대로 별도 보관했다. 이번에는 실제 게임 `garden-friends-sit-v1.png`의 모모/루루 앉기 칸0·4를 추출해 자세 참고로 사용했다.

가슴 앞의 두 손, 몸에 붙인 팔꿈치, 가까이 모은 짧은 다리와 발 배치를 따른다. 원본 치마 아래 가려진 골반·허벅지는 공통 회색 반바지로 재구성한 부분이며 원본에서 복원했다고 주장하지 않는다. 캐릭터의 얼굴·머리·의상·색은 복사하지 않았다. 서 있는 V2는 편한 팔 자세를 유지하고 앉기만 모모/루루의 손 배치를 쓴다.

내장 image_gen 초안을 Pixelorama에서 기존 팔레트로 정리했고, 머리는 승인 정지 V2의 실제 픽셀(행0..53)을 그대로 썼다. 최종은 96×96 전신 SE 한 컷과 정확한 좌우 반전 SW 한 컷이다. `sit-head-*.png` / `sit-body-*.png`로 레이어를 제공하며 편집 원본은 `garden-body-sit-friends-se-v1.pxo`다. 미리보기는 이 전신 PNG의 최근접 확대본이다.

`source-momo-sit.png` / `source-lulu-sit.png`는 원본 칸, `reference-*-sit.png`는 게임과 같은 90px+3px 여백의 참고 출력이다. `source-sit-ai.png`는 생성 중간본이며 최종 도트가 아니다. 사용 지시문은 `prompt.txt`다.

확인 페이지: `apps/client/public/body-sit-friends-v1/index.html`. 게임/좌석 높이에는 아직 연결하지 않았고, 앉고 일어서는 전환 모션도 아직 없다. 패키징 검사는 픽셀 보존/반전 확인이며 자세의 사용자 승인이 아니다.
