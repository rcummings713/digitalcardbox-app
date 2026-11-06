"""Original, editable vector invitation sources; no external artwork or fonts."""
import json
import math
from pathlib import Path

import fitz

HERE = Path(__file__).resolve().parent
BRIEFS = json.loads((HERE.parent / 'canva-invitations-100-briefs.json').read_text())
ROWS = [row for row in BRIEFS['templates'] if row['category'] == 'Graduation']
DOC = fitz.open()


def rgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i+2], 16) / 255 for i in (0, 2, 4))


def box(page, area, text, size=24, color='#172c3b', font='tiro', align=1):
    area = fitz.Rect(area)
    while size >= 8:
        shape = page.new_shape()
        spare = shape.insert_textbox(area, text, fontsize=size, fontname=font,
                                     color=rgb(color), align=align, lineheight=1.15)
        if spare >= 0:
            shape.commit()
            return
        size -= 0.5
    raise ValueError(f'Text does not fit: {text}')


def rect(page, area, fill, stroke=None, width=1):
    page.draw_rect(fitz.Rect(area), fill=rgb(fill) if fill else None,
                   color=rgb(stroke) if stroke else None, width=width)


def line(page, start, end, color, width=1, dashes=None):
    page.draw_line(start, end, color=rgb(color), width=width, dashes=dashes)


def poly(page, points, fill=None, stroke=None, width=1):
    shape = page.new_shape()
    shape.draw_polyline(points + [points[0]])
    shape.finish(fill=rgb(fill) if fill else None,
                 color=rgb(stroke) if stroke else None, width=width, closePath=True)
    shape.commit()


def circle(page, x, y, radius, fill, stroke=None, width=1):
    page.draw_circle((x, y), radius, fill=rgb(fill) if fill else None,
                     color=rgb(stroke) if stroke else None, width=width)


def cap(page, x, y, scale, color, accent):
    poly(page, [(x-68*scale,y),(x,y-28*scale),(x+68*scale,y),(x,y+28*scale)], color)
    poly(page, [(x-40*scale,y+19*scale),(x,y+36*scale),(x+40*scale,y+19*scale),
                (x+40*scale,y+48*scale),(x,y+61*scale),(x-40*scale,y+48*scale)], color)
    line(page, (x,y), (x+60*scale,y+8*scale), accent, 2*scale)
    line(page, (x+60*scale,y+8*scale), (x+60*scale,y+60*scale), accent, 2*scale)
    circle(page,x+60*scale,y+64*scale,4*scale,accent)


def stars(page, color):
    for x,y,r in [(43,75,2),(120,190,2),(330,60,2),(448,155,3),(415,300,2),
                  (65,380,2),(452,550,2),(100,605,3),(390,627,2)]:
        line(page,(x-r*2,y),(x+r*2,y),color,0.8)
        line(page,(x,y-r*2),(x,y+r*2),color,0.8)


def details(page, y, ink, align=1, x=65, right=435):
    box(page,(x,y,right,y+31),'[DATE]  ·  [TIME]',15,ink,'hebo',align)
    box(page,(x,y+39,right,y+69),'[VENUE]',16,ink,'helv',align)
    box(page,(x,y+89,right,y+119),'RSVP · [DETAILS]',11,ink,'helv',align)


