# 홍련 뒷머리 중앙 묶음 — 기본 자세 03

사용자 교정: 뒷머리 끝의 한 묶음은 **등 뒤 중앙**에 있어야 한다. v2처럼 몸 옆에 독립된 꼬리와 리본이 보이면 잘못된 형태다.

풀어 내린 뒷머리가 척추 중심선 뒤로 모여 아래 끝에서 한 번 묶인다. 앞 대각선에서는 그 매듭이 몸·옷 뒤에 가려지는 것이 자연스럽다. 매듭을 보여주려고 몸 옆으로 이동시키지 않는다. 앞으로 다른 방향과 모션도 [공통 외형 기준](SCARLET_CHARACTER_RULES.md)을 따른다.

- 내장 image_gen으로 v2 생성 원본을 편집. CLI 이미지 생성 미사용.
- 원본: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v3-source.png`
- 게임용 96px: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v3.png`
- 4배 확대: `apps/client/public/sprites/scarlet/scarlet-se-idle-base-v3-4x.png`
- export 스크립트로 기존 96×96, 최대 32색, y=88 발 기준선에 맞춘다. 생성 그림의 규격화 결과이며 수작업 픽셀 정리 완성본은 아니다.
- 검수 화면: `/scarlet-base.html`, 맵: `/?scarlet=base-v3`.
- 이전 파일은 보존한다. 한 방향 기본 자세만 있으며 걷기는 아직 없다.
- 생성 원본과 4배 확대 PNG에서 몸 옆 리본·끝 묶음 제거를 확인했다. 중앙 뒤 매듭 자체는 이 각도에서 가려져 보이지 않는다. 뒤쪽 방향을 제작할 때 중앙 매듭을 명시적으로 표현해야 한다.
- TypeScript와 Vite 빌드 통과. 이번 검수 시 브라우저 연결이 없어 UI 새로고침 검증은 완료하지 못했다.

## 최종 편집 프롬프트

```text
undefined
```
