"""Back up the corrected V6 and define existing scabbard column bounds."""
from pathlib import Path
import json,shutil
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v6';BACK=ART/'before-scabbard-outline';BACK.mkdir(exist_ok=True)
for d in ['se','ne']:
    names=[f'scarlet2-walk-{d}-v6.pxo']+[f'frame-{d}-{n}.png' for n in range(1,5)]
    for name in names:
        if not (BACK/name).exists():shutil.copyfile(ART/name,BACK/name)
for n in range(1,5):
    name=f'frame-sw-{n}.png'
    if not (BACK/name).exists():shutil.copyfile(ART/name,BACK/name)
se=[[x,89,95] for x in range(79,85)]+[[x,90,95] for x in range(85,88)]+[[x,91,95] for x in range(88,90)]+[[x,91,96] for x in range(90,93)]+[[x,92,97] for x in range(93,95)]+[[95,92,98]]+[[x,93,98] for x in range(96,98)]+[[98,93,99],[99,94,99],[100,94,100]]
ne=[[31,93,98],[32,92,98],[33,92,97],[34,92,97],[35,92,96],[36,92,96],[37,91,96],[38,91,96],[39,91,95],[40,91,95],[41,90,95],[42,90,94],[43,90,94],[44,89,94],[45,89,93],[46,89,93],[47,89,93],[48,89,93],[49,89,93],[50,89,92],[51,88,92],[52,88,91],[53,87,91],[54,87,90],[55,86,90],[56,86,89]]
(ART/'scabbard-line.json').write_text(json.dumps({'purpose':'Clean visible existing white scabbard with an inward one-pixel outline and coherent metal shading. Preserve alpha, tip/gold, moving arms and all other regions.','columns':{'se':se,'ne':ne},'bobY':[0,-1,0,-1]},indent=2),encoding='utf8')
print('Saved scabbard bounds and pre-outline artwork backup.')
