import numpy as np, sys, pickle
from pyproj import Transformer
from scipy.interpolate import RegularGridInterpolator
from scipy.optimize import differential_evolution
sys.path.insert(0,'../tools'); import control_points as C
d=np.load('srtm.npz'); Z=d['z']; lats=d['lats']; lons=d['lons']
t=Transformer.from_crs(4326,3844,always_xy=True)
LO,LA=np.meshgrid(lons,lats); X,Y=t.transform(LO,LA)       # X=easting, Y=northing
# regular interpolator in (lat,lon)
f=RegularGridInterpolator((lats,lons),Z,bounds_error=False,fill_value=np.nan)
inv=Transformer.from_crs(3844,4326,always_xy=True)
pts=[(2*x,2*y-102,z) for x,y,z in C.STREAM]
pts+=[(2*x,2*y-102,z) for x,y,z in C.SPOTS]
TR=pickle.load(open('TR_A.pkl','rb')); pts+=[(q[0],q[1],l) for p,l in TR for q in p[::25]]
P=np.array(pts,float); w=np.r_[np.full(len(C.STREAM),3.0),np.ones(len(P)-len(C.STREAM))]
def geo(par,P):
    N0,E0,th,k=par; c,s=np.cos(th),np.sin(th); x,y=P[:,0],P[:,1]
    N=N0+k*(x*c+y*s); E=E0+k*(-x*s+y*c); lon,lat=inv.transform(E,N); return lat,lon
def cost(par,ret=False):
    lat,lon=geo(par,P); zs=f(np.c_[lat,lon]); m=~np.isnan(zs)
    if m.sum()<len(P)*0.9: return 1e3
    r=(zs[m]-P[m,2]); r=r-np.median(r)
    return np.average(np.abs(r),weights=w[m])
base=(677632.,483860.1,0.2026,0.1325)
b=[(base[0]-350,base[0]+350),(base[1]-350,base[1]+350),(base[2]-0.15,base[2]+0.15),(base[3]*0.93,base[3]*1.07)]
print('base cost',cost(base))
res=differential_evolution(cost,b,seed=3,maxiter=60,popsize=25,tol=1e-4,polish=False)
print(res.x,res.fun)
np.save('align_par.npy',res.x)
lat,lon=geo(res.x,P); zs=f(np.c_[lat,lon]); r=zs-P[:,2]; print('median offset (SRTM-plan)',np.nanmedian(r))
# location of GE point in pano
ge=(24+47/60+7.19/3600,47+36/60+8.43/3600); Xg,Yg=t.transform(*ge)
N0,E0,th,k=res.x; c,s=np.cos(th),np.sin(th); u=(Yg-N0)/k; v=(Xg-E0)/k; print('GE point pano px',u*c-v*s,u*s+v*c)
