# 홍련 SD 품질 기준

사용자 기준: 블루아카이브 카페에서 볼 수 있는 SD 치비 캐릭터의 완성도.

후속 피드백: v1보다 단순하게 만든 v2에서 뒷머리 볼륨을 추가 축소했다. [v3 시트와 기록](SCARLET_HAIR_V3.md)을 최신 디자인 방향으로 사용한다.

기존 Three.js 도형 조합 모델은 기능 확인용 시제품이다. 얼굴 데칼, 곡선 머리카락, 부드러운 의상으로 개선했지만 목표 수준의 정밀 모델이라고 간주하지 않는다. 반복적으로 도형을 추가하는 방식으로 아트 단계를 완료 처리하지 않는다.

[홍련 SD 목표 외형 v1](scarlet-sd-target-v1.png)은 내장 imagegen으로 생성한 모델링용 컨셉 이미지다. 3D 파일, 인게임 스크린샷, 제작 완료 결과물이 아니다. 비율과 원작 기본 의상 세부 요소는 실제 모델링 전에 다시 검수한다. 특히 작은 SD 비율과 가동 시 머리카락/옷자락 간섭을 별도 확인한다.

## 실제 게임 모델의 완료 기준

- 정면/측면/후면이 일치하는 전용 메시와 UV.
- 얼굴 윤곽, 페인팅된 눈과 표정, 가늘어지는 층진 머리카락.
- 홍련 기본 코스튬의 식별 요소를 유지한 정돈된 의상과 장식.
- 뼈대와 스킨 가중치가 있는 모델, 대기/걷기/인사/착석/그네 동작.
- GLB 형태의 실물 에셋을 브라우저에 로드해 모든 방향과 움직임으로 검수.
- 디자인 시트에 있는 이미지를 평면으로 표시하는 작업을 3D 제작 완료로 간주하지 않음.

## 생성 기록

방식: 내장 image_gen. 게임에 이미지 파일을 모델 대신 넣지 않았다.

최종 프롬프트:

```text
Use case: stylized-concept. Create a polished 3D SD CHARACTER DESIGN TARGET SHEET for Scarlet (Hongryeon) from GODDESS OF VICTORY NIKKE, DEFAULT costume, intended as a modeling reference for a cozy isometric playground game. This is an aspirational concept/model reference, not a screenshot of an implemented game. Style target: the sophisticated anime super-deformed 3D characters seen in Blue Archive's cafe: beautiful hand-painted anime eyes and face, delicate smooth shaded skin, individually designed tapered sculpted hair locks, crisp painted costume details, subtly sculpted fabric folds, premium cel-shaded mobile game asset appearance. Approximately 2.25 heads tall excluding the hat, large head with soft cheeks and a small pointed chin, petite torso and short limbs, elegant NOT babyish, NOT a primitive toy made from spheres and boxes. Scarlet identification: silver pale lavender long hair, gold amber anime eyes, serene slightly mischievous smile; broad shallow conical off-white kasa hat with dark thin rim, warm peach underside, two slender gold horn-like crown ornaments, braided white cord and soft pom tassels, small violet flower motif. Default white and violet outfit with black narrow shoulder straps and armor trim, red patterned waist sash, small golden fittings, asymmetric white thigh-high armored boots with black wraps on one leg, long white and violet side coat panels, compact sheathed katana at hip; both hands free. Tasteful faithful fully clothed chibi adaptation, detailed silhouette, no alternate black costume, no halo, no gun. Composition: horizontal clean ivory studio sheet. Large beautiful front three-quarter full-body finished 3D render on the LEFT occupying 45% width. On RIGHT three smaller consistent matching views FRONT, SIDE, BACK, full body, neutral relaxed A pose, aligned ground line, same model same clothing colors and proportions. Plenty of margins, visible feet and all hat edges, minimal soft contact shadows. Small tasteful top title 'SCARLET / SD DESIGN TARGET', small labels under reference views. No scenery, no other characters, no website UI, no watermark. Prioritize genuinely appealing professional game SD design, layered hair volume, costume definition, readable facial expression.
```
