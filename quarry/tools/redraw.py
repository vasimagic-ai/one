"""Redraw the plan as a clean vector sheet (SVG) from the reconstructed DEM.
python3 quarry/tools/redraw.py"""
import json, os, sys, numpy as np
from skimage import measure
sys.path.insert(0, os.path.dirname(__file__))
from control_points import *
D = os.path.join(os.path.dirname(__file__), '..', 'data')
dem = json.load(open(os.path.join(D, 'dem.json')))
nx, ny, cell, x0, y0 = dem['nx'], dem['ny'], dem['cell'], dem['x0'], dem['y0']
z = np.array(dem['z']).reshape(ny, nx); conf = np.array(dem['d']).reshape(ny, nx) * 4

VX0, VY0, VX1, VY1 = 0, 450, 4050, 2250          # sheet window (scan px)
def P(x, y): return f'{x:.1f},{y - VY0:.1f}'
out = []; add = out.append
W, H = VX1 - VX0, VY1 - VY0
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H+150}" viewBox="0 0 {W} {H+150}" font-family="Arial,Helvetica,sans-serif">')
add(f'<rect width="{W}" height="{H+150}" fill="#fbfaf5"/>')
# coordinate grid (every 100 m)
step = 100 * PX_PER_M
add('<g stroke="#b9c3cc" stroke-width="1" fill="#6b7a88" font-size="14">')
for i in range(int(W / step) + 1):
    x = 205 + (i - 0) * step - step; add(f'<line x1="{x:.0f}" y1="0" x2="{x:.0f}" y2="{H}"/><text x="{x+3:.0f}" y="14">Y {677800 + (i-1)*100:,}</text>')
for j in range(int(H / step) + 1):
    y = j * step; add(f'<line x1="0" y1="{y:.0f}" x2="{W}" y2="{y:.0f}"/>')
add('</g>')
# contours
def lines(level):
    segs = []
    for c in measure.find_contours(z, level):
        pts = [(x0 + col * cell, y0 + row * cell) for row, col in c]
        segs.append(pts)
    return segs
def split_by_conf(pts):
    """yield (mapped?, pts) runs"""
    run, state = [], None
    for x, y in pts:
        ci = min(max(int((y - y0) / cell), 0), ny - 1); cj = min(max(int((x - x0) / cell), 0), nx - 1)
        s = conf[ci, cj] < 330
        if state is None or s == state: run.append((x, y))
        else:
            yield state, run; run = [run[-1], (x, y)]
        state = s
    if run: yield state, run
