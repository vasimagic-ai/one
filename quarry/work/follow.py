import numpy as np, cv2
ink=cv2.imread('ink.png',0)>0
H,W=ink.shape
dist=cv2.distanceTransform((~ink).astype(np.uint8),cv2.DIST_L2,3)   # distance to nearest ink
def ink_at(x,y):
    xi,yi=int(round(x)),int(round(y))
    if xi<0 or yi<0 or xi>=W or yi>=H: return 0.0
    return 1.0 if ink[yi,xi] else 0.0
def snap(x,y,r=30):
    """nearest ink pixel (thin contour) to (x,y) within r"""
    x0,y0=int(x),int(y); best=None
    for dy in range(-r,r+1):
        for dx in range(-r,r+1):
            xx,yy=x0+dx,y0+dy
            if 0<=xx<W and 0<=yy<H and ink[yy,xx]:
                dd=dx*dx+dy*dy
                if best is None or dd<best[0]: best=(dd,xx,yy)
    return None if best is None else (best[1],best[2])
def centre_on_line(x,y,d,half=14):
    """move point to centre of ink run across the line (perpendicular to d)"""
    n=np.array([-d[1],d[0]]); vals=[]
    for t in range(-half,half+1):
        vals.append((t,ink_at(x+n[0]*t,y+n[1]*t)))
    ts=[t for t,v in vals if v]
    if not ts: return x,y
    # nearest run to t=0
    runs=[];cur=[]
    for t,v in vals:
        if v: cur.append(t)
        elif cur: runs.append(cur);cur=[]
    if cur: runs.append(cur)
    best=min(runs,key=lambda r:abs(np.mean(r)))
    m=np.mean(best); return x+n[0]*m,y+n[1]*m
def follow(x,y,d,maxlen=6000,step=4,gapmax=70):
    d=np.array(d,float); d/=np.linalg.norm(d)
    pts=[(x,y)]; gap=0; length=0
    while length<maxlen:
        best=None
        for da in np.deg2rad(np.arange(-22,23,4)):
            c,s=np.cos(da),np.sin(da); dd=np.array([c*d[0]-s*d[1],s*d[0]+c*d[1]])
            sc=0
            for L in (6,12,18,24):
                sc+=ink_at(x+dd[0]*L,y+dd[1]*L)
            sc-=0.15*abs(da)*4
            if best is None or sc>best[0]: best=(sc,dd)
        sc,dd=best
        if sc<1.2:      # nothing ahead: bridge straight
            gap+=step
            if gap>gapmax: break
            nd=d
        else:
            gap=0; nd=0.65*d+0.35*dd; nd/=np.linalg.norm(nd)
        d=nd; x+=d[0]*step; y+=d[1]*step; length+=step
        if gap==0:
            x2,y2=centre_on_line(x,y,d,6); x=0.5*x+0.5*x2; y=0.5*y+0.5*y2
        if not(0<x<W and 0<y<H): break
        pts.append((x,y))
    if gap>0: pts=pts[:max(1,len(pts)-gap//step)]
    return np.array(pts)
