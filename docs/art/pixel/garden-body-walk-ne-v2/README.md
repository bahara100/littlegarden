# 공통 몸체 NE 걷기 V2 · 실제 뒷모습 전신 4컷 후보

사용자 요청: “걷기모션 다른 방향도 작업하자. 뒷모습걷기.” 기존 NE V1(앞모습의 V넥/주름만 지운 폐기 초안)은 재사용하지 않았다.

승인된 SE V20을 비율·색·표현 참고로, 홍련 NE V9를 뒤쪽 발/겹침 참고로 삼았다. 내장 image_gen으로 등·목덜미·뒤꿈치/밑창이 보이는 네 전신 자세를 만들었다. 첫 생성의 같은 팔 스윙/비슷한 통과 자세를 수정했고, 2번은 왼다리 지지·오른발 통과가 되도록 전신 시안을 한 번 더 수정했다.

최종 출처는 `source-cycle.png`의 1·3·4번과 `source-pose2-fixed.png`의 2번이다. `source-first-draft.png`, `source-pose2-before.png`는 중간본이며 최종 미리보기로 표시하지 않는다. 원본별 해상도 차이를 맞추기 위해 머리 폭46px를 기준으로 **전신 전체를 같은 비율로** 축소/정렬했다. SE의 머리 폭48px에 근접한 시안이며, 머리나 팔다리를 따로 조립하지 않았다. 목/몸/발은 각 컷에서 이어져 있다.

- 실제 재생: `walk.png`, 전신96×96 네 컷·6 FPS.
- 순서: 왼발 앞 → 오른발 통과 → 오른발 앞 → 왼발 통과. 팔도 반대쪽으로 흔든다.
- 편집 원본: `garden-body-walk-ne-v2.pxo`, 네 프레임·머리/몸 레이어. 레이어는 완성 전신을 손실 없이 나눈 편집용이다.
- NW: `garden-body-walk-nw-v2/`의 컷별 정확한 좌우 반전. 네 방향을 따로 그리지 않는다.
- 도구: `tools/art/garden-body-ne-v2-sample.gd`를 Pixelorama MCP `eval_gdscript`에서 프레임 번호와 함께 실행해 네이티브 PNG를 만든다. `source-layout.json`이 전체 프레임 배율/정렬 기준이다. 출력 패키징은 `python tools/art/build-garden-body-walk-ne-v2.py`.
- 생성 지시문: `prompt-cycle.txt`, `prompt-cycle-fix.txt`, `prompt-pose2.txt`.
- 확인: `apps/client/public/body-walk-ne-v2/index.html`. NE/NW 선택, 정지/반복재생/3 FPS/어니언 스킨, 실제 네 컷을 확인한다.

정지 미리보기/GIF는 실제 `walk.png`와 픽셀 일치하며 생성 중간본과 섞어 표시하지 않는다. 보존/연결/반전 검사 통과는 사용자 승인이 아니다. **새 후보는 사용자 검수 전이며 SE V20과 실제 게임은 교체하지 않았다.**
