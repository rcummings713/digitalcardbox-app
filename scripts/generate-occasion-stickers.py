"""Build seventeen original occasion GIFs and SVG posters; no external catalog.
Requires Pillow and the existing Playwright/Chrome frame renderer.
"""
from pathlib import Path
import math, subprocess, tempfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/gifs'
NAMES=['rings','sixteen','graduate','cake','balloons','moon','butterflies','bow','sunshine','leaves','doves','rainbow','fireworks','letter','champagne','teddy','sparkle']
PINK='#ba8692'; GOLD='#b7935f'; SAGE='#8f9c7f'; INK='#775a52'; CREAM='#faf4ed'
def star(x,y,r): return f'<path d="M{x} {y-r}Q{x+3} {y-3} {x+r} {y}Q{x+3} {y+3} {x} {y+r}Q{x-3} {y+3} {x-r} {y}Q{x-3} {y-3} {x} {y-r}Z"/>'
def heart(x,y,s): return f'<path transform="translate({x} {y}) scale({s})" d="M0 8C-34-16-34-43-13-43C-5-43 0-37 0-31C4-46 27-49 31-30C35-13 15 1 0 8Z"/>'
def art(name,t):
 w=math.sin(t*math.tau); p=[]
 p.append(f'<g transform="translate(0 {w*3:.2f})" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">')
 if name=='rings': p.append(f'<g fill="none" stroke="{GOLD}" stroke-width="7"><circle cx="103" cy="135" r="43"/><circle cx="151" cy="135" r="43"/><path d="M134 86L151 68L168 86L151 104Z" stroke-width="3"/></g><g fill="{PINK}" stroke="none">{heart(126,62,.32)}</g>')
 elif name=='sixteen': p.append(f'<text x="128" y="165" fill="{PINK}" stroke="none" font-size="108" text-anchor="middle" font-family="Georgia,serif">16</text><g fill="{GOLD}" stroke="none" opacity="{.7+w*.15}">{star(53,68,16)}{star(205,112,13)}{star(184,194,11)}</g>')
 elif name=='graduate': p.append(f'<path d="M43 105L128 65L213 105L128 145Z" fill="{INK}"/><path d="M69 119V157Q128 189 187 157V119" fill="{SAGE}"/><path d="M206 110V160" stroke="{GOLD}" stroke-width="4"/><circle cx="206" cy="165" r="5" fill="{GOLD}"/><path d="M85 199L172 185L177 211L90 225Z" fill="#efe2c5"/><path d="M128 194L132 217" stroke="{PINK}" stroke-width="7"/>')
 elif name=='cake': p.append(f'<rect x="55" y="130" width="146" height="63" rx="8" fill="#e7c6ce"/><path d="M55 143Q73 169 90 143Q108 169 127 143Q145 169 164 143Q183 169 201 143" fill="none"/><path d="M44 195H212M82 130V101M128 130V101M174 130V101"/><g fill="{GOLD}" stroke="none">'+''.join(f'<ellipse cx="{x}" cy="{85+w*3}" rx="6" ry="11"/>' for x in [82,128,174])+'</g>')
 elif name=='balloons':
  for i,(x,y,c) in enumerate([(80,92,PINK),(166,89,SAGE),(125,126,GOLD)]): p.append(f'<path d="M{x} {y+45}Q{x+20} 193 127 229" fill="none"/><ellipse cx="{x}" cy="{y-w*(3+i)}" rx="32" ry="44" fill="{c}"/><path d="M{x-8} {y-25}q-13 7-10 18" stroke="#ffffff" stroke-opacity=".5"/>')
 elif name=='moon': p.append(f'<path d="M143 48a78 78 0 1 0 65 111a66 66 0 0 1-65-111Z" fill="#d9bb80" stroke="{GOLD}"/><g fill="{PINK}" stroke="none">{star(181,67,16)}{star(199,124,12)}{star(157,102,10)}</g>')
 elif name=='butterflies':
  for x,y,s in [(109,126,1),(185,76,.55),(62,191,.38)]:p.append(f'<g transform="translate({x} {y}) scale({s*(1+w*.08)})"><path d="M0 0C-88-93-86 36-13 28C-76 71-7 93 0 8C13 98 78 67 14 28C91 36 90-91 0 0Z" fill="{PINK}"/><path d="M0-10V55M0-7L-11-23M0-7L11-23" fill="none"/></g>')
 elif name=='bow':p.append(f'<path d="M127 114C31 9 20 154 118 127L77 210L113 194L133 219L135 132L151 214L168 191L199 204L145 124C239 152 227 7 127 114Z" fill="#dcb9c2"/><path d="M124 112Q136 106 146 117L143 132L125 131Z" fill="{PINK}"/>')
 elif name=='sunshine':
  p.append(f'<circle cx="128" cy="128" r="47" fill="#e3c58b" stroke="{GOLD}"/>')
  for i in range(12):
   a=i*math.tau/12+t*.12;p.append(f'<path d="M{128+61*math.cos(a)} {128+61*math.sin(a)}L{128+83*math.cos(a)} {128+83*math.sin(a)}" stroke="{GOLD}" stroke-width="4"/>')
 elif name=='leaves':p.append(f'<path d="M128 218Q125 136 157 62M129 169Q84 141 73 81" fill="none" stroke="{SAGE}" stroke-width="4"/><path d="M146 104Q104 62 139 38Q171 40 146 104ZM142 121Q200 72 208 111Q196 142 142 121ZM127 161Q99 115 68 143Q67 177 127 161ZM129 186Q177 146 187 180Q177 211 129 186Z" fill="{SAGE}" stroke="none"/>')
 elif name=='doves':p.append(f'<path d="M66 159Q51 105 89 73Q81 126 121 125Q118 68 170 50Q146 110 170 131Q210 104 219 128L233 139L212 146Q186 191 136 181L87 207L96 169Z" fill="#eee8dc"/><circle cx="205" cy="132" r="2" fill="{INK}"/><path d="M214 146Q230 173 237 198M231 182Q208 162 212 180Q219 193 231 182" fill="none" stroke="{SAGE}"/>')
 elif name=='rainbow':
  for i,c in enumerate([PINK,GOLD,SAGE,'#90a9b1']):p.append(f'<path d="M{47+i*17} 182V143a{81-i*17} {81-i*17} 0 0 1 {162-i*34} 0V182" stroke="{c}" stroke-width="14" fill="none"/>')
 elif name=='fireworks':
  for cx,cy,r,c in [(90,104,55,PINK),(176,158,49,GOLD),(186,61,30,SAGE)]:
   for i in range(9):
    a=i*math.tau/9;scale=1+w*.12;p.append(f'<path d="M{cx+15*math.cos(a)} {cy+15*math.sin(a)}L{cx+r*scale*math.cos(a)} {cy+r*scale*math.sin(a)}" stroke="{c}" stroke-width="3"/>')
 elif name=='letter':p.append(f'<rect x="47" y="87" width="162" height="113" rx="5" fill="#e7d2c1"/><path d="M48 91L128 153L208 91M48 197L106 147M208 197L152 147" fill="none"/><g fill="{PINK}" stroke="none">{heart(130,93,.75)}</g>')
 elif name=='champagne':p.append(f'<g transform="rotate({-12+w*2} 128 128)"><path d="M105 50H142V88L157 116V211H90V116L105 88Z" fill="{SAGE}"/><path d="M106 48H141V73H106Z" fill="{GOLD}"/><path d="M92 144H155V185H92Z" fill="#f1e5cc"/><path d="M109 162H139"/></g><g fill="{GOLD}" stroke="none">{star(189,77,16)}{star(70,92,10)}</g>')
 elif name=='teddy':p.append(f'<g fill="#d3b59b"><circle cx="85" cy="78" r="22"/><circle cx="171" cy="78" r="22"/><ellipse cx="128" cy="163" rx="61" ry="63"/><circle cx="128" cy="104" r="53"/><ellipse cx="77" cy="207" rx="25" ry="21"/><ellipse cx="179" cy="207" rx="25" ry="21"/></g><ellipse cx="128" cy="120" rx="27" ry="20" fill="#eadac9"/><circle cx="110" cy="101" r="3" fill="{INK}"/><circle cx="146" cy="101" r="3" fill="{INK}"/><path d="M121 114Q128 105 135 114L128 121Z" fill="{INK}"/><path d="M128 121V129"/><g fill="{PINK}" stroke="none">{heart(128,181,.56)}</g>')
 else:p.append(f'<g fill="{GOLD}" stroke="none" transform="translate(128 128) scale({1+w*.10}) translate(-128 -128)">{star(128,128,62)}{star(55,61,20)}{star(198,184,25)}{star(202,62,15)}</g>')
 p.append('</g>')
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="128" fill="{CREAM}"/>'+''.join(p)+'</svg>'
with tempfile.TemporaryDirectory(prefix='dcb-occasion-gifs-') as folder:
 folder=Path(folder)
 for name in NAMES:
  (OUT/f'{name}.svg').write_text(art(name,0))
  for frame in range(16):(folder/f'{name}-{frame:02}.svg').write_text(art(name,frame/16))
 subprocess.run(['node',str(ROOT/'scripts/render-sticker-frames.mjs'),str(folder)],check=True)
 for name in NAMES:
  frames=[Image.open(folder/f'{name}-{i:02}.png').convert('RGB').quantize(colors=64) for i in range(16)]
  frames[0].save(OUT/f'{name}.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,optimize=True)
print('Built 17 original occasion GIFs and static posters.')
