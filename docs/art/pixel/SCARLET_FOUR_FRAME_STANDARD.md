# 홍련 방향별 4프레임 통일

2026-10-16 사용자 결정: 제작 시간을 줄이기 위해 걷기는 방향당 4프레임을 최종 규격으로 삼는다. 기본 6 FPS, 순서는 1→2→3→4→1이다.

- SE: `fullframe-se-v3/walk.png`. 최신 V2 8컷에서 1·3·5·7번을 그대로 추렸다.
- SW: `fullframe-sw-v3/walk.png`. 최신 V2 8컷에서 1·3·5·7번을 그대로 추렸다.
- NE: `fullframe-ne-v5/walk.png`. 다리 디자인·자세·갓 뿔 수정본 네 컷을 유지한다.
- NW: `fullframe-nw-v11/walk.png`. V9의 다리 겹침과 보행 자세, V10의 2번 칼을 유지하고 3번의 골반 옷자락과 기존 칼을 복원했다.

모든 현재 시트는 384×96이며 각 칸은 96×96이다. SE/SW는 선택한 원본 프레임과 픽셀이 같은지 확인하며 다시 축소하거나 재생성하지 않는다. `walk-preview-2x2.png`는 실제 시트와 픽셀 대조한 정지 미리보기다. 이전 8컷 파일은 이력으로 보존한다.

검수: `/scarlet-frames.html`에서 네 방향 선택. 놀이터: `/?scarlet=frames-four-v1`. 기존 전신 프레임 시험 링크도 최신 4컷 자산을 사용한다. 기본 홈페이지의 기존 캐릭터 시험 모드는 변경하지 않는다.

재현 도구: `tools/art/select-scarlet-four.ps1`. Windows PowerShell로 실행한다. 기존 NE V5에는 적용하지 않는다.
