import cv2, numpy as np, json, time
t0=time.time()
ink=cv2.imread('ink.png',0)>0; H,W=ink.shape
lm=np.load('linemask.npy'); p=cv2.imread('pano_full.jpg'); hsv=cv2.cvtColor(p,cv2.COLOR_BGR2HSV)
col=((hsv[...,1]>85)&(hsv[...,2]>70)).astype(np.uint8); col=cv2.dilate(col,np.ones((9,9)))>0
clean=ink&~cv2.dilate(lm.astype(np.uint8),np.ones((5,5))).astype(bool)&~col
np.save('clean.npy',clean); cv2.imwrite('clean.png',cv2.resize(clean[600:3800,0:4600].astype(np.uint8)*255,None,fx=.4,fy=.4))
# orientation field (gradient direction = perpendicular to contour) at half res
s=cv2.resize(clean.astype(np.float32),None,fx=.5,fy=.5,interpolation=cv2.INTER_AREA)
b=cv2.GaussianBlur(s,(0,0),5)
gx=cv2.Sobel(b,cv2.CV_32F,1,0,ksize=3); gy=cv2.Sobel(b,cv2.CV_32F,0,1,ksize=3)
Jxx=cv2.GaussianBlur(gx*gx,(0,0),22); Jyy=cv2.GaussianBlur(gy*gy,(0,0),22); Jxy=cv2.GaussianBlur(gx*gy,(0,0),22)
ang=0.5*np.arctan2(2*Jxy,Jxx-Jyy)        # direction of max intensity change
coh=np.sqrt((Jxx-Jyy)**2+4*Jxy**2)/(Jxx+Jyy+1e-9)
np.save('ang.npy',ang); np.save('coh.npy',coh)
print('done',time.time()-t0, coh.mean())
