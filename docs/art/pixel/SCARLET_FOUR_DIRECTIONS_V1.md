# 홍련 네 방향 기본 자세 01

↘ 승인된 v3 기본 자세를 유지하고 ↙·↖·↗를 개별 제작했다. 내장 image_gen 사용, CLI/API 생성 미사용. 단순 좌우 반전은 사용하지 않았다. 긴 뒷머리는 끝만 등 뒤 중앙 한곳에서 묶으며, 앞 대각선에서는 그 묶음이 가려진다.

## 파일

공통 위치: `apps/client/public/sprites/scarlet/`

| 방향 | 96px PNG | 생성 원본 |
|---|---|---|
| ↘ 앞오른쪽 | scarlet-se-idle-base-v3.png | scarlet-se-idle-base-v3-source.png |
| ↙ 앞왼쪽 | scarlet-sw-idle-four-v1.png | scarlet-sw-idle-four-v1-corrected-source.png |
| ↖ 뒤왼쪽 | scarlet-nw-idle-four-v1.png | scarlet-nw-idle-four-v1-source.png |
| ↗ 뒤오른쪽 | scarlet-ne-idle-four-v1.png | scarlet-ne-idle-four-v1-source.png |

- 묶음 시트: `scarlet-four-idle-v1.png` (384×96, 순서 SE/SW/NW/NE).
- 확대: `scarlet-four-idle-v1-4x.png` (1536×384).
- 좌표/규격: `scarlet-four-idle-v1.json`.
- 개별 원본을 기존 export 스크립트로 변환한 뒤 pack 스크립트로 묶었다. 각 장은 96×96, 불투명 32색, 알파 0/255, 마지막 발 픽셀 행 87(기준선 88)을 검사했다.
- 앞왼쪽 최초 생성본은 옆 묶음이 남아 추가 편집했다. 최종 렌더에는 corrected-source를 사용한다.

## 연결과 범위

- `/scarlet-directions.html`: 네 방향 확대/실제 크기 비교, 발·중심 기준선, 개별 다운로드.
- `/?scarlet=four-v1`: 시뮬레이션 yaw를 맵 투영에 맞춰 SE/SW/NW/NE로 선택한다. 걷기 프레임이 아닌 기본 자세 전환이다.
- 기존 단일 컷 검수와 기존 게임은 유지했다.
- 빌드 및 자동 테스트 23개 통과. 추가 테스트는 월드 좌표 방향과 화면 대각선의 매핑을 확인한다.
- 브라우저에서 네 방향 모두 로드 완료 상태 확인.
- 완전히 정리된 수작업 도트가 아닌 생성 원본 규격화 초안이다. 방향 사이 눈·모자 윤곽·장식·의상 세부 차이가 남는다. 걷기 제작 전 비교 화면으로 확인한다.

## 앞왼쪽 생성 프롬프트

```text
Edit the supplied approved Scarlet standing sprite into ONE new viewing direction. Same exact character design, proportions, head/hat size, relaxed planted-feet standing pose, materials, colors and crisp chunky pixel-art style. One whole character centered on a square transparent background, ample margin, no floor/shadows/text/labels. Isometric 2:1 diamond game camera elevated 30 degrees. Keep ivory broad kasa hat with two slender gold horns, violet braided top cord, violet flower emblem, hanging HAT tassels, silver lavender long hair, white off-shoulder purple-trimmed outfit, red waist sash, gold edges, white boots. Sheathed katana stays on HER ANATOMICAL LEFT hip, asymmetric BLACK wrap on HER ANATOMICAL LEFT leg; do not just mirror the image or move these to her other side. CRITICAL HAIR: ONE relaxed long curtain of hair, loose from head down back, gathering inward toward the spine; ONLY its bottom ends tied once with ONE small violet bow ON THE REAR MIDLINE behind lower back, with one short tapered tuft. NO twin tails, NO side ponytail, NO side bow near hand. From back views the ONE central low tie is clearly visible, upper/middle hair is loose, not tied at nape. Keep rear hair COMPACT, no huge hair cloud. The hat tassels are separate from hair ties. Use clean broad pixel clusters, restrained details, dark muted purple outlines, upper-left light, same cute two-head SD proportions as reference; suitable for later 96x96 fixed palette export. Do not create multiple views or frames.
DIRECTION: FRONT THREE QUARTER, facing SCREEN LOWER LEFT / southwest. Show her cute amber eyes and face turned toward lower left; both shoulders, torso, hips and toes face the same lower-left diagonal. This is the opposite front diagonal to the reference. Rear center hair tie is mostly hidden BEHIND torso, never move it to an outer side to expose it.
```

### 앞왼쪽 머리 교정 프롬프트

