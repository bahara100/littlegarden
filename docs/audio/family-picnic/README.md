# 웃음꽃 피는 나들이

사용자 요청: 아이들이 뛰어놀고 화목한 가족이 나들이 와서 웃으며 즐기는 분위기의 새 배경음.

- 새 멜로디와 구성. G장조, 4/4박자, 112 BPM, 48마디.
- 가볍게 뛰는 피아노와 클라리넷이 주제를 번갈아 연주하고, 짧은 응답 멜로디가 사이를 채운다.
- 나일론 기타, 어쿠스틱 베이스, 작은 셰이커·크로스스틱으로 밝은 리듬.
- 도입 4 → 주제 8 → 피아노 변주 8 → 편안한 중간부 8 → 주제 복귀/변주 16 → 마무리 4.
- 설치된 FluidSynth 2.6.1 + GeneralUser GS로 로컬 렌더링. 실제 웃음소리나 환경음은 넣지 않았다.
- 기존 두 곡과 함께 게임 목록에 추가한다. 끝에 잔향이 있는 완결형 곡이며 무간격 루프는 아니다.

편집 원본: `family-picnic.mid`, `score.json`, `family-picnic.wav`.
게임용: `apps/client/public/music/family-picnic.mp3`.
재현: pretty_midi가 설치된 Python 3.13으로 `tools/audio/compose-family-picnic.py` 실행.
도구 경로·악기 설정 함수는 `compose-sweet-park-walk.py`를 재사용한다. 이전 멜로디는 사용하지 않는다.

검증: 실제 MP3 102.71초, 44.1 kHz 스테레오, 128 kbps. 전체 디코딩 성공,
최대 샘플 레벨 -2.5 dBFS. TypeScript/Vite 빌드와 게임 음악 목록의 선택·재생 상태 확인.
