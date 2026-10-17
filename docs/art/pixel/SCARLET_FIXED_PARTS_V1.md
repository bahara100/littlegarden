# 홍련 고정 부품 보행 시험 01

내장 image_gen으로 한 번의 정지 부품 아틀라스를 만들고, 동일한 7개 부품으로 네 컷을 조립했다. 프레임별 전체 캐릭터 재생성/다리 텍스처 교체/좌우 반전은 하지 않는다. CLI/API 키 사용 없음.

## 결과 및 수정 원본 경로

- 원본 부품 아틀라스: `apps/client/public/sprites/scarlet/rig-se-v1/parts-source.png`
- 분리 부품 7개: 같은 폴더의 `body.png`, `leftThigh.png`, `leftShin.png`, `leftBoot.png`, `rightThigh.png`, `rightShin.png`, `rightBoot.png`
- 부품 규격/원본 영역/팔레트: `parts.json`
- 고정 관절·부품 연결·포즈 원본: `apps/client/src/scarletRig.ts`
- 조립·회전·팔레트 정리: `apps/client/src/scarletRigRenderer.ts`
- 실제 조립 PNG 시트: `docs/art/pixel/scarlet-se-rig-walk-v1.png` (384×96)
- 검수 화면: `scarlet-rig.html`, 맵 시험: `?scarlet=rig-se-v1`
- 자동 검사: `tests/life/scarlet-rig.test.ts`
- 지속 제작 지침: 루트 `AGENTS.md` 및 `docs/art/pixel/CHARACTER_PRODUCTION_WORKFLOW.md`

## 구현 기준

LEFT는 검은 교차 끈 부품, RIGHT는 분홍 지그재그 흰 스타킹 부품으로 영구 연결한다. 앞오른쪽 상체 원본에 맞춰 골반 좌표는 왼다리 (57,61), 오른다리 (49,61). 허벅지 길이 9, 종아리 길이 11이며 두 관절 역기구학으로 무릎을 구한다. 부츠는 종아리 회전과 분리해 앞오른쪽 방향을 유지한다. 위치를 바꾸더라도 같은 이미지 ID를 사용한다.

상체는 첫 시험을 위해 하나의 합성 부품으로 고정했다. 머리/팔/머리카락/칼집의 독립 레이어 및 다른 방향까지 완료한 작업은 아니다. 참조 기본 자세를 바탕으로 부품 원본을 새로 생성했으므로 과거 PNG 픽셀을 그대로 유지한 결과도 아니다.

아틀라스의 실제 배치는 행 높이가 같지 않아 원본 영역을 측정해 분리했다. 각 부품의 가장 큰 알파 연결 성분을 추출하고, 부품별 고정 크기로 축소/고정 팔레트 양자화했다. 작은 다리 부품의 옆 외곽선은 보강하고 관절 접합 끝은 겹칠 수 있게 뒀다. 렌더 후 이진 알파와 32색 팔레트를 다시 적용한다. 네 컷 각각을 내용 경계에 맞춰 확대/축소하지 않는다.

## 검증과 남은 작업

전체 테스트 26개 통과, 최종 골반 보정 후 관절 검사 2개 재실행 통과. TypeScript와 프로덕션 빌드 성공. 관절 검사는 모든 컷의 고정 부품 ID/골반 위치/허벅지·종아리 길이, 2번 오른발/4번 왼발 들기, 4→1 순환을 확인한다. 브라우저에서 상체/한쪽 다리 숨기기와 관절 표시, 한 컷 전환, 부품 목록을 확인했다. PNG 내보내기는 384×96, 32색 이하, 이진 알파, 상체 영역의 프레임 간 동일성을 검사했다.

이 시험의 목표는 좌우 디자인 교환 방지와 수정 가능한 구조 확보다. 걷기의 무게감, 관절 주변 도트, 접지/보폭, 상체 연동은 후속 보정 대상이며 최종 보행 애니메이션으로 판정하지 않는다. 다른 방향은 이전 기본 자세를 표시한다.

## 부품 생성 최종 프롬프트

```text
Use case: identity-preserve. Asset type: layered 2D puppet animation PARTS ATLAS, NOT animation frames. Use attached approved Scarlet southeast/front lower-right standing character as exact design reference. Output ONE transparent 4-column by 2-row grid of isolated CUTOUT PARTS, each centered with generous empty space. No text or labels or drawn grid. Every part in its own cell, no overlap.
Seven parts, exact row-major cell order:
Cell 1 (top-left): COMPLETE UPPER BODY cutout, from full ivory horned hat down to red sash, short white skirt and long purple/gold coat tails. Include face, arms/sleeves/hands, loose long lavender back hair, one sword at anatomical left waist. REMOVE BOTH LEGS entirely below the short skirt, leaving transparent space between coat tails. Keep head/hat/hair/robe exactly as reference. No amputated flesh, this is a clean paper-doll asset.
Cell 2: anatomical LEFT upper thigh only, peach skin and dark thigh garter at bottom, vertical from hip at top to knee at bottom. No shin/boot.
Cell 3: anatomical LEFT lower leg only, ivory-white stocking with permanent BLACK CRISSCROSS WRAPS across calf, vertical from knee at top to ankle at bottom. No thigh, no boot.
Cell 4: anatomical LEFT boot only, white upper, gold V cuff, dark charcoal toe/sole, pointing diagonally LOWER RIGHT southeast, ankle opening at top.
Cell 5 (bottom-left): anatomical RIGHT upper thigh only, peach skin and dark thin thigh garter at bottom, vertical hip to knee. No shin/boot.
Cell 6: anatomical RIGHT lower leg only, plain ivory white stocking with subtle pink zigzag near top; NO black crisscross wraps, vertical knee to ankle. No thigh, no boot.
Cell 7: anatomical RIGHT boot only, white upper, gold V cuff, charcoal toe/sole, ALSO pointing LOWER RIGHT southeast, ankle opening top. Same style as left boot.
Cell 8: completely EMPTY and transparent.
Use same design, restrained simplified shading, clean dark outlines, chibi proportions. Parts are neutral resting parts to rotate at hip/knee/ankle; NOT walking poses. Left/right anatomical identities must never swap. No repeated full characters, no motion frames, no duplicate limbs in any cell, no shadows. Genuine transparent background. Roughly equal relative scale among LEG parts only, but upper-body part may fill its own cell independently; atlas will be resized per part by software. Purple hair is one loose curtain gathered once at low BACK CENTER, no twintails/side ponytail. Keep cutout edges clean for joint overlap.
```

