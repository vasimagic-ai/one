"""Build a reconstructed DEM from hand-read control points.
Outputs quarry/data/dem.json (+ preview) — run:  python3 quarry/tools/build_dem.py"""
import json, sys, os, numpy as np
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree
sys.path.insert(0, os.path.dirname(__file__))
from control_points import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')
X0, X1, Y0, Y1, CELL = 0, 4000, 500, 2300, 12     # px extent / cell size

real = np.array(SPOTS + STREAM, float)
st = np.array(STREAM, float)

# --- synthetic valley sides where the sheet has no data ---------------------
syn = []
tree = cKDTree(real[:, :2])
seg = np.diff(st[:, :2], axis=0)
for i in range(len(st) - 1):
    t = seg[i] / np.linalg.norm(seg[i]); n = np.array([-t[1], t[0]])
    for d in (250, 450, 700):
        for sgn in (-1, 1):
            p = st[i, :2] + sgn * n * d
            if not (X0 <= p[0] <= X1 and Y0 <= p[1] <= Y1): continue
            if tree.query(p)[0] < 260: continue
            # valley side rises ~25% (north side a bit steeper than south)
            k = 0.30 if sgn < 0 else 0.22
            pass
# far upslope to the NW of the crest (unmapped): rises gently
for x, y, z in [(300,900,1130),(100,1100,1100),(300,600,1190),(600,560,1235),(900,520,1215),
                (1200,520,1180),(1500,480,1150),(1800,520,1120),(2100,560,1080),(2400,600,1050)]:
    syn.append((x, y, z))
syn = np.array(syn, float)
allp = np.vstack([real, syn])
# thin duplicates
_, idx = np.unique(np.round(allp[:, :2] / 6), axis=0, return_index=True)
allp = allp[np.sort(idx)]

# global plane as trend, RBF on residual
A = np.c_[allp[:, 0], allp[:, 1], np.ones(len(allp))]
coef, *_ = np.linalg.lstsq(A, allp[:, 2], rcond=None)
res = allp[:, 2] - A @ coef
w = np.where(np.arange(len(allp)) < len(real), 1.0, 8.0)  # more smoothing on synthetic
rbf = RBFInterpolator(allp[:, :2], res, kernel='thin_plate_spline', smoothing=w * 40.0)

xs = np.arange(X0, X1 + 1, CELL); ys = np.arange(Y0, Y1 + 1, CELL)
gx, gy = np.meshgrid(xs, ys)
q = np.c_[gx.ravel(), gy.ravel()]
z = (coef[0] * q[:, 0] + coef[1] * q[:, 1] + coef[2] + rbf(q)).reshape(gx.shape)

# carve the stream bed to the surveyed water profile (smooth blend, 14 px ~ 4 m wide)
from scipy.interpolate import interp1d
sline = []
for i in range(len(st) - 1):
    for t in np.linspace(0, 1, 12, endpoint=False): sline.append(st[i] * (1 - t) + st[i + 1] * t)
sline = np.array(sline)
stree = cKDTree(sline[:, :2])
dist, ii = stree.query(q); dist = dist.reshape(gx.shape); zs = sline[ii, 2].reshape(gx.shape)
bed = np.clip(1 - (dist - 14) / 90, 0, 1) ** 2        # 1 within 14 px, fades by ~100 px
z = z * (1 - bed) + (zs + (np.clip(dist - 14, 0, None) * 0.02)) * bed
# valley model far from mapped hillside: surface rises away from the stream
spots = np.array(SPOTS, float)
dsp = cKDTree(spots[:, :2]).query(q)[0].reshape(gx.shape)
side = np.sign(((q[:, 0] - sline[ii, 0]) * 0 + (q[:, 1] - sline[ii, 1])).reshape(gx.shape))  # +1 south(below), -1 north
kslope = np.where(side > 0, 0.20, 0.28)
zval = zs + kslope * dist / PX_PER_M
w = np.exp(-(dsp / 380.0) ** 2)
z = z * w + zval * (1 - w)
z = np.where(dist < 14, zs, z)
# smooth lightly
from scipy.ndimage import gaussian_filter
z = gaussian_filter(z, 1.0)

# confidence: distance to nearest *real* point
rd = cKDTree(real[:, :2]).query(q)[0].reshape(gx.shape)
print('z range', z.min(), z.max(), 'grid', z.shape, 'real pts', len(real), 'synthetic', len(syn))
os.makedirs(OUT, exist_ok=True)
json.dump({'x0': X0, 'y0': Y0, 'cell': CELL, 'nx': len(xs), 'ny': len(ys), 'pxPerM': PX_PER_M,
           'z': np.round(z, 2).ravel().tolist(), 'd': np.round(np.minimum(rd, 999) / 4).astype(int).ravel().tolist()},
          open(os.path.join(OUT, 'dem.json'), 'w'), separators=(',', ':'))

