# 스노우화이트 맵 연결 V1 (2026-10-22)

사용자 요청: “신캐릭터야. 코덱스가 작업한 스노우화이트 서있는 자세와 앉은 자세만 적용시켜줘.”

- 새 친구 `snow`(스노우화이트)를 네 번째 친구로 더했다. 친구 목록·소개 카드·친밀도·쓰다듬기·저장이 다른 친구와 같다.
- 그림: 승인 정지 V1(`docs/art/pixel/snow-white-idle-v1/idle-{se,ne}.png`)과 의자형 앉기 V1(`docs/art/pixel/snow-white-sit-v1/sit-{se,ne}.png`)을 바이트 그대로 `apps/client/public/sprites/snow-white/v1/`에 복사한다(`tools/art/sync-snow-white-runtime.py`). SW·NW는 좌우 반전.
- 홍련2와 같은 128px 캔버스·크기·접지(115/128)·앉기 원점·앉기 규칙을 쓴다(벤치·그네·시소·테이블은 앉은 그림, 돗자리는 바닥 앉기 그림이 없어 서 있는 그림).
- **걷기 그림은 아직 없다**: 걸을 때도 서 있는 그림으로 움직인다. 걷기가 승인되면 `snowWhite.ts`에 `walk`를 더하고 두 렌더러에서 홍련2처럼 재생한다.
- 확인: `check-seats.mjs`(개발 서버 5173)로 두 렌더러 × 걷는 중·벤치 두 방향·그네·시소·테이블 앞뒤·돗자리 14경우의 그림·반전·원점·일어서기를 확인했다. `stand-and-sit.png`: 위 걷는 중(Phaser)·벤치 SW·벤치 SE·그네 / 아래 시소·테이블 뒤(Phaser)·벤치 SW·테이블 뒤(Canvas).
