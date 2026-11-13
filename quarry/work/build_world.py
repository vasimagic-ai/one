import numpy as np, sys, pickle, json, base64, cv2
from pyproj import Transformer
from scipy.interpolate import RegularGridInterpolator, RBFInterpolator
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
sys.path.insert(0,'../tools'); import control_points as C
d=np.load('srtm.npz'); Zs=d['z']; lats=d['lats']; lons=d['lons']
par=np.load('align_par.npy'); N0,E0,th,K=par; c,s=np.cos(th),np.sin(th)
inv=Transformer.from_crs(3844,4326,always_xy=True)
f=RegularGridInterpolator((lats,lons),Zs,method='cubic',bounds_error=False,fill_value=None)
X0,X1,Y0,Y1=150,4350,1000,4350
CELLPX=26                                    # ~3.4 m
xs=np.arange(X0,X1,CELLPX)+CELLPX/2; ys=np.arange(Y0,Y1,CELLPX)+CELLPX/2
gx,gy=np.meshgrid(xs,ys); nx,ny=len(xs),len(ys)
def sample(px,py):
    u=px*c+py*s; v=-px*s+py*c; N=N0+K*u; E=E0+K*v; lon,lat=inv.transform(E,N); return f(np.c_[lat,lon])
base=sample(gx.ravel(),gy.ravel()).reshape(gx.shape)-7.0
base=gaussian_filter(base,1.0)
# verified contour points (zone C2)
TR=pickle.load(open('TR_A.pkl','rb'))
V=np.vstack([np.c_[p[::10],np.full(len(p[::10]),l)] for p,l in TR])
bv=sample(V[:,0],V[:,1])-7.0
res=V[:,2]-gaussian_filter(base,0)[np.clip(((V[:,1]-Y0)/CELLPX).astype(int),0,ny-1),np.clip(((V[:,0]-X0)/CELLPX).astype(int),0,nx-1)]
print('verified pts',len(V),'residual SRTM-corrected: median',np.median(res),'p10/p90',np.percentile(res,[10,90]))
rb=RBFInterpolator(V[:,:2],res,kernel='thin_plate_spline',smoothing=200.0,neighbors=40)
q=np.c_[gx.ravel(),gy.ravel()]; R=rb(q).reshape(gx.shape)
dist=cKDTree(V[:,:2]).query(q)[0].reshape(gx.shape); fade=np.exp(-(dist/260.0)**2)
Z=base+np.clip(R,-60,60)*fade
# stream bed from plan profile
st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float); sl=[]
for a,b in zip(st[:-1],st[1:]):
    for t in np.linspace(0,1,12,endpoint=False): sl.append(a*(1-t)+b*t)
sl=np.array(sl); sd,si=cKDTree(sl[:,:2]).query(q); sd=sd.reshape(gx.shape); sz=sl[si,2].reshape(gx.shape)
bed=np.clip(1-(sd-30)/160,0,1)**2; Z=Z*(1-bed)+(sz+np.clip(sd-30,0,None)*0.035)*bed
Z=gaussian_filter(Z,0.7)
print('Z',Z.min(),Z.max(),Z.shape)
# verify against verified contours
zz=Z[np.clip(((V[:,1]-Y0)/CELLPX).astype(int),0,ny-1),np.clip(((V[:,0]-X0)/CELLPX).astype(int),0,nx-1)]
print('MAE vs verified contours',np.abs(zz-V[:,2]).mean(),'p90',np.percentile(np.abs(zz-V[:,2]),90))
# scan texture crop
p=cv2.imread('pano_full.jpg'); crop=p[Y0:Y1,X0:X1]; w=2048; h=round(w*crop.shape[0]/crop.shape[1]); crop=cv2.resize(crop,(w,h),interpolation=cv2.INTER_AREA)
crop=cv2.convertScaleAbs(crop,alpha=1.12,beta=-12)
cv2.imwrite('world_scan.jpg',crop,[cv2.IMWRITE_JPEG_QUALITY,78])
sp=[(2*x,2*y-102) for x,y,z in C.SPOTS if False]
W={'nx':nx,'ny':ny,'x0':X0,'y0':Y0,'cellpx':CELLPX,'k':float(K),'z':np.round(Z,1).ravel().tolist(),
   'stream':[[float(a),float(b),float(z)] for a,b,z in st],'tw':w,'th':h}
json.dump(W,open('world.json','w'),separators=(',',':'))
b64=base64.b64encode(open('world_scan.jpg','rb').read()).decode()
open('world_scan.b64','w').write(b64); print('json KB',len(json.dumps(W))//1000,'scan KB',len(b64)//1000)
# preview contours of Z over the scan
from skimage import measure
v=p.copy()
for lv in range(940,1130,5):
    for cc in measure.find_contours(Z,lv):
        pp=np.c_[X0+cc[:,1]*CELLPX+CELLPX/2,Y0+cc[:,0]*CELLPX+CELLPX/2].astype(np.int32)
        cv2.polylines(v,[pp],False,(0,0,255) if lv%25==0 else (255,0,0),3)
cv2.imwrite('world_overlay.jpg',cv2.resize(v[Y0:Y1,X0:X1],None,fx=.4,fy=.4,interpolation=cv2.INTER_AREA))
