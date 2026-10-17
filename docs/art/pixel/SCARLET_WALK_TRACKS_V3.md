# 홍련 보행 방향 재검수 v3

내장 image_gen 사용. CLI/API 키 사용 없음. 이 기록은 `SCARLET_SW_TRACKS_V3.md` 이후 뒷방향까지 반영한 최종 상태다.

## 변경한 결과 파일

- `apps/client/public/sprites/scarlet/scarlet-sw-walk-v3.png`
- `apps/client/public/sprites/scarlet/scarlet-nw-walk-v3.png`
- `apps/client/public/sprites/scarlet/scarlet-ne-walk-v3.png`
- 각 방향 `-4x.png`, `-frame-{0..3}.png`, `.json`
- SE `scarlet-se-walk-v2.png`는 이전 사용자 확인 버전을 유지한다.

## 원본과 재현

각 방향 원본은 `scarlet-{sw,nw,ne}-walk-v3-guide-source.png`. 관절 도식은 `docs/art/pixel/scarlet-{sw,nw,ne}-leg-tracks-guide.png`. 도식은 새로 그린 단순 구조 그림이며 캐릭터 그림을 코드로 편집한 것이 아니다.

SW와 NW는 `tools/art/export-scarlet-walk.ps1 -Source <guide-source.png> -Direction <sw|nw> -Revision v3`로 내보냈다.

NE 전체 생성은 2·4번 들리는 발이 반복되어 2번을 한 번 더 생성했다. 최종 2번 원본은 `scarlet-ne-walk-v3-frame2-fix-source.png`. `-Frame2Override apps/client/public/sprites/scarlet/scarlet-ne-walk-v3-frame2-fix-source.png` 옵션으로 내보냈다. NE 최초 도식의 좌우 골반 배치는 카메라 해석이 맞지 않아 최종 2번 보정은 실제 캐릭터 그림 기준 검은 다리 왼쪽/흰 다리 오른쪽을 명시했다. 재생성 실패와 최종 입력을 구분해 보존한다.

## 검수 기준과 한계

이전 수정에서 2·4번을 개별적으로 바꾸며 다리/부츠가 바깥으로 벌어지고 큰 무릎 들기가 생겼다. 새 세 방향은 전체 네 컷을 작은 보폭으로 다시 생성한 뒤, 진행 방향으로 부츠가 놓이는지와 왼발/오른발이 번갈아 드는지 별도로 확인했다. SW 첫 단순 생성 `scarlet-sw-walk-v3-source.png`는 1·2번이 반복되어 미채택했다.

원본과 실제 96×96 시트를 시각적으로 확인했다. 내보내기는 최대 32색/이진 알파/마지막 불투명 행87을 검사했다. 최종 TypeScript+Vite 빌드 성공. 브라우저에서 SW 1→2→3→4→1 전환, 방향별 v3 다운로드 링크/정상 로드와 2·4 비교를 확인했다. 기계 검사가 해부학이나 자연스러운 보행을 보장하지는 않는다.

생성 기반의 재검수 초안이다. 같은 관절 리그로 렌더한 결과가 아니므로 모자·의상 크기와 발 접지의 미세한 변화는 남아 있다. 완전한 관절 일관성을 확보한 최종 애니메이션으로 판정하지 않는다.

## 최종 프롬프트

### SW 관절 가이드 생성

```text
Use case: compositing. Create a coherent 4-frame isometric Scarlet walk sprite sheet. Image1 = character appearance only. Image2 = REQUIRED leg joint trajectories and boot direction, NOT output artwork. Final output 2x2 full-body poses, true transparent background, no text or diagram markings.
Keep southwest/front lower-left camera and Scarlet costume/hair/hat from image1. Map image2 BLACK leg to Scarlet anatomical LEFT leg with black crisscross wraps. Map BLUE leg to her plain WHITE RIGHT leg, do NOT color it blue. Map GREEN boot arrows to the toe direction of BOTH her boots: lower-left in EVERY frame. Follow the guide ankle/knee positions closely! No big knee lifts, no sideways or outward knees, no foot turning right, no boot soles facing camera. Legs stay attached to same hips. Both boots parallel, tiny heel lift in passing.
Frame1 left wrapped leg forward, right plain back. Frame2 left wrapped leg supports screen-right, right plain foot passes screen-left with small lift. Frame3 right plain leg forward screen-left, left wrapped back screen-right. Frame4 right plain supports screen-left, left wrapped passes screen-right with small lift. This is a calm SMALL-STEP WALK, NOT a knee-raising march. Do not duplicate the two passing frames. Exactly 2 legs per pose, modest stride, legs below the skirt, no crouch.
Four identical heads/torso facing lower-left, body position/size/hat silhouette unchanged. Natural coherent sequence 1→2→3→4→1. The guide exaggerates leg length only to show joints; preserve short SD proportions of appearance reference. One loose lavender hair curtain, ends gathered once at back center hidden from front; no side bow. Preserve the one sheathed sword on left waist and asymmetric leg wraps. Clean simplified pixel-friendly chibi shading suitable for 96x96. Each character entirely inside its equal square cell with generous empty margins. No shadows, no letters/numbers, no colored joint marks in output.
```

### NW 관절 가이드 생성

