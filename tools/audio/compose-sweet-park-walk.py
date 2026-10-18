"""Original gentle 6/8 park duet. Run with Python 3.13 / pretty_midi.

Local FluidSynth and GeneralUser GS render the score; no external music service.
"""
from pathlib import Path
import json
import os
import random
import subprocess
import sys
import pretty_midi

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/audio/sweet-park-walk'
TRACK_ID = 'sweet-park-walk'
TITLE = '너와 나란히, 공원 산책'
BPM = 90  # quarter-note tempo; dotted-quarter walking pulse = 60
BEAT = 60 / BPM
BAR = 3
rng = random.Random(2026101803)
events = []


def environment():
    local = Path.home() / 'AppData/Local'
    env = os.environ.copy()
    if not env.get('FLUIDSYNTH'):
        env['FLUIDSYNTH'] = str(sorted((local / 'Programs/FluidSynth').glob('*/bin/fluidsynth.exe'))[-1])
    if not env.get('SOUNDFONT'):
        fonts = list((local / 'SoundFonts/GeneralUser-GS').glob('*.sf2'))
        fonts += list(local.glob('Packages/Claude_*/LocalCache/Local/SoundFonts/GeneralUser-GS/*.sf2'))
        env['SOUNDFONT'] = str(fonts[0])
    ffmpeg = sorted(local.glob('Microsoft/WinGet/Packages/Gyan.FFmpeg_*/ffmpeg-*/bin/ffmpeg.exe'))[-1]
    env['PATH'] = str(ffmpeg.parent) + os.pathsep + env.get('PATH', '')
    return env


def instrument(program, name, volume, pan, reverb):
    inst = pretty_midi.Instrument(program, name=name)
    for number, value in [(7, volume), (10, pan), (91, reverb), (93, 0)]:
        inst.control_changes.append(pretty_midi.ControlChange(number, value, 0))
    return inst


def note(inst, pitch, beat, duration, velocity):
    start = max(0, .14 + beat * BEAT + rng.uniform(-.010, .010))
    inst.notes.append(pretty_midi.Note(
        velocity=int(max(1, min(105, velocity + rng.uniform(-3, 3)))),
        pitch=pitch, start=start, end=start + duration * BEAT))
    events.append(dict(instrument=inst.name, pitch=pitch, beat=beat,
                       duration=duration, velocity=velocity))


# F major. Each bar contains three quarter-note beats = six eighth notes.
# A gentle rising third is answered by a descending phrase, with room between lines.
A = [
    [(69, 1), (72, .5), (74, 1), (72, .5)],
    [(69, 1.5), (67, .5), (65, .5), (None, .5)],
    [(67, .5), (69, .5), (70, .5), (74, 1), (72, .5)],
    [(67, 2), (None, 1)],
    [(65, .5), (69, 1), (72, .5), (69, 1)],
    [(67, 1), (65, .5), (64, 1), (None, .5)],
    [(62, .5), (65, .5), (69, 1), (67, .5), (65, .5)],
    [(64, 1), (67, .5), (65, 1), (None, .5)],
    [(69, .5), (72, 1), (77, .5), (76, .5), (74, .5)],
    [(72, 1.5), (69, .5), (67, .5), (None, .5)],
    [(70, 1), (74, .5), (72, .5), (70, .5), (69, .5)],
    [(67, 1.5), (64, .5), (None, 1)],
    [(65, 1), (69, .5), (72, 1), (69, .5)],
    [(67, .5), (65, 1), (64, .5), (62, 1)],
    [(64, .5), (67, .5), (70, 1), (69, .5), (67, .5)],
    [(65, 2.5), (None, .5)],
]
# A quieter conversation in the middle, ending with an upward lift towards the reprise.
B = [
    [(70, 1.5), (69, .5), (67, 1)],
    [(69, 1), (72, .5), (69, 1), (None, .5)],
    [(67, 1), (70, .5), (74, 1), (72, .5)],
    [(67, 2), (None, 1)],
    [(69, 1), (65, .5), (62, 1), (None, .5)],
    [(65, .5), (69, 1), (72, 1), (69, .5)],
    [(70, 1), (69, .5), (67, 1), (65, .5)],
    [(64, 2), (None, 1)],
    [(74, 1), (77, .5), (76, .5), (74, 1)],
    [(72, 1.5), (69, 1), (None, .5)],
    [(70, .5), (74, 1), (72, .5), (70, 1)],
    [(67, 2), (None, 1)],
    [(69, .5), (72, 1), (69, .5), (65, 1)],
    [(67, 1), (65, .5), (62, 1), (None, .5)],
    [(64, .5), (65, .5), (67, 1), (70, .5), (69, .5)],
    [(67, 1.5), (None, 1.5)],
]
CHORDS = {
    'Fmaj7': (41, [57, 60, 64, 65]),
    'C/E': (40, [55, 60, 64, 67]),
    'Dm7': (38, [57, 60, 62, 65]),
    'Am7': (45, [55, 60, 64, 69]),
    'Bbmaj7': (46, [57, 62, 65, 70]),
    'F/A': (45, [57, 60, 65, 69]),
    'Gm7': (43, [58, 62, 65, 67]),
    'C9': (36, [58, 62, 64, 67]),
    'F6': (41, [57, 60, 62, 65]),
}
AH = ['Fmaj7', 'C/E', 'Dm7', 'Am7', 'Bbmaj7', 'F/A', 'Gm7', 'C9',
      'Fmaj7', 'Dm7', 'Bbmaj7', 'C9', 'F/A', 'Gm7', 'C9', 'F6']
BH = ['Bbmaj7', 'F/A', 'Gm7', 'C9', 'Dm7', 'Am7', 'Gm7', 'C9',
      'Bbmaj7', 'F/A', 'Gm7', 'C9', 'Fmaj7', 'Gm7', 'C9', 'C9']


