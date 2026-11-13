import pickle, numpy as np, cv2, sys, time
import scipy.sparse as sp
from scipy.sparse.linalg import lsqr
sys.path.insert(0,'../tools'); import control_points as C
t0=time.time()
polys=pickle.load(open('polys.pkl','rb'))
def straightness(p):
    a,b=p[0],p[-1]; L=np.hypot(*(b-a)); 
    if L<1: return 0,0
    n=np.array([-(b-a)[1],(b-a)[0]])/L; dev=np.abs((p-a)@n).max(); return L,dev
keep=[]
for p in polys:
    L,dev=straightness(p)
    plen=np.sum(np.hypot(*np.diff(p,axis=0).T))
    if plen<100: continue
    if plen>450 and dev<7: continue          # grid / block lines
    keep.append(p)
print('polys',len(polys),'->',len(keep))
H,W=4656,8246
idr=np.full((H,W),-1,np.int16)
for i,p in enumerate(keep): cv2.polylines(idr,[p.astype(np.int32)],False,int(i),3)
st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float)
sl=[]
for a,b in zip(st[:-1],st[1:]):
    for t in np.linspace(0,1,40,endpoint=False): sl.append(a*(1-t)+b*t)
sl=np.array(sl)
from scipy.spatial import cKDTree
stree=cKDTree(sl[:,:2])
def tangent_at(p,k):
    a=p[max(k-6,0)]; b=p[min(k+6,len(p)-1)]; d=b-a; return d/(np.linalg.norm(d)+1e-9)
edges={}
for i,p in enumerate(keep):
    for k in range(8,len(p)-8,7):
        t=tangent_at(p,k); n=np.array([-t[1],t[0]])
        for sgn in (1,-1):
            for r in range(6,90,2):
                x,y=p[k]+n*sgn*r; xi,yi=int(x),int(y)
                if not(0<=xi<W and 0<=yi<H): break
                j=idr[yi,xi]
                if j>=0 and j!=i:
                    # parallelism check
                    q=keep[j]; kk=np.argmin(np.hypot(q[:,0]-x,q[:,1]-y)); tq=tangent_at(q,kk)
                    if abs(tq@t)>0.93:
                        d1=stree.query(p[k])[0]; d2=stree.query([x,y])[0]
                        s=1 if d2>d1 else -1      # other is higher if farther from stream
                        key=(i,j) if i<j else (j,i); sg=s if i<j else -s   # c_j - c_i = 5*sg for key (i,j)
                        e=edges.setdefault(key,[0,0,[]]); e[0]+=sg; e[1]+=1; e[2].append(r)
                    break
print('edge pairs',len(edges),time.time()-t0)
# unknown levels
n=len(keep); rows=[];cols=[];vals=[];b=[];w=[]
r_=0
for (i,j),(sgsum,cnt,rs) in edges.items():
    if cnt<2: continue
    s=np.sign(sgsum) if sgsum!=0 else 0
    if s==0: continue
    conf=abs(sgsum)/cnt
    if conf<0.7: continue
    # spacing: how many contour intervals between (assume 1)
    rows+= [r_,r_]; cols+=[j,i]; vals+=[1,-1]; b.append(5*s); w.append(min(cnt,8)*conf); r_+=1
print('constraints',r_)
# anchors: labelled C2 contours
lab={1085:(533,2775),1080:(325,2903),1075:(342,2970),1070:(347,3038),1065:(342,3105),1060:(342,3178),1055:(317,3250),1050:(317,3328),1045:(300,3400),1040:(308,3480),1035:(308,3545)}
anch=[]
for lv,(lx,ly) in lab.items():
    sx=lx+(70 if lv==1085 else 95)
    best=None
    for i,p in enumerate(keep):
        d=np.hypot(p[:,0]-sx,p[:,1]-ly); k=d.argmin()
        if d[k]<40 and (best is None or d[k]<best[0]): best=(d[k],i)
    if best: anch.append((best[1],lv)); print('anchor',lv,best)
# stream-bank anchors (weak): polylines ending near stream
for i,p in enumerate(keep):
    for e in (p[0],p[-1]):
        d,ii=stree.query(e)
        if d<50:
            zb=sl[ii,2]; anch.append((i,5*np.ceil((zb+0.5)/5)))
A=sp.csr_matrix((vals,(rows,cols)),shape=(r_,n)); bb=np.array(b,float); ww=np.array(w,float)
# anchors as extra rows
ar=[];ac=[];av=[];ab=[];aw=[]
for k,(i,lv) in enumerate(anch):
    ar.append(k);ac.append(i);av.append(1);ab.append(lv)
    aw.append(30.0 if lv==int(lv) and (i,lv) in anch[:11] else 0.25)
Aa=sp.csr_matrix((av,(ar,ac)),shape=(len(anch),n))
for it in range(10):
    M=sp.vstack([A.multiply(ww[:r_,None]) if False else sp.diags(ww)@A, sp.diags(np.array(aw))@Aa]).tocsr(); rhs=np.r_[bb*ww,np.array(ab)*np.array(aw)]
    c=lsqr(M,rhs,atol=1e-8,btol=1e-8,iter_lim=5000)[0]
    res=A@c-bb; ww=np.array(w,float)/np.maximum(1,np.abs(res)/3)
print('levels range',c.min(),c.max(),time.time()-t0)
pickle.dump((keep,c),open('levels.pkl','wb'))
v=cv2.imread('pano_full.jpg')
for p,cl in zip(keep,c):
    col=cv2.applyColorMap(np.uint8([[np.clip((cl-950)/280*255,0,255)]]),cv2.COLORMAP_JET)[0,0].tolist()
    cv2.polylines(v,[p.astype(np.int32)],False,col,4)
cv2.imwrite('levels.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
