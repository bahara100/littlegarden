# 공통 몸체 정지 V2 · 자연스럽게 내린 팔

사용자가 가슴 앞에 모은 손을 옆으로 펴 달라고 요청했고, 곧게 편 A자 초안을 “너무 기본 자세”라며 자연스럽게 다듬도록 했다. 이후 “좋아. 다음은 앉는 자세도 베이스 몸체를 만들자.”라고 확인했다.

최신 정지는 `base-idle-se.png` / `garden-body-idle-relaxed-v2.pxo`다. 어깨를 낮추고 팔꿈치를 부드럽게 굽혀 손을 몸통 양옆에 놓았다. 좌우 각도에 차이가 있다. 기존 머리(행0..53)와 무릎 아래/발(행75 이후)은 표시 픽셀이 동일하다. 96×96, 19색, 알파0/255, 머리/몸 2레이어다.

내장 image_gen으로 팔 자세를 만들고 Pixelorama에서 기존 팔레트로 정리해 원래 머리와 하체에 연결했다. 생성 지시문은 `prompt.txt`, 채택한 AI 원본은 `source-arms-relaxed-ai.png`다. 첫 A자 초안 `source-arms-ai.png`와 `garden-body-idle-arms-open-v2.pxo`는 이력이며 최종 표시본이 아니다.

기존 모모·루루 의상에는 소매와 손도 포함되므로 새 팔 위에 그대로 겹치지 않는다. 머리 PNG만 보조 자료로 보존했다. 게임에는 아직 연결하지 않았다.

패키징: `python tools/art/package-garden-body-poses-v1.py`. 확인 페이지: `apps/client/public/body-base-v2/index.html`.
