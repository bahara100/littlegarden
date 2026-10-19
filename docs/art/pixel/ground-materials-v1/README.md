# 공원 지면 원화 V1

내장 `image_gen`으로 기존 `playground-props-v1.png`의 도트 스타일을 참고해 잔디와 흙길 원화를 각각 생성했다. 전체 프롬프트는 [prompts.json](prompts.json), 원본은 `grass-source.png` / `path-source.png`에 보관했다.

런타임은 `apps/client/public/sprites/garden/ground-materials-v1/grass.png` / `path.png`이며 각각 256×256·64색이다. 패키징은 `tools/art/package-ground-materials-v1.py`의 최근접 축소와 팔레트 정리다.

`groundMaterials.ts`에서 월드 좌표에 고정한 연속 패턴으로 아이소메트릭 투영한다. 길은 타일 합집합에만 흙 재질을 그리고 외곽의 잔디 조각은 같은 잔디 원화에서 이어 그려 경계를 자연스럽게 한다. 지역·계절 색 변화를 적용하되 준비 중인 온천 지역은 기존 바닥 표현을 유지한다. 그림자나 새 장애물은 추가하지 않는다.

화면 검수: `docs/design/terrain-details-2026-10-19/`의 전체·확대·꾸미기 화면.
