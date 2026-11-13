import cv2, numpy as np, time
from skimage.morphology import skeletonize
t0=time.time()
ink=cv2.imread('ink.png',0); H,W=ink.shape
# work at half scale for line finding
small=cv2.resize(ink,None,fx=.5,fy=.5,interpolation=cv2.INTER_AREA)>100
sk=skeletonize(small).astype(np.uint8)*255
print('skel',(sk>0).sum(),time.time()-t0)
mask=np.zeros((H//2,W//2),np.uint8); rem=sk.copy(); out=[]
for it in range(40):
    L=cv2.HoughLines(rem,1,np.pi/1440,550)   # >=550 half-scale px = 1100 px
    if L is None: break
    rho,t=L[0][0]
    ys,xs=np.nonzero(rem); dist=np.abs(xs*np.cos(t)+ys*np.sin(t)-rho); inl=dist<2.2
    u=-xs[inl]*np.sin(t)+ys[inl]*np.cos(t)
    if inl.sum()<500: break
    p0=np.array([rho*np.cos(t),rho*np.sin(t)]); d=np.array([-np.sin(t),np.cos(t)])
    # keep only the dense stretch: segment extents from inliers percentile
    a=p0+d*(np.percentile(u,0.5)-3); b=p0+d*(np.percentile(u,99.5)+3)
    cv2.line(mask,tuple(np.int32(a)),tuple(np.int32(b)),255,7)
    rem[ys[inl],xs[inl]]=0
    out.append((float(rho),float(t),int(inl.sum()),float(u.min()),float(u.max())))
print(len(out),time.time()-t0)
for o in out: print([round(v,1) for v in o])
big=cv2.resize(mask,(W,H),interpolation=cv2.INTER_NEAREST)
np.save('linemask.npy',big>0)
cv2.imwrite('linemask.png',cv2.resize(big[500:3400,0:5200],None,fx=.35,fy=.35))
