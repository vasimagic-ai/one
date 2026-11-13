import numpy as np, cv2, pickle
from scipy.spatial import cKDTree
P=np.load('cross_raw.npy'); n=len(P)
par=list(range(n))
def find(a):
    while par[a]!=a: par[a]=par[par[a]]; a=par[a]
    return a
tr=cKDTree(P[:,:2]); E=0
for a in range(n):
    for b in tr.query_ball_point(P[a,:2],110):
        if b<=a: continue
        if P[a,4]!=P[b,4] or P[a,3]==P[b,3] or abs(P[a,3]-P[b,3])>3: continue
        d=P[a,6:8]+P[b,6:8]; d/=np.linalg.norm(d)+1e-9
        dl=P[b,:2]-P[a,:2]; dpar=abs(dl@d); sp=min(P[a,8],P[b,8])
        if dpar<0.33*sp and abs(P[a,2]-P[b,2])<=10:
            par[find(a)]=find(b); E+=1
print('edges',E)
comp={}
for i in range(n): comp.setdefault(find(i),[]).append(i)
good=[]; drop=0
for r,ids in comp.items():
    if len(ids)<4: continue
    zs=P[ids,2]; vals,cnt=np.unique(zs,return_counts=True); m=vals[cnt.argmax()]
    if cnt.max()<0.7*len(ids): drop+=1; continue
    good.append((m,ids))
print('chains',len(good),'dropped',drop,'pts',sum(len(g[1]) for g in good))
pickle.dump(good,open('chains.pkl','wb'))
v=cv2.imread('pano_full.jpg')
for m,ids in good:
    Q=P[ids]; t=np.array([-Q[:,7].mean(),Q[:,6].mean()]); order=np.argsort(Q[:,:2]@t); pp=Q[order,:2].astype(np.int32)
    col=cv2.applyColorMap(np.uint8([[np.clip((m-950)/280*255,0,255)]]),cv2.COLORMAP_JET)[0,0].tolist()
    cv2.polylines(v,[pp],False,col,4)
cv2.imwrite('chains.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
