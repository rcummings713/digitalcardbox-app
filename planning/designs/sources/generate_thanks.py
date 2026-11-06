"""Eight original vector invitation templates; no external artwork or fonts.

Run with Python 3 and PyMuPDF. All wording is live PDF text, ornaments are
independent vector paths. Output is an authoring source for Canva import and
does not add templates to the application catalogue.
"""
from pathlib import Path
import json
import math
import fitz

HERE = Path(__file__).resolve().parent
BRIEFS = json.loads((HERE.parent / "canva-invitations-100-briefs.json").read_text())
THANKS = [t for t in BRIEFS["templates"] if t["category"] == "Thanks"]
DOC = fitz.open()
W, H = 360, 504


def c(h):
    return tuple(int(h[i:i+2], 16) / 255 for i in (1, 3, 5))


def rect(p, box, fill, stroke=None, width=1):
    p.draw_rect(fitz.Rect(box), color=c(stroke) if stroke else None,
                fill=c(fill) if fill else None, width=width)


def ellipse(p, box, fill=None, stroke=None, width=1):
    p.draw_oval(fitz.Rect(box), color=c(stroke) if stroke else None,
                fill=c(fill) if fill else None, width=width)


def line(p, a, b, color, width=1):
    p.draw_line(a, b, color=c(color), width=width)


def poly(p, pts, fill=None, stroke=None, width=1):
    p.draw_polyline(pts, fill=c(fill) if fill else None,
                    color=c(stroke) if stroke else None, width=width, closePath=True)


def bezier(p, pts, color, width=1):
    p.draw_bezier(*pts, color=c(color), width=width)


def text(p, words, box, size, color, font="tiro", align=1):
    # No silent text loss: reduce only when the declared box needs more space.
    while size >= 7:
        probe = p.new_shape()
        available = probe.insert_textbox(fitz.Rect(box), words, fontsize=size,
                                         fontname=font, color=c(color), align=align,
                                         lineheight=1.12)
        if available >= 0:
            probe.commit()
            return
        size -= .5
    raise ValueError(f"Text does not fit: {words}")


def leaf(p, x, y, dx, dy, color):
    s = p.new_shape()
    s.draw_bezier((x, y), (x + dx*.05 - dy*.3, y + dy*.05 + dx*.3),
                  (x + dx*.8 - dy*.4, y + dy*.8 + dx*.4), (x+dx, y+dy))
    s.draw_bezier((x+dx, y+dy), (x + dx*.8 + dy*.4, y + dy*.8 - dx*.4),
                  (x + dx*.05 + dy*.3, y + dy*.05 - dx*.3), (x,y))
    s.finish(fill=c(color), color=None)
    s.commit()


def flower(p, x, y, r, petals, core, count=6):
    for i in range(count):
        a = 2*math.pi*i/count
        leaf(p, x, y, math.cos(a)*r, math.sin(a)*r, petals)
    ellipse(p, (x-r*.16,y-r*.16,x+r*.16,y+r*.16), core)


def heart(p, x, y, r, fill):
    s=p.new_shape()
    s.draw_bezier((x,y+r*.8),(x-r*1.5,y-r*.15),(x-r*.75,y-r*1.2),(x,y-r*.35))
    s.draw_bezier((x,y-r*.35),(x+r*.75,y-r*1.2),(x+r*1.5,y-r*.15),(x,y+r*.8))
    s.finish(fill=c(fill),color=None);s.commit()


def sparkle(p,x,y,r,color):
    poly(p, [(x,y-r),(x+r*.22,y-r*.22),(x+r,y),(x+r*.22,y+r*.22),
             (x,y+r),(x-r*.22,y+r*.22),(x-r,y),(x-r*.22,y-r*.22)],color)


def page(bg):
    p=DOC.new_page(width=W,height=H)
    rect(p,(0,0,W,H),bg)
    return p


def details(p, y, ink, x=40, right=320, size=12, align=1):
    text(p,"[DATE] · [TIME]",(x,y,right,y+22),size,ink,"helv",align)
    text(p,"[VENUE]",(x,y+27,right,y+49),size,ink,"helv",align)


