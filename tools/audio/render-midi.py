"""Play a MIDI score with real instrument sounds and turn it into a game song.

    py tools/audio/render-midi.py <song.mid> <id> "<title>" ["<artist>"]

1. FluidSynth plays the score with the GeneralUser GS SoundFont into a 44.1 kHz WAV (in a temporary folder).
2. tools/audio/prepare-track.py trims silence, evens loudness and writes apps/client/public/music/<id>.mp3,
   then prints the line to add to apps/client/src/music.ts.

Write the score with pretty_midi or mido (e.g. pretty_midi.PrettyMIDI(), an Instrument with program 0 = piano,
notes, .write('song.mid')). Instruments follow General MIDI program numbers.

Where things are (override with environment variables):
- FLUIDSYNTH: fluidsynth.exe, default %LOCALAPPDATA%/Programs/FluidSynth/<version>/bin/fluidsynth.exe
- SOUNDFONT: the .sf2, default %LOCALAPPDATA%/SoundFonts/GeneralUser-GS/GeneralUser-GS.sf2
  (GeneralUser GS v2.0.3, free for any music made with it, commercial included: see LICENSE.txt beside it)
"""
import glob
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.environ.get('LOCALAPPDATA', '')


def fluidsynth() -> str:
    found = os.environ.get('FLUIDSYNTH') or shutil.which('fluidsynth')
    if not found:
        matches = sorted(glob.glob(os.path.join(LOCAL, 'Programs', 'FluidSynth', '*', 'bin', 'fluidsynth.exe')))
        found = matches[-1] if matches else None
    if not found or not os.path.exists(found):
        sys.exit('FluidSynth not found. See README (도구) for how it was installed, or set FLUIDSYNTH.')
    return found


def soundfont() -> str:
    path = os.environ.get('SOUNDFONT') or os.path.join(LOCAL, 'SoundFonts', 'GeneralUser-GS', 'GeneralUser-GS.sf2')
    if not os.path.exists(path):
        sys.exit(f'SoundFont not found: {path}. Set SOUNDFONT to a .sf2 file.')
    return path


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) not in (4, 5):
        sys.exit(__doc__)
    score = sys.argv[1]
    if not os.path.isfile(score):
        sys.exit(f'No such file: {score}')
    with tempfile.TemporaryDirectory() as work:
        wav = os.path.join(work, 'render.wav')
        # -n no MIDI input, -i no shell, -g gain (0.5 keeps loud scores from clipping; loudness is evened out later).
        subprocess.run([fluidsynth(), '-n', '-i', '-q', '-g', '0.5', '-r', '44100', '-F', wav, soundfont(), score], check=True)
        subprocess.run([sys.executable, os.path.join(HERE, 'prepare-track.py'), wav, *sys.argv[2:]], check=True)


if __name__ == '__main__':
    main()
