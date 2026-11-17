#!/usr/bin/env python3
"""The robot against the keyboard through the wake: its lowest point (its outline and tail nozzle, 0.44 m under the tip
when tip-up) above the keycaps, frame by frame, for the path in components/take.ts (copied here; keep in step).
  /tmp/ivyenv/bin/python -I scripts/robot_clear.py"""
import numpy as np, math
U=0.098; KB=[0.25,0.235,3.3]; YAW=0.07
def keyw(row,xc):
    x=(xc-7.5)*U; z=(row-2)*U; c,s=math.cos(YAW),math.sin(YAW)
    return [KB[0]+x*c+z*s, KB[1]+0.03, KB[2]-x*s+z*c]
WK=keyw(4,6.875)
MON=[0,1.3,0]; rx,rz=-0.04,0.03
def onScreen(u,v,out):
    x,y,z=(u-0.5)*4.0,(0.5-v)*2.25,0.14+out
    y,z=y*math.cos(rx)-z*math.sin(rx), y*math.sin(rx)+z*math.cos(rx)
    x,y=x*math.cos(rz)-y*math.sin(rz), x*math.sin(rz)+y*math.cos(rz)
    return [MON[0]+x,MON[1]+y,MON[2]+z]
def ease(t): return 4*t**3 if t<0.5 else 1-(-2*t+2)**3/2
def keyed(keys,f):
    i=0
    while i<len(keys)-2 and f>=keys[i+1][0]: i+=1
    (f0,a),(f1,b)=keys[i],keys[i+1]
    t=min(1,max(0,(f-f0)/(f1-f0))); t=ease(t)
    return [a[j]+(b[j]-a[j])*t for j in range(3)]
def interp(f,xs,ys):
    return float(np.interp(f,xs,ys))
H=0.36
PTS=[(x*H,y*H) for x,y in [(0,0),(0,-1),(0.235,-0.775),(0.39,-1.13),(0.535,-1.065),(0.38,-0.715),(0.7,-0.715)]]+[(0.184,-0.435),(0.2,-0.30),(0.034,-0.38)]
def lowest(p,nose):
    a=math.pi*nose
    return min(p[1]+(x*math.sin(a)+y*math.cos(a)) for x,y in PTS)
TOP=0.265+0.02  # keycap tops plus the case lip
def inside_kb(p): return -0.55<p[0]<1.05 and 2.95<p[2]<3.65
def run(intro,nosek,label):
    worst=(9,None)
    bad=[]
    for f in range(150,265):
        p=keyed(intro,f)
        n=interp(f,*nosek)
        lo=lowest(p,n)
        if inside_kb(p) and f>166:
            c=lo-TOP
            if c<worst[0]: worst=(c,f)
            if c<0.03: bad.append(f)
    print(label,'worst clearance %.3f m at frame %s; frames under 3 cm: %s'%(worst[0],worst[1],(bad[0],bad[-1]) if bad else 'none'))
G=onScreen(0.5,0.62,0.5)
old=[(150,[WK[0],WK[1]+0.12,WK[2]]),(162,[WK[0],WK[1]-0.012,WK[2]]),(176,[WK[0]+0.1,WK[1]+0.3,WK[2]]),(262,G)]
run(old,([95,115,172,200],[0,1,1,0]),'old')
new=[(150,[WK[0],WK[1]+0.12,WK[2]]),(162,[WK[0],WK[1]-0.012,WK[2]]),(180,[WK[0]+0.06,WK[1]+0.42,WK[2]-0.05]),(204,[WK[0]+0.02,WK[1]+0.68,WK[2]-0.45]),(262,G)]
run(new,([95,115,180,206],[0,1,1,0]),'new')
for f in (176,186,196,206,216,230):
    p=keyed(new,f); print(f,[round(v,3) for v in p], 'low %.3f'%lowest(p,interp(f,[95,115,180,206],[0,1,1,0])))