def gratitude_table():
    cream,forest,rust="#FFF5E7","#284C3F","#AE523B"
    p=page(cream)
    text(p,"WITH WARM APPRECIATION",(30,37,330,55),9,forest,"helv")
    text(p,"A gathering to\nsay thank you",(28,72,332,164),34,forest,"tiit")
    text(p,"[HOST NAME]",(32,191,328,216),17,forest,"tiro")
    details(p,232,forest)
    # A richly set dinner table spans the page, with four place settings.
    rect(p,(40,333,320,402),"#EFC8AC")
    for xx in range(44,320,12):
        line(p,(xx,334),(xx,402),"#D4A58E",.55)
    for yy in range(337,402,10):
        line(p,(40,yy),(320,yy),"#D4A58E",.4)
    for x in [83,145,215,277]:
        ellipse(p,(x-18,346,x+18,382),cream,forest,.65)
        ellipse(p,(x-13,351,x+13,377),None,rust,.65)
        line(p,(x-23,346),(x-23,382),forest,1)
        for dx in [-2,0,2]:line(p,(x-23+dx,346),(x-23+dx,353),forest,.7)
        line(p,(x+23,346),(x+23,382),forest,1)
        ellipse(p,(x-8,320,x+8,335),None,forest,.8)
        line(p,(x,335),(x,341),forest,.8)
        line(p,(x-5,341),(x+5,341),forest,.8)
    for x,y in [(62,315),(300,315),(177,338)]:
        line(p,(x,y),(x,y-27),forest,1)
        flower(p,x,y-30,10,rust,"#D9A44A")
        leaf(p,x,y-8,-9,-9,forest);leaf(p,x,y-14,8,-8,forest)
    for x in [51,309]:
        poly(p,[(x-12,408),(x+12,408),(x+16,422),(x-16,422)],forest)
    text(p,"A seat at the table, just for you.",(30,432,330,450),10,forest,"tiit")
    text(p,"RSVP [DETAILS]",(30,465,330,484),10,forest,"helv")


def bouquet_for_you():
    blush,wine,sage="#F9E7E3","#65293B","#728674"
    p=page(blush)
    rect(p,(17,17,343,487),None,wine,.6)
    text(p,"YOU'RE INVITED",(154,53,322,71),9,wine,"helv",0)
    text(p,"With\ngratitude",(150,87,330,185),32,wine,"tiro",0)
    line(p,(155,207),(315,207),wine,.6)
    text(p,"[HOST NAME]",(155,232,324,257),15,wine,"tibo",0)
    details(p,280,wine,155,324,10.5,0)
    text(p,"RSVP [DETAILS]",(155,363,324,385),9.5,wine,"helv",0)
    # Large wrapped bouquet, open around the word column.
    poly(p,[(30,206),(146,215),(113,410),(88,399)],"#D8B4A5")
    poly(p,[(29,206),(94,257),(113,410),(70,361)],"#E8C7B4")
    poly(p,[(146,215),(94,257),(113,410),(138,326)],"#C39388")
    for x,y in [(51,126),(96,88),(126,143),(71,184),(30,171),(111,194)]:
        line(p,(x,y),(109,349),sage,1.2)
        leaf(p,x+(109-x)*.35,y+(349-y)*.35,-22,-8,sage)
        leaf(p,x+(109-x)*.52,y+(349-y)*.52,19,-14,sage)
    for x,y,r,col in [(51,126,30,"#B35A71"),(96,88,26,wine),
                      (126,143,28,"#C67783"),(71,184,29,"#E6A5A7"),
                      (30,171,20,wine),(111,194,23,"#B35A71")]:
        flower(p,x,y,r,col,"#E4B86F",7)
    bezier(p,[(100,344),(62,318),(63,371),(106,349)],wine,2)
    bezier(p,[(106,349),(143,315),(151,360),(110,351)],wine,2)
    line(p,(106,349),(91,386),wine,2);line(p,(110,351),(133,383),wine,2)
    text(p,"BOUQUET FOR YOU",(30,449,330,467),9,wine,"helv")


