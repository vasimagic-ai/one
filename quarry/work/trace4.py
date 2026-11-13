import cv2, numpy as np, time
t0=time.time()
ink=cv2.imread('ink.png',0)>0; H,W=ink.shape
h2=cv2.resize(ink.astype(np.uint8)*255,None,fx=.5,fy=.5,interpolation=cv2.INTER_AREA)>100   # half res
h2=h2.astype(np.uint8)
K=151   # half-res px => 300 px full
acc=np.zeros_like(h2)
for ang in np.arange(0,180,1.0):
    k=np.zeros((K,K),np.uint8); c=K//2; dx,dy=np.cos(np.deg2rad(ang)),np.sin(np.deg2rad(ang))
    cv2.line(k,(int(c-dx*c),int(c-dy*c)),(int(c+dx*c),int(c+dy*c)),1,3)
    # opening tolerant to 1px wobble: erode with line, dilate back
    e=cv2.erode(h2,k); d=cv2.dilate(e,k); acc|=d
print(time.time()-t0)
big=cv2.resize(acc*255,(W,H),interpolation=cv2.INTER_NEAREST)>0
np.save('straight.npy',big)
cv2.imwrite('straight.png',cv2.resize(big[500:3400,0:5200].astype(np.uint8)*255,None,fx=.35,fy=.35))
rest=ink&~cv2.dilate(big.astype(np.uint8),np.ones((9,9))).astype(bool)
cv2.imwrite('rest.png',cv2.resize(rest[500:3400,0:3600].astype(np.uint8)*255,None,fx=.5,fy=.5))
