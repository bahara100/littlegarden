"""Original happy family picnic theme. Python 3.13 / pretty_midi / FluidSynth.

The existing composer's helpers are reused only for installed tool discovery
and MIDI instrument controls. All melody, harmony, rhythm and form below are new.
"""
from pathlib import Path
import importlib.util
import json
import random
import subprocess
import sys
import pretty_midi

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/audio/family-picnic'
TRACK_ID = 'family-picnic'
TITLE = '웃음꽃 피는 나들이'
BPM = 112
BEAT = 60 / BPM
rng = random.Random(2026101804)
events = []

# Reuse local rendering setup, without using the earlier song's note data.
spec = importlib.util.spec_from_file_location('local_audio_helpers', Path(__file__).with_name('compose-sweet-park-walk.py'))
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def note(inst, pitch, beat, length, velocity):
    start = max(0, .12 + beat * BEAT + rng.uniform(-.009, .009))
    inst.notes.append(pretty_midi.Note(int(max(1, min(110, velocity + rng.uniform(-3, 3)))),
                                      pitch, start, start + length * BEAT))
    events.append(dict(instrument=inst.name, pitch=pitch, beat=beat, length=length, velocity=velocity))


# G major: short skips alternate with longer, smiling answers. Each line is one 4/4 bar.
A = [
    [(67, .5), (71, .5), (74, .75), (71, .25), (69, .5), (67, .5), (69, .5), (None, .5)],
    [(71, 1), (74, .5), (78, .5), (76, 1), (74, .5), (None, .5)],
    [(72, .5), (76, .5), (79, 1), (76, .5), (74, .5), (72, .5), (None, .5)],
    [(74, 1), (69, .5), (66, .5), (69, 1), (None, 1)],
    [(71, .75), (74, .25), (79, .5), (78, .5), (76, 1), (74, .5), (None, .5)],
    [(72, .5), (71, .5), (69, 1), (67, .5), (69, .5), (72, .5), (None, .5)],
    [(69, .5), (72, .5), (74, .75), (72, .25), (71, .5), (69, .5), (66, 1)],
    [(67, 1), (71, .5), (69, .5), (67, 1.5), (None, .5)],
]
A2 = [list(line) for line in A]
A2[0] = [(71, .5), (74, .5), (79, 1), (78, .5), (74, .5), (71, .5), (None, .5)]
A2[3] = [(74, 1.5), (72, .5), (69, 1), (None, 1)]
A2[7] = [(71, .5), (69, .5), (67, 2), (None, 1)]
B = [
    [(76, 1.5), (79, .5), (81, 1), (79, 1)],
    [(78, 1), (74, .5), (71, .5), (74, 1.5), (None, .5)],
    [(76, 1), (74, .5), (71, .5), (69, 1), (72, 1)],
    [(74, 2), (None, .5), (72, .5), (71, 1)],
    [(72, 1), (76, .5), (79, .5), (76, 1.5), (None, .5)],
    [(74, 1), (71, .5), (69, .5), (67, 1.5), (None, .5)],
    [(69, .5), (71, .5), (72, 1), (74, .5), (72, .5), (69, 1)],
    [(66, 1), (69, .5), (74, .5), (None, 2)],
]
CHORDS = {
    'G6': (43, [55, 59, 62, 64]), 'Bm7': (47, [57, 59, 62, 66]),
    'Cmaj7': (36, [55, 59, 60, 64]), 'D7': (38, [57, 60, 62, 66]),
    'Em7': (40, [55, 59, 62, 64]), 'Am7': (45, [55, 60, 64, 69]),
    'G/B': (47, [55, 59, 62, 67]),
}
AH = ['G6', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'Am7', 'D7', 'G6']
BH = ['Cmaj7', 'G/B', 'Am7', 'D7', 'Cmaj7', 'G/B', 'Am7', 'D7']