def good_company():
    peach,espresso,butter="#F5D2BA","#533627","#FFF2CC"
    p=page(peach)
    # An original scalloped cafe mat.
    rect(p,(31,31,329,473),butter)
    for x in range(39,329,16):
        ellipse(p,(x-8,23,x+8,39),butter);ellipse(p,(x-8,465,x+8,481),butter)
    for y in range(39,473,16):
        ellipse(p,(23,y-8,39,y+8),butter);ellipse(p,(321,y-8,337,y+8),butter)
    rect(p,(41,41,319,463),None,espresso,.65)
    text(p,"GOOD COMPANY BRUNCH",(46,56,314,74),9,espresso,"helv")
    text(p,"Thank you,\nlet's brunch",(45,86,315,168),31,espresso,"tiit")
    # Espresso cup, saucer, steam and a generous croissant.
    ellipse(p,(169,235,280,257),"#E8AF7B",espresso,.8)
    ellipse(p,(190,227,260,245),None,espresso,.5)
    bezier(p,[(211,184),(211,167),(231,168),(218,150)],espresso,.9)
    bezier(p,[(235,185),(235,170),(255,174),(243,157)],espresso,.9)
    ellipse(p,(248,195,281,225),None,espresso,2)
    poly(p,[(192,197),(254,197),(248,236),(203,236)],"#FFF7E0",espresso,1.2)
    ellipse(p,(191,189,255,207),"#754A32",espresso,1)
    ellipse(p,(200,194,246,202),"#C78C5A")
    s=p.new_shape()
    s.draw_bezier((65,253),(82,207),(117,207),(152,245))
    s.draw_bezier((152,245),(146,273),(131,281),(121,260))
    s.draw_bezier((121,260),(102,239),(89,252),(81,270))
    s.draw_bezier((81,270),(72,275),(61,269),(65,253))
    s.finish(fill=c("#CF8747"),color=c(espresso),width=.8);s.commit()
    for xx,yy in [(82,237),(101,226),(120,229),(138,243)]:
        bezier(p,[(xx,yy),(xx+4,yy+9),(xx+4,yy+18),(xx,yy+24)],"#9D5B2F",1)
    text(p,"[HOST NAME]",(48,302,312,327),17,espresso,"tibo")
    details(p,349,espresso,size=11)
    text(p,"RSVP [DETAILS]",(48,425,312,446),10,espresso,"helv")


def appreciation_bloom():
    lavender,ivory,green="#CAB9DA","#FFF9EB","#214E3B"
    p=page(lavender)
    # Full-bleed flower shapes surround a clean oval of text.
    for x,y,r,col in [(45,87,89,"#815C9C"),(330,367,92,"#8F6DA7"),
                      (25,388,74,"#A78BBE"),(315,80,62,"#D8CAE5")]:
        flower(p,x,y,r,col,"#F2C75C",8)
    leaf(p,25,275,41,-119,green);leaf(p,294,297,55,-81,green)
    leaf(p,54,451,99,26,green);leaf(p,221,37,81,-14,green)
    ellipse(p,(49,83,311,424),ivory)
    text(p,"APPRECIATION IN BLOOM",(65,113,295,133),8.5,green,"helv")
    text(p,"Celebrating\nthe people\nwho care",(68,158,292,272),27,green,"hebo")
    text(p,"[HOST NAME]",(71,290,289,314),15,green,"helv")
    details(p,330,green,71,289,10)
    text(p,"RSVP [DETAILS]",(71,389,289,408),9,green,"helv")


