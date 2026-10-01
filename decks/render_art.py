import sys; sys.path.insert(0,'/home/claude/wp')
import art
from playwright.sync_api import sync_playwright
def svg(w,h,body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'
jobs = {}
# cover panel: 6.6in x 7.5in -> 634 x 720 px
W,H=634,720
jobs['cover_panel']=(W,H, art.defs('a')+f'<defs><clipPath id="c"><path d="M60,0 H{W} V{H} H0 C0,{H} 0,110 60,0 Z"/></clipPath></defs><g clip-path="url(#c)">'+art.background('a',0,0,W,H)+art.discs('a',575,60,n=4,r0=30,step=38)+art.estate('a',262,338,33)+f'<path d="M-20,640 C160,580 340,660 {W+20},560" fill="none" stroke="url(#aswoosh)" stroke-width="2.4"/></g>')
# full-bleed gradient backgrounds 1280x720
jobs['bg_full']=(1280,720, art.defs('b')+art.background('b',0,0,1280,720)+art.discs('b',1040,330,n=5,r0=24,step=42)+'<g transform="translate(1040,330)"><circle r="26" fill="#fff"/><circle r="10" fill="#0F6CBD"/></g>'+'<path d="M-10,560 C300,500 640,620 1290,470" fill="none" stroke="url(#bswoosh)" stroke-width="2.4"/>')
jobs['bg_plain']=(1280,720, art.defs('p')+art.background('p',0,0,1280,720)+'<path d="M-10,600 C300,540 640,660 1290,520" fill="none" stroke="url(#pswoosh)" stroke-width="2.4"/>')
# divider art (estate small, right)
jobs['bg_divider']=(1280,720, art.defs('d')+art.background('d',0,0,1280,720)+art.discs('d',1180,80,n=4,r0=26,step=40)+art.estate('d',900,300,34)+'<path d="M-10,640 C300,580 640,690 1290,560" fill="none" stroke="url(#dswoosh)" stroke-width="2.2"/>')
# band (wide, short) for quotes 12.3in x 1.5in -> 1180 x 144
jobs['band']=(1180,144, art.defs('q')+art.background('q',0,0,1180,144)+'<path d="M700,136 C850,80 1000,150 1200,50" fill="none" stroke="url(#qswoosh)" stroke-width="2"/>')
# tall panel for agenda 4.2in x 6.2in -> 403 x 595
jobs['panel_tall']=(403,595, art.defs('t')+art.background('t',0,0,403,595)+art.discs('t',200,210,n=5,r0=18,step=28)+'<g transform="translate(200,210)"><circle r="22" fill="#fff"/><circle r="9" fill="#0F6CBD"/></g><path d="M-20,420 C100,380 260,460 420,390" fill="none" stroke="url(#tswoosh)" stroke-width="2.2"/>')
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,(w,h,body) in jobs.items():
        pg=b.new_page(viewport={'width':w,'height':h}, device_scale_factor=2.5)
        pg.set_content(f'<html><body style="margin:0">{svg(w,h,body)}</body></html>')
        pg.screenshot(path=f'img/{name}.png', omit_background=True, clip={'x':0,'y':0,'width':w,'height':h})
        pg.close()
    b.close()
print('done')
