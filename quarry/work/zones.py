import sys, pickle, numpy as np, cv2
sys.path.insert(0,'.')
from follow import *
from transect import crossings, trace_contours
TR=[]   # list of (polyline, level)
def add_polys(polys,levels):
    for p,l in zip(polys,levels):
        if p is not None and len(p)>15: TR.append((p.astype(np.float32),float(l)))
def nearest_level(pt,maxd=14):
    best=None
    for p,l in TR:
        d=np.hypot(p[:,0]-pt[0],p[:,1]-pt[1]).min()
        if d<maxd and (best is None or d<best[0]): best=(d,l)
    return None if best is None else best[1]
# Zone A: x=560 transect, contours #10..#18 -> 1045..1085
cr=crossings((560,3560),(560,2620)); A=[cr[i] for i in range(10,19)]; levA=[1045+5*k for k in range(9)]
add_polys(trace_contours(A,None),levA)
print('zone A',len(TR))
pickle.dump(TR,open('TR_A.pkl','wb'))
v=cv2.imread('pano_full.jpg')
for p,l in TR:
    cv2.polylines(v,[p.astype(np.int32)],False,(0,0,255),4); m=p[len(p)//2]; cv2.putText(v,str(int(l)),(int(m[0]),int(m[1])-8),cv2.FONT_HERSHEY_SIMPLEX,1.3,(255,0,0),3)
cv2.imwrite('zA.jpg',cv2.resize(v[2300:3700,150:3200],None,fx=.55,fy=.55,interpolation=cv2.INTER_AREA))
