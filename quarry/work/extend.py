import sys, pickle, numpy as np, cv2, time
sys.path.insert(0,'.')
from follow import *
from transect import crossings
H,W=ink.shape
def on_known(TR,pt,maxd=12):
    best=None
    for p,l in TR:
        d=np.hypot(p[:,0]-pt[0],p[:,1]-pt[1]).min()
        if d<maxd and (best is None or d<best[0]): best=(d,l)
    return None if best is None else best[1]
def tangent_pca(c):
    xi,yi=int(c[0]),int(c[1]); win=ink[max(yi-14,0):yi+15,max(xi-14,0):xi+15]; wy,wx=np.nonzero(win)
    if len(wx)<10: return None
    ev,evec=np.linalg.eigh(np.cov(np.c_[wx,wy].T)); 
    return evec[:,1] if ev[1]>2.5*ev[0] else None
def process_transect(TR,p0,p1,maxextra=14):
    cr=crossings(p0,p1)
    if len(cr)<2: return 0
    d=(np.array(p1,float)-np.array(p0,float)); d/=np.linalg.norm(d)
    lv=[on_known(TR,c) for c in cr]
    anchors=[i for i,l in enumerate(lv) if l is not None]
    if not anchors: return 0
    # direction of increasing level along transect: from anchors pairs
    sl=0
    if len(anchors)>=2:
        a,b=anchors[0],anchors[-1]
        if b-a<1 or (lv[b]-lv[a])!=5*(b-a)*np.sign(lv[b]-lv[a]) and abs(lv[b]-lv[a])!=5*(b-a):
            # inconsistent anchors -> skip
            if not all(abs(lv[anchors[k+1]]-lv[anchors[k]])==5*(anchors[k+1]-anchors[k]) for k in range(len(anchors)-1)): return 0
        sl=np.sign(lv[b]-lv[a])
    else:
        return 0   # need two anchors to know direction
    gaps=np.diff([c@d for c in cr])
    new=[]
    # fill between / extrapolate
    levels=[None]*len(cr)
    for i in anchors: levels[i]=lv[i]
    # extrapolate outward from first anchor and last anchor
    def walk(start,step):
        i=start; n=0; ref=np.median(np.abs(gaps)) if len(gaps) else 1
        while 0<=i+step<len(cr) and n<maxextra:
            gap=abs((cr[i+step]-cr[i])@d); prev=abs((cr[i]-cr[i-step])@d) if 0<=i-step<len(cr) else gap
            if gap>2.3*prev+8 or gap<0.4*prev-8: break
            levels[i+step]=levels[i]+5*sl*(step); i+=step; n+=1
    walk(anchors[0],-1); walk(anchors[-1],+1)
    for k in range(len(anchors)-1):   # between anchors fill by count
        for i in range(anchors[k]+1,anchors[k+1]): levels[i]=levels[anchors[k]]+5*sl*(i-anchors[k])
    cnt=0
    for c,l in zip(cr,levels):
        if l is None or on_known(TR,c,12) is not None: continue
        t=tangent_pca(c)
        if t is None or abs(t@d)>0.55: continue      # contour must cross the transect near-perpendicular
        cc=centre_on_line(c[0],c[1],t,10)
        p1_=follow(cc[0],cc[1],t,maxlen=5000); p2_=follow(cc[0],cc[1],-t,maxlen=5000)
        pl=np.vstack([p2_[::-1],p1_]) if len(p2_)>1 else p1_
        if len(pl)>15:
            a,b=pl[0],pl[-1]; Lc=np.hypot(*(b-a)); plen=np.sum(np.hypot(*np.diff(pl,axis=0).T))
            if Lc>1:
                nn=np.array([-(b-a)[1],(b-a)[0]])/Lc; dev=np.abs((pl-a)@nn).max()
                if plen>350 and dev<9: continue          # grid-like straight line
            TR.append((pl.astype(np.float32),float(l))); cnt+=1
    return cnt
def families(box):
    x0,y0,x1,y1=box; T=[]
    for x in range(x0,x1,110): T.append(((x,y0),(x,y1)))
    for y in range(y0,y1,110): T.append(((x0,y),(x1,y)))
    for k in range(-(y1-y0),(x1-x0),120):   # 45deg lines
        T.append(((x0+max(0,k),y0+max(0,-k)),(min(x1,x0+max(0,k)+(y1-y0)),min(y1,y0+max(0,-k)+(y1-y0)))))
        T.append(((x0+max(0,k),y1-max(0,-k)),(min(x1,x0+max(0,k)+(y1-y0)),max(y0,y1-max(0,-k)-(y1-y0)))))
    return T
if __name__=='__main__':
    TR=pickle.load(open(sys.argv[1],'rb')); box=tuple(map(int,sys.argv[2].split(','))); rounds=int(sys.argv[3]); t0=time.time()
    for r in range(rounds):
        n=0
        for p0,p1 in families(box):
            n+=process_transect(TR,p0,p1)
            if time.time()-t0>100: break
        print('round',r,'added',n,'total',len(TR),time.time()-t0)
        if n==0 or time.time()-t0>100: break
    pickle.dump(TR,open(sys.argv[4],'wb'))
