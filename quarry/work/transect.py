import sys, numpy as np, cv2, pickle
sys.path.insert(0,'.')
from follow import *
def crossings(p0,p1,minrun=3,maxrun=22):
    p0=np.array(p0,float);p1=np.array(p1,float); L=int(np.hypot(*(p1-p0))); out=[]; run=0
    d=(p1-p0)/L
    for i in range(L+1):
        x,y=p0+d*i; xi,yi=int(x),int(y)
        if ink[yi,xi]: run+=1
        else:
            if minrun<=run<=maxrun: out.append(p0+d*(i-run/2))
            run=0
    return out
def trace_contours(cr,tdir):
    polys=[]
    for c in cr:
        # tangent from local PCA
        xi,yi=int(c[0]),int(c[1]); win=ink[yi-14:yi+15,xi-14:xi+15]; wy,wx=np.nonzero(win)
        if len(wx)<10: polys.append(None); continue
        ev,evec=np.linalg.eigh(np.cov(np.c_[wx,wy].T)); t=evec[:,1]
        cc=centre_on_line(c[0],c[1],t,10)
        p1=follow(cc[0],cc[1],t,maxlen=5000); p2=follow(cc[0],cc[1],-t,maxlen=5000)
        polys.append(np.vstack([p2[::-1],p1]) if len(p2)>1 else p1)
    return polys
def render(name,polys,levels,box,scale=.6,pts=None,transect=None):
    v=cv2.imread('pano_full.jpg'); x0,y0,x1,y1=box
    for p,l in zip(polys,levels):
        if p is None: continue
        cv2.polylines(v,[p.astype(np.int32)],False,(0,0,255),3)
        m=p[len(p)//2]; cv2.putText(v,str(int(l)),(int(m[0]),int(m[1])-6),cv2.FONT_HERSHEY_SIMPLEX,1.1,(255,0,0),3)
    if transect is not None: cv2.line(v,tuple(np.int32(transect[0])),tuple(np.int32(transect[1])),(0,200,0),3)
    cv2.imwrite(name,cv2.resize(v[y0:y1,x0:x1],None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA))
if __name__=='__main__':
    T=((560,3560),(560,2620)); cr=crossings(*T); print(len(cr),[tuple(map(int,c)) for c in cr])
