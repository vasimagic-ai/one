import numpy as np, sys, cv2, time
import scipy.sparse as sp
from scipy.sparse.linalg import lsqr
from skimage import measure
sys.path.insert(0,'../tools'); import control_points as C
t0=time.time()
P=np.load('cross_raw.npy')
X0,X1,Y0,Y1,G=150,5300,500,3900,16
nx=(X1-X0)//G+1; ny=(Y1-Y0)//G+1; N=nx*ny
def idx(x,y): return np.clip(((y-Y0)/G).astype(int),0,ny-1)*nx+np.clip(((x-X0)/G).astype(int),0,nx-1)
def bil(x,y):
    gx=np.clip((x-X0)/G,0,nx-1.001); gy=np.clip((y-Y0)/G,0,ny-1.001); i=gx.astype(int); j=gy.astype(int); fx=gx-i; fy=gy-j
    return [(j*nx+i,(1-fx)*(1-fy)),(j*nx+i+1,fx*(1-fy)),((j+1)*nx+i,(1-fx)*fy),((j+1)*nx+i+1,fx*fy)]
rows=[];cols=[];vals=[];b=[];w=[]; r=0
def add_eq(terms,rhs,wt):
    global r
    for c,v in terms:
        rows.extend([r]*len(c)) if False else None
    r+=1
# vectorised builders
def build(eqs):
    R=[];Cc=[];V=[];B=[];W=[]
    for k,(pts_terms,rhs,wt) in enumerate(eqs): pass
# build segment & tie equations vectorised
seg=[];tie=[]
order=np.lexsort((P[:,5],P[:,4],P[:,3])); Q=P[order]
for a,b_ in zip(Q[:-1],Q[1:]):
    if a[3]==b_[3] and a[4]==b_[4] and b_[5]==a[5]+1:
        gap=np.hypot(b_[0]-a[0],b_[1]-a[1])
        if gap<160: seg.append((a[0],a[1],b_[0],b_[1]))
seg=np.array(seg); print('segments',len(seg))
tx=-Q[:,7]; ty=Q[:,6]   # tangent (perp to d)
eps=20
t1=np.c_[Q[:,0]+eps*tx,Q[:,1]+eps*ty,Q[:,0],Q[:,1]]; t2=np.c_[Q[:,0]-eps*tx,Q[:,1]-eps*ty,Q[:,0],Q[:,1]]
ties=np.vstack([t1,t2])
def mat(pairs,rhs_val,wt):
    n=len(pairs); R=[];Cc=[];V=[]
    A=bil(pairs[:,0],pairs[:,1]); B=bil(pairs[:,2],pairs[:,3])
    for (ia,wa),(ib,wb) in zip(A,B):
        pass
    rows=np.arange(n); out=[]
    for (ia,wa) in A: out.append(sp.csr_matrix((wa,(rows,ia)),shape=(n,N)))
    for (ib,wb) in B: out.append(sp.csr_matrix((-wb,(rows,ib)),shape=(n,N)))
    M=sum(out); return M
Mseg=mat(seg,5,1.0); bseg=np.full(len(seg),5.0)
Mtie=mat(ties,0,1.0); btie=np.zeros(len(ties))
# stream anchors
st=np.array([(2*x,2*y-102,z) for x,y,z in C.STREAM],float); sl=[]
for a,b_ in zip(st[:-1],st[1:]):
    for t in np.linspace(0,1,14,endpoint=False): sl.append(a*(1-t)+b_*t)
sl=np.array(sl)
def anchor(pts,zv):
    A=bil(pts[:,0],pts[:,1]); rows=np.arange(len(pts)); return sum(sp.csr_matrix((wa,(rows,ia)),shape=(len(pts),N)) for ia,wa in A), zv
Man,ban=anchor(sl,sl[:,2])
# laplacian smoothness
I=np.arange(N).reshape(ny,nx)
def lap():
    rr=[];cc=[];vv=[];k=0
    for dy,dx in [(0,1),(1,0)]:
        a=I[:ny-dy,:nx-dx].ravel(); c=I[dy:,dx:].ravel(); n=len(a)
        rr+= list(np.arange(k,k+n))*2; cc+=list(a)+list(c); vv+=[1]*n+[-1]*n; k+=n
    return sp.csr_matrix((vv,(rr,cc)),shape=(k,N))
Ml=lap()
wseg=np.ones(len(seg)); wtie=np.ones(len(ties))
z=np.full(N,1050.0)
for it in range(8):
    A=sp.vstack([Mseg.multiply(wseg[:,None]),Mtie.multiply(wtie[:,None])*0.8,Man*4.0,Ml*0.06]).tocsr()
    bb=np.r_[bseg*wseg,btie*wtie*0.8,ban*4.0,np.zeros(Ml.shape[0])]
    if it==0: x0=np.full(N,1050.)
    sol=lsqr(A,bb,x0=z,atol=1e-6,btol=1e-6,iter_lim=3000)[0]; z=sol
    rs=Mseg@z-bseg; rt=Mtie@z
    wseg=1/np.maximum(1,np.abs(rs)/2.0); wtie=1/np.maximum(1,np.abs(rt)/3.0)
    print(it,'seg resid med',np.median(abs(rs)),'tie',np.median(abs(rt)),'z',z.min(),z.max(),time.time()-t0)
Z=z.reshape(ny,nx); np.savez('poisson.npz',z=Z,x0=X0,y0=Y0,g=G)
v=cv2.imread('pano_full.jpg')
for lv in range(920,1330,5):
    for c in measure.find_contours(Z,lv):
        pp=np.c_[X0+c[:,1]*G,Y0+c[:,0]*G].astype(np.int32)
        cv2.polylines(v,[pp],False,(0,0,255) if lv%25==0 else (255,0,0),3)
cv2.imwrite('overlay.jpg',cv2.resize(v[500:3900,100:5400],None,fx=.33,fy=.33,interpolation=cv2.INTER_AREA))
cv2.imwrite('overlay_q.jpg',cv2.resize(v[2200:3700,150:2300],None,fx=.7,fy=.7,interpolation=cv2.INTER_AREA))
