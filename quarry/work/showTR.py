import sys,pickle,numpy as np,cv2
TR=pickle.load(open(sys.argv[1],'rb')); box=tuple(map(int,sys.argv[2].split(','))); sc=float(sys.argv[3]); out=sys.argv[4]
v=cv2.imread('pano_full.jpg')
for p,l in TR:
    col=cv2.applyColorMap(np.uint8([[np.clip((l-950)/280*255,0,255)]]),cv2.COLORMAP_JET)[0,0].tolist()
    cv2.polylines(v,[p.astype(np.int32)],False,col,4)
    if len(p)>60:
        m=p[len(p)//2]; cv2.putText(v,str(int(l)),(int(m[0]),int(m[1])-6),cv2.FONT_HERSHEY_SIMPLEX,1.0,(0,0,0),3)
x0,y0,x1,y1=box; cv2.imwrite(out,cv2.resize(v[y0:y1,x0:x1],None,fx=sc,fy=sc,interpolation=cv2.INTER_AREA))
