# 홍련 걷기 02 — 4번 교차 자세 수정

사용자 번호는 시트의 왼쪽 위부터 1·2·3·4다. 3→4→1에서 왼발이 부자연스럽게 이동한다는 피드백에 따라 4번만 다시 제작했다.

- 1·2·3번은 기존 v1 PNG를 그대로 재사용한다.
- 4번은 오른쪽 흰 다리가 몸 아래에서 지지하고, 왼쪽 검은 장식 다리는 무릎을 굽혀 발을 들어 몸 아래를 지나가는 중간 자세로 교정했다. 곧바로 왼발을 멀리 내미는 기존 4번 대신 passing 자세를 사용한다.
- 내장 image_gen 편집 사용. 입력 1은 기존 3번, 입력 2는 다음으로 이어질 1번이다. CLI 이미지 생성은 사용하지 않았다.
- 새 원본: `apps/client/public/sprites/scarlet/scarlet-se-walk-v2-frame-3-source.png`
- 새 4번: `apps/client/public/sprites/scarlet/scarlet-se-walk-v2-frame-3.png`
- 새 시트: `apps/client/public/sprites/scarlet/scarlet-se-walk-v2.png`
- 확대 시트: `apps/client/public/sprites/scarlet/scarlet-se-walk-v2-4x.png`
- 메타데이터: `apps/client/public/sprites/scarlet/scarlet-se-walk-v2.json`
- 포장 스크립트: `tools/art/pack-scarlet-walk-v2.ps1`. 기존 1·2·3 PNG와 새 4번만 묶는다.
- 각 컷은 96×96, 최대 32색, 알파 0/255, 발 기준선 y=88이다.
- `/scarlet-walk.html`에 3→4→1만 반복 버튼 추가. 멈춘 상태에서 한 컷 넘기기도 해당 순서로 동작한다.
- 맵 주소 `/?scarlet=walk-se-v2`, 과거 walk-se-v1 쿼리도 최신 걷기 검수 모드로 연결한다.
- TypeScript/Vite 빌드 통과. 브라우저에서 4→1→3→4 순환(3→4→1의 반복), 4번 직접 선택, 구간 재생을 확인했다.
- 실제 화면: `scarlet-se-walk-v2-frame4-preview.jpg`.
- 여전히 생성 초안이며, 수정한 4번의 얼굴·모자 윤곽 등에 미세한 외형 차이가 남을 수 있다.

## 최종 편집 프롬프트

```text
Create ONE corrected intermediate walking frame, frame 4, using image1 as the exact EDIT TARGET (frame3 right-foot contact) and image2 ONLY as future pose reference (frame1 left-foot contact). Output one full character on transparent background, no extra boots/objects/pixels outside the character, not a sheet. Preserve image1's camera, scale, head, hat, face, torso, costume, hair, sheathed sword, colors and pixel art nearly exactly. CHANGE THE LEGS to a true LEFT-LEG PASSING POSE BETWEEN these two references, NOT either contact pose. Anatomical LEFT leg is the BLACK-WRAPPED leg: in image1 it trails behind, in image2 it is extended far forward. In the new intermediate frame its KNEE bends and travels FORWARD while the LEFT BOOT is LIFTED and TUCKED UNDER THE PELVIS close to the standing leg, ready to extend next, NOT already stretched out to the front, not planted on ground, not teleported sideways. Anatomical RIGHT WHITE leg is the SUPPORT leg: draw it almost vertical beneath hip, with white boot planted under the body on the SAME ground baseline as image1. The black boot should be visibly higher than planted white boot and roughly near its ankle/shin, a compact passing silhouette. Left black boot halfway between trailing position of image1 and extended lower-right position of image2. Face and body STILL point southeast/lower right. Upper body stays level and at same horizontal anchor. Tiny neutral arm passing swing if needed; no jump, run, kick, crouch or new limb. Maintain identity of each leg (black wraps on left, white on right) and both boots, no duplicated legs. Keep rear hair a single loose curtain with only one bottom tie behind CENTER of back, no side ponytail. Keep hat and head exactly matching image1, no size change, no extra shadow/floor/text. ONE full character fully inside generous clear margins. We need smooth 3->4->1 motion: right white contact -> white support and black foot passing UNDER BODY -> black left contact.
```

