import sys, pickle, time, numpy as np, cv2
sys.path.insert(0,'.')
from follow import *
t0=time.time()
H,W=ink.shape
traced=np.zeros((H,W),np.uint8)
polys=[]
def tangent(x,y):
    xi,yi=int(x),int(y); win=ink[max(yi-14,0):yi+15,max(xi-14,0):xi+15]; wy,wx=np.nonzero(win)
    if len(wx)<10: return None
    cov=np.cov(np.c_[wx,wy].T); ev,evec=np.linalg.eigh(cov)
    if ev[1]<3*ev[0]: return None
    return evec[:,1]
ROI=(180,5300,600,3900)
transects=[]
for x in range(200,5300,110): transects.append(((x,ROI[2]),(x,ROI[3])))
for y in range(650,3900,110): transects.append(((ROI[0],y),(ROI[1],y)))
# diagonals
for k in range(-3500,5300,140): transects.append(((200+max(0,-k),600+max(0,k)),(min(5300,200+ (3900-600-max(0,k))+max(0,-k)),3900)))
nseed=0
for (a,b) in transects:
    L=int(np.hypot(b[0]-a[0],b[1]-a[1])); xs=np.linspace(a[0],b[0],L); ys=np.linspace(a[1],b[1],L)
    run=0
    for i in range(L):
        xi,yi=int(xs[i]),int(ys[i])
        if not(0<=xi<W and 0<=yi<H): continue
        if ink[yi,xi]: run+=1
        else:
            if 3<=run<=22:
                cx=xs[i-run//2-1]; cy=ys[i-run//2-1]
                if traced[int(cy),int(cx)]==0:
                    t=tangent(cx,cy)
                    if t is not None:
                        nseed+=1
                        c=centre_on_line(cx,cy,t,10)
                        p1=follow(c[0],c[1],t,maxlen=5000); p2=follow(c[0],c[1],-t,maxlen=5000)
                        pts=np.vstack([p2[::-1],p1]) if len(p2)>1 else p1
                        if len(pts)>10:
                            cv2.polylines(traced,[pts.astype(np.int32)],False,1,9)
                            polys.append(pts.astype(np.float32))
            run=0
    if time.time()-t0>105: print('time limit at transect',a,b); break
print(len(polys),'polylines',nseed,'seeds',time.time()-t0)
pickle.dump(polys,open('polys.pkl','wb'))