def path(pts): return 'M' + ' L'.join(P(x, y) for x, y in pts)
labels = []
for lv in range(900, 1245, 5):
    idx = lv % 25 == 0
    for pts in lines(lv):
        if len(pts) < 4: continue
        for mapped, run in split_by_conf(pts):
            if len(run) < 2: continue
            if mapped: add(f'<path d="{path(run)}" fill="none" stroke="{"#7a4a1e" if idx else "#b07a45"}" stroke-width="{2.2 if idx else 1.1}" stroke-linejoin="round"/>')
            else: add(f'<path d="{path(run)}" fill="none" stroke="#c9b9a6" stroke-width="1" stroke-dasharray="6 6"/>')
        if idx and len(pts) > 30:
            m = pts[len(pts) // 2]
            ci = min(max(int((m[1] - y0) / cell), 0), ny - 1); cj = min(max(int((m[0] - x0) / cell), 0), nx - 1)
            if conf[ci, cj] < 330: labels.append((m[0], m[1], lv))
for x, y, lv in labels:
    add(f'<text x="{x - VX0:.0f}" y="{y - VY0:.0f}" font-size="15" fill="#5b3512" stroke="#fbfaf5" stroke-width="4" paint-order="stroke" text-anchor="middle">{lv}</text>')
# stream: banks + bed
sp = [(x, y) for x, y, _ in STREAM]
add(f'<path d="{path(sp)}" fill="none" stroke="#9cc3dc" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>')
add(f'<path d="{path(sp)}" fill="none" stroke="#3f86b5" stroke-width="5" stroke-linejoin="round"/>')
add(f'<text transform="translate({1980 - VX0},{1255 - VY0}) rotate(-22)" font-size="26" font-style="italic" fill="#2a6d99">pr. Fintina</text>')
# halda
add(f'<g fill="#d8cdb8" fill-opacity=".55" stroke="#8a7a5c" stroke-width="2"><path d="{path([(250,1735),(330,1722),(560,1730),(780,1745),(900,1768),(840,1800),(600,1790),(420,1790),(280,1790)])} Z"/>'
    f'<path d="{path([(1300,1400),(1560,1385),(1590,1450),(1330,1500)])} Z"/></g>')
# blocks
cols = {'upper (pink)': '#b04a8a', 'blue': '#2b4da8', 'pink': '#b04a8a', 'teal 2-B': '#1f9a8c', 'teal top': '#1f9a8c'}
for k, pts in BLOCK_LINES.items():
    add(f'<path d="{path(pts)}" fill="none" stroke="{cols[k]}" stroke-width="3.5" stroke-linejoin="round"/>')
for lab, x, y in BLOCK_LABELS:
    big = lab != 'HALDA'
    add(f'<text x="{x - VX0}" y="{y - VY0}" font-size="{34 if big else 20}" font-weight="{700 if big else 400}" fill="#222" text-anchor="middle" stroke="#fbfaf5" stroke-width="5" paint-order="stroke">{lab}</text>')
# buildings
for x, y, w, h, lab in BUILDINGS:
    add(f'<rect x="{x - VX0 - w/2}" y="{y - VY0 - h/2}" width="{w}" height="{h}" fill="#e8e1d2" stroke="#222" stroke-width="2"/>')
    if lab: add(f'<text x="{x - VX0}" y="{y - VY0 - h/2 - 6}" font-size="18" text-anchor="middle" fill="#222">{lab}</text>')
# spot heights
add('<g font-size="11" fill="#444">')
for x, y, zz in SPOTS:
    if abs(zz - round(zz)) > 0.01 or zz % 5:
        add(f'<circle cx="{x - VX0}" cy="{y - VY0}" r="2.2" fill="#444"/><text x="{x - VX0 + 4}" y="{y - VY0 - 3}">{zz:g}</text>')
add('</g>')
# north arrow (sheet north points to the right, as on the original)
add(f'<g transform="translate({W-260},60)"><line x1="0" y1="0" x2="160" y2="30" stroke="#222" stroke-width="3"/><polygon points="170,32 138,34 145,16" fill="#222"/><text x="-26" y="-6" font-size="26" font-weight="700">N</text></g>')
# scale bar 100 m
sb = 100 * PX_PER_M
add(f'<g transform="translate(40,{H-40})"><rect width="{sb}" height="10" fill="#222"/><rect x="{sb/2}" width="{sb/2}" height="10" fill="#fbfaf5" stroke="#222"/><text y="-8" font-size="16">0</text><text x="{sb}" y="-8" font-size="16" text-anchor="end">100 m</text></g>')
# title block
ty = H + 10
add(f'<g transform="translate(0,{ty})" font-size="22"><rect x="2" y="2" width="{W-4}" height="132" fill="none" stroke="#222" stroke-width="2"/>'
    f'<text x="30" y="50" font-size="36" font-weight="700">HARTA GEOLOGICĂ — Cariera Fântâna</text>'
    f'<text x="30" y="88" font-size="22">Redesenată digital după Anexa nr. 3, SC ROMET SA Baia Sprie, 08.10.1997 · Sistem Stereo ’70 · scara originală 1:1000</text>'
    f'<text x="30" y="118" font-size="18" fill="#8a2b2b">Curbele de nivel (5 m) sunt reconstruite din cotele și curbele etichetate de pe planșă; liniile punctate = zonă neridicată (extrapolat).</text></g>')
add('</svg>')
open(os.path.join(D, 'quarry_plan.svg'), 'w').write('\n'.join(out))
print('written', len(out))
