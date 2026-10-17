# 홍련 뒷머리 수정 — 기본 자세 02

사용자가 지정한 머리 형태: **길게 풀어 내린 뒷머리의 아래 끝부분만 한곳으로 모아 묶는다.** 양갈래가 아니며, 위나 목덜미에서 묶은 포니테일도 아니다. 완전히 풀어서 매듭을 없애는 것도 아니다. 삿갓에 달린 술 장식과 머리끈을 구분한다.

- v1의 두 갈래처럼 보이는 옆 묶음을 제거하고 단일 하단 묶음으로 수정.
- 내장 image_gen으로 v1 생성 원본을 편집. CLI/API 이미지 생성 미사용.
- 생성 원본: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v2-source.png`
- 게임용 파일: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v2.png`
- 확대 파일: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v2-4x.png`
- 기존 export 스크립트의 96×96, 최대 32색, 발 기준선 y=88 규격을 유지한다.
- `/scarlet-base.html`과 `/?scarlet=base-v2`에 연결. 과거 `base-v1` 쿼리는 검수 모드의 별칭으로 유지하며, v1 파일은 덮어쓰지 않는다.
- 한 방향 기본 자세 한 컷이다. 애니메이션과 다른 방향은 아직 없다.
- TypeScript 검사와 Vite 빌드 통과. 브라우저 검수 화면 및 놀이터의 BASE FRAME 02 연결 확인. 실제 화면: `scarlet-base-v2-preview.jpg`.

## 최종 편집 프롬프트

```text
undefined
```
