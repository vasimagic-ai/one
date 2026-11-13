import json
t=open('sim_template.html',encoding='utf8').read()
t=t.replace('__WORLD__',open('world.json').read()).replace('__SCAN__',open('world_scan.b64').read())
open('../quarry_fantana_sim.html','w',encoding='utf8').write(t); print(len(t)/1e6,'MB')
