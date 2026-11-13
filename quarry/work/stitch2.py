import cv2, numpy as np
from PIL import Image, ImageOps
U='/root/.claude/uploads/38991a8c-e48a-522a-ab95-2bcea220e640/'
files=['2281ba16','54b65faa','8911f4e7']
full=[cv2.cvtColor(np.array(ImageOps.exif_transpose(Image.open(U+f+'-image.jpg')).convert('RGB')),cv2.COLOR_RGB2BGR) for f in files]
print([i.shape for i in full])
half=[cv2.resize(i,None,fx=.5,fy=.5,interpolation=cv2.INTER_AREA) for i in full]
g=[cv2.cvtColor(i,cv2.COLOR_BGR2GRAY) for i in half]
sift=cv2.SIFT_create(8000)
h,w=g[0].shape
def H(a,b,ma,mb,affine):
    ka,da=sift.detectAndCompute(g[a],ma); kb,db=sift.detectAndCompute(g[b],mb)
    m=cv2.BFMatcher().knnMatch(db,da,k=2); good=[x for x,y in m if x.distance<.75*y.distance]
    s=np.float32([kb[x.queryIdx].pt for x in good]); d=np.float32([ka[x.trainIdx].pt for x in good])
    if affine:
        M,mask=cv2.estimateAffinePartial2D(s,d,method=cv2.RANSAC,ransacReprojThreshold=6); M=np.vstack([M,[0,0,1]])
    else: M,mask=cv2.findHomography(s,d,cv2.RANSAC,4.0)
    print(a,b,len(good),int(mask.sum())); return M
ma=np.zeros((h,w),np.uint8); ma[:,int(w*.6):]=255; mb=np.zeros((h,w),np.uint8); mb[:,:int(w*.47)]=255
h12=H(0,1,ma,mb,False); h23=H(1,2,ma,mb,True)
S=np.diag([2,2,1.]); Si=np.linalg.inv(S)
Hs=[np.eye(3),S@h12@Si,S@h12@h23@Si]
hh,ww=full[0].shape[:2]
cs=[cv2.perspectiveTransform(np.float32([[0,0],[ww,0],[ww,hh],[0,hh]]).reshape(-1,1,2),M).reshape(-1,2) for M in Hs]
a=np.vstack(cs); mn=a.min(0); mx=a.max(0); print(mn,mx)
T=np.array([[1,0,-mn[0]],[0,1,-mn[1]],[0,0,1.]]); W,Hh=int(mx[0]-mn[0]),int(mx[1]-mn[1]); print(W,Hh)
acc=np.zeros((Hh,W,3),np.float32); cnt=np.zeros((Hh,W),np.float32)
for im,M in zip(full,Hs):
    wimg=cv2.warpPerspective(im,T@M,(W,Hh)).astype(np.float32)
    m=cv2.warpPerspective(np.ones(im.shape[:2],np.float32),T@M,(W,Hh)); m=cv2.erode(m,np.ones((9,9))); 
    # hard seam: keep weights sharp so overlap isn't ghosted -> use distance from image centre
    m=cv2.GaussianBlur(m,(0,0),6)
    acc+=wimg*m[...,None]; cnt+=m
pano=(acc/np.maximum(cnt,1e-3)[...,None]).astype(np.uint8)
cv2.imwrite('pano_full.jpg',pano,[cv2.IMWRITE_JPEG_QUALITY,92]); np.save('Hs.npy',np.array([T@M for M in Hs])); print(pano.shape)
cv2.imwrite('pano_small.jpg',cv2.resize(pano,None,fx=.25,fy=.25,interpolation=cv2.INTER_AREA))
