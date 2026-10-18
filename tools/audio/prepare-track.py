"""Turn a song file into the game's web format and print the line to add to apps/client/src/music.ts.

    python tools/audio/prepare-track.py <source file> <id> "<title>" ["<artist>"]

- Output: apps/client/public/music/<id>.mp3 (the id may use English letters, numbers, - and _ only; the build
  keeps a music file only when its exact path appears in the code).
- Loudness is evened out to about -16 LUFS so songs play at the same level, silence at the start and end is
  trimmed, and the result is 44.1 kHz stereo MP3 at 128 kbps (plays in every browser).
- Needs ffmpeg (installed with `winget install Gyan.FFmpeg`). The source file is never changed.
"""
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, 'apps', 'client', 'public', 'music')


def tool(name: str) -> str:
    """ffmpeg/ffprobe from PATH, or from winget's links folder when the shell has not picked up the new PATH yet."""
    found = shutil.which(name)
    if found:
        return found
    links = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', f'{name}.exe')
    if os.path.exists(links):
        return links
    sys.exit(f'{name} not found. Install it with: winget install Gyan.FFmpeg')


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')  # Korean titles print correctly in any console
    if len(sys.argv) not in (4, 5):
        sys.exit(__doc__)
    source, track_id, title = sys.argv[1], sys.argv[2], sys.argv[3]
    artist = sys.argv[4] if len(sys.argv) == 5 else None
    if not os.path.isfile(source):
        sys.exit(f'No such file: {source}')
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,60}', track_id):
        sys.exit('The id may use English letters, numbers, - and _ only (up to 60).')
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f'{track_id}.mp3')
    trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1'
    audio_filter = f'{trim},areverse,{trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
    subprocess.run([tool('ffmpeg'), '-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-vn', '-map_metadata', '-1',
                    '-af', audio_filter, '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', out], check=True)
    probe = subprocess.run([tool('ffprobe'), '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', out],
                           check=True, capture_output=True, text=True)
    seconds = float(json.loads(probe.stdout)['format']['duration'])
    size = os.path.getsize(out) / 1024
    entry = {'id': track_id, 'title': title, **({'artist': artist} if artist else {}), 'src': f'music/{track_id}.mp3'}
    line = '{ ' + ', '.join(f"{k}: {json.dumps(v, ensure_ascii=False)}".replace('"', "'") for k, v in entry.items()) + ' },'
    print(f'Wrote {os.path.relpath(out, ROOT)} · {int(seconds // 60)}:{int(seconds % 60):02d} · {size:.0f} KB')
    print('Add this line to TRACKS in apps/client/src/music.ts:')
    print('  ' + line)


if __name__ == '__main__':
    main()