def coupe(p,x,y,sign,ink,fill):
    # Each open glass is a closed vector bowl with a long elegant stem.
    s=p.new_shape()
    s.draw_bezier((x-42,y),(x-32,y+44),(x+32,y+44),(x+42,y))
    s.draw_line((x+42,y),(x-42,y))
    s.finish(color=c(ink),fill=c(fill),width=1.2);s.commit()
    ellipse(p,(x-42,y-8,x+42,y+8),None,ink,1)
    line(p,(x,y+33),(x+sign*8,y+105),ink,1.5)
    line(p,(x-24+sign*8,y+106),(x+24+sign*8,y+106),ink,1.5)
    for xx,yy in [(x-14,y+12),(x+6,y+22),(x+17,y+7)]:
        ellipse(p,(xx-1.7,yy-1.7,xx+1.7,yy+1.7),ink)


def toast_of_thanks():
    navy,gold,white="#162F46","#E3C281","#FFF7E8"
    p=page(navy)
    rect(p,(22,22,338,482),None,gold,.65)
    text(p,"A TOAST OF THANKS",(34,42,326,62),9,gold,"helv")
    text(p,"Here's\nto you",(34,77,326,190),48,white,"tiro")
    text(p,"[HOST NAME]",(34,213,326,238),17,white,"tiit")
    coupe(p,124,276,-1,gold,"#324A55")
    coupe(p,234,261,1,gold,"#324A55")
    for x,y,r in [(180,273,8),(79,256,5),(285,295,6),(190,330,4),(176,248,4)]:
        sparkle(p,x,y,r,gold)
    details(p,408,white,size=11)
    text(p,"RSVP [DETAILS]",(35,463,325,481),9,gold,"helv")


def community_sunshine():
    yellow,coral,cream,ink="#F1BD37","#D6684E","#FFF6DF","#683723"
    p=page(cream)
    # Paper-cut sun, twenty-four long rays and surrounding heart confetti.
    x,y=180,133
    for i in range(24):
        a=2*math.pi*i/24
        pts=[]
        for angle,r in [(a-.05,69),(a,108 if i%2 else 99),(a+.05,69)]:
            pts.append((x+math.cos(angle)*r,y+math.sin(angle)*r))
        poly(p,pts,yellow)
    ellipse(p,(116,69,244,197),yellow)
    heart(p,180,129,25,coral)
    for xx,yy,r in [(51,248,13),(310,240,11),(46,438,8),(311,431,9)]:
        heart(p,xx,yy,r,coral)
    text(p,"A little thanks,\na lot of heart",(39,261,321,335),28,ink,"hebo")
    text(p,"[HOST NAME]",(50,356,310,379),16,ink,"helv")
    details(p,398,ink,size=11)
    text(p,"RSVP [DETAILS]",(40,464,320,482),9.5,ink,"helv")


def volunteer_garden():
    oat,sage,rust,ink="#F5EDD9","#71846B","#B0573F","#324839"
    p=page(oat)
    text(p,"VOLUNTEER APPRECIATION",(35,38,325,57),9,ink,"helv")
    text(p,"Thank you for\nhelping us grow",(31,81,329,169),32,ink,"tiro")
    text(p,"[HOST NAME]",(40,202,320,227),17,ink,"tiit")
    details(p,245,ink,size=11)
    text(p,"RSVP [DETAILS]",(40,311,320,333),10,ink,"helv")
    # Large watering can and a growing garden along the bottom.
    poly(p,[(56,381),(145,381),(136,443),(67,443)],rust)
    ellipse(p,(111,351,165,406),None,rust,7)
    poly(p,[(55,400),(25,367),(19,373),(51,423)],rust)
    ellipse(p,(48,375,150,392),"#C77354",ink,.6)
    poly(p,[(20,366),(16,371),(24,382),(30,377)],sage)
    for xx,yy in [(18,390),(26,401),(14,410),(31,418)]:
        ellipse(p,(xx,yy,xx+2,yy+5),sage)
    line(p,(60,453),(324,453),sage,1)
    for xx,yy,rr in [(191,383,24),(243,366,31),(301,395,21)]:
        line(p,(xx,450),(xx,yy),ink,1.4)
        leaf(p,xx,426,-25,-20,sage);leaf(p,xx,414,22,-26,sage)
        flower(p,xx,yy,rr,"#D4A249","#8D5138",7)
    for xx in [173,218,274,327]:
        line(p,(xx,451),(xx,428),sage,1)
        leaf(p,xx,439,-10,-9,sage);leaf(p,xx,435,10,-10,sage)
    text(p,"GOOD THINGS GROW TOGETHER",(40,473,320,488),8,ink,"helv")


