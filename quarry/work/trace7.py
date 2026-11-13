import cv2, numpy as np, time
from skimage.morphology import skeletonize
from scipy.ndimage import convolve
t0=time.time()
clean=np.load('clean.npy'); P=np.load('cross_ok.npy')
x0,y0,x1,y1=150,500,5300,3900
c=clean[y0:y1,x0:x1]
c=cv2.morphologyEx(c.astype(np.uint8),cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))>0
sk=skeletonize(c); print('skel',sk.sum(),time.time()-t0)
nb=convolve(sk.astype(np.uint8),np.ones((3,3),np.uint8),mode='constant')-1
junc=sk&(nb>=3)
br=sk&~cv2.dilate(junc.astype(np.uint8),np.ones((5,5))).astype(bool)
n,lab=cv2.connectedComponents(br.astype(np.uint8),connectivity=8); print('branches',n,time.time()-t0)
sizes=np.bincount(lab.ravel()); 
# label each branch from crossings
votes={}
for x,y,z,*_ in P:
    X=int(x-x0); Y=int(y-y0)
    win=lab[max(Y-5,0):Y+6,max(X-5,0):X+6]; ids=np.unique(win[win>0])
    for i in ids: votes.setdefault(int(i),[]).append(z)
level={}; bad=0
for i,zs in votes.items():
    if sizes[i]<25: continue
    zs=np.array(zs)
    if zs.max()-zs.min()<1: level[i]=zs[0]
    elif np.sum(zs==np.bincount(zs.astype(int)).argmax())>=0.8*len(zs) and len(zs)>=3: level[i]=float(np.bincount(zs.astype(int)).argmax())
    else: bad+=1
print('labelled branches',len(level),'conflicting',bad)
ys,xs=np.nonzero(br)
ids=lab[ys,xs]
keep=np.array([i in level for i in ids])
pts=np.c_[xs[keep]+x0,ys[keep]+y0,[level[i] for i in ids[keep]],ids[keep]]
# subsample every ~5th pixel
pts=pts[::5]; print('points',len(pts))
np.save('contour_pts.npy',pts)
v=cv2.imread('pano_full.jpg')
for x,y,z,_ in pts[::2]:
    col=cv2.applyColorMap(np.uint8([[np.clip((z-950)/280*255,0,255)]]),cv2.COLORMAP_JET)[0,0].tolist(); cv2.circle(v,(int(x),int(y)),3,col,-1)
cv2.imwrite('contour_view.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
