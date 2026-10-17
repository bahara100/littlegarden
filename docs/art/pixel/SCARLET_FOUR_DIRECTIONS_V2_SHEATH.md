# 홍련 네 방향 02 — 뒤쪽 칼집 수정

사용자가 지적한 뒤쪽 두 방향의 칼집 누락/부자연스러운 연결을 수정한다. 내장 image_gen으로 각 방향의 원본을 편집했으며 CLI 생성은 사용하지 않았다. 앞쪽 두 컷은 그대로 재사용한다.

- 뒤왼쪽: `apps/client/public/sprites/scarlet/scarlet-nw-idle-four-v2-source.png` → `scarlet-nw-idle-four-v2.png`
- 뒤오른쪽: `apps/client/public/sprites/scarlet/scarlet-ne-idle-four-v2-source.png` → `scarlet-ne-idle-four-v2.png`
- 전체 시트: `apps/client/public/sprites/scarlet/scarlet-four-idle-v2.png`
- 확대 시트: `apps/client/public/sprites/scarlet/scarlet-four-idle-v2-4x.png`
- 규격/좌표: `apps/client/public/sprites/scarlet/scarlet-four-idle-v2.json`
- 생성 그림을 기존 export 스크립트로 96×96 고정 팔레트에 맞추고 `pack-scarlet-directions.ps1 -Revision v2`로 묶는다.
- 비교 화면 `/scarlet-directions.html`, 맵 `/?scarlet=four-v2`. 과거 four-v1 쿼리도 최신 검수 모드를 연다. 과거 v1 파일은 보존한다.
- 같은 머리·의상과 등 뒤 중앙의 단일 끝 묶음을 유지하면서 검자루→코등이→길고 가는 짙은 칼집→금색 끝마감을 한 자루의 축으로 정리하는 것이 목표다. 머리와 팔에 일부 가려질 수 있지만 노출된 조각은 같은 축에 있어야 한다.
- 한 방향 한 컷의 기본 자세이며 걷기 애니메이션은 아직 없다.
- 검수 완료: 두 생성 원본과 4배 도트에서 길게 이어지는 칼집 확인. pack 검증에서 네 컷 96×96·알파 0/255·발 마지막 행 87 통과. 뒤쪽 두 컷은 각각 31색, 앞 두 컷은 32색이다.
- TypeScript 검사와 Vite 빌드 통과. 브라우저에서 FOUR DIRECTIONS 02와 네 이미지 로드 완료 확인. 실제 화면: `scarlet-four-directions-v2-sheath-preview.jpg`.

## 뒤왼쪽 최종 편집 프롬프트

```text
undefined
```

## 뒤오른쪽 최종 편집 프롬프트

```text
undefined
```