def kindness_post():
    cream,cobalt,cherry="#FFF6E7","#22479E","#BE413E"
    p=page(cream)
    # Airmail bars form a graphic edge, with ample safe margins.
    for x in range(-8,360,28):
        poly(p,[(x,0),(x+12,0),(x+26,12),(x+14,12)],cobalt)
        poly(p,[(x,492),(x+12,492),(x+26,504),(x+14,504)],cherry)
    for y in range(14,492,28):
        poly(p,[(0,y),(12,y+14),(12,y+26),(0,y+12)],cherry)
        poly(p,[(348,y),(360,y+14),(360,y+26),(348,y+12)],cobalt)
    text(p,"KINDNESS POST",(35,40,258,60),10,cobalt,"helv",0)
    text(p,"Good people\ndeserve a\ncelebration",(35,80,325,203),32,cobalt,"tibo",0)
    text(p,"[HOST NAME]",(35,222,325,246),17,cobalt,"tiit",0)
    details(p,263,cobalt,35,325,11,0)
    # The envelope is an illustration, with separate text outside its paper.
    rect(p,(52,348,303,435),"#F0DDBF",cobalt,1)
    poly(p,[(52,348),(177,412),(303,348)],"#FFF9ED",cobalt,1)
    poly(p,[(52,435),(143,384),(177,412),(210,384),(303,435)],"#EAD1AC",cobalt,.6)
    heart(p,177,402,12,cherry)
    # Postage stamp at the upper-right, made of original vector edges and heart.
    rect(p,(278,28,327,73),cream,cobalt,.9)
    for xx in range(282,327,7):
        ellipse(p,(xx-2,26,xx+2,30),cream);ellipse(p,(xx-2,71,xx+2,75),cream)
    for yy in range(33,73,7):
        ellipse(p,(276,yy-2,280,yy+2),cream);ellipse(p,(325,yy-2,329,yy+2),cream)
    heart(p,302,50,11,cherry)
    text(p,"RSVP [DETAILS]",(35,462,325,482),10,cobalt,"helv")


DRAWERS=[gratitude_table,bouquet_for_you,good_company,appreciation_bloom,
         toast_of_thanks,community_sunshine,volunteer_garden,kindness_post]
for brief,draw in zip(THANKS,DRAWERS):
    draw()
DOC.set_metadata({"title":"DigitalCardBox · Thanks · 8 original invitation templates",
                  "author":"DigitalCardBox",
                  "subject":"Original vector illustrations with editable invitation text",
                  "keywords":", ".join(t["title"] for t in THANKS)})
OUTPUT=HERE/"thanks.pdf"
DOC.save(OUTPUT,garbage=4,deflate=True)
DOC.close()

# Source validation checks that required placeholders survived and all text is
# on-canvas. Source illustrations use vector paths, with no raster dependence.
check=fitz.open(OUTPUT)
assert len(check)==8
for n,p in enumerate(check):
    contents=p.get_text()
    for required in ["[HOST NAME]","[DATE]","[TIME]","[VENUE]","RSVP [DETAILS]"]:
        assert required in contents,(n+1,required,contents)
    for block in p.get_text("dict")["blocks"]:
        if block["type"]!=0:continue
        for ln in block["lines"]:
            for span in ln["spans"]:
                r=fitz.Rect(span["bbox"])
                assert r.x0>=16 and r.y0>=16 and r.x1<=344 and r.y1<=492,(n+1,span)
    assert len(p.get_drawings())>20
    assert not p.get_images()
print(f"Validated {len(check)} vector pages, separate text, bounded placeholders: {OUTPUT}")
