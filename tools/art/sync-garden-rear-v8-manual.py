"""Publish user-exported V8 frames verbatim; never rerun procedural art builders."""
import hashlib
import importlib.util
import json
import re
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel'
PUBLIC=ROOT/'apps/client/public'
OUT=ART/'garden-body-walk-ne-v8'
SOURCE=OUT/'manual-edit-2026-10-18'
spec=importlib.util.spec_from_file_location('preview',ROOT/'tools/art/build-garden-body-walk-se-v3.py')
h=importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
h.HEAD_ROWS=45
h.SRC=str(ART/'garden-body-walk-se-v20')
frames=[np.array(Image.open(SOURCE/f'user_{i:04}.png').convert('RGBA')) for i in range(4)]
before=np.array(Image.open(SOURCE/'before-walk.png').convert('RGBA'))
digest=hashlib.sha256(b''.join(f.tobytes() for f in frames)).hexdigest()
changes=[]
for i,f in enumerate(frames):
    old=before[:,i*96:(i+1)*96]
    visible=(f[...,3]>0)|(old[...,3]>0)
    changes.append(int((np.any(f!=old,axis=2)&visible).sum()))
metadata={'version':8,'stage':'user-manually-edited-authoritative-source','source':'manual-edit-2026-10-18/source-user-edited.pxo','pixelSha256':digest,'changedPixelsByFrame':changes,'method':'Pixelorama composite exported verbatim; no redraw, resize or palette conversion'}
for direction,fs in [('ne',frames),('nw',[f[:,::-1].copy() for f in frames])]:
    folder=ART/f'garden-body-walk-{direction}-v8'
    dest=PUBLIC/f'body-walk-{direction}-v8'
    h.write_outputs(fs,['User manual V8 Pixelorama export']*4,{**metadata,'direction':direction},str(folder),str(dest))
    for i,f in enumerate(fs,1):
        if direction=='ne': shutil.copyfile(SOURCE/f'user_{i-1:04}.png',folder/f'frame-{i}-native.png')
        assert np.array_equal(np.array(Image.open(dest/f'frame-{i}.png').convert('RGBA')),f)
    html=(dest/'index.html').read_text(encoding='utf-8')
    html=re.sub(r"img\.src=root\+file(?:\+'\?rev=[a-f0-9]+')?}","img.src=root+file+'?rev="+digest[:12]+"'}",html)
    html=html.replace('2·4번은 기존 걷기 그림의 팔·손 명암과 굵기를 재사용했습니다. 잘린 왼쪽 엉덩이와 반바지 외곽선은 원본으로 복원했습니다. 1·3번과 다리·보폭은 유지했습니다.','사용자가 직접 수정한 V8 원본을 그대로 반영했습니다. NE 네 컷과 NW 반전, 반복 재생과 미리보기가 같은 수정본을 표시합니다.')
    (dest/'index.html').write_text(html,encoding='utf-8')
    (folder/'MANUAL_EDIT_LOCK.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copyfile(OUT/'garden-body-walk-ne-v8.pxo',PUBLIC/'body-walk-ne-v8/garden-body-walk-ne-v8.pxo')
shutil.copyfile(OUT/'walk.png',PUBLIC/'friends-base-walk-v1/base-walk-ne.png')
(OUT/'verification.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=False))
