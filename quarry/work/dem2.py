import numpy as np, sys, json, cv2
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
sys.path.insert(0,'../tools'); import control_points as C
P=np.load('cross_ok.npy')[:,:3]
spots=np.array([(2*x,2*y-102,z) for x,y,z in C.SPOTS]); st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float)
# thin crossing points: keep one per 10px cell per level
key={}
for x,y,z in P: key.setdefault((int(x//10),int(y//10),int(z)),(x,y,z))
Pc=np.array(list(key.values())); print('crossings',len(P),'->',len(Pc))
# spots only where not contradicting traced contours (>=40px away from any crossing), low weight
tr=cKDTree(Pc[:,:2]); sp_keep=np.array([tr.query(s[:2])[0]>45 for s in spots]); print('spots used',sp_keep.sum(),'/',len(spots))
S=spots[sp_keep]
X0,X1,Y0,Y1,CELL=150,5300,500,3900,24
# stream samples
sl=[]
for a,b in zip(st[:-1],st[1:]):
    for t in np.linspace(0,1,10,endpoint=False): sl.append(a*(1-t)+b*t)
sl=np.array(sl)
pts=np.vstack([Pc,S,sl[::2]]); w=np.r_[np.ones(len(Pc))*1.0,np.ones(len(S))*4.0,np.ones(len(sl[::2]))*2.0]
A=np.c_[pts[:,0],pts[:,1],np.ones(len(pts))]; coef,*_=np.linalg.lstsq(A,pts[:,2],rcond=None)
res=pts[:,2]-A@coef
rbf=RBFInterpolator(pts[:,:2],res,kernel='thin_plate_spline',smoothing=w*8.0,neighbors=80)
xs=np.arange(X0,X1+1,CELL); ys=np.arange(Y0,Y1+1,CELL); gx,gy=np.meshgrid(xs,ys); q=np.c_[gx.ravel(),gy.ravel()]
z=(coef[0]*q[:,0]+coef[1]*q[:,1]+coef[2]+rbf(q)).reshape(gx.shape)
# stream bed + valley model far from data
stree=cKDTree(sl[:,:2]); dist,ii=stree.query(q); dist=dist.reshape(gx.shape); zs=sl[ii,2].reshape(gx.shape)
bed=np.clip(1-(dist-28)/180,0,1)**2; z=z*(1-bed)+(zs+np.clip(dist-28,0,None)*0.04)*bed
conf=cKDTree(np.vstack([Pc[:,:2],S[:,:2]])).query(q)[0].reshape(gx.shape)
side=np.sign(q[:,1]-sl[ii,1]).reshape(gx.shape)
zval=zs+np.where(side>0,0.20,0.28)*dist/7.1
wv=np.exp(-(conf/700.0)**2); z=z*wv+zval*(1-wv); z=gaussian_filter(z,.8)
print('z',z.min(),z.max(),z.shape)
np.savez('dem2.npz',z=z,x0=X0,y0=Y0,cell=CELL,conf=conf)
# overlay contours on scan
from skimage import measure
v=cv2.imread('pano_full.jpg')
for lv in range(920,1330,5):
    for c in measure.find_contours(z,lv):
        pp=np.c_[X0+c[:,1]*CELL,Y0+c[:,0]*CELL].astype(np.int32)
        cv2.polylines(v,[pp],False,(0,0,255) if lv%25==0 else (255,0,0),3)
cv2.imwrite('overlay.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
cv2.imwrite('overlay_q.jpg',cv2.resize(v[2200:3700,150:2300],None,fx=.7,fy=.7,interpolation=cv2.INTER_AREA))
