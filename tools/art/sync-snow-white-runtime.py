"""Publish the exact reviewed Snow White standing V1, walking V1 and chair sitting V1 art for the game."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/client/public/sprites/snow-white/v1';OUT.mkdir(parents=True,exist_ok=True)
files={}
for d in ['se','ne']:
    for pose,folder in [('idle','snow-white-idle-v1'),('walk','snow-white-walk-v1'),('sit','snow-white-sit-v1')]:
        source=ROOT/f'docs/art/pixel/{folder}/{pose}-{d}.png'
        target=OUT/f'{pose}-{d}.png';shutil.copyfile(source,target)
        files[target.name]={'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps({'character':'스노우화이트','standingVersion':1,'sittingVersion':1,'walkingVersion':1,'frameSize':128,'frames':4,'fps':6,'mirrors':{'sw':'se','nw':'ne'},'files':files},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Synced Snow White standing V1, walking V1 and chair sitting V1: 6 exact PNGs.')