def phrase(inst, melody, first_bar, velocity):
    for bar, line in enumerate(melody):
        assert abs(sum(length for _, length in line) - 4) < .001
        beat = (first_bar + bar) * 4
        for pitch, length in line:
            if pitch is not None:
                gate = .84 if length < 1 else .95
                note(inst, pitch, beat, length * gate, velocity + (4 if beat % 4 == 0 else 0))
            beat += length


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    DOC.mkdir(parents=True, exist_ok=True)
    score = pretty_midi.PrettyMIDI(initial_tempo=BPM, resolution=960)
    score.time_signature_changes.append(pretty_midi.TimeSignature(4, 4, 0))
    score.key_signature_changes.append(pretty_midi.KeySignature(7, 0))
    piano = helpers.instrument(0, 'Piano - skipping and smiling', 85, 55, 24)
    clarinet = helpers.instrument(71, 'Clarinet - playful answers', 73, 77, 26)
    guitar = helpers.instrument(24, 'Nylon guitar - sunny picnic', 73, 40, 20)
    bass = helpers.instrument(32, 'Acoustic bass - light bounce', 75, 64, 10)
    drums = helpers.instrument(0, 'Soft shaker and cross-stick', 51, 65, 12)
    drums.is_drum = True
    harmony = ['G6', 'Bm7', 'Cmaj7', 'D7'] + AH + AH + BH + AH + AH + ['Cmaj7', 'D7', 'G6', 'G6']
    assert len(harmony) == 48
    for bar, chord in enumerate(harmony):
        beat = bar * 4
        root, voices = CHORDS[chord]
        edge = bar < 4 or bar >= 44
        # Short bass followed by a light chord: a gentle, springy picnic pulse.
        for offset, pitch in [(0, root), (2, root + 7 if root <= 43 else root - 5)]:
            if bar == 47 and offset:
                continue
            note(bass, pitch, beat + offset, 1.15 if bar < 47 else 3.7, 44 if edge else 51)
        for offset in [0, 1, 2, 3]:
            if bar == 47 and offset:
                continue
            selected = [voices[0]] if offset in [0, 2] else voices[1:]
            for i, pitch in enumerate(selected):
                note(guitar, pitch, beat + offset + i * .035, .72 if offset % 2 else .95,
                     (34 if edge else 42) + (2 if offset % 2 else -2))
        if bar == 47:
            for i, pitch in enumerate([55, 59, 62, 67]):
                note(guitar, pitch, beat + i * .045, 3.4, 36)
        if 4 <= bar < 44:
            for step in range(8):
                note(drums, 70, beat + step * .5, .08, 24 if step % 2 else 18)
            for offset in (1, 3):
                note(drums, 37, beat + offset, .08, 23)
            note(drums, 36, beat, .10, 22)
        if bar % 2 == 0:
            for i, pitch in enumerate(voices[1:3]):
                note(piano, pitch, beat + i * .03, 1.3, 30)

    phrase(piano, [[(67, .5), (71, .5), (74, 1), (71, 1), (None, 1)],
                   [(66, 1), (69, .5), (74, .5), (None, 2)],
                   [(64, .5), (67, .5), (72, 1), (76, 1), (None, 1)],
                   [(74, 1), (69, 1), (None, 2)]], 0, 54)
    phrase(clarinet, A, 4, 62)
    phrase(piano, A2, 12, 65)
    phrase(clarinet, B, 20, 59)
    phrase(piano, A, 28, 65)
    phrase(clarinet, A2, 36, 61)
    # Little replies in the rests resemble a family calling back to the children.
    for bar, pitches in [(7, [74, 71]), (15, [69, 66]), (23, [69, 66]), (31, [74, 71]), (39, [69, 66])]:
        other = piano if bar in (7, 23, 39) else clarinet
        for i, pitch in enumerate(pitches):
            note(other, pitch, bar * 4 + 3 + i * .5, .35, 43)
    phrase(piano, [[(72, 1), (76, .5), (79, .5), (76, 1), (None, 1)],
                   [(74, 1), (72, .5), (69, .5), (66, 1), (None, 1)],
                   [(67, .5), (71, .5), (74, 1), (71, 1), (67, 1)],
                   [(67, 3.5), (None, .5)]], 44, 53)
    for pitch in [55, 59, 62]:
        note(piano, pitch, 47 * 4, 3.6, 29)
    for inst in [piano, clarinet, guitar, bass, drums]:
        inst.notes.sort(key=lambda n: n.start)
        score.instruments.append(inst)
    midi = DOC / f'{TRACK_ID}.mid'
    score.write(str(midi))
    metadata = dict(title=TITLE, bpm=BPM, key='G major', meter='4/4', bars=48,
                    form='Intro 4 / A-clarinet 8 / A-piano 8 / B 8 / A-piano 8 / A-clarinet 8 / coda 4',
                    brief='뛰노는 아이들, 웃으며 나들이를 즐기는 화목한 가족',
                    instruments=[dict(name=i.name, program=i.program, drums=i.is_drum, notes=len(i.notes)) for i in score.instruments],
                    notes=events)
    (DOC / 'score.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    env = helpers.environment()
    wav = DOC / f'{TRACK_ID}.wav'
    subprocess.run([env['FLUIDSYNTH'], '-n', '-i', '-g', '0.5', '-r', '44100', '-F', str(wav), env['SOUNDFONT'], str(midi)], env=env, cwd=DOC, check=True)
    if not wav.is_file():
        raise RuntimeError('FluidSynth did not write the WAV master')
    subprocess.run([sys.executable, str(ROOT / 'tools/audio/prepare-track.py'), str(wav), TRACK_ID, TITLE], env=env, check=True)
    print(json.dumps({k: v for k, v in metadata.items() if k != 'notes'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
