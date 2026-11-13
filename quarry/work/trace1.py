import cv2, numpy as np
p=cv2.imread('pano_full.jpg'); hsv=cv2.cvtColor(p,cv2.COLOR_BGR2HSV); g=cv2.cvtColor(p,cv2.COLOR_BGR2GRAY)
gs=cv2.GaussianBlur(g,(0,0),1.2)
bg=cv2.dilate(gs,np.ones((31,31)))      # local paper level
bg=cv2.GaussianBlur(bg,(0,0),15)
d=bg.astype(np.int16)-gs.astype(np.int16)
ink=(d>38).astype(np.uint8)*255
ink[:, :180]=0; ink[:300]=0
cv2.imwrite('ink.png',ink)
cv2.imwrite('ink_crop.png',ink[2300:3000,900:1900])
