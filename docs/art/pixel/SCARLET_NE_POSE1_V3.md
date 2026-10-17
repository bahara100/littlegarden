# 홍련 NE V3 — 1번 초기 자세 복원, 3번 수정본 유지

> 사용자 재지적으로 1번의 무늬 배치가 잘못된 이전 버전이다. 실제 좌우를 화면 좌우로 혼동했다. 최신 기준은 SCARLET_NE_ANATOMY_V4.md 및 fullframe-ne-v4/source-keys.png다.

사용자는 최초 NE 1번의 자세가 좋았고 무늬만 틀렸으며, 최근 1번의 자세가 어색하다고 지적했다. 이어 **3번은 다리 방향을 고친 수정본을 사용해야 한다**고 명시했다.

## 최종 조합
- 1번: NE V1/source-keys-ordered.png의 첫 자세를 편집 대상으로 삼아 다리/발 위치·각도·길이를 유지하고, 전경 왼 종아리에 검은 교차 끈, 가려진 오른 종아리에 흰 스타킹을 적용하도록 편집했다. 보폭/접지 단계 명목으로 다리 위치를 다시 바꾸지 않았다.
- **2·3·4번: NE V2의 최종 frame-2/3/4.png를 그대로 복사.** PNG 파일 SHA256 동일을 확인했으므로 3번도 방향을 고친 수정본 그대로다.
- 현재는 4컷 검수본이다. 자연스러운 순환의 완성을 자동 검사로 주장하지 않는다. 특히 이번에는 사용자 선호에 따라 1번의 원래 자세를 우선했고 접지 단계 해석에 맞춰 자세를 재변형하지 않았다.

## 저장 파일
apps/client/public/sprites/scarlet/fullframe-ne-v3/
- source-pose-edit.png: 최초 NE 기준 이미지에 무늬만 바꾸도록 요청한 편집 결과. **이 이미지의 2·3·4번은 이전 오류가 있으므로 그대로 사용하지 않는다.**
- **source-keys.png: 최종 고해상도 2×2 기준. 1번은 편집 결과, 2·3·4번은 V2/source-keys-grounded.png의 같은 셀을 픽셀 그대로 재포장했다. 후속 제작 참고는 이 조합 원본을 사용한다.**
- frame-1.png: 새로 패키징한 초기 자세+수정 무늬.
- frame-2.png / frame-3.png / frame-4.png: V2의 최종 PNG와 바이트 동일.
- walk.png: 최종 384×96 시트.
- walk-contact-4x.png: 네 컷 4배 확대.
- walk.json: 공통 축소율/샘플링 원점/프레임 등록 정보.
화면 기록 docs/art/pixel/scarlet-ne-pose1-v3-review.png.

검수 /scarlet-frames.html?direction=ne
놀이터 /?scarlet=frames-ne-v3 (기존 v1/v2 URL도 최신 수정 시트 사용).

## 패키징/검증
tools/art/export-scarlet-ne-keys-v3.ps1 → ScarletFrameReplacement.cs.
네 컷을 다시 축소하면 3번까지 달라질 수 있어, 1번만 V2의 공통 축소율 0.14513274336283186과 샘플링 원점을 사용해 패키징했다. 1번의 전체 셀을 그 좌표계로 샘플링하여 기존 공통 크롭 경계 밖으로 조금 나온 모자도 자르지 않았다. 머리 가로 중심/발 기준 정수 등록은 기존 규칙을 유지했다. 2·3·4번은 PNG를 재인코딩하거나 다시 정렬하지 않고 복사했다.

- 1번 96×96/32색/투명/내용 잘림 검사.
- 2·3·4번: 이전 V2 최종 PNG와 파일 해시 동일 검증. 3번 원본 셀도 기존 V2와 동일한 픽셀 복사.
- 빌드 성공 (기존 3D character 번들 크기 경고 유지).
- 브라우저에서 새 V3 시트 경로와 1번/3번 표시, 느린 재생, 놀이터 V3 검수 링크 확인. 검수/놀이터 오류 로그 없음.
- 저위험 에셋 교체에 대해 동일 단위 테스트를 반복하는 대신 사용자 요구인 '3번 수정본 보존'을 파일 해시로 확인했다.

## 재현
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/art/export-scarlet-ne-keys-v3.ps1
npm.cmd run build
```

## 이미지 편집 도구와 전체 프롬프트
built-in image_gen.imagegen, transparent_background=true. 입력: fullframe-ne-v1/source-keys-ordered.png (원래 자세를 보존할 편집 대상). 결과는 기본 generated_images에 보존하고 프로젝트에 복사했다. 모델/seed는 도구가 제공하지 않았다.

```text
Use case: precise-object-edit.
Edit ONLY stocking decoration/texture in TOP LEFT CEL of this existing transparent 2x2 Scarlet rear northeast sprite sheet. The user EXPLICITLY likes this ORIGINAL TOP-LEFT POSE and rejects the later leg repositioning. Pose preservation is the absolute priority.
In top-left the LONG foreground calf at SCREEN LEFT is currently plain white: add the character's BLACK CRISSCROSS STRAPS to THIS EXACT calf, keeping its existing contour, knee angle, length, ankle, gold cuff and boot silhouette/position unchanged.
The SHORTER partially obscured calf at SCREEN RIGHT is the opposite RIGHT leg: make it PLAIN WHITE with no black straps, retaining its exact current geometry. Keep the original small pink stocking top border.
Change only the surface colors/black band pattern INSIDE these two existing calf silhouettes. Do NOT change leg shapes, hip/knee connections, foot/ankle locations, boot toe directions, stride, leg height, body height or ground line. Do NOT try to enforce a different contact phase or correct the gait. Do NOT move either foot at all. Do not redraw new limbs. The foreground long left calf should still extend down-left exactly as it does now, and the shorter right calf/boot stay tucked behind in exactly its original location.
Keep head/hat, loose hair with one low center tie, torso, shoulders, arms, red sash, coat, sword and canvas registration unchanged. Preserve all other three cells as much as possible. Same existing pixel-art finish. No text, guides, shadows or new objects. True transparency. Exactly same 2x2 full-body sheet layout.
```

