# 홍련 앞왼쪽 보행 방향 재검토 v3

내장 image_gen으로 생성. CLI/API 키 사용 없음. 이전의 SW/NW 2·4번만 교체하는 방식은 다리와 발끝 방향의 일관성을 충분히 유지하지 못했다. SW 네 컷을 동일한 기준 이미지와 관절 가이드로 다시 생성했다. NW/SE/NE는 이번 단계에서 변경하지 않았다. 네 방향 수정 완료를 뜻하지 않는다.

## 저장 경로

- 최종 생성 입력 원본: `apps/client/public/sprites/scarlet/scarlet-sw-walk-v3-guide-source.png`
- 실제 사용 시트: `apps/client/public/sprites/scarlet/scarlet-sw-walk-v3.png`
- 확대 시트: `apps/client/public/sprites/scarlet/scarlet-sw-walk-v3-4x.png`
- 프레임: `scarlet-sw-walk-v3-frame-{0..3}.png`, 메타데이터 `scarlet-sw-walk-v3.json`
- 관절 도식: `docs/art/pixel/scarlet-sw-leg-tracks-guide.png` (새로 그린 구조 가이드이며 캐릭터 원본을 코드로 편집한 것이 아님)
- 검수 URL: `scarlet-walk.html?direction=sw`

첫 생성 `scarlet-sw-walk-v3-source.png`는 1·2번 반복에 가까워 채택하지 않았다. 관절 가이드를 넣은 두 번째 생성을 사용한다. 두 부츠가 내려왼쪽을 향하고, 발목/무릎/골반이 이어지는지 원본과 96px 시트에서 비교했다. 검은 끈의 왼다리는 해부학적 왼쪽으로 유지하며, 발걸음 때 화면상 겹침은 허용한다. 프레임을 각각 다시 그렸으므로 완전한 관절 고정 애니메이션은 아니며, 발 접지와 크기의 미세한 흔들림은 추가 검토 대상이다.

## 첫 생성 프롬프트 (미채택)

```text
Use case: identity-preserve. Repair a walking animation by redrawing a coherent FOUR pose cycle from ONE approved standing character. Image 1 is the approved Scarlet identity and correct southwest camera. Output a transparent 2x2 sprite sheet with four full-body characters, one in each equal square cell. No labels, no numbers, no background.
All four face southwest, screen lower-left, SAME CAMERA and same shoulders/pelvis orientation as reference. Natural slow SMALL-STEP WALK, not marching. Foot direction is the highest priority: BOTH BOOTS' TOES POINT diagonally LOWER LEFT in ALL FOUR CELLS. Both boots remain parallel. No turned-out feet, no splayed feet, no boots pointing right, no twist or ankle swivel, no soles facing camera.
Anatomical LEFT leg has black crisscross straps from thigh to shin and originates at screen-RIGHT hip. Anatomical RIGHT leg is plain white and originates at screen-LEFT hip. Keep these hip attachments and leg identities throughout all four cells. Never exchange the wrapped leg with the plain one. Both knees bend in the same travel plane toward lower-left. Do not cross thighs or move a boot sideways across the other leg.
Row-major 1: black-wrapped LEFT foot modestly forward lower-left in travel direction, plain RIGHT leg modestly back upper-right. Both boots still point lower-left.
2: black-wrapped LEFT foot supports beneath its OWN hip; plain RIGHT leg passes its own hip with a SMALL knee flex and heel lifted only slightly behind. The lifted right boot remains toe-down-left, near ground. Knees below robe, NO high knee.
3: plain RIGHT foot modestly forward lower-left in travel direction; black-wrapped LEFT leg modestly back upper-right, still attached to screen-right hip. Both boots point lower-left.
4: plain RIGHT foot supports beneath its OWN hip; black-wrapped LEFT leg passes its own hip with a SMALL knee flex and heel lifted slightly behind. Lifted left boot toe-down-left, near ground, NO high knee.
Left and right action alternates, but both legs move along PARALLEL diagonal tracks, never rotate away from travel direction. The 4→1 wrap is a small forward step. Each frame same head/hat size, same body center, same baseline, minimal bob and gentle opposing arm swing. Preserve Scarlet hat lavender hair white purple gold robe red sash sword on anatomical left waist. Hair one loose curtain, single low tie at back center hidden from this front view, no side bow. Simple clean SD illustration for reduction to 96 pixels, 2-head-tall proportions. Generous transparent margins within EACH cell; no neighboring overlap, no shadows, no extra limbs. Exact same static torso/hat appearance in all 4 cells.
```

## 관절 가이드 생성 프롬프트 (채택)

```text
Use case: compositing. Create a coherent 4-frame isometric Scarlet walk sprite sheet. Image1 = character appearance only. Image2 = REQUIRED leg joint trajectories and boot direction, NOT output artwork. Final output 2x2 full-body poses, true transparent background, no text or diagram markings.
Keep southwest/front lower-left camera and Scarlet costume/hair/hat from image1. Map image2 BLACK leg to Scarlet anatomical LEFT leg with black crisscross wraps. Map BLUE leg to her plain WHITE RIGHT leg, do NOT color it blue. Map GREEN boot arrows to the toe direction of BOTH her boots: lower-left in EVERY frame. Follow the guide ankle/knee positions closely! No big knee lifts, no sideways or outward knees, no foot turning right, no boot soles facing camera. Legs stay attached to same hips. Both boots parallel, tiny heel lift in passing.
Frame1 left wrapped leg forward, right plain back. Frame2 left wrapped leg supports screen-right, right plain foot passes screen-left with small lift. Frame3 right plain leg forward screen-left, left wrapped back screen-right. Frame4 right plain supports screen-left, left wrapped passes screen-right with small lift. This is a calm SMALL-STEP WALK, NOT a knee-raising march. Do not duplicate the two passing frames. Exactly 2 legs per pose, modest stride, legs below the skirt, no crouch.
Four identical heads/torso facing lower-left, body position/size/hat silhouette unchanged. Natural coherent sequence 1→2→3→4→1. The guide exaggerates leg length only to show joints; preserve short SD proportions of appearance reference. One loose lavender hair curtain, ends gathered once at back center hidden from front; no side bow. Preserve the one sheathed sword on left waist and asymmetric leg wraps. Clean simplified pixel-friendly chibi shading suitable for 96x96. Each character entirely inside its equal square cell with generous empty margins. No shadows, no letters/numbers, no colored joint marks in output.
```

