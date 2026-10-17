# 이미지 기반 3D 생성 검증

확인일: 2026-10-16, Asia/Seoul.

## 목표

확정 v3 디자인의 얼굴·머리카락·삿갓을 이미지 기반 생성으로 재현할 수 있는지 확인한다. 코드 조합 모델을 더 수정하는 방식과 구분한다. 입력 컨셉 이미지와 실제 생성된 3D 파일을 혼동하지 않는다. 품질 확인 전 기존 게임 에셋을 교체하지 않는다.

## 입력

- `scarlet-head-front-v1.png`: v3 시트를 참조해 생성한 단일 흉상 입력 이미지. 실제 3D 결과물이 아니다.
- 흰 배경, 한 캐릭터, 정면 흉상. 이미지 생성 과정에서 세부 장식이 달라질 수 있어 원 시트와 비교한다.
- 내장 image_gen 편집을 사용. 원본 v3 시트는 변경하지 않았다.

최종 입력 이미지 프롬프트:

```text
Prepare a SINGLE IMAGE-TO-3D INPUT from this approved Scarlet SD concept sheet. Output ONE isolated front-facing upper-chest character bust only, on a pure white background, square composition. Not a sheet, not multiple views, no text, no labels, no border, no pedestal. Preserve exactly the approved character identity, beautiful anime golden eyes, calm smile, pale silver lavender hair, less-voluminous back hair, wide off-white kasa hat with dark thin rim and warm peach underside, two gold horns, lavender braided crown cord, violet flower mark and hanging tassels. Use the small FRONT depiction in the source as the main geometry reference, with the face fidelity of the large three-quarter depiction. Straight-on front camera at face height, very slight elevated angle only if needed to show the hat crown; face unobstructed, eyes visible. Head, entire hat including its horns and all tassels, shoulders and upper chest visible, arms excluded below shoulder, body cropped cleanly at upper chest. Visible hair ends should terminate at the bust crop for this head-only reconstruction experiment; preserve hair style and compact volume, do not redesign the face or costume. Keep all extremities inside frame with 8 percent margins. Maintain polished cel-shaded 3D SD game model appearance, detailed painted face and broad clean sculpted hair clumps, soft even diffuse lighting with very gentle shadow, no dramatic shadows, no depth of field, no perspective distortion. This is input concept artwork for a separate 3D-generation test, not a finished mesh or screenshot.
```

## 무료 경로

- [Meshy 무료 플랜 공식 안내](https://intercom.help/meshy/en/articles/15696428-what-is-included-on-the-free-plan): 월 100 크레딧, Meshy 6 Lite 결과 월 10회 다운로드. 최신 모델의 생성과 무료 파일 다운로드는 별개. 로그인 단계에서 약관 동의가 있어 사용자에게 직접 진행을 요청했다.
- [Tripo 공식 요금표](https://www.tripo3d.ai/pricing): 무료 월 200 크레딧, 무료 내보내기 15회(H2.5 only) 표기. 무료 모델 공개/비상업 조건 표기. 이번에는 생성을 실행하지 않았다.
- [Tencent Hunyuan3D-2.1 공식 공개 데모](https://huggingface.co/spaces/tencent/Hunyuan3D-2.1): 직접 데모 화면에서 입력 이미지 업로드와 Gen Textured Shape 요청을 실행했다. 실행 시점까지 로그인/결제 단계는 없었으며 GPU 할당·완료·다운로드 가능 여부는 실제 실행 결과로 판단한다.

가격/제한은 조회 당시 안내이며 계정 상태 및 서비스 변경에 따라 달라질 수 있다. 유료 가입이나 결제는 실행하지 않았다.

## 판정 기준

1. 뷰를 회전해도 얼굴/머리/삿갓이 실제 입체로 유지되는가.
2. 눈과 앞머리, 머리카락 실루엣이 입력과 유사한가.
3. 후면에 심한 구멍/중복 면/엉뚱한 형상이 없는가.
4. 표준 GLB/OBJ를 실제 다운로드할 수 있는가.
5. 렌더 이미지 한 장을 얻은 것과 모델 파일을 얻은 것을 구분한다.

최종 결과는 생성 요청 응답을 확인한 뒤 아래에 기록한다.

## 실행 중간 결과

- Tencent 공개 데모에 로그인 없이 입력 이미지를 업로드했다.
- Gen Textured Shape: Error 표시. 원인은 화면에 구체적으로 표시되지 않아 단정하지 않음.
- Gen Shape: 입체 모델 뷰어가 생성되어 형상 생성 성공 확인. 모델 파일 다운로드/로컬 검수 및 텍스처 품질은 아직 미확인.
- Meshy 작업 공간에서는 Meshy 6 Lite 선택 가능 및 생성 비용 10 크레딧 표시를 확인했다. 유료 생성은 실행하지 않음.

## 무료 형상 생성 및 다운로드 성공

Hunyuan3D-2.1 공개 데모의 Gen Shape → Transform → Download로 실제 `white_mesh.glb`를 다운로드했다. 이 실행에서는 로그인/가입/결제를 하지 않았다. 서비스의 미래 가용성·쿼터까지 보장하는 것은 아니다.

- 원본 보존: 이 폴더의 `scarlet-head-hunyuan-shape.glb`
- 검수 화면 제공 파일: `apps/client/public/models/experiments/scarlet-head-hunyuan-shape.glb`
- 검수 주소: 개발 서버의 `/character.html?model=hunyuan-head`
- 실제 화면: [무료 생성 결과](hunyuan-head-shape-preview.png)
- 원본 크기: 16,534,352바이트, 정점 459,148개, 삼각형 918,640개.
- 원본은 위치/인덱스 형상만 포함하며 UV/색상 텍스처/본/모션이 없다. 검수 뷰어에서 노멀 계산, 회색 재질, 크기 정렬만 수행한다. 생성 원본 형상을 수작업 모델로 바꾸지 않았다.
- 브라우저에서 정면·측면·후면 회전 확인. 로컬 검수 화면 오류/경고 없음.
- 기존 게임 캐릭터는 교체하지 않았다. 형상 유사도 확인 → 색상 텍스처 → 경량화 → 리깅을 거쳐야 한다.
- 별도로 Simplify Mesh/50,000면 내보내기를 요청했다. 시간이 걸려 원본 다운로드와 구분하며, 완료/파일 획득 전 경량화 성공으로 간주하지 않는다.

판정: **무료 이미지 기반 3D 형상 생성과 파일 획득 경로 검증 성공. 텍스처 포함 생성과 게임용 캐릭터 완성은 미완료.**

> 2026-10-17: 사용자가 “3D모델은 안쓸꺼니까 지워도 돼”라고 해서 이 실험의 GLB 파일(scarlet-head-hunyuan-shape.glb, scarlet-head-hunyuan-colored-v1.glb)과 apps/client/public/models/(scarlet-v3.glb 포함)를 지웠다. 미리보기 이미지와 기록 문서만 남는다.
