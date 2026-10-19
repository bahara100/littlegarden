# 호수 V2

사용자가 기존 호수를 새로 만들어 달라고 요청해 imagegen 내장 도구로 도트 원화를 생성했다. 프롬프트 전체는 `prompt.txt`, 원본은 `source.png`, 게임용 출력은 `pond.png`다.

- 둥근 마름모형 돌 테두리, 안쪽의 깊이 있는 돌벽, 청록색 물, 얕은 물가의 자갈, 이끼, 연잎과 수련.
- 원화 제작 당시 크기는 4×5칸이며, 후속 요청으로 런타임 기본 크기를 5×6칸으로 넓혔다. 배치/회전·길 막기·호수 구경은 유지한다. 별도 그림자와 캐릭터 그림은 추가하지 않는다.
- 256×160 RGBA, 가시 너비 240px. 다른 기구와 같은 불투명도 기준(180 이상)을 적용하고 nearest-neighbour 축소 및 96색 정리. 원본 알파는 source.png에 보존한다.
- 바닥 접지 기준점은 (128,90). 홀수 회전은 전체 도트 좌우 반전이며 현재 6×5 방향이다. Phaser/Canvas 모두 `pondSprite.ts`의 같은 원화를 사용한다.
- 물속 물고기 3마리는 `pondFish.ts`의 작은 도트로, 8 FPS 공통 레이어에서 꼬리를 흔들며 32초 경로를 순환한다. 원화의 물색 마스크로 돌과 연잎 밑에 가려지고, 꾸미기/동작 줄이기에서는 정지한다.
- 저장 v3→v4: 기존 호수는 공간이 허용되면 5×6으로 확대한다. 기구/경계/중앙 통로와 겹치면 그 호수만 4×5를 보존하고, 꾸미기에서 옮기거나 다시 꺼낼 때 5×6 미리보기로 바꾼다. 다른 기구는 이동하지 않는다.
- 런타임: `apps/client/public/sprites/garden/pond-v2/pond.png`. 재현: `py tools/art/package-pond-v2.py docs/art/pixel/pond-v2/source.png`.
- 이전 폴리곤 호수 `pondArt.ts`는 보존했으며 이미지 준비 전 대체 그림으로만 사용한다.

핵심 생성 요청: "strict orthographic 2:1 isometric", "rounded 4-by-5 isometric tile rectangle", "continuous rounded rim of irregular substantial grey-beige stones", "sunk turquoise water", "two small lily-pad clusters", "transparent outside", "NO cast shadow".
