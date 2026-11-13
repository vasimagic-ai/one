import cv2, numpy as np
from skimage.morphology import skeletonize
p=cv2.imread('pano_full.jpg'); hsv=cv2.cvtColor(p,cv2.COLOR_BGR2HSV)
ink=cv2.imread('ink.png',0)
H,W=ink.shape
# 1. coloured lines (pink/teal/blue): saturation vs local paper
sat=hsv[...,1].astype(np.int16)
print('sat pct',np.percentile(sat[1000:3000,200:3500],[50,90,99,99.9]))
col=(sat>85)&(hsv[...,2]>70)
col=cv2.dilate(col.astype(np.uint8),np.ones((9,9)))
cv2.imwrite('colmask.png',cv2.resize(col[500:3400,0:3600]*255,None,fx=.4,fy=.4))
# 2. long straight lines via Hough on skeleton
sk=skeletonize(ink>0).astype(np.uint8)*255
lines=cv2.HoughLinesP(sk,1,np.pi/720,threshold=250,minLineLength=900,maxLineGap=25)
lm=np.zeros_like(ink)
n=0
if lines is not None:
    for l in lines.reshape(-1,4):
        x1,y1,x2,y2=l
        # straightness check: fraction of skeleton pixels along the segment
        L=int(np.hypot(x2-x1,y2-y1)); xs=np.linspace(x1,x2,L).astype(int); ys=np.linspace(y1,y2,L).astype(int)
        frac=(cv2.dilate(sk,np.ones((5,5)))[ys.clip(0,H-1),xs.clip(0,W-1)]>0).mean()
        if frac>0.85: cv2.line(lm,(x1,y1),(x2,y2),255,11); n+=1
print('lines',n)
cv2.imwrite('linemask.png',cv2.resize(lm[500:3400,0:3600],None,fx=.4,fy=.4))
np.save('lm.npy',lm>0); np.save('col.npy',col>0)
