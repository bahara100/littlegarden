# 전신 이미지 → 3D 시도

2026-10-16. 상태: **입력 이미지 준비 완료, 전신 모델 파일 미획득**.

## 보존 파일

- `scarlet-fullbody-front-v1.png`: 승인한 `../scarlet-sd-target-v3.png`를 참조해 내장 image_gen으로 만든 정면 전신 입력 이미지. 다리와 부츠 전체를 포함한다. 2D 컨셉 이미지이며 실제 3D 렌더 결과가 아니다.
- 기존 `scarlet-head-hunyuan-shape.glb`는 이전 흉상 실험의 원본이다. 전신 결과로 취급하지 않는다.

## 실제 실행

Hunyuan3D-2.1 공개 데모의 기존 흉상 입력을 제거하고 전신 PNG를 업로드했다. 화면은 “Uploading 1 file”에서 멈췄으며 생성 요청까지 진행하지 못했다. 새로고침과 새 탭에서 복구를 시도했으나 브라우저 연결 명령도 시간 초과로 실패했다. 따라서 전신 형상 생성, 경량화, 색상 적용은 성공으로 기록하지 않는다. 유료 가입이나 결제는 하지 않았다.

로컬 경량화에 사용할 trimesh/fast-simplification/scipy/numpy를 `tools/art/pydeps`에 격리 설치했다. 버전은 `tools/art/requirements-mesh.txt`에 기록했다. 라이브러리 설치는 모델 정리 완료를 뜻하지 않는다. 기존 게임 모델과 뷰어 코드는 변경하지 않았다.

## 재개 지점

브라우저 연결 복구 후 공개 데모에 전신 PNG를 다시 업로드하고 Gen Shape로 원본부터 확보한다. 원본 보존 후 불필요한 작은 조각/퇴화 면과 노멀을 점검하고 면 수를 줄인다. Gen Textured Shape의 실제 결과를 확인한다. AI 텍스처 생성이 실패하여 투영/추정 채색을 쓰게 되면 결과에 명시한다. 정면·측면·후면을 모두 검수한 뒤 게임 적용을 판단한다.

## 입력 이미지 프롬프트

```text
Prepare ONE clean full-body image-to-3D reconstruction input of the approved Scarlet SD character in this reference. Use the small FRONT view as the exact costume/proportion reference and the large three-quarter view for beautiful face fidelity. A single character, straight-on FRONT view, relaxed symmetric A pose with arms about 25 degrees away from torso, hands clearly separated from hips, both legs and entire boots visible, feet slightly apart. Approximately 2.25 heads tall excluding hat, big anime golden eyes, serene small smile, pale silver lavender layered hair with the approved REDUCED back-hair volume. Preserve the wide off-white kasa hat, dark thin rim, two slim golden horns, violet braided crown cord, flower motif and simple hanging tassels; white/violet simplified default outfit, black narrow straps, red waist sash, violet/white hanging side panels, asymmetric white boots with black wraps on one leg, compact sheathed sword at hip. Keep all details coherent with approved design. Hair should fall behind shoulders/body and must not conceal arms or legs. Full body from horn tips to boot soles entirely inside frame, 8 percent clear white margins, sharp silhouette, no overlapping other views. Pure white background with only a faint contact shadow. Orthographic-like front camera at mid-body height without foreshortening. Polished cel-shaded anime SD game-asset concept appearance, even neutral lighting, no blur, no dramatic shadows. No text, no labels, no watermark, no stand, no extra subjects, no extra limbs. This is a 2D input reference for external 3D generation, NOT a finished 3D mesh or game screenshot.
```
