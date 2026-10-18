# 너와 나란히, 공원 산책

사용자 요청: 연인들이 공원에 와서 산책하는 편안하고 달콤한 배경음.

- 독립적인 새 멜로디, F장조, 6/8박자. 4분음표 90 BPM / 점4분음표 산책 박동 60 BPM.
- 56마디: 도입 4 → 주제 16 → 첼로와 피아노가 대화하는 중간부 16 → 주제 복귀 16 → 마무리 4.
- 부드러운 피아노, 나일론 기타 분산화음, 낮은 첼로, 어쿠스틱 베이스, 중간부의 작은 현악 화음.
- 큰 드럼 없이 두 걸음씩 살짝 흔들리는 리듬. 장7화음·6화음으로 따뜻한 색을 더했다.
- FluidSynth 2.6.1 + 설치된 GeneralUser GS로 로컬 연주. 사운드폰트는 저장소에 넣지 않는다.

편집 원본: `sweet-park-walk.mid`, `score.json`, `sweet-park-walk.wav`.
게임용 MP3: `apps/client/public/music/sweet-park-walk.mp3`.
재현: pretty_midi가 설치된 Python 3.13으로 `tools/audio/compose-sweet-park-walk.py` 실행.
게임 목록에 기존 **햇살이 쉬어가는 공원**과 함께 추가했다.
완결형 곡으로 끝에 잔향이 있으며, 샘플 단위 무간격 루프는 아니다.

검증: 실제 MP3 111.73초, 44.1 kHz 스테레오, 128 kbps. 전체 디코딩 성공,
최대 샘플 레벨 -2.9 dBFS. TypeScript/Vite 빌드와 브라우저 목록 선택·재생 상태 확인.