```text
Use case: identity-preserve with pose guide. Output a clean transparent 2x2 sprite sheet of Scarlet walking NORTHWEST upper-left, viewed from BACK three-quarter, matching image1 exactly. Image1 is identity/camera reference. Image2 is required leg joint/boot direction guide, not final artwork.
Four full-body poses with SAME body/hat camera, scale, silhouette and center. Small calm walking steps. Image2 BLACK leg means anatomical LEFT leg with black crisscross straps, attached to screen LEFT hip. BLUE means plain WHITE anatomical RIGHT leg, screen RIGHT hip, not blue fabric. GREEN lines are boot toe vectors. BOTH boot toes must always point UPPER LEFT in every pose. Show heels from behind; no frontal shoe toe caps facing viewer, no turned-out feet, no sideways knees, no high knee marching, no soles facing camera.
Follow guide joint tracks: frame1 wrapped LEFT foot forward upper-left and plain RIGHT foot back lower-right. Frame2 wrapped LEFT supports under its own screen-left hip and plain RIGHT heel passes slightly lifted under its screen-right hip. Frame3 plain RIGHT foot forward upper-left and wrapped LEFT foot back lower-right. Frame4 plain RIGHT supports under its screen-right hip, wrapped LEFT heel passes slightly lifted under its screen-left hip. Exactly two legs, fixed hip ownership, opposite small passing poses. The gray guide has long schematic legs; retain Scarlet's SHORT SD legs from identity reference. Keep thighs beneath hem, no pelvis rotation or leg swapping, modest stride.
Keep ivory gold horned hat, lavender hair as ONE loose curtain tied ONLY once at LOW CENTRAL ends, white/purple/gold robe red sash. Katana hilt at screen-left waist, guard and slim dark sheath continuing diagonally down screen-right to single gold tip, never missing or doubled. No front eyes, only small hidden cheek as reference. No extra bow/side tails. Subtle arm swing. Pixel-friendly simplified clean shaded chibi art for 96x96 reduction. All hats/boots/sheaths wholly inside equal cells with generous empty margins. No text, numbers, colored guide marks, background or shadows. Transparent alpha.
```

### NE 전체 생성

```text
Use case: identity-preserve with pose guide. Create a coherent 4-frame isometric Scarlet walking sprite sheet, 2x2 transparent equal cells. Image1 = exact approved character identity and BACK northeast camera. Image2 = required leg joint/boot toe guide, not final artwork. All four walk toward UPPER RIGHT and show BACK three-quarter, no front eyes.
Guide BLACK leg = anatomical LEFT with black crisscross straps attached to screen RIGHT hip. BLUE leg = plain WHITE anatomical RIGHT attached to screen LEFT hip (do NOT color blue). GREEN boot vectors = toe direction, BOTH boots point UPPER RIGHT every frame. Heel/back view of both boots, never front toe caps or soles facing camera. Do not turn out feet or twist knees sideways. Small slow natural walk, no high-knee march.
Follow guide frame1 wrapped LEFT forward up-right, plain RIGHT trailing down-left. Frame2 wrapped LEFT supports its screen-right hip while plain RIGHT heel passes its screen-left hip with slight lift. Frame3 plain RIGHT forward up-right, wrapped LEFT trailing down-left. Frame4 plain RIGHT supports screen-left hip while wrapped LEFT heel passes screen-right hip with slight lift. Exactly two legs, fixed hip attachments, opposite passing legs. Same static torso/hat, modest stride and gentle opposing arm swing. The guide has long schematic legs only to show joints; retain SHORT chibi SD legs from appearance reference. Four-frame cycle must be coherent and wrap naturally.
Preserve ivory wide gold horned hat purple ring/tassels, white purple gold robe, red sash. Lavender long hair one loose curtain with ONLY one small bow tying low ends at spinal CENTER back. Katana hilt at screen RIGHT waist, continuous dark slim sheath crosses diagonally down screen LEFT ending one gold tip, sword attached not floating. Do not mirror costume identity. Wrapped leg is white fabric with BLACK CRISSCROSS BANDS, not solid black armor. Short 2-head-tall chibi, pixel-friendly simplified clean shading for 96x96. All hats/sheaths/boots inside own equal cell, generous transparent margins. No diagram colors/letters/numbers, no shadow, no background.
```

### NE 2번 별도 보정

```text
Edit this northeast BACK-view Scarlet sheet into ONE single full-body frame on transparent background, matching exact hat/head/body costume size and camera of the top-right cell. This is frame 2 of a calm walk. Fix lower legs only: BLACK CRISSCROSS-WRAPPED LEFT LEG is on VIEWER LEFT and is STRAIGHT, supporting the weight with its boot on ground. PLAIN WHITE RIGHT LEG on VIEWER RIGHT bends slightly, its heel/boot lifted behind on VIEWER RIGHT, off ground. The lifted leg MUST be WHITE, not black wrapped! Do not copy the source passing pose that lifts the black leg. BOTH boots point UPPER RIGHT, showing their heels from behind, no sideways rotated foot or high knee. Preserve whole character exactly including central low hair tie, sword hilt right and scabbard crossing left, red sash and ivory purple gold costume. Small heel lift and natural walk. No text, no shadow, generous transparent margin. Output ONE pose only.
```

