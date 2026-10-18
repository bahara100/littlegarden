# 공통 몸체 SW(앞왼쪽) 걷기 V1 · SE V20 좌우 반전

사용자 지시: “좌우 반전 시켜서 왼쪽 아래꺼도 만들어봐.”

SE 현재본 V20(docs/art/pixel/garden-body-walk-se-v20/)의 네 컷을 컷마다 좌우 반전(x → 95 − x)했다. 다시 그린 픽셀은 없고, 시트·레이어·미리보기·GIF는 SE와 같은 구성이다. 걷는 방향은 왼쪽 아래이며, 몸이 거울상이라 1번에서 앞에 딛는 다리는 화면 왼쪽 다리다(확인 페이지 컷 이름도 오른발/왼발을 바꿔 표시).

SE를 고치면 tools/art/build-garden-body-walk-sw-v1.py를 다시 실행해 SW를 맞춘다.
확인 페이지: apps/client/public/body-walk-sw-v1/index.html (SE 페이지와 서로 링크). 실제 게임에는 아직 연결하지 않았다.
