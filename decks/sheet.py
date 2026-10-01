import sys,glob
from PIL import Image
pre=sys.argv[1]; out=sys.argv[2]; sel=[int(x) for x in sys.argv[3:]]
fs=sorted(glob.glob(f'/home/claude/deck2/out/{pre}-*.jpg'))
if sel: fs=[f for f in fs if int(f.rsplit('-',1)[1].split('.')[0]) in sel]
ims=[Image.open(f) for f in fs]; w,h=ims[0].size
cols=2; rows=(len(ims)+1)//2
S=Image.new('RGB',(cols*w+10,rows*h+10*(rows-1)),'#777')
for k,im in enumerate(ims): r,c=divmod(k,cols); S.paste(im,(c*(w+10),r*(h+10)))
S.save(out); print(S.size)
