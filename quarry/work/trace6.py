import cv2, numpy as np, json, sys, time
sys.path.insert(0,'../tools'); import control_points as C
t0=time.time()
clean=np.load('clean.npy'); ang=np.load('ang.npy'); coh=np.load('coh.npy'); H,W=clean.shape
dem=json.load(open('../data/dem.json')); pz=np.array(dem['z']).reshape(dem['ny'],dem['nx'])
def prior(x,y):
    gx=np.clip((x/2)/12,0,pz.shape[1]-1.01); gy=np.clip(((y+102)/2-500)/12,0,pz.shape[0]-1.01)
    i,j=int(gx),int(gy); fx,fy=gx-i,gy-j
    return (pz[j,i]*(1-fx)+pz[j,i+1]*fx)*(1-fy)+(pz[j+1,i]*(1-fx)+pz[j+1,i+1]*fx)*fy
st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float)
# resample stream every 30px
pts=[];zs=[]
for a,b in zip(st[:-1],st[1:]):
    L=np.hypot(*(b[:2]-a[:2])); n=max(1,int(L/14))
    for t in np.linspace(0,1,n,endpoint=False): pts.append(a[:2]*(1-t)+b[:2]*t); zs.append(a[2]*(1-t)+b[2]*t)
pts=np.array(pts); zs=np.array(zs)
ROI=(180,5300,500,3900)
def field(x,y):
    a=ang[int(np.clip(y/2,0,ang.shape[0]-1)),int(np.clip(x/2,0,ang.shape[1]-1))]; return np.array([np.cos(a),np.sin(a)])
out=[]; paths=[]
for k,(p0,z0) in enumerate(zip(pts,zs)):
    i0=min(k+1,len(pts)-1); tdir=pts[i0]-pts[max(k-1,0)] if k<len(pts)-1 else pts[-1]-pts[-2]; tdir=tdir/ (np.linalg.norm(tdir)+1e-9); nrm=np.array([-tdir[1],tdir[0]])
    for side in (+1,-1):
        d=nrm*side; pos=p0.copy()+d*30; path=[pos.copy()]; last_cross=0; seq=[]; prev_ink=False; run=0
        dist=0
        while dist<4200:
            f=field(*pos)
            if f@d<0: f=-f
            d=0.8*d+0.2*f; d/=np.linalg.norm(d)+1e-9
            pos=pos+d*2.0; dist+=2
            x,y=int(pos[0]),int(pos[1])
            if not(ROI[0]<x<ROI[1] and ROI[2]<y<ROI[3]): break
            v=clean[y,x]
            if v:
                run+=1
            else:
                if run>0:
                    if 3<=run<=26:
                        cx,cy=pos[0]-d[0]*run/2,pos[1]-d[1]*run/2; xi,yi=int(cx),int(cy)
                        win=clean[max(yi-11,0):yi+12,max(xi-11,0):xi+12]; wy,wx=np.nonzero(win)
                        ok=False
                        if len(wx)>=12:
                            cov=np.cov(np.c_[wx,wy].T); ev,evec=np.linalg.eigh(cov); ax=evec[:,1]
                            if ev[1]>2.5*ev[0] and abs(ax@d)<0.5: ok=True
                        if ok: seq.append((cx,cy,dist-run/2))
                    last_cross=dist
                run=0
            path.append(pos.copy())
            if dist-last_cross>420: break
        paths.append(np.array(path))
        # merge near duplicates
        m=[]
        for c in seq:
            if m and c[2]-m[-1][2]<7: continue
            m.append(c)
        if len(m)<2: continue
        # first level from bank elevation, best offset vs prior
        base=5*np.ceil((z0+0.5)/5)
        best=None
        for off in range(-3,4):
            lv=[base+5*(i+off) for i in range(len(m))]
            r=np.median([abs(lv[i]-prior(m[i][0],m[i][1])) for i in range(len(m))])
            if best is None or r<best[0]: best=(r,off)
        r,off=best
        for i,c in enumerate(m): out.append((c[0],c[1],base+5*(i+off),k,side,i))
out=np.array(out); print(len(out),'crossings',time.time()-t0)
np.save('cross_raw.npy',out)
# outlier removal by neighbours from other streamlines
from scipy.spatial import cKDTree
P=out.copy()
for it in range(4):
    tr=cKDTree(P[:,:2]); keep=np.ones(len(P),bool)
    for i in range(len(P)):
        idx=tr.query_ball_point(P[i,:2],110)
        idx=[j for j in idx if (P[j,3]!=P[i,3] or P[j,4]!=P[i,4])]
        if len(idx)<6: continue
        Q=P[idx]; A=np.c_[Q[:,0]-P[i,0],Q[:,1]-P[i,1],np.ones(len(Q))]
        w=1/(1+np.hypot(Q[:,0]-P[i,0],Q[:,1]-P[i,1])/60)
        try: c,*_=np.linalg.lstsq(A*w[:,None],Q[:,2]*w,rcond=None)
        except: continue
        if abs(c[2]-P[i,2])>7.6: keep[i]=False
    print(it,keep.sum(),'/',len(P)); P=P[keep]
np.save('cross_ok.npy',P)
import pickle; pickle.dump(paths,open('paths.pkl','wb'))