def phrase(inst, melody, first_bar, velocity):
    for bar, line in enumerate(melody):
        assert abs(sum(length for _, length in line) - BAR) < .001
        position = (first_bar + bar) * BAR
        for pitch, duration in line:
            if pitch is not None:
                gate = .96 if duration >= 1 else .89
                contour = 3 if bar % 4 in (0, 1) else -1
                note(inst, pitch, position, duration * gate,
                     velocity + contour + (2 if position % BAR == 0 else 0))
            position += duration


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    DOC.mkdir(parents=True, exist_ok=True)
    score = pretty_midi.PrettyMIDI(initial_tempo=BPM, resolution=960)
    score.time_signature_changes.append(pretty_midi.TimeSignature(6, 8, 0))
    score.key_signature_changes.append(pretty_midi.KeySignature(5, 0))
    piano = instrument(0, 'Piano - walking together', 86, 59, 32)
    guitar = instrument(24, 'Nylon guitar - swaying arpeggios', 72, 42, 26)
    cello = instrument(42, 'Cello - warm replies', 64, 82, 34)
    bass = instrument(32, 'Acoustic bass - soft steps', 70, 64, 14)
    strings = instrument(48, 'Strings - quiet warmth', 49, 67, 36)
    harmony = ['Fmaj7', 'C/E', 'Bbmaj7', 'C9'] + AH + BH + AH + ['Bbmaj7', 'C9', 'F6', 'F6']
    assert len(harmony) == 56

    for bar, chord in enumerate(harmony):
        beat = bar * BAR
        root, voicing = CHORDS[chord]
        is_edge = bar < 4 or bar >= 52
        # Six light eighth notes create two relaxed, swaying steps per bar.
        for step, index in enumerate([0, 1, 2, 1, 3, 2]):
            if bar == 55 and step > 0:
                continue
            note(guitar, voicing[index], beat + step * .5, .87,
                 (35 if is_edge else 41) + (3 if step in (0, 3) else -2))
        note(bass, root, beat, 2.55, 42 if not is_edge else 35)
        if not is_edge and bar % 2 == 1:
            note(bass, root + 7, beat + 2.5, .4, 30)
        # A few close inner voices; keep the accompaniment below the melody.
        if bar % 2 == 0 or bar >= 52:
            for index, pitch in enumerate(voicing[1:3]):
                note(piano, pitch, beat + index * .035, 2.1, 29 if not is_edge else 26)
        # Strings enter for the central conversation, then recede before the ending.
        if 20 <= bar < 36 or 44 <= bar < 52:
            for pitch in voicing[1:3]:
                note(strings, pitch, beat + .12, 2.92, 34 if bar < 36 else 28)
        if bar == 55:
            for index, pitch in enumerate([53, 60, 65, 69]):
                note(guitar, pitch, beat + index * .055, 3.5, 33)

    phrase(piano, [[(65, 1), (69, .5), (72, 1), (None, .5)],
                   [(67, 1.5), (64, 1), (None, .5)],
                   [(65, 1), (69, 1), (70, .5), (None, .5)],
                   [(67, 1), (64, .5), (None, 1.5)]], 0, 48)
    phrase(piano, A, 4, 56)
    # Cello takes the first phrase in a low register, piano answers above it.
    cello_line = [[(pitch - 12 if pitch is not None else None, duration)
                   for pitch, duration in bar] for bar in B[:8]]
    phrase(cello, cello_line, 20, 51)
    phrase(piano, B[8:], 28, 55)
    phrase(piano, A, 36, 53)
    # Replies sit in the melody's rests; avoid constant unison doubling.
    for bar, pitches in [(7, [57, 60]), (11, [60, 57]), (15, [55, 58]),
                         (31, [58, 55]), (43, [57, 60]), (47, [55, 58])]:
        for index, pitch in enumerate(pitches):
            note(cello, pitch, bar * BAR + 2 + index * .5, .47, 36)
    phrase(piano, [[(70, 1), (69, .5), (65, 1), (None, .5)],
                   [(67, 1), (64, .5), (62, 1), (None, .5)],
                   [(65, 1.5), (69, .5), (67, .5), (None, .5)],
                   [(65, 2.7), (None, .3)]], 52, 45)
    for pitch in [53, 60]:
        note(piano, pitch, 55 * BAR, 3.2, 27)

    for inst in [piano, guitar, cello, bass, strings]:
        inst.notes.sort(key=lambda n: n.start)
        score.instruments.append(inst)
    midi = DOC / f'{TRACK_ID}.mid'
    score.write(str(midi))
    metadata = dict(title=TITLE, key='F major', meter='6/8',
                    quarterBpm=BPM, dottedQuarterBpm=60, bars=56,
                    form='Intro 4 / A 16 / B 16 (cello-piano conversation) / A 16 / coda 4',
                    brief='공원에 온 연인들의 편안하고 달콤한 산책',
                    instruments=[dict(name=i.name, program=i.program, notes=len(i.notes))
                                 for i in score.instruments], notes=events)
    (DOC / 'score.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    env = environment()
    wav = DOC / f'{TRACK_ID}.wav'
    subprocess.run([env['FLUIDSYNTH'], '-n', '-i', '-g', '0.5', '-r', '44100',
                    '-F', str(wav), env['SOUNDFONT'], str(midi)], env=env, cwd=DOC, check=True)
    if not wav.is_file():
        raise RuntimeError('FluidSynth did not write the WAV master')
    subprocess.run([sys.executable, str(ROOT / 'tools/audio/prepare-track.py'),
                    str(wav), TRACK_ID, TITLE], env=env, check=True)
    print(json.dumps({k: v for k, v in metadata.items() if k != 'notes'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
