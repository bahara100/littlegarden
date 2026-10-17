# 흉상 채색 1차 실험

2026-10-16. 기존 Hunyuan 흉상 GLB를 실제로 채색했다. 외부 서비스의 AI 텍스처 생성 결과가 아니라 **로컬 정면 투영 + 후면 추정 색상**이다.

- 결과: `scarlet-head-hunyuan-colored-v1.glb`, 같은 파일을 웹 public/models/experiments에도 제공한다.
- 실행 스크립트: `tools/art/color-hunyuan-head.py`. PYTHONPATH에 `tools/art/pydeps`를 지정한 Python으로 실행한다. Pillow는 번들 Python에 설치되어 있다.
- 삼각형 918,640 → 150,000. 퇴화/중복 면 제거, 노멀 정리 및 내보내기. 원본 파일은 보존.
- 정면에 원 입력 PNG를 UV 투영하고 GLB에 포함. 후면은 은보라색 머리카락/밝은 삿갓/금색 뿔 등 추정 정점 색을 적용했다. 원 입력 PNG는 편집하지 않았다.
- 정면/측면/후면 브라우저 렌더 확인, TypeScript 및 Vite 빌드 통과.
- 검수 주소: `/character.html?model=hunyuan-head-colored`.
- [정면 실제 렌더](hunyuan-head-colored-front.jpg), [후면 실제 렌더](hunyuan-head-colored-back.jpg).

## 품질 판정

눈과 표정, 머리카락, 의상 색상이 실제 입체에 표시된다. 단일 이미지 투영이므로 삿갓 아래와 얼굴/머리카락 경계에 얼룩 및 늘어짐이 남는다. 후면은 평면적인 추정 채색이며 정교한 질감/장식은 없다. 기본 색상 적용 가능성은 확인했으나 최종 게임 에셋 품질은 아니다. 뼈대와 모션은 없으며 기존 놀이터 캐릭터를 교체하지 않았다.
