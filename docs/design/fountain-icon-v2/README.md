# 분수대 감정 아이콘 V2

사용자가 Claude가 만든 분수대 아이콘을 다듬어 달라고 요청했다. `make-emote-icons.py`의 기존 도형 기반 분수 대신 16×16 격자를 직접 정리했다.

- 갈라져 내려오는 물줄기와 작은 윗그릇, 짧은 기둥, 넓고 둥근 아래 수반을 분리했다.
- 돌은 크림색/살구색 명암과 따뜻한 외곽선, 물은 하늘색/밝은 물빛/짙은 파랑으로 구분했다. 총7색과 투명도0/255만 사용한다.
- 기존 말풍선 감정 `⛲ → fountain` 연결과 1·2·3배 배율은 그대로다. 분수 구경 중 새 그림을 표시한다.
- 분수 단독 수정 단계에서는 다른 감정·계절 아이콘 11개의 파일 SHA256이 같았다. `preserved-icons.json`은 그 시점의 기록이다. 이후 사용자의 전체 점검 요청에 따라 5개를 추가 수정했으며 최신 기록은 `../icon-review-2026-10-19/`에 있다.

`comparison.png`의 왼쪽은 이전, 오른쪽은 V2다. `fountain.png`가 실제16×16, `preview.png`는 같은 픽셀을16배 확대한 것이다. 런타임은 `apps/client/public/sprites/ui/emotes/fountain.png`, 원본 격자는 `tools/art/make-emote-icons.py`의 `fountain()`이다.