for i,row in enumerate(ROWS):
    page = DOC.new_page(width=500,height=700)
    if i == 0:
        bg,ink,gold = '#142d46','#fff7e5','#f4bf50'
        rect(page,(0,0,500,700),bg)
        circle(page,250,170,108,gold)
        for a in range(0,360,20):
            r=math.radians(a)
            line(page,(250+119*math.cos(r),170+119*math.sin(r)),
                 (250+135*math.cos(r),170+135*math.sin(r)),gold,1)
        cap(page,250,165,1.15,bg,ink)
        box(page,(60,324,440,397),row['headline'],33,ink,'hebo')
        box(page,(60,419,440,463),'[GRADUATE NAME]',25,ink,'tiro')
        line(page,(201,482),(299,482),gold,2)
        details(page,513,ink)
    elif i == 1:
        bg,ink,accent='#fff7e8','#274d3e','#ce623a'
        rect(page,(0,0,500,700),bg)
        rect(page,(23,23,477,677),None,ink,1)
        for y in range(36,670,18):
            circle(page,23,y,4,bg,ink,.6)
            circle(page,477,y,4,bg,ink,.6)
        box(page,(57,56,315,84),'YOU ARE CORDIALLY INVITED',10,ink,'hebo',0)
        rect(page,(350,51,445,162),None,accent,1)
        cap(page,397,95,.5,accent,ink)
        box(page,(58,209,431,315),row['headline'],35,ink,'tiro',0)
        box(page,(58,338,441,392),'[GRADUATE NAME]',27,ink,'hebo',0)
        line(page,(58,423),(440,423),accent,1)
        box(page,(58,448,440,477),'A graduation celebration',14,ink,'tiit',0)
        details(page,513,ink,0,58,440)
    elif i == 2:
        bg,ink,gold='#e4eadd','#29493d','#9b793a'
        rect(page,(0,0,500,700),bg)
        for sign in (-1,1):
            stem=[(250+sign*(145-25*math.sin(k/7)),90+k*22) for k in range(9)]
            for k in range(len(stem)-1): line(page,stem[k],stem[k+1],gold,1)
            for k,(x,y) in enumerate(stem):
                page.draw_oval(fitz.Rect(x-17 if sign<0 else x,y-7,
                                       x if sign<0 else x+17,y+7),fill=rgb(ink),color=None)
        box(page,(125,125,375,157),'CLASS OF',13,ink,'helv')
        box(page,(105,168,395,235),'[YEAR]',49,ink,'tiro')
        box(page,(62,318,438,394),row['headline'],32,ink,'tiro')
        box(page,(60,415,440,456),'[GRADUATE NAME]',25,ink,'hebo')
        details(page,513,ink)
    elif i == 3:
        bg,ink,blue='#fcfcf8','#171717','#254bcd'
        rect(page,(0,0,500,700),bg)
        box(page,(29,37,472,123),'CLASS',87,ink,'hebo',0)
        box(page,(34,148,468,206),'[YEAR]',51,blue,'hebo',0)
        poly(page,[(0,248),(500,194),(500,245),(0,299)],blue)
        box(page,(42,332,457,411),row['headline'],31,ink,'hebo',0)
        box(page,(42,441,458,484),'[GRADUATE NAME]',24,ink,'hebo',0)
        details(page,523,ink,0,42,458)
        rect(page,(0,675,500,700),blue)
    elif i == 4:
        bg,ink,accent='#cee2e8','#203f52','#bc6c48'
        rect(page,(0,0,500,700),bg)
        rect(page,(35,35,465,665),'#fff9ed')
        circle(page,35,211,15,bg)
        circle(page,465,211,15,bg)
        line(page,(52,211),(448,211),ink,.8,'[3 5] 0')
        box(page,(62,65,436,89),'ADMIT ONE TO A NEW ADVENTURE',10,ink,'hebo')
        rect(page,(199,119,291,178),None,accent,2)
        rect(page,(225,109,265,119),None,accent,2)
        line(page,(217,123),(217,174),accent,2)
        line(page,(273,123),(273,174),accent,2)
        box(page,(65,260,435,338),row['headline'],33,ink,'tiro')
        box(page,(65,362,435,404),'[GRADUATE NAME]',25,ink,'hebo')
        box(page,(65,440,435,470),'Join us for a graduation party',14,ink,'tiit')
        details(page,505,ink)
    elif i == 5:
        bg,ink,gold='#252b4b','#f9f2e7','#d7b45f'
        rect(page,(0,0,500,700),bg)
        stars(page,gold)
        pts=[(160,180),(250,130),(340,180),(250,229),(160,180),(160,235),
             (250,271),(340,235),(340,180)]
        for j in range(len(pts)-1): line(page,pts[j],pts[j+1],gold,1)
        for x,y in pts:circle(page,x,y,2.7,gold)
        box(page,(65,321,435,405),row['headline'],34,ink,'tiro')
        box(page,(65,426,435,468),'[GRADUATE NAME]',24,'#d8c8ed','hebo')
        details(page,515,ink)
    elif i == 6:
        bg,ink,accent='#f7f2e8','#364b56','#ad845d'
        rect(page,(0,0,500,700),bg)
        line(page,(36,48),(36,538),accent,1)
        line(page,(464,48),(464,538),accent,1)
        box(page,(65,73,435,105),'A CELEBRATION OF ACHIEVEMENT',11,ink,'hebo')
        box(page,(68,153,432,259),row['headline'],35,ink,'tiro')
        box(page,(68,287,432,329),'[HONOREE NAME]',25,ink,'hebo')
        details(page,371,ink)
        poly(page,[(0,641),(116,540),(200,621),(312,514),(500,647),(500,700),(0,700)],'#c2cbd0')
        poly(page,[(0,681),(144,599),(229,655),(352,576),(500,656),(500,700),(0,700)],accent)
        poly(page,[(0,698),(175,651),(270,687),(412,619),(500,677),(500,700),(0,700)],ink)
    elif i == 7:
        bg,ink,accent='#652e3e','#fff3dd','#d5a8a4'
        rect(page,(0,0,500,700),bg)
        for x,y in [(211,122),(292,147)]:
            poly(page,[(x-35,y),(x+35,y),(x+18,y+30),(x-18,y+30)],None,accent,1.5)
            line(page,(x,y+30),(x,y+79),accent,1.5)
            line(page,(x-23,y+79),(x+23,y+79),accent,1.5)
        box(page,(61,286,439,370),row['headline'],37,ink,'tiro')
        box(page,(61,407,439,452),'[HONOREE NAME]',28,ink,'hebo')
        line(page,(70,478),(430,478),accent,1)
        details(page,514,ink)
    elif i == 8:
        bg,ink,red='#fff5e2','#254ea0','#c34f44'
        rect(page,(0,0,500,700),bg)
        for x,y,w,h,color in [(0,60,178,96,ink),(500,152,-190,98,red)]:
            poly(page,[(x,y),(x+w,y+h/2),(x,y+h)],color)
            line(page,(x+3 if w>0 else x-3,y-14),(x+3 if w>0 else x-3,y+h+25),color,2)
        box(page,(60,287,440,368),row['headline'],34,ink,'hebo')
        box(page,(60,390,440,429),'[STUDENT NAME]',26,ink,'tiro')
        box(page,(60,446,440,477),'[FUTURE SCHOOL]',16,red,'hebo')
        details(page,521,ink)
        for x,y in [(85,218),(424,89),(236,134),(442,265),(64,612)]:
            line(page,(x-4,y-5),(x+4,y+5),red,2)
    else:
        bg,ink,gold='#efe5d2','#2f6565','#c59b36'
        rect(page,(0,0,500,700),bg)
        box(page,(65,75,435,168),row['headline'],35,ink,'tiro')
        box(page,(65,203,435,246),'[GRADUATE NAME]',26,ink,'hebo')
        details(page,286,ink)
        circle(page,250,584,80,gold)
        for n in range(4):
            yy=520+n*10
            poly(page,[(250,561+n*10),(94-n*7,yy),(94-n*7,633+n*7),(250,665),
                       (406+n*7,633+n*7),(406+n*7,yy)],'#fff8e7',ink,.8)
        line(page,(250,561),(250,665),ink,1.5)
        for x0,x1 in [(118,230),(270,382)]:
            for y in [568,585,602]:line(page,(x0,y),(x1,y+17 if x0<250 else y-17),ink,.6)

DOC.set_metadata({'title':'DCB Graduation — 10 Invitation Templates',
                  'author':'TheDigitalCardBox original vector artwork',
                  'subject':'Editable invitation templates with placeholder event details'})
DOC.save(HERE/'graduation.pdf',garbage=4,deflate=True)
for i,page in enumerate(DOC):
    text=page.get_text()
    assert '[DATE]' in text and '[VENUE]' in text and 'RSVP' in text,(i,text)
    for word in page.get_text('words'):
        assert fitz.Rect(word[:4]) in page.rect,(i,word)
assert len(DOC)==10
print('Created graduation.pdf: 10 pages, separate editable vector text, all bounds checked')
