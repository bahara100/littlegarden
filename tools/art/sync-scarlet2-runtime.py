"""Publish the exact reviewed Scarlet2 art, keeping every previous source intact."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/client/public/sprites/scarlet2/approved-v6';OUT.mkdir(parents=True,exist_ok=True)
files={}
for d in ['se','ne']:
    for pose,folder in [('idle','scarlet2-base-v2'),('walk','scarlet2-walk-v6')]:
        source=ROOT/f'docs/art/pixel/{folder}/{pose}-{d}.png'
        target=OUT/f'{pose}-{d}.png';shutil.copyfile(source,target)
        files[target.name]={'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps({'character':'홍련2','standingVersion':2,'walkingVersion':6,'frameSize':128,'frames':4,'fps':6,'mirrors':{'sw':'se','nw':'ne'},'files':files},ensure_ascii=False,indent=2),encoding='utf8')
print('Synced standing V2 and final walking V6: 4 exact PNGs.')
