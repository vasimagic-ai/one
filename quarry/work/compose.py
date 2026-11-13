import cv2, numpy as np
from PIL import Image, ImageOps
U='/root/.claude/uploads/38991a8c-e48a-522a-ab95-2bcea220e640/'
files=['2281ba16','54b65faa','8911f4e7']
full=[cv2.cvtColor(np.array(ImageOps.exif_transpose(Image.open(U+f+'-image.jpg')).convert('RGB')),cv2.COLOR_RGB2BGR) for f in files]
Hs=np.load('Hs.npy'); W,Hh=8246,4656
best=np.full((Hh,W),-1,np.float32); out=np.full((Hh,W,3),255,np.uint8); src=np.zeros((Hh,W),np.uint8)
for k,(im,M) in enumerate(zip(full,Hs)):
    m=np.ones(im.shape[:2],np.uint8)*255; m[:40]=0; m[-40:]=0; m[:,:40]=0; m[:,-40:]=0
    d=cv2.distanceTransform(m,cv2.DIST_L2,3)
    wd=cv2.warpPerspective(d,M,(W,Hh)); wi=cv2.warpPerspective(im,M,(W,Hh))
    sel=wd>best; out[sel]=wi[sel]; best[sel]=wd[sel]; src[sel]=k
cv2.imwrite('pano_full.jpg',out,[cv2.IMWRITE_JPEG_QUALITY,92]); cv2.imwrite('src.png',src); cv2.imwrite('pano_small.jpg',cv2.resize(out,None,fx=.25,fy=.25,interpolation=cv2.INTER_AREA))
