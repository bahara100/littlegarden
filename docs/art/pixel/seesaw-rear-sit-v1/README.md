# 시소 반대편 앉기

시소 양 끝은 같은 앞 대각선 두 장을 반전해서 마주보게 할 수 없다. 원본 그림의 왼쪽 위 좌석은 SE, 오른쪽 아래 좌석은 NW를 봐야 한다. 반전 그림에서는 SW / NE다.

기존 승인된 V2의 `idle-ne-head.png`, `idle-ne-costume.png`, `idle-ne-legs.png` 레이어를 활용했다. 머리와 의상은 그대로 보존하고 신발을 치마 아래로 4px 올려 뒷모습 앉기를 구성했다. 기존 원본의 오른쪽 아래 흰색 내보내기 잔여 조각은 새 그림에서만 제거했다. NW는 NE를 정확하게 반전한다.

런타임 `sprites/garden/seesaw-sit-v1/{peach,lilac}-ne.png`, 96×96. 앞 앉기, 게임 V2 걷기와 기존 대기는 바꾸지 않는다. 재현은 `tools/art/package-seesaw-rear-sit-v1.py`.