```text
Correct ONLY the back hair in this southwest Scarlet standing sprite. The small violet tie and separate tuft at the OUTER SCREEN-RIGHT edge beside her rightmost hand are WRONG. REMOVE that lateral tie and tuft completely. The long hair is a single continuous loose curtain flowing behind her back; all its low tips gather ON THE REAR SPINAL MIDLINE behind the torso and pelvis. In this FRONT southwest three-quarter view that one rear-center low tie must be OCCLUDED by torso/clothing, not shown at the side outline. Do not expose a side ponytail, do not add any hair bow on either outer edge. Visible side hair should curve INWARD behind the torso rather than hang in a separate tail near the hand. Leave bangs, face, hat/hat tassels, horns, costume, sash, sword, asymmetric leg wraps, boots, southwest facing, proportions, pixel art and transparent background EXACTLY unchanged. Keep the sword and black wrapped leg on the same anatomical side as this input. Only remove the erroneous outer hair tie and make that hair merge into the rear-center curtain.
```

## 뒤왼쪽 생성 프롬프트

```text
Edit the supplied approved Scarlet standing sprite into ONE new viewing direction. Same exact character design, proportions, head/hat size, relaxed planted-feet standing pose, materials, colors and crisp chunky pixel-art style. One whole character centered on a square transparent background, ample margin, no floor/shadows/text/labels. Isometric 2:1 diamond game camera elevated 30 degrees. Keep ivory broad kasa hat with two slender gold horns, violet braided top cord, violet flower emblem, hanging HAT tassels, silver lavender long hair, white off-shoulder purple-trimmed outfit, red waist sash, gold edges, white boots. Sheathed katana stays on HER ANATOMICAL LEFT hip, asymmetric BLACK wrap on HER ANATOMICAL LEFT leg; do not just mirror the image or move these to her other side. CRITICAL HAIR: ONE relaxed long curtain of hair, loose from head down back, gathering inward toward the spine; ONLY its bottom ends tied once with ONE small violet bow ON THE REAR MIDLINE behind lower back, with one short tapered tuft. NO twin tails, NO side ponytail, NO side bow near hand. From back views the ONE central low tie is clearly visible, upper/middle hair is loose, not tied at nape. Keep rear hair COMPACT, no huge hair cloud. The hat tassels are separate from hair ties. Use clean broad pixel clusters, restrained details, dark muted purple outlines, upper-left light, same cute two-head SD proportions as reference; suitable for later 96x96 fixed palette export. Do not create multiple views or frames.
DIRECTION: REAR THREE QUARTER, facing SCREEN UPPER LEFT / northwest, looking AWAY from viewer. Show back of head and back of costume, NOT front face, no visible eyes looking at viewer, at most a tiny cheek edge. Body and both toes face upper left. The rear hair curtain gathers to ONE central low tip tie along her SPINE, clearly visible at center of back (not at either lateral edge). Preserve compact hair and visible boots.
```

## 뒤오른쪽 생성 프롬프트

```text
Edit the supplied approved Scarlet standing sprite into ONE new viewing direction. Same exact character design, proportions, head/hat size, relaxed planted-feet standing pose, materials, colors and crisp chunky pixel-art style. One whole character centered on a square transparent background, ample margin, no floor/shadows/text/labels. Isometric 2:1 diamond game camera elevated 30 degrees. Keep ivory broad kasa hat with two slender gold horns, violet braided top cord, violet flower emblem, hanging HAT tassels, silver lavender long hair, white off-shoulder purple-trimmed outfit, red waist sash, gold edges, white boots. Sheathed katana stays on HER ANATOMICAL LEFT hip, asymmetric BLACK wrap on HER ANATOMICAL LEFT leg; do not just mirror the image or move these to her other side. CRITICAL HAIR: ONE relaxed long curtain of hair, loose from head down back, gathering inward toward the spine; ONLY its bottom ends tied once with ONE small violet bow ON THE REAR MIDLINE behind lower back, with one short tapered tuft. NO twin tails, NO side ponytail, NO side bow near hand. From back views the ONE central low tie is clearly visible, upper/middle hair is loose, not tied at nape. Keep rear hair COMPACT, no huge hair cloud. The hat tassels are separate from hair ties. Use clean broad pixel clusters, restrained details, dark muted purple outlines, upper-left light, same cute two-head SD proportions as reference; suitable for later 96x96 fixed palette export. Do not create multiple views or frames.
DIRECTION: REAR THREE QUARTER, facing SCREEN UPPER RIGHT / northeast, looking AWAY from viewer. Show back of head and back of costume, NOT front face, no eyes looking at viewer, at most a tiny cheek edge. Body and both toes face upper right. Rear hair curtain gathers to ONE central low tip tie along her SPINE, clearly visible at center of back (not at either lateral edge). This is the opposite back diagonal; katana remains at HER LEFT hip, don't mirror its anatomical placement.
```

