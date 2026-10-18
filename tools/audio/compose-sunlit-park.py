"""Compose an original, bright acoustic family-park theme and render it locally.

Run with Python 3.13 (pretty_midi). No previous composition is used.
FluidSynth + GeneralUser GS are installed locally, never bundled with the game.
"""
from pathlib import Path
import json
import os
import random
import subprocess
import sys
import pretty_midi

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/audio/sunlit-park'
TRACK_ID = 'sunlit-park'
TITLE = '햇살이 쉬어가는 공원'
BPM = 100
BEAT = 60 / BPM
rng = random.Random(2026101802)


def environment():
    local = Path.home() / 'AppData/Local'
    env = os.environ.copy()
    env.setdefault('FLUIDSYNTH', str(sorted((local / 'Programs/FluidSynth').glob('*/bin/fluidsynth.exe'))[-1]))
    fonts = list((local / 'SoundFonts/GeneralUser-GS').glob('*.sf2'))
    fonts += list(local.glob('Packages/Claude_*/LocalCache/Local/SoundFonts/GeneralUser-GS/*.sf2'))
    env.setdefault('SOUNDFONT', str(fonts[0]))
    ffmpeg = sorted(local.glob('Microsoft/WinGet/Packages/Gyan.FFmpeg_*/ffmpeg-*/bin/ffmpeg.exe'))[-1]
    env['PATH'] = str(ffmpeg.parent) + os.pathsep + env.get('PATH', '')
    return env


def instrument(program, name, volume, pan, reverb=24, drum=False):
    inst = pretty_midi.Instrument(program, is_drum=drum, name=name)
    for number, value in [(7, volume), (10, pan), (91, reverb), (93, 0)]:
        inst.control_changes.append(pretty_midi.ControlChange(number, value, 0))
    return inst


events = []


def note(inst, pitch, beat, duration, velocity):
    start = max(0, .12 + beat * BEAT + rng.uniform(-.008, .008))
    end = start + duration * BEAT
    inst.notes.append(pretty_midi.Note(int(max(1, min(110, velocity + rng.uniform(-3, 3)))), pitch, start, end))
    events.append(dict(instrument=inst.name, pitch=pitch, beat=beat, duration=duration, velocity=velocity))


# One event sequence per bar. Rests are written explicitly, leaving room to breathe.
# A: a friendly rising greeting, then short skipping replies and an unhurried cadence.
A = [
    [(64, .5), (67, .5), (69, 1), (67, .5), (64, .5), (62, .5), (None, .5)],
    [(64, 1), (67, .5), (72, .5), (71, 1), (67, .5), (None, .5)],
    [(69, .75), (67, .25), (64, 1), (62, .5), (64, .5), (67, 1)],
    [(62, 1.5), (60, .5), (62, 1), (None, 1)],
    [(65, .5), (69, .5), (72, 1), (69, .5), (67, .5), (65, 1)],
    [(64, .75), (67, .25), (69, .5), (67, .5), (64, 1), (None, 1)],
    [(62, .5), (64, .5), (65, 1), (67, .5), (65, .5), (62, 1)],
    [(64, 1), (62, .5), (59, .5), (60, 1.5), (None, .5)],
]
# B: longer lines over warm F / C / Dm harmony, like watching the children from a bench.
B = [
    [(69, 1.5), (72, .5), (74, 1), (72, .5), (None, .5)],
    [(67, 1), (64, .5), (67, .5), (72, 1.5), (None, .5)],
    [(69, 1), (65, .5), (64, .5), (62, 1), (65, 1)],
    [(67, 1.5), (69, .5), (71, 1), (None, 1)],
    [(72, 1), (69, .5), (67, .5), (65, 1.5), (None, .5)],
    [(64, 1), (67, .5), (69, .5), (67, 1), (64, 1)],
    [(65, 1), (64, .5), (62, .5), (59, 1), (62, 1)],
    [(67, 1), (65, .5), (62, .5), (64, 1.5), (None, .5)],
]
CHORDS = {
    'C6': (36, [60, 64, 67, 69]), 'G': (43, [59, 62, 67, 69]),
    'Am7': (45, [60, 64, 67, 69]), 'Em7': (40, [59, 62, 64, 67]),
    'F6': (41, [57, 60, 65, 69]), 'C/E': (40, [60, 64, 67, 72]),
    'Dm7': (38, [57, 60, 62, 65]), 'G7': (43, [59, 62, 65, 67]),
}
AH = ['C6', 'G', 'Am7', 'Em7', 'F6', 'C/E', 'Dm7', 'G7']
BH = ['F6', 'C/E', 'Dm7', 'G7', 'F6', 'C/E', 'Dm7', 'G7']


