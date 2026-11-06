"""Original editable layouts for invitations omitted by Canva generation."""
import html
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE.parent/'canva-invitations-100-briefs.json').read_text())


def text(value, y, size, color, family='Georgia, serif', left=48, width=404,
         align='center', weight=400, spacing=0):
    return (f'<div style="position:absolute;left:{left}px;top:{y}px;width:{width}px;'
            f'font-family:{family};font-size:{size}px;line-height:1.13;'
            f'font-weight:{weight};letter-spacing:{spacing}px;text-align:{align};'
            f'color:{color};">{value}</div>')


def path(d, fill='none', stroke='none', width=1, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {extra}/>'


def circle(x,y,r,fill,stroke='none',width=1):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'


def leaf(x,y,angle,scale,color):
    return (f'<g transform="translate({x} {y}) rotate({angle}) scale({scale})">'+
            path('M0 0 C-18 -13 -17 -33 0 -43 C16 -23 13 -10 0 0Z',color)+
            path('M0 0L0 -34','none','#fff8e9',.6)+'</g>')


def branch(x,y,angle,color,scale=1):
    art=path('M0 0 Q-5 -65 15 -125','none',color,1.4)
    for k in range(6): art+=leaf(k*1.8,-17-k*16,(-48 if k%2 else 49),.47,color)
    return f'<g transform="translate({x} {y}) rotate({angle}) scale({scale})">{art}</g>'


def rose(x,y,scale,color,edge):
    art=''
    for j in range(7):
        a=2*math.pi*j/7
        art+=circle(math.cos(a)*15,math.sin(a)*15,19,color,edge,.35)
    art+=circle(0,0,20,color,edge,.6)
    art+=path('M-10 2C-14 -15 15 -19 16 -2C17 13 -4 18 -9 6C-14 -5 4 -11 7 -2C10 5 -1 10 -3 3','none',edge,.8)
    return f'<g transform="translate({x} {y}) scale({scale})">{art}</g>'


def star(x,y,r,color):
    return path(f'M{x-r} {y}Q{x} {y} {x} {y-r}Q{x} {y} {x+r} {y}Q{x} {y} {x} {y+r}Q{x} {y} {x-r} {y}Z',color)


def frame(color,rx=0):
    return f'<rect x="25" y="25" width="450" height="650" rx="{rx}" fill="none" stroke="{color}" stroke-width="1"/>'


def make(row,index,category):
    decoration=''; extra=''; align='center'; y=245; name_y=382; details_y=470
    bg='#fff8eb'; ink='#3c483e'; accent='#8e9c7d'; face='Georgia, serif'
    label='YOU ARE WARMLY INVITED'; headline=html.escape(row['headline'])
    if category=='Wedding' and index==0:
        bg='#f0eee4'; ink='#354c3b'; accent='#a89972';label='REHEARSAL DINNER'
        decoration=frame('#aaa182')+path('M157 218V144A93 93 0 0 1 343 144V218','none','#c6bda6',13)
        decoration+=branch(122,234,-25,'#798b62',1.05)+branch(383,235,24,'#798b62',1.05)
        decoration+=path('M192 214H308M207 214V239M293 214V239','none','#8f795c',2)
        headline='The evening<br>before'; y=294;name_y=405;details_y=486
    elif category=='Wedding' and index==1:
        bg='#faf1dc';ink='#37322c';accent='#b68e4b';label='REHEARSAL DINNER'
        decoration=frame(accent)+path('M95 136H190Q180 176 143 178Q105 176 95 136M143 178V227M116 227H170','none',accent,1.5)
        decoration+=path('M214 115H309Q299 155 262 157Q224 155 214 115M262 157V206M235 206H289','none',accent,1.5)
        for x,z in [(352,90),(372,166),(332,222)]:decoration+=star(x,z,7,accent)
        align='left';headline='A toast before<br>the vows';y=298;name_y=420;details_y=495
    elif category=='Wedding' and index==2:
        bg='#fff8f1';ink='#754858';accent='#ad7b84';label='BRIDAL SHOWER'
        for x,z,s in [(28,40,1.5),(112,15,.8),(468,90,1.2),(475,620,1.4),(395,682,1),(32,620,.8)]:
            decoration+=branch(x,z+90,30,'#899578',.7)+rose(x,z,s,'#ecc3c7','#c28d98')
        y=205;name_y=370;details_y=477;headline='Shower the bride<br>with love'
        decoration+=path('M151 337Q250 359 349 337','none','#d4adad',1)
    elif category=='Wedding' and index==3:
        bg='#f5f0e9';ink='#54483e';accent='#9f9eaf';label='BRIDAL SHOWER'
        for a in range(0,360,12):
            rad=math.radians(a);decoration+=circle(250+88*math.cos(rad),150+88*math.sin(rad),3,'#fffdf7','#c5b9a7',.5)
        decoration+=path('M207 132H286V161Q283 190 247 190Q211 188 207 161ZM286 139Q320 133 317 157Q313 179 286 171','none','#8292a3',1.5)
        decoration+=path('M199 197Q247 212 297 197M222 123Q211 110 224 95M246 122Q235 106 248 90','none','#8292a3',1.4)
        headline='An afternoon<br>for the bride';y=300;name_y=415;details_y=495
    elif category=='Wedding' and index==4:
        bg='#4e2d50';ink='#fff3dc';accent='#ef9b55';label='BEFORE THE BIG DAY';face='Arial, sans-serif'
        decoration=circle(250,139,82,accent)+circle(281,116,79,bg)
        decoration+=path('M-20 180Q80 125 110 202T223 243T373 206T526 267','none','#b97b99',18)
        for x,z in [(76,74),(416,124),(332,68),(451,315)]:decoration+=star(x,z,9,'#e6b9c3')
        headline='One more night<br>before forever';y=330;name_y=438;details_y=512
    elif category=='Wedding' and index==5:
        bg='#202126';ink='#fff5e7';accent='#e77fa5';label='CELEBRATE THE WEEKEND';face='Arial, sans-serif'
        for x,z,w,h in [(20,100,52,150),(77,65,48,185),(130,135,54,115),(189,24,65,226),(260,110,48,140),(313,79,62,171),(380,129,40,121),(425,53,61,197)]:
            decoration+=f'<rect x="{x}" y="{z}" width="{w}" height="{h}" fill="#31333b" stroke="#a4a2a5" stroke-width=".6"/>'
            for yy in range(z+15,z+h-12,22):
                for xx in range(x+10,x+w-5,14):decoration+=f'<rect x="{xx}" y="{yy}" width="4" height="7" fill="{accent}" opacity=".8"/>'
        y=327;headline='The celebration<br>starts here';name_y=435;details_y=513
    elif category=='Wedding' and index==6:
        bg='#faf2e4';ink='#3b5039';accent='#bc4d43';label='ENGAGEMENT PARTY'
        for x in range(0,500,24):decoration+=f'<rect x="{x}" y="0" width="10" height="700" fill="#bdceac" opacity=".45"/>'
        for z in range(0,700,24):decoration+=f'<rect x="0" y="{z}" width="500" height="10" fill="#bdceac" opacity=".45"/>'
        decoration+='<rect x="42" y="52" width="416" height="596" rx="130" fill="#fff9ed"/>'
        for x,z,s in [(133,155,1),(367,550,.75)]:
            decoration+=f'<g transform="translate({x} {z}) scale({s})">'+path('M-23 -8Q-29 10 0 42Q29 10 23 -8Q5 -25 -23 -8Z',accent)+path('M-25 -10L0 -21L25 -10L7 -8L0 1L-7 -8Z','#647a4d')
            for xx,yy in [(-9,1),(10,4),(0,16),(-5,27),(13,-7)]:decoration+=path(f'M{xx} {yy}l1.5 4','none','#f2d29d',1)
            decoration+='</g>'
        y=247;headline='Engaged and<br>celebrating';name_y=375;details_y=455
    elif category=='Wedding' and index==7:
        bg='#faf3e2';ink='#34416b';accent='#b08a3e';label='ENGAGEMENT PARTY'
        decoration+=path('M-15 50C160 10 40 145 172 175M515 31C332 19 459 152 326 175','none',accent,2)
        decoration+=f'<rect x="170" y="167" width="160" height="73" rx="5" fill="#e4d8ba" stroke="{accent}" stroke-width="1"/>'
        for x in [184,223,262,301]:decoration+=circle(x,203,12,'#fff9eb',accent,.6)
        for x in [194,306]:decoration+=branch(x,167,0,'#7e946f',.35)
        y=300;headline='Come celebrate<br>our engagement';name_y=418;details_y=497
    elif category=='Wedding':
        bg='#f7f4e8';ink='#345652';accent='#8da79a';label='AN INTIMATE WEDDING'
        decoration+=path('M0 525Q80 570 148 526T300 549T500 520V700H0Z','#b9ccc0')
        decoration+=path('M0 578Q90 536 175 575T350 565T500 595V700H0Z','#789e91')
        decoration+=path('M0 634Q95 590 184 641T360 623T500 649V700H0Z','#3c6b63')
        decoration+=path('M1 550Q82 597 149 550T300 573T500 544','none','#f7f4e8',1.2)
        y=137;headline='A little ceremony,<br>a lot of love';name_y=280;details_y=363
    elif index==0:
        bg='#182c29';ink='#fff3d9';accent='#c3a264';label='A MASQUERADE CELEBRATION'
        decoration=frame(accent)+circle(250,115,56,accent)+circle(273,96,55,bg)
        decoration+=path('M114 210Q154 159 221 199Q250 221 279 199Q346 159 386 210Q365 277 303 258Q250 227 197 258Q135 277 114 210Z','#294d43',accent,1.3)
        decoration+=path('M140 213Q171 191 208 216Q176 242 140 213ZM292 216Q329 191 360 213Q324 242 292 216Z',bg,accent,1)
        for x in [127,162,197,232,267,302,337,372]:decoration+=circle(x,185-(30 if x in [162,337] else 0),2.4,accent)
        headline='An evening<br>of mystery';y=329;name_y=439;details_y=516
    elif index==1:
        bg='#f3ead6';ink='#31493b';accent='#aa6040';label='GOOD COMPANY · OPEN SKIES'
        decoration=path('M0 0H500V170Q370 212 250 171T0 180Z','#243d39')
        for x,z,r in [(46,54,3),(151,102,4),(255,36,4),(357,75,3),(447,123,3),(340,141,2)]:decoration+=star(x,z,r,'#e3c992')
        decoration+=path('M225 613L284 644M280 612L221 645','none','#825239',9)
        decoration+=path('M247 620C216 604 232 581 245 562Q240 589 260 579C275 605 269 619 247 620Z','#c37447')
        decoration+=path('M247 619Q239 600 253 588Q269 612 247 619Z','#edbb60')
        headline='Gather around';y=270;name_y=360;details_y=445
    else:
        bg='#fff6df';ink='#233f78';accent='#bc5143';label='YOU ARE INVITED';face='Arial, sans-serif'
        decoration=path('M0 640V575L66 522L132 575V700H0Z','#cb584c')
        decoration+=path('M124 700V623L199 567L274 623V700Z','#e0ad3f')
        decoration+=path('M302 700V578L380 522L458 578V700Z','#365dae')
        for x,z in [(40,590),(88,590),(172,636),(217,636),(337,590),(386,590)]:decoration+=f'<rect x="{x}" y="{z}" width="21" height="26" rx="3" fill="#fff1cc"/>'
        decoration+=path('M82 183A168 168 0 0 1 418 183','none','#d26e55',14)
        decoration+=path('M101 183A149 149 0 0 1 399 183','none','#e0b541',12)
        decoration+=path('M119 183A131 131 0 0 1 381 183','none','#456ca8',11)
        headline='The more<br>the merrier';y=241;name_y=358;details_y=438

    label_y=y-43
    body=text(label,label_y,10,accent,'Arial, sans-serif',align=align,weight=700,spacing=2)
    body+=text(headline,y,35,ink,face,align=align)
    body+=text('[Couple Names]' if row['occasion'] in ['Wedding','Engagement party'] else '[Honoree Name]',name_y,27,ink,face,align=align)
    body+=text('[Date] &nbsp;·&nbsp; [Time]',details_y,16,ink,'Arial, sans-serif',align=align)
    body+=text('[Venue]',details_y+38,16,ink,'Arial, sans-serif',align=align)
    footer_y=635 if not(category=='Wedding' and index==8) else 481
    if category=='Celebration' and index==1: footer_y=544
    if category=='Celebration' and index==2: footer_y=520
    body+=text('Kindly RSVP · [Contact]',footer_y,11,ink,'Arial, sans-serif',align=align)
    return (f'<article data-document-role="page" data-label="{html.escape(row["title"])}" '
            f'style="position:relative;width:500px;height:700px;overflow:hidden;background:{bg};">'
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" '
            f'style="position:absolute;left:0;top:0;width:500px;height:700px">{decoration}</svg>{body}</article>')


for category,start in [('Wedding',9),('Celebration',9)]:
    rows=[r for r in DATA['templates'] if r['category']==category][start:]
    pages='\n'.join(make(r,i,category) for i,r in enumerate(rows))
    head='<!doctype html><html lang="en"><meta charset="utf-8"><title>DCB '+category+' supplementary invitations</title>'
    head+='<style>*{box-sizing:border-box}html,body{margin:0;padding:0}article{page-break-after:always}article>div{z-index:1}@page{size:500px 700px;margin:0}</style><body>'
    (HERE/(category.lower()+'-supplement.html')).write_text(head+pages+'</body></html>')
    print(category,len(rows),'original editable invitation pages')
