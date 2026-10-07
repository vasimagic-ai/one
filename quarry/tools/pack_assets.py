"""Pack data for the offline (file://) viewer:  data/dem.js, data/scan.js, data/plan.js, data/scan.jpg"""
import json, base64, os, io
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'data')
S = os.environ.get('PANO', 'pano.png')
dem = json.load(open(os.path.join(D, 'dem.json')))
open(os.path.join(D, 'dem.js'), 'w').write('window.QUARRY_DEM=' + json.dumps(dem, separators=(',', ':')) + ';')
if os.path.exists(S):
    im = Image.open(S).convert('RGB')
    x0, y0, x1, y1 = 0, dem['y0'], dem['x0'] + (dem['nx'] - 1) * dem['cell'], dem['y0'] + (dem['ny'] - 1) * dem['cell']
    c = im.crop((x0, y0, x1, y1)); c = c.resize((2048, round(2048 * c.height / c.width)), Image.LANCZOS)
    c.save(os.path.join(D, 'scan.jpg'), quality=80, optimize=True)
b = base64.b64encode(open(os.path.join(D, 'scan.jpg'), 'rb').read()).decode()
open(os.path.join(D, 'scan.js'), 'w').write('window.QUARRY_SCAN="data:image/jpeg;base64,' + b + '";')
svg = open(os.path.join(D, 'quarry_plan.svg'), encoding='utf8').read()
open(os.path.join(D, 'plan.js'), 'w').write('window.QUARRY_PLAN=' + json.dumps(svg) + ';')
import sys; sys.path.insert(0, os.path.dirname(__file__))
import control_points as C
feat = {'stream': C.STREAM, 'blocks': C.BLOCK_LINES, 'labels': C.BLOCK_LABELS, 'buildings': C.BUILDINGS, 'spots': C.SPOTS}
open(os.path.join(D, 'features.js'), 'w').write('window.QUARRY_FEATURES=' + json.dumps(feat) + ';')
print('packed')
