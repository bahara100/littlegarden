# 홍련 교차 자세 2·4번 수정 v2

내장 image_gen 도구로 SW/NW의 교차 자세만 새로 생성했다. CLI/API 키 사용 없음. 각 방향 1·3번은 기존 v1 프레임을 그대로 재사용하고 2·4번만 새 v2 프레임으로 교체했다. SE v2 / NE v1은 발이 반대인 것을 확인하고 유지했다.

## 결과 경로

- `apps/client/public/sprites/scarlet/scarlet-sw-walk-v2.png`
- `apps/client/public/sprites/scarlet/scarlet-nw-walk-v2.png`
- 각 시트의 `-4x.png`, `.json`, `-frame-1.png`(2번), `-frame-3.png`(4번)
- 생성 원본: `scarlet-{sw,nw}-walk-v2-passing-source.png` (2열, 왼쪽 2번 / 오른쪽 4번)
- 검수 화면: `scarlet-walk.html`의 “같은 교차, 반대쪽 발” 비교 영역
- 화면 증거: `docs/art/pixel/scarlet-sw-passing-v2-preview.jpg`, `docs/art/pixel/scarlet-nw-passing-v2-preview.jpg`

## 확인 기준

2번: 검은 끈의 왼다리 지지, 흰 오른발 들기. 4번: 흰 오른다리 지지, 검은 끈의 왼발 들기. 카메라 방향별로 보이는 좌우는 달라지므로 캐릭터 자신의 왼쪽/오른쪽을 기준으로 한다. 두 자세에서 들린 부츠의 화면 위치와 무릎 굽힘이 반대인지 실제 96×96 내보내기에서도 확인했다.

내보내기 스크립트는 크기 96×96, 최대 32색, 이진 알파, 마지막 불투명 행 87을 검사했다. 빌드 및 기존 테스트 24개 통과. 발의 해부학적 차이는 자동 테스트가 아니라 원본·시트·브라우저 비교 화면을 보고 검수했다. 생성 기반 이미지라 머리/의상 크기의 미세한 차이는 남아 있다.

## sw 최종 프롬프트

```text
Use case: precise-object-edit. Existing game sprite repair. Input image is a FOUR-frame reference, but output EXACTLY TWO full-body poses SIDE BY SIDE in one horizontal 2-column, 1-row transparent sprite sheet. No text, no grid, no numbers.
Replace only the passing poses with these anatomically OPPOSITE leg actions:
FRONT three-quarter facing LOWER LEFT southwest. Face visible, amber eyes. In this camera anatomical LEFT leg is screen RIGHT and has black crisscross straps. Anatomical RIGHT leg is screen LEFT and plain white.
LEFT CELL = frame 2: BLACK-STRAPPED LEFT LEG on screen RIGHT is STRAIGHT DOWN, boot planted under pelvis. PLAIN WHITE RIGHT LEG on screen LEFT is BENT, KNEE LIFTED, boot lifted well above ground, with a clearly visible gap below its sole.
RIGHT CELL = frame 4: PLAIN WHITE RIGHT LEG on screen LEFT is STRAIGHT DOWN, boot planted under pelvis. BLACK-STRAPPED LEFT LEG on screen RIGHT is BENT, KNEE LIFTED, boot lifted well above ground, clearly visible gap below its sole.
These two shapes MUST have opposite lifted knees and opposite planted feet. Do NOT copy the same bent knee on both. Keep screen left/right leg ownership fixed, do not swap the black straps between legs. Sword at anatomical left waist screen right. Long hair loose behind, no visible side bow.
Keep the exact same Scarlet character design, lavender hair, ivory wide hat with gold horns/purple rope/tassels, white purple gold robe and red sash, scale, camera and proportion as input. DO NOT mirror the whole character. Both output poses face the same direction. The silhouette and body center/hat height stay matched. Only lower-leg poses and subtle opposing arm swing differ. Short chibi proportions, clean restrained shading for 96x96 game pixel reduction. Each full character centered in its equal-sized half with at least 8% transparent margins, all boots/hat/sheath included. No floor shadow. True alpha transparency. Crucial acceptance criterion: in the LEFT output cell, the plain WHITE calf is lifted and black-wrapped calf supports; in the RIGHT output cell, BLACK-wrapped calf is lifted and white calf supports.
```

## nw 최종 프롬프트

```text
Use case: precise-object-edit. Existing game sprite repair. Input image is a FOUR-frame reference, but output EXACTLY TWO full-body poses SIDE BY SIDE in one horizontal 2-column, 1-row transparent sprite sheet. No text, no grid, no numbers.
Replace only the passing poses with these anatomically OPPOSITE leg actions:
BACK three-quarter facing UPPER LEFT northwest. No front eyes. Anatomical LEFT leg is screen LEFT with black crisscross straps. Anatomical RIGHT leg is screen RIGHT plain white.
LEFT CELL = frame 2: BLACK-STRAPPED LEFT LEG on screen LEFT is STRAIGHT DOWN, boot planted under pelvis. PLAIN WHITE RIGHT LEG on screen RIGHT is BENT at knee, heel lifted backward and up, plain white calf/boot visibly off ground on screen right, clearly visible gap under boot.
RIGHT CELL = frame 4: PLAIN WHITE RIGHT LEG on screen RIGHT is STRAIGHT DOWN, boot planted under pelvis. BLACK-STRAPPED LEFT LEG on screen LEFT is BENT at knee, heel lifted backward and up, black-strapped calf/boot visibly off ground on screen left, clearly visible gap under boot.
These shapes MUST have opposite lifted feet and opposite planted feet. Show distinct black vs white calf. Long hair one curtain with ONE small low tie at back spinal CENTER. Katana hilt screen left, continuous dark sheath diagonally down screen right ending single gold tip.
Keep the exact same Scarlet character design, lavender hair, ivory wide hat with gold horns/purple rope/tassels, white purple gold robe and red sash, scale, camera and proportion as input. DO NOT mirror the whole character. Both output poses face the same direction. The silhouette and body center/hat height stay matched. Only lower-leg poses and subtle opposing arm swing differ. Short chibi proportions, clean restrained shading for 96x96 game pixel reduction. Each full character centered in its equal-sized half with at least 8% transparent margins, all boots/hat/sheath included. No floor shadow. True alpha transparency. Crucial acceptance criterion: in the LEFT output cell, the plain WHITE calf is lifted and black-wrapped calf supports; in the RIGHT output cell, BLACK-wrapped calf is lifted and white calf supports.
```

