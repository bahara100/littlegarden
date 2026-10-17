# 홍련 NE V4 — 1번의 실제 좌우 다리 무늬 정정

사용자 지적: 검은 줄무늬는 캐릭터 자신의 왼다리인데, V3의 1번은 오른다리에 검은 무늬가 있었다. 이전 작업에서 화면의 왼쪽 다리를 해부학적 왼다리로 단정한 것이 오류였다.

**이 1번 자세에서는 화면 왼쪽 아래로 길게 뻗은 전경 다리가 RIGHT/오른다리이며 흰 스타킹이다. 뒤에 짧게 보이는 화면 오른쪽 다리가 LEFT/왼다리이며 검은 교차 끈이 있다.** 이 판정은 해당 교차 자세에 대한 것이며 다른 컷의 화면 좌우에 기계적으로 적용하지 않는다.

처음 자세를 유지한 원본(V1/source-keys-ordered.png)의 첫 셀을 편집 대상으로 삼아 짧은 뒤쪽 왼 종아리에 검은 무늬를 적용하고 긴 오른다리는 흰색으로 유지했다. 포즈·다리 윤곽·부츠 위치를 바꾸지 않도록 요청했다. 2·3·4번은 기존 V2 최종 PNG를 복사했고 파일 SHA256이 동일하다. 사용자가 명시한 '3번은 방향을 고친 수정본'을 유지한다.

## 저장 경로
apps/client/public/sprites/scarlet/fullframe-ne-v4/
- source-pose-edit.png: 생성 편집 결과. 1번만 사용하며 다른 셀은 기준으로 쓰지 않는다.
- **source-keys.png: 후속 작업용 최종 조합 원본. 1번 편집 + V2 수정 2·3·4번 원본 셀.**
- frame-1.png ~ frame-4.png, walk.png(384×96), walk-contact-4x.png, walk.json.
- 화면 기록: docs/art/pixel/scarlet-ne-anatomy-v4-review.png.
- 내보내기: tools/art/export-scarlet-ne-keys-v4.ps1, ScarletFrameReplacement.cs.
- 검수: /scarlet-frames.html?direction=ne.
- 놀이터: /?scarlet=frames-ne-v4. 기존 NE v1/v2/v3 URL도 최신 시트 사용.

## 확인

사용자가 첨부한 2×2 이미지는 source-pose-edit.png와 파일 해시가 동일했다. 이 파일에서는 1번만 최종 조합에 채택했으므로 다른 세 컷은 실제 재생본과 달랐다. 생성 도구의 자동 중간 출력을 최종 결과와 구분해 설명하지 못해 혼란을 줬다.

최종 정지 미리보기 **walk-preview-2x2.png(768×768)**를 실제 재생 PNG의 네 컷으로 패키징했다. 각 컷을 최근접 4배 확대해 2×2로 배치했고, tools/art/verify-scarlet-preview.ps1로 모든 출력 픽셀을 대조한 결과 불일치 0이다. 이 작업 전후 walk.png 파일 해시도 동일하므로 캐릭터 그림/애니메이션 자체는 바꾸지 않았다. 검수 페이지의 '재생 컷 2×2 받기'도 이 파일을 가리킨다. 앞으로 이 최종 미리보기만 결과 비교에 사용한다.
V2와 같은 공통 축소율·샘플링 원점으로 1번만 패키징했다. 2·3·4번은 재축소/재인코딩 없이 복사하고 파일 해시 일치를 확인했다. 빌드 성공. 브라우저에서 V4 시트 로드와 1번 다리 확대를 확인했으며 긴 오른다리는 흰색, 가려진 짧은 왼다리는 검은 무늬로 보인다. 오류 로그 없음. 이미지 규격 검사가 해부학 검증을 대신하지 않는다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-ne-keys-v4.ps1
npm.cmd run build
```

## 도구·전체 프롬프트
built-in image_gen.imagegen, transparent_background=true. 입력은 최초 NE 자세 원본(V1/source-keys-ordered.png). 생성 원본을 기본 generated_images에 보존하고 프로젝트로 복사했다. 모델/seed는 도구에서 제공하지 않았다.

```text
Use case: precise-object-edit.
Edit TOP-LEFT CEL ONLY in this transparent 2x2 Scarlet northeast rear-view sheet. The user's anatomical correction is authoritative:
IN THIS PARTICULAR POSE the LONG FOREGROUND LEG, visible at screen-left and extended down-left, is the character's RIGHT LEG. It MUST remain PLAIN WHITE stocking, no black X straps.
The SHORTER REAR LEG tucked behind toward screen-right is the character's LEFT LEG. Add the BLACK CRISSCROSS STRAPS to the EXPOSED stocking part of THAT SHORT REAR CALF. Make a small visible dark X/diagonal band on the exposed side above its gold boot cuff, naturally occluded by the foreground leg and coat. Do not put the black pattern on the large foreground calf.
The previous error was assuming screen-left = anatomical left when legs cross. Do not repeat that. The long screen-left leg is RIGHT/plain; the short rear screen-right leg is LEFT/black straps in THIS pose.
Preserve the exact original pose, leg contours, hip/knee/ankle/boot positions, foot angles, stride, body/hat/head/arms/hair/center tie/coat/sword and registration. Change ONLY stocking surface markings inside the small rear-left calf. Foreground long white calf stays plain exactly as it is. No geometry changes, no relocating feet, no new posture, no mirroring. No extra leg or boot. Same pixel-art finish and true transparent 2x2 layout, no labels/guides/shadows. Other cells unchanged as much as possible; only top-left is being used.
```

