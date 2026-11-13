import json,numpy as np,pickle,cv2,sys
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter, map_coordinates
from skimage import measure
dem=json.load(open('../data/dem.json')); pz=np.array(dem['z']).reshape(dem['ny'],dem['nx'])
X0,X1,Y0,Y1,CELL=150,5300,500,3900,24
xs=np.arange(X0,X1+1,CELL); ys=np.arange(Y0,Y1+1,CELL); gx,gy=np.meshgrid(xs,ys)
# prior on the new grid (bilinear from old DEM; old coords = (x/2, (y+102)/2))
ox=(gx/2-dem['x0'])/dem['cell']; oy=((gy+102)/2-dem['y0'])/dem['cell']
prior=map_coordinates(pz,[np.clip(oy,0,pz.shape[0]-1.01),np.clip(ox,0,pz.shape[1]-1.01)],order=1)
def prior_at(x,y):
    return map_coordinates(prior,[np.clip((y-Y0)/CELL,0,prior.shape[0]-1.01),np.clip((x-X0)/CELL,0,prior.shape[1]-1.01)],order=1)
P=np.load('cross_raw.npy')[:,:3]
TR=pickle.load(open('TR_A.pkl','rb'))
V=np.vstack([np.c_[p[::12],np.full(len(p[::12]),l)] for p,l in TR])      # verified contour points (zone A)
r=P[:,2]-prior_at(P[:,0],P[:,1]); keep=np.abs(r)<=6.0
print('crossings',len(P),'consistent with prior',keep.sum())
C=np.vstack([P[keep],V])
# thin: one point per 14px cell per level
key={}
for x,y,z in C: key.setdefault((int(x//14),int(y//14),int(z)),(x,y,z))
C=np.array(list(key.values())); print('constraint pts',len(C))
res=C[:,2]-prior_at(C[:,0],C[:,1])
# robust local residual field: TPS with smoothing, limited neighbours
rb=RBFInterpolator(C[:,:2],res,kernel='thin_plate_spline',smoothing=30.0,neighbors=50)
q=np.c_[gx.ravel(),gy.ravel()]; R=rb(q).reshape(gx.shape)
# fade correction away from constraints
dist=cKDTree(C[:,:2]).query(q)[0].reshape(gx.shape); fade=np.exp(-(dist/180.0)**2)
R=np.clip(R,-8,8)*fade
Z=gaussian_filter(prior+R,0.6)
np.savez('dem4.npz',z=Z,prior=prior,x0=X0,y0=Y0,cell=CELL)
# evaluate on verified points
for name,Zg in (('prior',prior),('corrected',Z)):
    zz=map_coordinates(Zg,[np.clip((V[:,1]-Y0)/CELL,0,Zg.shape[0]-1.01),np.clip((V[:,0]-X0)/CELL,0,Zg.shape[1]-1.01)],order=1)
    e=zz-V[:,2]; print(name,'vs verified contours: MAE',np.abs(e).mean(),'p90',np.percentile(np.abs(e),90))
v=cv2.imread('pano_full.jpg')
for lv in range(920,1330,5):
    for c in measure.find_contours(Z,lv):
        pp=np.c_[X0+c[:,1]*CELL,Y0+c[:,0]*CELL].astype(np.int32)
        cv2.polylines(v,[pp],False,(0,0,255) if lv%25==0 else (255,0,0),3)
cv2.imwrite('overlay.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
cv2.imwrite('overlay_q.jpg',cv2.resize(v[2100:3700,150:2600],None,fx=.65,fy=.65,interpolation=cv2.INTER_AREA))
