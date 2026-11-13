import numpy as np, sys, cv2
from scipy.interpolate import griddata
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
from skimage import measure
sys.path.insert(0,'../tools'); import control_points as C
P=np.load('cross_ok.npy')   # x,y,z,k,side,i
# group by streamline
dense=[]
order=np.lexsort((P[:,5],P[:,4],P[:,3]))
P=P[order]
for key in set(zip(P[:,3],P[:,4])):
    m=(P[:,3]==key[0])&(P[:,4]==key[1]); Q=P[m]
    for a,b in zip(Q[:-1],Q[1:]):
        gap=np.hypot(b[0]-a[0],b[1]-a[1])
        if gap>110 or abs(b[2]-a[2])>5*(b[5]-a[5])+0.1: continue
        n=max(2,int(gap/6))
        for t in np.linspace(0,1,n): dense.append((a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t))
D=np.array(dense); print('dense samples',len(D))
np.save('dense.npy',D)
st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float)
X0,X1,Y0,Y1,CELL=150,5300,500,3900,24
xs=np.arange(X0,X1+1,CELL); ys=np.arange(Y0,Y1+1,CELL); gx,gy=np.meshgrid(xs,ys)
zl=griddata(D[:,:2],D[:,2],(gx,gy),method='linear')
cov=cKDTree(D[:,:2]).query(np.c_[gx.ravel(),gy.ravel()])[0].reshape(gx.shape)
zl[cov>70]=np.nan
np.savez('dem3_raw.npz',z=zl,cov=cov,x0=X0,y0=Y0,cell=CELL)
v=cv2.imread('pano_full.jpg')
zz=np.where(np.isnan(zl),0,zl)
for lv in range(920,1330,5):
    for c in measure.find_contours(np.where(np.isnan(zl),-9999,zl),lv):
        pp=np.c_[X0+c[:,1]*CELL,Y0+c[:,0]*CELL].astype(np.int32)
        cv2.polylines(v,[pp],False,(0,0,255) if lv%25==0 else (255,0,0),3)
cv2.imwrite('overlay.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
cv2.imwrite('overlay_q.jpg',cv2.resize(v[2200:3700,150:2300],None,fx=.7,fy=.7,interpolation=cv2.INTER_AREA))
cv2.imwrite('overlay_f.jpg',cv2.resize(v[900:2400,2600:4600],None,fx=.6,fy=.6,interpolation=cv2.INTER_AREA))
