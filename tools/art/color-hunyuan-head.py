"""Texture the preserved AI mesh locally. Front projection + inferred rear palette.
Run with PYTHONPATH=tools/art/pydeps using Python with Pillow installed.
Does not modify the input artwork or the original mesh.
"""
from pathlib import Path
import json
import struct
import numpy as np
import trimesh
from PIL import Image
from scipy.ndimage import maximum_filter

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/image-to-3d'
OUT = ROOT / 'apps/client/public/models/experiments'
source = ART / 'scarlet-head-hunyuan-shape.glb'
mesh = trimesh.load(source, force='mesh')
original_faces = len(mesh.faces)
mesh.update_faces(mesh.nondegenerate_faces())
mesh.update_faces(mesh.unique_faces())
mesh.remove_unreferenced_vertices()
mesh = mesh.simplify_quadric_decimation(face_count=150000)
mesh.fix_normals()

# Hunyuan's normalized front faces +Z. Match the foreground bounds of the
# exact reference used for shape generation, leaving its white margins out.
img = Image.open(ART / 'scarlet-head-front-v1.png').convert('RGB')
pixels = np.asarray(img)
mask = np.min(pixels, axis=2) < 210
ys, xs = np.where(mask)
left, right, top, bottom = xs.min(), xs.max(), ys.min(), ys.max()
lo, hi = mesh.bounds
v = mesh.vertices
u = (v[:, 0]-lo[0])/(hi[0]-lo[0])
t = (hi[1]-v[:, 1])/(hi[1]-lo[1])
px = left + u*(right-left)
py = top + t*(bottom-top)
uv = np.column_stack((px/(img.width-1), 1-py/(img.height-1)))

# Front-depth visibility prevents front eyes from appearing on the rear hair.
grid = 512
ix = np.clip((u*(grid-1)).astype(int), 0, grid-1)
iy = np.clip((t*(grid-1)).astype(int), 0, grid-1)
depth = np.full((grid,grid), -100.)
np.maximum.at(depth, (iy,ix), v[:,2])
depth = maximum_filter(depth, size=5)
visible = v[:,2] > depth[iy,ix]-.16
front = (visible[mesh.faces].sum(axis=1)>=2) & (mesh.face_normals[:,2] > -.15)

# Back/occluded surface palette is a deliberate approximation, not AI texture.
h = (v[:,1]-lo[1])/(hi[1]-lo[1])
colors = np.tile([184,168,207,255], (len(v),1)).astype(np.uint8)
colors[h>.58] = [242,231,219,255]
colors[(h>.87)&(np.abs(v[:,0])<.40)] = [209,159,81,255]
colors[(h<.22)] = [217,206,226,255]
colors[(h<.12)&(np.abs(v[:,0])<.35)] = [141,72,99,255]
back = mesh.copy()
back.update_faces(~front)
back.visual = trimesh.visual.ColorVisuals(back, vertex_colors=colors)
back.remove_unreferenced_vertices()
painted = mesh.copy()
painted.update_faces(front)
mat = trimesh.visual.material.PBRMaterial(name='Reference front projection', baseColorTexture=img,
    baseColorFactor=[255,255,255,255], metallicFactor=0., roughnessFactor=.9, doubleSided=True)
painted.visual = trimesh.visual.texture.TextureVisuals(uv=uv, material=mat)
painted.remove_unreferenced_vertices()
scene = trimesh.Scene()
scene.add_geometry(painted, geom_name='Front reference projection')
scene.add_geometry(back, geom_name='Inferred rear palette')
name = 'scarlet-head-hunyuan-colored-v1.glb'
data = scene.export(file_type='glb', include_normals=True)
# ColorVisuals exports no material; glTF's default metallic=1 makes the back
# appear unnaturally dark. Give that primitive an explicit matte white base.
jlen = struct.unpack_from('<I',data,12)[0]
doc = json.loads(data[20:20+jlen])
material_index = len(doc.setdefault('materials',[]))
doc['materials'].append(dict(name='Matte inferred palette', doubleSided=True,
    pbrMetallicRoughness=dict(baseColorFactor=[1,1,1,1],metallicFactor=0,roughnessFactor=.9)))
for item in doc['meshes']:
    for primitive in item['primitives']:
        if 'COLOR_0' in primitive['attributes']:
            primitive['material'] = material_index
jbytes = json.dumps(doc,separators=(',',':')).encode()
jbytes += b' '*((-len(jbytes))%4)
tail = data[20+jlen:]
data = struct.pack('<III',0x46546c67,2,20+len(jbytes)+len(tail))+struct.pack('<II',len(jbytes),0x4e4f534a)+jbytes+tail
(ART/name).write_bytes(data)
(OUT/name).write_bytes(data)
report = dict(source=source.name, output=name, method='front image projection + inferred rear palette',
    originalTriangles=original_faces, triangles=len(mesh.faces), frontTriangles=int(front.sum()),
    backTriangles=int((~front).sum()), bytes=len(data), inputImageBounds=[int(left),int(top),int(right),int(bottom)],
    hasRig=False, hasAnimation=False)
(ART/'scarlet-head-colored-metrics.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assert np.isfinite(mesh.vertices).all()
assert len(mesh.faces)<=150000 and 0<front.sum()<len(mesh.faces)
print(json.dumps(report,indent=2))
