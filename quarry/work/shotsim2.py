import sys
from playwright.sync_api import sync_playwright
R='/tmp/claude-0/-home-user-one/38991a8c-e48a-522a-ab95-2bcea220e640/scratchpad/'
body=open('/home/user/one/quarry/quarry_fantana_sim.html',encoding='utf8').read()
open(R+'sim2_test.html','w',encoding='utf8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>')
def route(r):
    u=r.request.url
    if 'three.min.js' in u: r.fulfill(path=R+'r128/node_modules/three/build/three.min.js',content_type='application/javascript')
    elif 'OrbitControls' in u: r.fulfill(path=R+'r128/node_modules/three/examples/js/controls/OrbitControls.js',content_type='application/javascript')
    else: r.abort()
shots=sys.argv[1:]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1400,'height':800}); pg.route('**/*',lambda r: route(r) if r.request.url.startswith('http') else r.continue_())
    pg.on('pageerror',lambda e: print('ERR',str(e)[:400])); pg.on('console',lambda m: print('console',m.type,m.text[:200]) if m.type=='error' and 'ERR_FAILED' not in m.text else None)
    pg.goto('file://'+R+'sim2_test.html'); pg.wait_for_function('window.__quarry',timeout=90000)
    pg.evaluate("document.getElementById('speed').value=8;document.getElementById('speed').dispatchEvent(new Event('input'))")
    for s in shots:
        cam,mode,wait=s.split(':'); pg.evaluate(f"window.__quarry.setCam('{cam}');window.__quarry.setMode('{mode}')"); pg.wait_for_timeout(int(wait)); pg.screenshot(path=R+f'sim2_{cam}_{mode}.png')
    print(pg.evaluate("JSON.stringify({plat:window.__quarry.PLAT,cru:window.__quarry.CRU,floor:window.__quarry.FLOOR,roadH:window.__quarry.roadH,trips:window.__quarry.state().trips,t:Math.round(window.__quarry.state().tons),st:window.__quarry.state().status,exc:window.__quarry.exc.st,tr:window.__quarry.trucksAll.map(t=>t.st+':'+t.load)})"))
    b.close()