def phrase(inst, melody, first_bar, velocity):
    for bar, notes in enumerate(melody):
        position = (first_bar + bar) * 4
        for pitch, duration in notes:
            if pitch is not None:
                # Connected long notes, lightly detached short notes.
                gate = .93 if duration >= 1 else .80
                note(inst, pitch, position, duration * gate, velocity + (4 if position % 4 == 0 else 0))
            position += duration


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    DOC.mkdir(parents=True, exist_ok=True)
    score = pretty_midi.PrettyMIDI(initial_tempo=BPM, resolution=960)
    score.time_signature_changes.append(pretty_midi.TimeSignature(4, 4, 0))
    score.key_signature_changes.append(pretty_midi.KeySignature(0, 0))
    piano = instrument(0, 'Piano - sunny melody', 88, 59, 28)
    guitar = instrument(24, 'Nylon guitar - picnic accompaniment', 77, 43, 22)
    flute = instrument(73, 'Flute - playful breeze', 71, 80, 32)
    bass = instrument(32, 'Acoustic bass - gentle footsteps', 77, 64, 10)
    drums = instrument(0, 'Soft maracas and brushes', 52, 64, 12, drum=True)

    # Intro 4 / A 8 / varied A 8 / B 8 / homecoming A 8 / coda 4 = 40 bars, 96 seconds.
    harmony = ['C6', 'C6', 'F6', 'G7'] + AH + AH + BH + AH + ['F6', 'G7', 'C6', 'C6']
    for bar, chord in enumerate(harmony):
        root, voicing = CHORDS[chord]
        beat = bar * 4
        quiet = bar < 4 or bar >= 36
        # Broken nylon chords, softer offbeats and a small human strum delay.
        pattern = [0, 2, 1, 3, 0, 2, 1, 2]
        for step, index in enumerate(pattern):
            if bar == 39 and step > 0:
                continue
            note(guitar, voicing[index], beat + step * .5, .72, (40 if quiet else 46) + (3 if step in (0, 4) else -2))
        if bar == 39:
            for i, pitch in enumerate([60, 64, 67, 72]):
                note(guitar, pitch, beat + i * .045, 3.1, 37)
        note(bass, root + 12, beat, 1.65 if bar != 39 else 3.2, 49 if not quiet else 41)
        if bar != 39:
            note(bass, root + 19 if root + 19 < 62 else root + 7, beat + 2, 1.3, 40)
        # No heavy drum kit: a very quiet texture behind the melody.
        if 4 <= bar < 36:
            for step in range(8):
                note(drums, 70, beat + step * .5, .08, 23 if step % 2 else 17)
            for offset in (1, 3):
                note(drums, 38, beat + offset, .09, 14)
        if bar % 4 == 0:
            for i, pitch in enumerate(voicing[:3]):
                note(piano, pitch - 12, beat + i * .035, 2.0, 31)

    # Opening invitation and the final answer share a small, memorable figure.
    phrase(piano, [[(67, 1), (64, 1), (69, 1), (None, 1)],
                   [(67, 1.5), (64, .5), (60, 1), (None, 1)],
                   [(65, 1), (69, 1), (67, 1), (None, 1)],
                   [(62, 1), (59, 1), (None, 2)]], 0, 56)
    phrase(piano, A, 4, 66)
    phrase(flute, A, 12, 61)
    phrase(flute, B, 20, 60)
    reprise = [list(bar) for bar in A]
    reprise[-1] = [(64, 1), (62, .5), (59, .5), (60, 2)]
    phrase(piano, reprise, 28, 64)
    # Sparse responses in the gaps, rather than doubling every melody note.
    for bar, pitches in [(7, [74, 72]), (11, [67, 64]), (31, [74, 72]), (35, [67, 64])]:
        for i, pitch in enumerate(pitches):
            note(flute, pitch, bar * 4 + 3 + i * .5, .4, 44)
    for bar in [13, 17, 21, 25]:
        note(piano, 72 if bar % 8 == 1 else 67, bar * 4 + 3.5, .35, 39)
    phrase(piano, [[(65, 1), (69, 1), (67, 1), (None, 1)],
                   [(62, 1), (59, 1), (62, 1), (None, 1)],
                   [(64, 1), (67, 1), (60, 2)],
                   [(60, 3), (None, 1)]], 36, 54)

    for inst in [piano, guitar, flute, bass, drums]:
        inst.notes.sort(key=lambda n: n.start)
        score.instruments.append(inst)
    midi = DOC / f'{TRACK_ID}.mid'
    score.write(str(midi))
    metadata = dict(title=TITLE, bpm=BPM, key='C major', meter='4/4', bars=40,
                    form='Intro 4 / A 8 / A-flute 8 / B 8 / A-piano 8 / coda 4',
                    brief='편안하고 밝은 공원, 뛰어노는 아이들과 화목한 가족',
                    instruments=[dict(name=i.name, program=i.program, drums=i.is_drum, notes=len(i.notes)) for i in score.instruments],
                    notes=events)
    (DOC / 'score.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    env = environment()
    wav = DOC / f'{TRACK_ID}.wav'
    subprocess.run([env['FLUIDSYNTH'], '-n', '-i', '-g', '0.5', '-r', '44100', '-F', str(wav), env['SOUNDFONT'], str(midi)], env=env, cwd=DOC, check=True)
    if not wav.is_file():
        raise RuntimeError('FluidSynth did not write the WAV master')
    subprocess.run([sys.executable, str(ROOT / 'tools/audio/prepare-track.py'), str(wav), TRACK_ID, TITLE], env=env, check=True)
    print(json.dumps({k: v for k, v in metadata.items() if k != 'notes'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
