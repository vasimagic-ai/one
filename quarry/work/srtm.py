import numpy as np, requests, time, json
lat0,lat1=47.588,47.616; lon0,lon1=24.768,24.806
nl,no=48,46
lats=np.linspace(lat0,lat1,nl); lons=np.linspace(lon0,lon1,no)
pts=[(a,b) for a in lats for b in lons]; z=[]
for i in range(0,len(pts),100):
    q='|'.join(f'{a:.6f},{b:.6f}' for a,b in pts[i:i+100])
    for tr in range(4):
        r=requests.get('https://api.opentopodata.org/v1/srtm30m',params={'locations':q},timeout=40)
        if r.status_code==200: break
        time.sleep(3)
    z+= [x['elevation'] for x in r.json()['results']]; time.sleep(1.1)
np.savez('srtm.npz',z=np.array(z,float).reshape(nl,no),lats=lats,lons=lons); print('ok',np.nanmin(z),np.nanmax(z))
