# -*- coding: utf-8 -*-
"""สร้างชุดภาพของเกม (assets.js) — ตัวละคร chibi สไตล์ A ชุดไทยโบราณ + ของประกอบฉาก
รัน:  python tools/gen_assets.py     (ได้ไฟล์ assets.js ที่โฟลเดอร์หลัก)
ตัวละครแยกเป็น 2 ชั้น: ขา (ยืน/ก้าวซ้าย/ก้าวขวา) กับ ตัวท่อนบน (ตามมุมมองและท่า) เกมเอามาซ้อนกันแล้วขยับ
"""
import io, os, json, math, random

OLC, OLW = '#33211f', 5.5
SKIN, GOLD, SH = '#f7d3ae', '#f2c14e', '#1a0f33'

def P(d, fill, sw=None, stroke=None, op=1):
    w = OLW if sw is None else sw
    st = f'stroke="{stroke or OLC}" stroke-width="{w}"' if w else 'stroke="none"'
    return f'<path d="{d}" fill="{fill}" {st} opacity="{op}" stroke-linejoin="round" stroke-linecap="round"/>'
def E(cx, cy, rx, ry, fill, sw=0, op=1):
    st = f'stroke="{OLC}" stroke-width="{sw}"' if sw else 'stroke="none"'
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {st} opacity="{op}"/>'
def L(d, stroke=None, sw=None, op=1):
    return f'<path d="{d}" fill="none" stroke="{stroke or OLC}" stroke-width="{sw or OLW}" opacity="{op}" stroke-linecap="round" stroke-linejoin="round"/>'
def G(inner, x=0, y=0, s=1, flip=False, rot=0):
    return f'<g transform="translate({x},{y}) rotate({rot}) scale({-s if flip else s},{s})">{inner}</g>'

DEFS = '''<defs>
<radialGradient id="glow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
<pattern id="pakama" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f4ead8"/><rect width="7" height="7" fill="#c9483a"/><rect x="7" y="7" width="7" height="7" fill="#c9483a"/><rect x="7" width="7" height="7" fill="#e79a8a"/><rect y="7" width="7" height="7" fill="#e79a8a"/></pattern>
<clipPath id="hc"><path d="M-98,-205 C-101,-270 -52,-306 0,-306 C52,-306 101,-270 98,-205 C96,-150 54,-122 0,-122 C-54,-122 -96,-150 -98,-205Z"/></clipPath>
<pattern id="weave" width="14" height="12" patternUnits="userSpaceOnUse"><rect width="14" height="12" fill="#c98f55"/><path d="M0,3 H14 M0,9 H14" stroke="#8a5a30" stroke-width="1.6"/><path d="M4,0 V12 M11,0 V12" stroke="#e0b377" stroke-width="2" opacity=".7"/></pattern>
</defs>'''

# ================================================================ ตัวละคร
HEAD = 'M-98,-205 C-101,-270 -52,-306 0,-306 C52,-306 101,-270 98,-205 C96,-150 54,-122 0,-122 C-54,-122 -96,-150 -98,-205Z'
BODY = 'M-38,-116 C-47,-92 -49,-62 -43,-36 C-22,-27 22,-27 43,-36 C49,-62 47,-92 38,-116 C20,-124 -20,-124 -38,-116Z'
CAP = 'M-102,-208 C-106,-276 -56,-314 0,-314 C56,-314 106,-276 102,-208 C100,-152 56,-122 0,-122 C-56,-122 -100,-152 -102,-208Z'

def flower(col='#fff', mid='#ffc531'):
    s = ''
    for i in range(5): s += f'<g transform="rotate({i*72})">' + P('M0,0 C-9,-7 -9,-20 0,-24 C9,-20 9,-7 0,0Z', col, 2.5) + '</g>'
    return s + E(0, 0, 6, 6, mid, 2.5)
def krathong(lit=True, glowing=True):
    s = E(0, -64, 30, 30, 'url(#glow)') if (lit and glowing) else ''
    for i in range(-3, 4): s += P(f'M{i*13-9},-4 C{i*13-9},-20 {i*16},-30 {i*17},-34 C{i*16+3},-28 {i*13+9},-20 {i*13+9},-4Z', '#5cb85a', 3)
    s += P('M-50,-6 C-50,14 50,14 50,-6 C30,2 -30,2 -50,-6Z', '#3f8f45', 3.5)
    for x, c in ((-22, '#c95be0'), (0, '#ffb52e'), (22, '#ff8fb0')): s += E(x, -14, 8, 7, c, 2.5)
    s += L('M-12,-18 L-15,-46 M12,-18 L15,-46', '#a8703c', 2.5) + P('M-4,-20 L-4,-46 L4,-46 L4,-20Z', '#fff6dc', 2.5)
    if lit: s += P('M0,-46 C-7,-56 -3,-64 0,-70 C3,-64 7,-56 0,-46Z', '#ffb03a', 2, '#e07a1e') + E(-15, -48, 2.6, 2.6, '#ff7a3a') + E(15, -48, 2.6, 2.6, '#ff7a3a')
    return s
def face(expr):
    ey = -196
    s = E(-64, -176, 15, 9, '#ff9aa6', op=.7) + E(64, -176, 15, 9, '#ff9aa6', op=.7)
    for ex in (-40, 40):
        f = 1 if ex > 0 else -1
        if expr in ('laugh', 'happy'): s += L(f'M{ex-12},{ey+4} Q{ex},{ey-12} {ex+12},{ey+4}')
        elif expr == 'pray': s += L(f'M{ex-12},{ey-2} Q{ex},{ey+10} {ex+12},{ey-2}')
        else: s += E(ex, ey, 8, 11.5, '#2a1a18') + E(ex - 2.4, ey - 4.5, 2.6, 3, '#fff')
        if expr == 'smug': s += L(f'M{ex-13*f},{ey-22} L{ex+11*f},{ey-30}', sw=5)
        elif expr in ('o', 'eat'): s += L(f'M{ex-12},{ey-30} Q{ex},{ey-38} {ex+12},{ey-30}', sw=5)
        else: s += L(f'M{ex-11},{ey-27} Q{ex},{ey-32} {ex+11},{ey-27}', sw=5)
    if expr == 'laugh': s += P('M-20,-173 Q0,-136 20,-173Z', '#c9483a') + E(0, -157, 9, 5, '#ff9a9a')
    elif expr == 'o': s += E(0, -162, 7, 9, '#a8483a', 4)
    elif expr == 'eat': s += E(0, -160, 11, 10, '#a8483a', 4)
    elif expr == 'smug': s += L('M-16,-166 Q-8,-156 0,-166 Q8,-156 16,-166')
    elif expr == 'pray': s += L('M-8,-166 Q0,-160 8,-166')
    else: s += L('M-15,-169 Q0,-153 15,-169')
    return s
def stubble(full=False):
    if full: return P(HEAD, '#4a3a3a', 0, op=.13)
    return P('M-95,-216 C-97,-276 -52,-303 0,-303 C52,-303 97,-276 95,-216 C60,-236 -60,-236 -95,-216Z', '#4a3a3a', 0, op=.13)
def hair_front(kind, c):
    lw = OLW
    if kind == 'mahadthai': return stubble() + P('M-64,-266 C-60,-314 60,-314 64,-266 C40,-258 -40,-258 -64,-266Z', c) + L('M-34,-292 C-16,-300 16,-300 34,-292', '#fff', 6, .2)
    if kind == 'peek':
        s = P('M-93,-230 C-91,-298 -44,-315 0,-315 C44,-315 91,-298 93,-230 C74,-254 34,-264 0,-262 C-34,-264 -74,-254 -93,-230Z', c)
        for f in (-1, 1): s += P(f'M{91*f},-240 C{100*f},-224 {98*f},-200 {88*f},-184 C{84*f},-202 {84*f},-222 {81*f},-238Z', c, lw * .7)
        return s + L('M-52,-288 C-26,-300 26,-300 52,-288', '#fff', 6, .2)
    if kind == 'juk':
        s = stubble() + E(0, -322, 25, 23, c, lw) + L('M-34,-330 L34,-316', GOLD, 5)
        for i in range(7): s += E(-21 + i * 7, -302 - (3 - abs(i - 3)) * 1.4, 4.6, 4.6, '#fff', 1.6)
        return s
    if kind == 'queue': return P('M-86,-248 C-82,-306 82,-306 86,-248 C50,-262 -50,-262 -86,-248Z', '#2a2230') + L('M-84,-250 C-50,-264 50,-264 84,-250', '#c9483a', 4) + E(0, -305, 9, 8, '#c9483a', 3)
    if kind in ('long', 'muay', 'braid'):
        s = P('M-101,-212 C-105,-282 -54,-314 0,-314 C54,-314 105,-282 101,-212 C92,-238 58,-264 5,-272 L0,-262 L-5,-272 C-58,-264 -92,-238 -101,-212Z', c)
        for f in (-1, 1): s += P(f'M{97*f},-236 C{106*f},-212 {104*f},-176 {92*f},-150 C{86*f},-176 {86*f},-210 {84*f},-236Z', c, lw * .7)
        if kind == 'braid':
            for i in range(5): s += E(86 - i * 4, -146 + i * 20, 13 - i * .8, 13, c, lw * .8)
            s += P('M60,-58 L80,-66 L84,-46 L70,-50 L62,-40Z', '#e2574a', lw * .7)
        return s + L('M-56,-288 C-30,-300 -10,-302 -4,-300 M56,-288 C30,-300 10,-302 4,-300', '#fff', 6, .2)
    return stubble()
def hair_back_view(kind, c):
    shine = L('M-60,-282 C-30,-298 30,-298 60,-282', '#fff', 7, .2)
    if kind == 'mahadthai': return stubble(True) + P('M-64,-262 C-60,-314 60,-314 64,-262 C40,-246 -40,-246 -64,-262Z', c)
    if kind == 'peek': return P('M-97,-214 C-101,-290 -50,-315 0,-315 C50,-315 101,-290 97,-214 C82,-174 40,-158 0,-158 C-40,-158 -82,-174 -97,-214Z', c) + shine
    if kind == 'juk':
        s = stubble(True) + E(0, -322, 25, 23, c, OLW) + L('M-34,-316 L34,-330', GOLD, 5)
        for i in range(7): s += E(-21 + i * 7, -302 - (3 - abs(i - 3)) * 1.4, 4.6, 4.6, '#fff', 1.6)
        return s
    if kind == 'queue':
        s = P('M-11,-256 C-15,-200 -13,-140 -8,-92 L8,-92 C13,-140 15,-200 11,-256Z', '#2a1a18') + L('M-10,-210 L10,-206 M-10,-170 L10,-166 M-9,-130 L9,-126', '#555', 2)
        return s + P('M-88,-236 C-84,-306 84,-306 88,-236 C50,-222 -50,-222 -88,-236Z', '#2a2230') + L('M-86,-238 C-50,-224 50,-224 86,-238', '#c9483a', 4) + E(0, -305, 9, 8, '#c9483a', 3)
    if kind == 'long':
        s = P('M-106,-220 C-112,-292 -56,-318 0,-318 C56,-318 112,-292 106,-220 C116,-150 110,-92 88,-58 C62,-46 -62,-46 -88,-58 C-110,-92 -116,-150 -106,-220Z', c)
        return s + L('M-40,-250 C-46,-190 -48,-120 -40,-64 M0,-262 L0,-56 M40,-250 C46,-190 48,-120 40,-64', sw=2.2, op=.35) + shine
    if kind == 'muay': return E(0, -324, 40, 30, c, OLW) + L('M-52,-318 L52,-336', GOLD, 6) + P(CAP, c) + shine
    if kind == 'braid':
        s = P(CAP, c)
        for i in range(5): s += E(0, -128 + i * 19, 13 - i * .8, 13, c, OLW * .8)
        return s + P('M-12,-40 L12,-40 L8,-22 L0,-30 L-8,-22Z', '#e2574a', OLW * .7) + shine
    return stubble(True)
def foot(x, y, bare):
    d = f'M{x-17},{y-6} C{x-20},{y-17} {x+20},{y-17} {x+17},{y-6} C{x+20},{y+4} {x-20},{y+4} {x-17},{y-6}Z'
    if bare: return P(d, SKIN) + L(f'M{x-5},{y} L{x-5},{y-5} M{x+4},{y} L{x+4},{y-5}', sw=2.2)
    return P(d, '#3a2a2a')
def arm_down(col): return P('M-36,-110 C-58,-106 -68,-86 -66,-66 C-64,-54 -48,-54 -46,-66 C-46,-80 -42,-90 -34,-94Z', col) + E(-56, -60, 11, 11, SKIN, OLW)
def arm_up(col): return P('M-36,-110 C-60,-112 -78,-128 -80,-148 C-78,-160 -62,-158 -60,-148 C-58,-134 -48,-124 -34,-122Z', col) + E(-72, -154, 11, 11, SKIN, OLW)
def arm_mid(col): return P('M-38,-108 C-54,-100 -54,-80 -40,-72 C-30,-68 -22,-76 -26,-84 C-30,-90 -32,-98 -30,-104Z', col) + E(-28, -76, 11, 11, SKIN, OLW)
def arm_eat(col): return P('M-36,-110 C-58,-112 -70,-126 -66,-142 C-62,-152 -48,-150 -46,-142 C-46,-134 -42,-128 -34,-122Z', col) + E(-56, -148, 11, 11, SKIN, OLW)

def legs(o, walk=0):
    g = o.get; ex = g('ex', ()); bare = g('feet', 'bare') == 'bare'; longb = g('bottom') in ('nung', 'monk'); s = ''
    for i, x in enumerate((-19, 19)):
        up = walk == i + 1; lift = 11 if up else 0; dx = ((-5, 5)[i]) if up else 0
        if not longb: s += P(f'M{x-11},-40 L{x-10+dx},{-10-lift} C{x-10+dx},{-3-lift} {x+10+dx},{-3-lift} {x+10+dx},{-10-lift} L{x+11},-40Z', '#fffaf2' if 'stocking' in ex else SKIN)
        s += foot(x + dx, -lift, bare)
        if 'anklet' in ex and not longb: s += L(f'M{x-10+dx},{-15-lift} L{x+10+dx},{-15-lift}', GOLD, 4.5)
    return s
def upper(o, view='f', pose='stand', expr=None):
    g = o.get; ex = g('ex', ()); lw = OLW; back = view == 'b'; side = view == 's'
    torso, bottom, bc, top, sc = g('torso', 'bare'), g('bottom', 'kraben'), g('bc', '#3f5a8a'), g('top', '#fff'), g('sc', GOLD)
    hk, hc = g('hair'), g('hc', '#2e2422'); expr = expr or g('expr', 'smile'); s = ''
    cloth_top = torso in ('jacket', 'chinese')
    sl = top if cloth_top else SKIN; sr = '#e8912a' if torso == 'monk' else sl
    if back: sl, sr = sr, sl
    if not back:
        if hk == 'queue': s += P('M56,-252 C92,-232 100,-170 86,-108 C82,-98 70,-102 72,-114 C82,-168 74,-222 48,-240Z', '#2a1a18') + L('M70,-200 L84,-196 M76,-170 L88,-166 M76,-140 L88,-136', '#555', 2)
        if hk == 'long': s += P('M-106,-220 C-112,-292 -56,-318 0,-318 C56,-318 112,-292 106,-220 C116,-150 110,-92 88,-58 C62,-46 -62,-46 -88,-58 C-110,-92 -116,-150 -106,-220Z', hc) + L('M-70,-120 C-74,-100 -72,-80 -66,-64 M70,-120 C74,-100 72,-80 66,-64', sw=2.2, op=.35)
        if hk == 'muay': s += E(0, -324, 40, 30, hc, lw) + L('M-52,-336 L52,-318', GOLD, 6) + E(54, -318, 6, 6, '#e2574a', 2.5)
        if torso == 'sabai': s += P('M-40,-112 C-58,-100 -66,-64 -60,-30 L-45,-33 C-50,-64 -44,-92 -30,-106Z', sc)
    elif pose in ('hold', 'wai'): s += arm_mid(sl) + G(arm_mid(sr), flip=True)
    pre_body = s; s = ''
    s += P(BODY, top if cloth_top else SKIN)
    if not cloth_top and torso == 'bare' and not back: s += L('M-3,-52 Q0,-49 3,-52', sw=2.2, op=.6)
    if torso in ('sabai', 'wrap'): s += P('M-46,-104 C-20,-96 20,-96 46,-104 L47,-70 C20,-62 -20,-62 -47,-70Z', top)
    if bottom == 'kraben':
        s += P('M-45,-70 C-55,-56 -57,-40 -51,-27 C-36,-21 -16,-23 -6,-29 L0,-41 L6,-29 C16,-23 36,-21 51,-27 C57,-40 55,-56 45,-70 C28,-63 -28,-63 -45,-70Z', bc)
        s += P('M-8,-67 L8,-67 L5,-41 L0,-41 L-5,-41Z', '#fff', 0, op=.22) + L('M-24,-62 L-9,-34 M24,-62 L9,-34 M-36,-58 L-26,-32 M36,-58 L26,-32', sw=2, op=.4)
    elif bottom == 'nung':
        s += P('M-45,-70 C-53,-42 -54,-22 -50,-9 C-30,-2 30,-2 50,-9 C54,-22 53,-42 45,-70 C28,-63 -28,-63 -45,-70Z', bc)
        if not back: s += P('M-11,-66 L11,-66 L14,-7 L-14,-7Z', '#fff', 0, op=.2) + L('M-4,-64 L-5,-8 M4,-64 L5,-8', sw=2, op=.45)
        if 'hem' in ex: s += P('M-52,-22 C-30,-14 30,-14 52,-22 L50,-9 C30,-2 -30,-2 -50,-9Z', GOLD, lw * .7) + L('M-40,-13 L-34,-9 M-20,-10 L-14,-6 M0,-9 L6,-5 M20,-10 L26,-7', '#b9722a', 2)
    elif bottom == 'pants':
        s += P('M-45,-68 C-51,-40 -49,-22 -45,-12 C-30,-7 -12,-7 -4,-12 L0,-42 L4,-12 C12,-7 30,-7 45,-12 C49,-22 51,-40 45,-68 C28,-61 -28,-61 -45,-68Z', bc)
    if cloth_top:
        s += P('M-38,-116 C-47,-94 -49,-74 -47,-58 C-22,-50 22,-50 47,-58 C49,-74 47,-94 38,-116 C20,-124 -20,-124 -38,-116Z', top)
        s += P('M-14,-125 L14,-125 L12,-112 L-12,-112Z', top, lw * .7)
        if back: s += L('M0,-112 L0,-56', sw=2.2, op=.4)
        elif torso == 'jacket': s += ''.join(E(0, y, 3.6, 3.6, GOLD, 2) for y in (-104, -92, -80, -68))
        else: s += L('M0,-112 L0,-54', sw=2.2) + ''.join(L(f'M-9,{y} L9,{y}', '#f6e3b8', 4) + E(0, y, 3, 3, '#f6e3b8', 1.5) for y in (-100, -84, -68))
    if torso == 'monk':
        robe = P('M40,-114 C24,-124 6,-124 -8,-118 L-47,-72 C-54,-44 -54,-22 -50,-9 C-30,-2 30,-2 50,-9 C54,-30 53,-80 40,-114Z', '#e8912a')
        robe += L('M-4,-114 C-20,-90 -30,-58 -34,-10 M12,-118 C2,-80 -6,-40 -8,-6 M30,-110 C26,-70 24,-30 24,-6', '#a85c12', 2.5, .7)
        robe += P('M20,-121 C32,-121 40,-117 42,-110 L38,-58 L22,-58Z', '#d47a1a', lw * .7)
        s += G(robe, flip=True) if back else robe
    if torso == 'sabai':
        d = P('M-38,-114 C-30,-121 -20,-123 -12,-122 L47,-76 L47,-58 L34,-58Z', sc)
        if 'trim' in ex: d += L('M-30,-112 L40,-60 M-16,-120 L46,-70', '#fff6c8', 2.2, .9)
        if back: d += P('M-40,-114 C-50,-90 -50,-60 -44,-36 L-28,-38 C-34,-62 -32,-90 -24,-112Z', sc)
        s += G(d, flip=True) if back else d
    if 'pakama' in ex: s += P('M-47,-76 C-20,-68 20,-68 47,-76 L47,-61 C20,-53 -20,-53 -47,-61Z', 'url(#pakama)', lw * .7) + (P('M28,-64 L46,-32 L32,-28 L22,-58Z', 'url(#pakama)', lw * .7) if not back else '')
    if 'belt' in ex: s += P('M-47,-74 C-20,-66 20,-66 47,-74 L47,-63 C20,-55 -20,-55 -47,-63Z', GOLD, lw * .7) + (E(0, -61, 8, 7, '#fff3b0', 2.5) if not back else '')
    if not back:
        if 'necklace' in ex: s += L('M-24,-119 Q0,-94 24,-119', GOLD, 4.5) + E(0, -105, 5, 6, '#e2574a', 2)
        if 'amulet' in ex: s += L('M-22,-119 Q0,-98 22,-119', '#8a5a34', 2.5) + P('M-6,-106 L6,-106 L4,-94 L-4,-94Z', GOLD, 2)
    if 'hab' in ex:
        s += L('M-118,-114 L118,-114', '#8a5a34', 9) + L('M-118,-114 L118,-114', '#c9965a', 3)
        for x in (-108, 108):
            s += L(f'M{x},-112 L{x-20},-44 M{x},-112 L{x+20},-44', sw=2.2)
            s += E(x - 12, -50, 13, 10, '#f2c14e', 3) + E(x + 11, -52, 13, 10, '#6cc05a', 3) + E(x, -60, 10, 9, '#ff8fb0', 3)
            s += P(f'M{x-32},-44 L{x+32},-44 L{x+24},-6 C{x+10},0 {x-10},0 {x-24},-6Z', 'url(#weave)')
    if pose in ('hold', 'wai'):
        if not back:
            s += G(arm_mid(sl) + G(arm_mid(sr), flip=True), 18 if side else 0)
            if pose == 'wai': s += P('M-7,-78 C-9,-96 -3,-108 0,-112 C3,-108 9,-96 7,-78Z', SKIN)
    elif pose == 'up': s += arm_down(sl) + G(arm_up(sr), flip=True)
    elif pose == 'eat': s += arm_down(sl) + G(arm_eat(sr), flip=True)
    elif side: s += G(arm_down(sl), 44)
    else: s += arm_down(sl) + G(arm_down(sr), flip=True)
    if 'bangle' in ex and pose == 'stand' and not side: s += L('M-66,-70 L-48,-72 M66,-70 L48,-72', GOLD, 4.5)
    s = pre_body + ('<g transform="scale(.86,1)">' + s + '</g>' if side else s)
    s += E(-98, -198, 10, 13, SKIN, lw) + ('' if side else E(98, -198, 10, 13, SKIN, lw))
    s += P(HEAD, SKIN)
    if back: s += hair_back_view(hk, hc)
    else:
        s += ('<g clip-path="url(#hc)">' + G(face(expr), 36) + '</g>' if side else face(expr)) + hair_front(hk, hc)
        if side and hk in ('peek', 'long', 'muay', 'braid'): s += P('M-104,-206 C-110,-282 -58,-318 -4,-316 C-44,-298 -74,-258 -80,-200 C-84,-176 -92,-166 -100,-172Z', hc)
        if 'flower' in ex: s += G(flower(), -92, -238, .8)
        if 'earring' in ex: s += E(-98, -180, 5, 6, GOLD, 2) + ('' if side else E(98, -180, 5, 6, GOLD, 2))
    return s

CAST = [
    dict(name='ขุนนาง', hair='mahadthai', torso='jacket', top='#fffaf2', bottom='kraben', bc='#7a4a9a', feet='shoes', ex=('stocking',), expr='smug'),
    dict(name='คุณหญิง', hair='peek', torso='sabai', top='#f6e3b8', sc='#e2a93a', bottom='nung', bc='#9a3a5a', ex=('trim', 'hem', 'necklace', 'belt', 'bangle', 'flower', 'earring')),
    dict(name='ชาวบ้านชาย', hair='mahadthai', torso='bare', bottom='kraben', bc='#3f5a8a', ex=('pakama',)),
    dict(name='แม่ค้าหาบเร่', hair='peek', torso='wrap', top='#c9685a', bottom='nung', bc='#4a4a6a', ex=('hab',), expr='happy'),
    dict(name='เด็กชายไว้จุก', hair='juk', torso='bare', bottom='kraben', bc='#c9483a', ex=('amulet', 'anklet')),
    dict(name='เด็กหญิงไว้จุก', hair='juk', torso='wrap', top='#ffb7c5', bottom='nung', bc='#6aa86f', ex=('bangle',)),
    dict(name='พระสงฆ์', hair='shaved', torso='monk', bottom='monk', expr='pray', monk=True),
    dict(name='พ่อค้าจีน', hair='queue', torso='chinese', top='#4a6a9a', bottom='pants', bc='#2a2a3a', feet='shoes'),
    dict(name='หญิงสาวผมยาว', hair='long', hc='#3a2622', torso='sabai', top='#f4ead8', sc='#f08aa8', bottom='nung', bc='#5a7ab0', ex=('flower', 'bangle')),
    dict(name='แม่หญิงเกล้ามวย', hair='muay', hc='#2e2422', torso='sabai', top='#f6e3b8', sc='#6cc0b4', bottom='nung', bc='#7a3a4a', ex=('hem', 'earring')),
    dict(name='สาวผมเปีย', hair='braid', hc='#4a2c1a', torso='wrap', top='#f2c14e', bottom='nung', bc='#6a4a8a', ex=('bangle',)),
    # แม่ค้าประจำร้าน (ไม่มีหาบ)
    dict(name='แม่ค้า', hair='peek', torso='wrap', top='#c9685a', bottom='nung', bc='#4a4a6a', expr='happy', vendor=True),
    dict(name='พ่อค้า', hair='mahadthai', torso='bare', bottom='kraben', bc='#6a5a3a', ex=('pakama',), expr='happy', vendor=True),
]

# ================================================================ ของประกอบฉาก
def blob(cx, cy, rx, ry, n, seed, jit=.1, bump=.42):
    r = random.Random(seed); pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + r.uniform(-.1, .1); k = 1 + r.uniform(-jit, jit)
        pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
    d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(n):
        p, q = pts[i], pts[(i + 1) % n]; mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        dx, dy = mx - cx, my - cy; ln = math.hypot(dx, dy) or 1; seg = math.hypot(q[0] - p[0], q[1] - p[1])
        d += f' Q{mx + dx / ln * seg * bump:.1f},{my + dy / ln * seg * bump:.1f} {q[0]:.1f},{q[1]:.1f}'
    return d + 'Z'
def lantern():
    s = L('M0,-18 L0,0', sw=3) + P('M-14,0 C-26,10 -26,42 -14,52 L14,52 C26,42 26,10 14,0Z', '#ffd27a')
    s += L('M-5,2 C-12,16 -12,36 -5,50 M5,2 C12,16 12,36 5,50', '#e09a3a', 2.5)
    s += P('M-13,-5 L13,-5 L14,2 L-14,2Z', '#c9483a', 3.5) + P('M-14,50 L14,50 L13,57 L-13,57Z', '#c9483a', 3.5) + P('M-4,57 L4,57 L3,76 L0,71 L-3,76Z', '#e2574a', 3)
    return s
def bamboo(x, y0, y1, w=12):
    s = P(f'M{x-w/2},{y0} L{x-w/2},{y1} L{x+w/2},{y1} L{x+w/2},{y0}Z', '#d9b25e', 4)
    for yy in range(int(y0) + 40, int(y1), 56): s += L(f'M{x-w/2},{yy} L{x+w/2},{yy}', sw=2.5)
    return s
def thatch(x0, x1, yt, yb, inset=34):
    d = f'M{x0+inset},{yt} L{x1-inset},{yt} L{x1},{yb}'; n = int((x1 - x0) / 40)
    for i in range(n):
        xa = x1 - (i + .5) * (x1 - x0) / n; xb = x1 - (i + 1) * (x1 - x0) / n
        d += f' L{xa:.0f},{yb+18} L{xb:.0f},{yb}'
    s = P(d + 'Z', '#cfa64e')
    for i in range(1, n * 2):
        x = x0 + i * (x1 - x0) / (n * 2); xt = x0 + inset + i * (x1 - x0 - inset * 2) / (n * 2)
        s += L(f'M{xt:.0f},{yt+10} L{x:.0f},{yb-6}', '#8a6a2a', 2.2, .55)
    return s + L(f'M{x0+inset-10},{yt} L{x1-inset+10},{yt}', '#8a6a2a', 10) + L(f'M{x0+inset-10},{yt} L{x1-inset+10},{yt}', '#b98a3a', 4)
def jar():
    return (P('M-40,-6 C-62,-40 -54,-86 -28,-98 L28,-98 C54,-86 62,-40 40,-6 C20,3 -20,3 -40,-6Z', '#b5683a') + P('M22,-92 C44,-80 50,-44 36,-12 C30,-40 30,-70 22,-92Z', '#8a4a28', 0, op=.5)
            + E(0, -98, 30, 8, '#7a3f22', 4) + L('M-30,-70 C-38,-54 -38,-36 -32,-22', '#e0a070', 4, .7))
def it_khaolam(): return P('M-9,-44 L-9,8 C-5,12 5,12 9,8 L9,-44Z', '#b9c27a', 3.5) + E(0, -44, 9, 4, '#fffaf0', 3) + L('M-9,-14 L9,-14', sw=2.2, op=.6)
def it_fruit(): return P('M-14,-4 C-20,-22 -6,-36 6,-34 C20,-30 22,-8 10,4 C2,10 -10,8 -14,-4Z', '#ffc93e', 3.5) + P('M4,-34 C6,-44 16,-46 20,-40 C14,-38 8,-36 4,-34Z', '#58aa55', 3) + E(-4, -18, 4, 6, '#fff3b0', op=.6)
def pin_blades():
    s = ''
    for i, c in enumerate(('#ff6b6b', '#ffd166', '#4ecdc4', '#8c7ae6')): s += f'<g transform="rotate({i*90})">' + P('M0,0 L26,-4 C22,-18 8,-24 0,-22Z', c, 3) + '</g>'
    return s + E(0, 0, 4.5, 4.5, '#fff', 2.5)
def it_pinstick(): return L('M0,12 L0,-62', OLC, 7) + L('M0,12 L0,-62', '#d9b25e', 3.5)
def it_krok(): return P('M-28,0 C-20,14 20,14 28,0 C18,-8 -18,-8 -28,0Z', '#4a9a4e', 3.5) + ''.join(P(f'M{x-10},-2 C{x-10},-17 {x+10},-17 {x+10},-2Z', '#fff6e8', 3) + E(x, -9, 3, 2, '#6cc05a') for x in (-12, 10))
def it_coco(): return E(0, -18, 20, 18, '#8fbf6a', 3.5) + P('M-10,-32 L10,-32 L7,-38 L-7,-38Z', '#fff6e8', 2.5) + L('M3,-36 L12,-58', '#ff8fb0', 4)
def it_noodle(): return P('M-24,-14 C-24,10 24,10 24,-14Z', '#fff6e8', 3.5) + E(0, -14, 24, 7, '#ffd98a', 3) + L('M6,-18 L22,-40 M0,-18 L14,-42', '#8a5a34', 2.5)
def it_garland():
    s = ''
    for i in range(10): a = i / 10 * 6.283; s += E(round(math.cos(a) * 14), round(-22 + math.sin(a) * 18), 5, 5, '#ffffff', 2)
    return s + L('M0,-4 L0,10', '#ff8fb0', 4) + E(0, 14, 6, 7, '#ff8fb0', 2.5) + E(0, -40, 5, 5, '#ffc531', 2)
def it_fish(col='#f2c14e'): return L('M0,-44 L0,-30', OLC, 2.5) + P('M0,-30 L16,-14 L0,2 L-16,-14Z', col, 3) + P('M0,2 L10,16 L-10,16Z', '#e2574a', 3) + E(-5, -16, 2.5, 2.5, '#2a1a18') + L('M-6,-8 L6,-20', '#fff', 2, .5)
def it_corn(): return L('M0,14 L0,-6', '#d9b25e', 5) + P('M-9,-6 C-12,-30 -6,-46 0,-50 C6,-46 12,-30 9,-6Z', '#ffd23e', 3.5) + L('M-5,-14 L5,-14 M-6,-24 L6,-24 M-5,-34 L5,-34', '#e0a020', 2) + P('M-9,-6 C-14,-12 -14,-20 -10,-26 C-8,-18 -6,-12 0,-6Z', '#6cc05a', 3)
def kneel(o, bow=False):
    g = o.get; col = '#e8912a' if g('bottom') == 'monk' else g('bc', '#3f5a8a')
    body = f'<g transform="translate(0,{36 if bow else 24}) scale(1,{.6 if bow else 1})">{upper(o, "b", "hold")}</g>'
    return body + P('M-56,-6 C-64,-36 64,-36 56,-6 C36,7 -36,7 -56,-6Z', col) + E(-22, -2, 14, 8, SKIN, OLW * .7) + E(22, -2, 14, 8, SKIN, OLW * .7)
def dog(col, dk, patch=None, fr='a'):
    s = ''
    if fr == 'sit':
        s += L('M-22,-8 C-48,-6 -58,-24 -50,-40', OLC, 13) + L('M-22,-8 C-48,-6 -58,-24 -50,-40', col, 7)
        s += E(-6, -38, 30, 36, col, OLW) + P('M6,-30 L6,-2 L20,-2 L20,-30Z', col, 4) + P('M-22,-12 C-34,-12 -34,2 -18,2 L4,2 L4,-8Z', col, 4)
        hx, hy = 14, -90
    else:
        for k, x in enumerate((-30, -14, 14, 30)):
            up = 7 if (k % 2 == 0) == (fr == 'a') else 0
            s += P(f'M{x-7},-30 L{x-7},{-2-up} L{x+7},{-2-up} L{x+7},-30Z', col, 4)
        s += L('M-40,-50 C-58,-62 -56,-84 -44,-92', OLC, 13) + L('M-40,-50 C-58,-62 -56,-84 -44,-92', col, 7) + E(0, -42, 44, 24, col, OLW)
        hx, hy = 40, -72
    if patch: s += E(-10, -46 if fr != 'sit' else -44, 15, 11, patch)
    s += E(hx, hy, 28, 26, col, OLW) + E(hx + 22, hy + 8, 14, 11, '#fff6e8', 4) + E(hx + 32, hy + 4, 5, 4, '#2a1a18') + E(hx + 6, hy - 6, 4, 5.5, '#2a1a18') + E(hx + 4, hy + 8, 6, 4, '#ff9aa6', op=.7)
    s += P(f'M{hx-16},{hy-18} C{hx-28},{hy-12} {hx-30},{hy+8} {hx-20},{hy+16} C{hx-12},{hy+6} {hx-10},{hy-8} {hx-16},{hy-18}Z', dk, 4) + L(f'M{hx+18},{hy+14} Q{hx+24},{hy+20} {hx+30},{hy+14}', sw=2.5)
    return s
def cat(col, dk, stripe=False, fr='a'):
    s = ''
    if fr == 'sleep':
        s += E(0, -20, 42, 22, col, OLW) + L('M-36,-12 C-20,6 20,6 34,-6', OLC, 11) + L('M-36,-12 C-20,6 20,6 34,-6', dk, 6)
        s += E(24, -24, 19, 16, col, OLW) + P('M10,-34 L12,-48 L22,-38Z', col, 3.5) + P('M28,-40 L38,-50 L38,-34Z', col, 3.5) + L('M16,-22 Q20,-19 24,-22 M28,-22 Q32,-19 36,-22', sw=2.2)
        return s
    if fr == 'sit':
        s += L('M-14,-6 C-40,-2 -46,-22 -34,-30', OLC, 11) + L('M-14,-6 C-40,-2 -46,-22 -34,-30', dk, 6) + E(0, -36, 24, 34, col, OLW) + P('M6,-26 L6,-2 L18,-2 L18,-26Z', col, 3.5)
        hx, hy = 6, -80
    else:
        for k, x in enumerate((-26, -12, 12, 26)):
            up = 6 if (k % 2 == 0) == (fr == 'a') else 0
            s += P(f'M{x-6},-24 L{x-6},{-2-up} L{x+6},{-2-up} L{x+6},-24Z', col, 3.5)
        s += L('M-34,-40 C-56,-50 -60,-86 -40,-98', OLC, 11) + L('M-34,-40 C-56,-50 -60,-86 -40,-98', dk, 6) + E(0, -34, 38, 20, col, OLW)
        hx, hy = 34, -58
    if stripe:
        for dx in (-14, -2, 10): s += L(f'M{dx},-50 L{dx+3},-40', dk, 4) if fr != 'sit' else L(f'M{dx*.6},-60 L{dx*.6+2},-50', dk, 4)
    s += E(hx, hy, 24, 22, col, OLW) + P(f'M{hx-20},{hy-10} L{hx-18},{hy-34} L{hx-4},{hy-20}Z', col, 3.5) + P(f'M{hx+4},{hy-20} L{hx+18},{hy-34} L{hx+20},{hy-10}Z', col, 3.5)
    s += E(hx - 8, hy - 2, 3.4, 5, '#2a1a18') + E(hx + 9, hy - 2, 3.4, 5, '#2a1a18') + P(f'M{hx-3},{hy+5} L{hx+4},{hy+5} L{hx+.5},{hy+9}Z', '#ff8fa0', 1.5) + E(hx - 13, hy + 7, 5, 3, '#ff9aa6', op=.6) + E(hx + 14, hy + 7, 5, 3, '#ff9aa6', op=.6)
    return s + L(f'M{hx+12},{hy+6} L{hx+30},{hy+2} M{hx+12},{hy+9} L{hx+30},{hy+11} M{hx-11},{hy+6} L{hx-28},{hy+2}', sw=1.5, op=.6)
def table():
    s = ''
    for x in (-122, 122): s += P(f'M{x-8},-36 L{x-8},0 L{x+8},0 L{x+8},-36Z', '#b98a4a', 4)
    return s + P('M-130,-70 L130,-70 L140,-48 L-140,-48Z', '#e6be7a') + P('M-140,-48 L140,-48 L136,-32 L-136,-32Z', '#c99a54')
def dish_noodle(): return G(it_noodle(), 0, 0, 1.25)
def dish_rice(): return E(0, -6, 30, 9, '#fff6e8', 3.5) + P('M-16,-8 C-16,-26 14,-26 14,-8Z', '#ffffff', 3) + P('M-2,-10 C0,-22 22,-22 24,-10Z', '#f6dca0', 3) + E(-20, -8, 5, 3.5, '#6cc05a', 2)
def dish_curry(): return E(0, -6, 30, 9, '#fff6e8', 3.5) + P('M-18,-8 C-18,-26 6,-26 6,-8Z', '#ffffff', 3) + P('M0,-8 C0,-20 24,-20 24,-8Z', '#e8782a', 3) + E(12, -12, 3, 2.5, '#58aa55')
def bshop_back():
    s = P('M-150,-34 C-96,-52 96,-52 150,-34 C104,-18 -104,-18 -150,-34Z', '#5a3a24')
    return s + L('M-124,-30 L-124,-124', OLC, 9) + L('M-124,-30 L-124,-124', '#8a5a34', 5) + L('M-124,-120 L-96,-120', '#8a5a34', 5) + G(lantern(), -96, -112, .66)
def bshop_front(): return P('M-150,-34 C-104,-16 104,-16 150,-34 C122,20 -122,20 -150,-34Z', '#b0763e') + L('M-128,-14 C-80,2 80,2 128,-14', sw=2.5, op=.5) + L('M-110,2 C-60,14 60,14 110,2', sw=2, op=.35)
def it_sangha():
    s = P('M-22,-34 L22,-34 L18,6 C8,10 -8,10 -18,6Z', '#ffd23e', 3.5) + L('M-22,-22 L22,-22', '#e0a020', 3) + E(0, -34, 22, 7, '#fff6e8', 3)
    s += P('M-14,-36 L-14,-54 L-2,-54 L-2,-36Z', '#e2574a', 3) + P('M0,-36 L0,-50 L14,-50 L14,-36Z', '#4ecdc4', 3) + P('M-8,-52 C-8,-64 10,-64 10,-52Z', '#e8912a', 3)
    return s + L('M-22,-34 C-24,-70 24,-70 22,-34', OLC, 3)
def sangha_table():
    s = table()
    for x in (-84, 0, 84): s += G(it_sangha(), x, -72, 1.1)
    return s
def hat_ngob(): return P('M-150,36 C-90,-30 -34,-64 0,-70 C34,-64 90,-30 150,36 C84,58 -84,58 -150,36Z', '#e6c880') + L('M0,-70 L-80,44 M0,-70 L-30,52 M0,-70 L30,52 M0,-70 L80,44', '#b9965a', 3, .6) + L('M-120,20 C-60,40 60,40 120,20', '#b9965a', 3, .6)
def hat_crown():
    s = L('M-96,58 C-60,26 60,26 96,58', '#3f8f45', 8)
    for i, x in enumerate((-84, -56, -28, 0, 28, 56, 84)): s += G(flower(('#ffffff', '#ff8fb0', '#ffd23e')[i % 3], '#ffc531'), x, 42 - (9 - (i - 3) ** 2) * 1.6, .8)
    return s
def hat_chada():
    s = P('M-84,44 L-70,40 L-66,72Z', GOLD, 3) + P('M84,44 L70,40 L66,72Z', GOLD, 3)
    s += P('M-70,40 L70,40 L62,6 L-62,6Z', GOLD) + P('M-52,6 L52,6 L40,-34 L-40,-34Z', GOLD) + P('M-32,-34 L32,-34 L20,-70 L-20,-70Z', GOLD) + P('M-14,-70 L14,-70 L0,-140Z', GOLD)
    for x, y in ((-36, 24), (0, 24), (36, 24), (-20, -14), (20, -14), (0, -52)): s += E(x, y, 6, 6, '#e2574a', 2.5)
    return s
def mask_khon():
    s = P('M-70,60 C-90,10 -60,-40 -50,-90 L-30,-40 L0,-60 L30,-40 L50,-90 C60,-40 90,10 70,60 C70,150 40,200 0,206 C-40,200 -70,150 -70,60Z', '#fff6e8')
    s += E(-30, 70, 16, 12, '#2a1a18') + E(30, 70, 16, 12, '#2a1a18') + E(-30, 70, 6, 5, '#ffd23e') + E(30, 70, 6, 5, '#ffd23e')
    s += P('M-10,90 C-14,120 -6,150 0,176 C6,150 14,120 10,90Z', '#e2574a', 3.5) + P('M-44,150 C-20,176 20,176 44,150 C20,162 -20,162 -44,150Z', '#2a1a18', 3)
    for x, c in ((-52, '#4ecdc4'), (52, '#4ecdc4'), (-40, '#e2574a'), (40, '#e2574a')): s += L(f'M{x},110 L{x*.8:.0f},136', c, 5)
    return s + L('M-50,30 C-30,16 -10,20 -6,34 M50,30 C30,16 10,20 6,34', '#e2574a', 5)
def mask_hanuman():
    s = E(0, 106, 82, 86, '#ffffff', OLW) + P('M-82,60 C-60,16 60,16 82,60 C40,36 -40,36 -82,60Z', GOLD) + E(0, 30, 10, 10, '#e2574a', 3)
    s += E(-32, 92, 17, 20, '#3f8f55', 4) + E(32, 92, 17, 20, '#3f8f55', 4) + E(-32, 94, 7, 9, '#2a1a18') + E(32, 94, 7, 9, '#2a1a18')
    s += P('M-40,140 C-20,128 20,128 40,140 C30,176 -30,176 -40,140Z', '#e2574a') + P('M-26,146 L-18,160 L-10,146Z', '#fff', 2) + P('M10,146 L18,160 L26,146Z', '#fff', 2)
    return s + L('M-10,118 Q0,126 10,118', sw=4)
def it_umbrella():
    s = L('M0,10 L0,-150', OLC, 9) + L('M0,10 L0,-150', '#8a5a34', 5)
    s += P('M-110,-130 C-70,-190 70,-190 110,-130 C80,-140 50,-140 36,-128 C24,-140 -24,-140 -36,-128 C-50,-140 -80,-140 -110,-130Z', '#e2574a')
    return s + L('M0,-176 L-70,-140 M0,-176 L-36,-130 M0,-176 L36,-130 M0,-176 L70,-140', '#ffd23e', 3) + E(0, -180, 7, 7, GOLD, 3)
def dish_padthai(): return E(0, -6, 30, 9, '#fff6e8', 3.5) + P('M-20,-8 C-22,-24 20,-24 20,-8Z', '#f0a04a', 3) + L('M-12,-14 Q0,-20 12,-14 M-8,-10 Q2,-16 14,-10', '#c9742a', 2) + E(-18, -8, 5, 3.5, '#6cc05a', 2) + P('M12,-18 C18,-24 24,-18 20,-12Z', '#ff8fa0', 2)
def dish_somtam(): return E(0, -6, 30, 9, '#fff6e8', 3.5) + P('M-22,-8 C-22,-22 2,-22 2,-8Z', '#b8e986', 3) + L('M-16,-12 L-6,-16 M-14,-9 L-2,-13', '#ff8a3a', 2.5) + P('M4,-8 C4,-22 16,-24 20,-16 L28,-12 L22,-8Z', '#b5683a', 3)
def it_banana():
    s = L('M0,14 L0,-52', OLC, 6) + L('M0,14 L0,-52', '#d9b25e', 3)
    for y in (-18, -42): s += P(f'M-20,{y+6} C-22,{y-8} 18,{y-12} 22,{y} C16,{y+10} -12,{y+12} -20,{y+6}Z', '#f2c14e', 3.5) + L(f'M-10,{y-2} L-6,{y+6} M2,{y-4} L6,{y+4} M12,{y-4} L14,{y+2}', '#8a5a34', 2.2)
    return s
def it_plapao():
    s = L('M-34,6 L36,-30', OLC, 6) + L('M-34,6 L36,-30', '#d9b25e', 3)
    s += P('M-22,-6 C-14,-28 16,-36 30,-24 C22,-6 -4,6 -22,-6Z', '#c9a36a', 3.5) + P('M-22,-6 L-38,-16 L-34,4Z', '#a8854e', 3) + E(18, -24, 2.6, 2.6, '#2a1a18')
    return s + L('M-10,-12 L-6,-4 M0,-18 L4,-8 M10,-22 L14,-12', '#fff6e8', 3, .8)
def it_lodchong(): return P('M-24,-14 C-24,10 24,10 24,-14Z', '#fff6e8', 3.5) + E(0, -14, 24, 7, '#ffffff', 3) + L('M-14,-15 q4,-4 8,0 M-2,-12 q4,-4 8,0 M6,-16 q4,-4 8,0', '#58aa55', 3.5)
def it_oliang(): return P('M-14,-40 L14,-40 L11,4 C6,8 -6,8 -11,4Z', '#c99a54', 3.5) + E(0, -40, 14, 5, '#3a2218', 3) + L('M4,-40 L14,-62', '#ff8fb0', 4) + L('M-13,-20 L13,-20', sw=2.2, op=.5)
def it_thuay():
    s = P('M-30,2 C-22,14 22,14 30,2 C20,-6 -20,-6 -30,2Z', '#4a9a4e', 3.5)
    for x in (-13, 12): s += P(f'M{x-11},-2 L{x-8},-16 L{x+8},-16 L{x+11},-2Z', '#f6e3b8', 3) + E(x, -16, 8, 3.5, '#ffffff', 2.5)
    return s
def it_lotus():
    s = ''
    for x, h in ((-10, -46), (0, -58), (11, -44)):
        s += L(f'M0,10 L{x},{h+12}', '#3f8f45', 4) + P(f'M{x},{h+16} C{x-10},{h+8} {x-7},{h-6} {x},{h-14} C{x+7},{h-6} {x+10},{h+8} {x},{h+16}Z', '#ff9fc0', 3) + L(f'M{x},{h+12} L{x},{h-6}', '#e0608f', 1.6, .6)
    return s + L('M-5,2 L5,2', '#f2c14e', 5)
def stool(): return P('M-30,0 L-22,-52 L22,-52 L30,0 L18,0 L14,-34 L-14,-34 L-18,0Z', '#e23a3a') + E(0, -52, 26, 9, '#f25a5a', OLW) + E(0, -53, 14, 4, '#c92a2a')
def trash_bin():
    s = P('M-34,-70 L34,-70 L26,0 C10,6 -10,6 -26,0Z', 'url(#weave)') + E(0, -70, 34, 10, '#5a3a24', OLW) + L('M-32,-46 L32,-46 M-29,-22 L29,-22', '#8a5a30', 3, .6)
    return s + P('M-14,-74 L-4,-92 L6,-76Z', '#e8d9c0', 3) + E(12, -76, 8, 6, '#6cc05a', 2.5)
ST = {0: ('thatch',), 1: ('awning', '#e2574a', '#fff6e8'), 6: ('awning', '#3f8f55', '#fff6e8'), 2: ('umb', '#e2574a', '#a8322a'), 7: ('umb', '#ffb52e', '#d9801e'),
      3: ('gable', '#a8503a', '#7a3426'), 4: ('rack',), 5: ('tent', '#8c6ad0', '#ffe9b8')}
STYLE = dict(kanom=1, krok=6, drink=2, fruit=7, coco=2, khaolam=0, corn=0, dress=3, mask=3, lantern=4, toy=4, fishtoy=4, garland=5, krathong=0, noodle=0, chicken=1, curry=3, padthai=5, somtam=6)
PANEL = 'M-170,-250 L170,-250 L170,-118 L-170,-118Z'
def post(x, y0, col, w=14): return P(f'M{x-w/2},{y0} L{x-w/2},0 L{x+w/2},0 L{x+w/2},{y0}Z', col, 4)
def stall_back(st=0):
    t = ST[st][0]
    if t == 'thatch': return bamboo(-164, -250, 0) + bamboo(164, -250, 0) + P(PANEL, '#4a2f24', 0, op=.6)
    if t in ('awning', 'tent'): return post(-164, -262, '#f3ead8') + post(164, -262, '#f3ead8') + P(PANEL, ST[st][1], 0, op=.4) + P(PANEL, '#2a1830', 0, op=.4)
    if t == 'umb': return bamboo(0, -268, 0, 14)
    if t == 'gable':
        s = post(-164, -262, '#8a5a34', 18) + post(164, -262, '#8a5a34', 18) + P(PANEL, '#5a3826', 0, op=.85)
        for x in range(-136, 137, 34): s += L(f'M{x},-250 L{x},-118', sw=2.5, op=.35)
        return s
    return post(-176, -266, '#a8703c') + post(176, -266, '#a8703c')
def scallops(y, a, b, h=24):
    s = ''
    for i in range(8):
        x = -236 + i * 59; s += P(f'M{x},{y} L{x+59},{y} L{x+59},{y+16} Q{x+29.5},{y+16+h} {x},{y+16}Z', b if i % 2 == 0 else a, 3)
    return s
def sign_plank(fill, border): return P('M-156,-340 L156,-340 L156,-258 L-156,-258Z', fill) + L('M-144,-328 L144,-328 L144,-270 L-144,-270Z', border, 3)
def stall_base(st):
    t = ST[st][0]; s = ''
    for x in (-178, 178): s += P(f'M{x-8},-72 L{x-8},0 L{x+8},0 L{x+8},-72Z', '#b98a4a', 4)
    s += P('M-192,-128 L192,-128 L204,-98 L-204,-98Z', '#e6be7a')
    if t in ('awning', 'tent'):
        a, b = ST[st][1:]; d = 'M-204,-98 L204,-98 L200,-46'
        for i in range(8): x = 200 - i * 50; d += f' Q{x-25},-22 {x-50},-46'
        s += P(d + 'Z', b) + L('M-203,-84 L203,-84', a, 7) + L('M-202,-72 L202,-72', a, 3)
    elif t == 'gable':
        s += P('M-204,-98 L204,-98 L200,-70 L-200,-70Z', '#8a5a34') + P('M-198,-70 L198,-70 L196,-40 L-196,-40Z', '#7a4a2c')
        for x in (-100, 0, 100): s += L(f'M{x},-96 L{x},-42', sw=2.2, op=.45)
        s += L('M-200,-84 L200,-84', GOLD, 3, .9)
    elif t == 'umb':
        s += P('M-204,-98 L204,-98 L200,-70 L-200,-70Z', '#d9a85a')
        for x in range(-192, 185, 24): s += L(f'M{x},-95 L{x+12},-73 M{x+12},-95 L{x},-73', '#a8703c', 2.2, .7)
    else:
        s += P('M-204,-98 L204,-98 L200,-70 L-200,-70Z', '#c99a54')
        for x in range(-176, 177, 32): s += L(f'M{x},-95 L{x},-73', sw=2.2, op=.5)
    return s
def stall_top(st):
    t = ST[st][0]; s = ''; lamps = True
    if t == 'thatch':
        s += thatch(-232, 232, -348, -244) + sign_plank('#8a5a34', '#c9965a')
    elif t == 'awning':
        a, b = ST[st][1:]
        for i in range(8):
            xt = -196 + i * 49; xb = -236 + i * 59; s += P(f'M{xt},-346 L{xt+49},-346 L{xb+59},-262 L{xb},-262Z', a if i % 2 == 0 else b, 3)
        s += scallops(-262, a, b) + L('M-196,-346 L196,-346 L236,-262 L-236,-262Z', sw=5) + sign_plank('#5a2a22', GOLD)
        s += L('M-236,-234 Q0,-204 236,-234', sw=2.5); lamps = False
        for i, x in enumerate(range(-200, 201, 50)):
            y = -234 + 15 * (1 - (x / 236.0) ** 2); s += E(x, y + 9, 7, 8.5, ['#ffd23e', '#ff8fb0', '#7fd6c8', '#ffb52e'][i % 4], 2.5)
    elif t == 'tent':
        a, b = ST[st][1:]
        for i in range(8):
            x0 = -236 + i * 59; x1 = x0 + 59; s += P(f'M0,-364 Q{x0*.42:.0f},-296 {x0},-262 L{x1},-262 Q{x1*.42:.0f},-296 0,-364Z', a if i % 2 == 0 else b, 3)
        s += scallops(-262, b, a) + L('M0,-364 Q-99,-296 -236,-262 L236,-262 Q99,-296 0,-364Z', sw=5) + sign_plank('#4a2a6a', GOLD)
    elif t == 'umb':
        a, b = ST[st][1:]
        s += P('M-214,-262 C-170,-330 -60,-362 0,-362 C60,-362 170,-330 214,-262 Q160,-280 107,-262 Q53,-280 0,-262 Q-53,-280 -107,-262 Q-160,-280 -214,-262Z', a)
        for x in (-214, -107, 0, 107, 214): s += L(f'M0,-360 Q{x*.55:.0f},-330 {x},-263', b, 4)
        s += E(0, -360, 8, 6, GOLD, 3) + sign_plank('#6b4226', '#e6be7a')
        for x in (-196, 196): s += L(f'M{x},-268 L{x},-236', sw=3)
    elif t == 'gable':
        a, b = ST[st][1:]
        s += P('M-150,-350 L150,-350 L240,-250 L-240,-250Z', a)
        for y in (-325, -300, -275):
            w = 150 + (y + 350) * .9; s += L(f'M{-w:.0f},{y} L{w:.0f},{y}', b, 3)
            for x in range(int(-w) + 20, int(w), 40): s += L(f'M{x},{y} L{x-4},{y+25}', b, 2.5, .8)
        s += P('M-162,-362 L162,-362 L158,-346 L-158,-346Z', GOLD, 4) + L('M-240,-250 L240,-250', GOLD, 7)
        for f in (-1, 1): s += P(f'M{158*f},-348 C{182*f},-350 {192*f},-356 {196*f},-364 C{200*f},-350 {192*f},-338 {170*f},-338Z', GOLD, 3.5)
        s += sign_plank('#5a2a22', GOLD)
    else:
        s += P('M-214,-264 L214,-264 L214,-246 L-214,-246Z', '#a8703c', 4) + sign_plank('#8a5a34', '#e6be7a')
        for i, x in enumerate((-57, -19, 19, 57)): s += P(f'M{x-16},-244 L{x+16},-244 L{x},-212Z', ['#e2574a', '#ffd23e', '#4ecdc4', '#ff8fb0'][i], 3)
        for x in (-196, 196): s += L(f'M{x},-246 L{x},-236', sw=3)
    if lamps:
        for x in (-196, 196): s += G(lantern(), x, -222, .78)
    return s
def stall_front(kind):
    st = STYLE.get(kind, 0); s = stall_base(st)
    if kind == 'kanom':
        for i, x in enumerate((-124, 0, 124)):
            s += E(x, -118, 52, 15, '#d9a85a', 4) + E(x, -120, 42, 10, '#3f8f45')
            for k in range(5): s += E(x - 28 + k * 14, -122 - (k % 2) * 3, 7, 6, ['#ffb3c7', '#fff3b0', '#b8e986', '#ffd59e', '#ffffff'][(k + i) % 5], 2.5)
    elif kind == 'krathong':
        for x, f in ((-128, kr_leaf), (-44, kr_lotus), (44, kr_gold), (128, kr_coco)): s += G(f(), x, -112, .44)
    elif kind == 'khaolam':
        s += P('M-150,-124 L150,-124 L140,-104 L-140,-104Z', '#3a3232', 4) + P('M-138,-120 L138,-120 L132,-110 L-132,-110Z', '#ff8a3a', 0)
        for i in range(8):
            x = -126 + i * 36; s += f'<g transform="translate({x},-112) rotate({-14 + (i % 3) * 6})">' + P('M-10,0 L-10,-70 L10,-70 L10,0Z', '#b9c27a' if i % 2 else '#a8b468', 4) + E(0, -70, 10, 4, '#fffaf0', 3) + L('M-10,-24 L10,-24', sw=2, op=.5) + '</g>'
    elif kind == 'fruit':
        for i, x in enumerate((-124, 0, 124)):
            cols = (('#ffc93e', '#ffb52e'), ('#e2574a', '#ff8a7a'), ('#8fbf6a', '#b8e986'))[i]
            for k, (dx, dy) in enumerate(((-24, -122), (0, -130), (24, -122), (-12, -136), (12, -136))): s += E(x + dx, dy, 15, 12, cols[k % 2], 3)
            s += P(f'M{x-48},-118 L{x+48},-118 L{x+40},-98 C{x+20},-92 {x-20},-92 {x-40},-98Z', 'url(#weave)', 4)
    elif kind == 'toy':
        for i, x in enumerate((-132, -66, 0, 66, 132)): s += G(it_pinstick(), x, -128, 1.05) + f'<g transform="translate({x},-192) rotate({i * 23})">' + pin_blades() + '</g>'
    elif kind == 'krok':
        s += E(-56, -118, 86, 18, '#3a3232', 4)
        for i in range(8): s += E(-112 + i * 16, -117 - (i % 2) * 4, 8, 5.5, '#fff6e8', 2.5)
        s += E(110, -116, 48, 13, '#3f8f45', 4) + ''.join(E(86 + k * 16, -119, 8, 6, '#fff6e8', 2.5) for k in range(4))
    elif kind == 'coco':
        for i, x in enumerate((-132, -66, 0, 66, 132)): s += E(x, -128, 27, 24, '#8fbf6a', 4) + P(f'M{x-13},-146 L{x+13},-146 L{x+9},-154 L{x-9},-154Z', '#fff6e8', 3) + (L(f'M{x+4},-150 L{x+14},-176', '#ff8fb0', 4) if i % 2 == 0 else '')
    elif kind == 'noodle':
        s += P('M-150,-110 C-156,-170 -50,-170 -56,-110Z', '#b5683a') + E(-103, -156, 44, 9, '#f6e3b8', 3.5) + L('M-120,-176 C-110,-190 -126,-200 -116,-214 M-90,-176 C-80,-190 -96,-200 -86,-214', '#fff', 5, .4)
        for x in (10, 80, 148): s += P(f'M{x-30},-128 C{x-30},-104 {x+30},-104 {x+30},-128Z', '#fff6e8', 4) + E(x, -128, 30, 8, '#ffd98a', 3.5) + L(f'M{x+8},-132 L{x+26},-156', '#8a5a34', 3)
    elif kind == 'garland':
        s += L('M-190,-236 L-90,-236 M90,-236 L190,-236', '#8a5a34', 7)
        for x in (-160, -112, 112, 160): s += G(it_garland(), x, -190, 1.1)
        for x in (-60, 0, 60): s += G(it_garland(), x, -108, .95, rot=90)
    elif kind == 'fishtoy':
        s += L('M-190,-236 L-90,-236 M90,-236 L190,-236', '#8a5a34', 7)
        for i, x in enumerate((-160, -112, 112, 160)): s += G(it_fish(('#f2c14e', '#e2574a', '#4ecdc4', '#f2c14e')[i]), x, -190, 1.15)
        for i, x in enumerate((-70, 0, 70)): s += G(it_fish(('#4ecdc4', '#f2c14e', '#e2574a')[i]), x, -100, 1.0, rot=90)
    elif kind == 'corn':
        s += P('M-150,-124 L150,-124 L140,-104 L-140,-104Z', '#3a3232', 4) + P('M-138,-120 L138,-120 L132,-110 L-132,-110Z', '#ff8a3a', 0)
        for i in range(6): s += f'<g transform="translate({-110 + i * 44},-114) rotate({-20 + (i % 2) * 14})">' + it_corn() + '</g>'
    elif kind == 'chicken':
        s += L('M-190,-236 L-90,-236 M90,-236 L190,-236', '#8a5a34', 7)
        for x in (-160, -116, 116, 160): s += L(f'M{x},-236 L{x},-218', sw=3) + P(f'M{x-14},-214 C{x-22},-190 {x-14},-164 {x},-158 C{x+14},-164 {x+22},-190 {x+14},-214 C{x+6},-222 {x-6},-222 {x-14},-214Z', '#f6dca0', 4)
        s += E(-90, -116, 46, 13, '#b98a4a', 4) + P('M-112,-120 C-110,-136 -70,-136 -68,-120Z', '#f6dca0', 3.5) + P('M40,-110 C36,-150 124,-150 120,-110Z', '#b5683a') + E(80, -146, 40, 8, '#ffffff', 3.5)
    elif kind == 'curry':
        for i, (x, c) in enumerate(((-126, '#e2574a'), (-42, '#6cc05a'), (42, '#ffc93e'), (126, '#b5683a'))):
            s += P(f'M{x-34},-110 C{x-40},-146 {x+40},-146 {x+34},-110Z', '#8a5a34') + E(x, -140, 32, 8, c, 3.5) + L(f'M{x+10},-142 L{x+30},-170', '#d9b25e', 5)
    elif kind == 'dress':
        s += G(hat_ngob(), -118, -124, .34) + G(hat_crown(), 0, -144, .4) + G(hat_chada(), 118, -126, .36)
    elif kind == 'mask':
        s += L('M-190,-236 L-90,-236 M90,-236 L190,-236', '#8a5a34', 7) + G(mask_khon(), -140, -230, .34) + G(mask_hanuman(), 140, -228, .34)
        for x in (-70, 0, 70): s += G(it_umbrella(), x, -112, .44, rot=x * .3)
    elif kind == 'padthai':
        s += E(-60, -122, 66, 17, '#3a3232', 4) + E(-60, -127, 52, 11, '#f0a04a', 3.5) + L('M-90,-128 Q-60,-138 -30,-128', '#c9742a', 2.5) + L('M-20,-130 L20,-160', '#8a5a34', 5)
        for x in (60, 128): s += G(dish_padthai(), x, -112, 1.15)
    elif kind == 'somtam':
        s += P('M36,-112 C30,-154 108,-154 102,-112Z', '#b5683a') + E(69, -150, 36, 8, '#b8e986', 3.5) + L('M60,-150 L44,-196', OLC, 12) + L('M60,-150 L44,-196', '#c99a54', 7)
        for x in (-140, -100, -60): s += L(f'M{x},-104 L{x},-150', '#d9b25e', 4) + P(f'M{x-14},-150 C{x-18},-176 {x+18},-176 {x+14},-150 C{x+8},-142 {x-8},-142 {x-14},-150Z', '#b5683a', 3.5)
    elif kind == 'lantern':
        for i, x in enumerate((-130, -44, 44, 130)): s += G(lantern(), x, -192, .78 if i % 2 else .7)
    else:
        s += G(jar(), -118, -112, .62) + G(jar(), -30, -112, .5)
        for x in (60, 100, 140): s += P(f'M{x-12},-116 L{x-12},-152 L{x+12},-152 L{x+12},-116Z', '#8fbf6a', 4) + L(f'M{x-12},-134 L{x+12},-134', sw=2.2)
    s += stall_top(st)
    return s
def lot_empty():
    s = P('M-150,-64 L150,-64 L176,-6 L-176,-6Z', 'url(#weave)', 4) + L('M-158,-46 L158,-46 M-166,-26 L166,-26', '#8a5a30', 2, .5)
    for x in (-170, 170): s += bamboo(x, -150, -6, 10)
    s += L('M-170,-140 C-80,-120 80,-120 170,-140', '#e8d9c0', 3) + P('M-110,-150 L110,-150 L110,-90 L-110,-90Z', '#b98852')
    return s
def tree_big(seed=1):
    s = P('M-46,4 C-30,-30 -26,-90 -30,-150 C-50,-200 -84,-226 -110,-246 L-88,-264 C-60,-242 -34,-220 -16,-188 C-12,-228 -8,-268 -14,-316 L18,-316 C14,-258 16,-216 26,-178 C46,-214 72,-236 104,-250 L118,-230 C82,-212 54,-176 42,-136 C36,-86 40,-34 60,4 C40,-8 22,-10 10,4 C-6,-10 -28,-8 -46,4Z', '#8f6040')
    s += P('M12,-168 C24,-120 24,-60 36,-8 C42,-36 36,-86 42,-136 C46,-152 50,-164 56,-176 C40,-178 24,-176 12,-168Z', '#5e3d26', 0, op=.45)
    s += L('M-10,-30 C-8,-70 -6,-110 -10,-150 M22,-20 C20,-50 22,-80 20,-104', sw=2.5, op=.4)
    for i, (cx, cy, rx, ry, n, c) in enumerate(((0, -350, 255, 150, 20, '#2f6b3f'), (-135, -312, 128, 88, 13, '#3a7d49'), (140, -318, 132, 90, 13, '#3a7d49'), (0, -430, 168, 98, 15, '#46935a'), (-62, -366, 100, 60, 11, '#58aa66'), (82, -378, 96, 58, 11, '#58aa66'))):
        s += P(blob(cx, cy, rx, ry, n, seed * 17 + i), c, 5.5 if i == 0 else 4)
    r = random.Random(seed)
    for _ in range(26):
        x, y = r.uniform(-200, 200), r.uniform(-450, -270); s += L(f'M{x:.0f},{y:.0f} q8,-9 16,0', '#235233' if r.random() < .5 else '#8fd07a', 3, .8)
    s += L('M-150,-236 L-150,-196', sw=3) + G(lantern(), -150, -180, 1.1) + L('M130,-246 L130,-190', sw=3) + G(lantern(), 130, -174, 1.25)
    return s
def palm():
    s = P('M-16,2 C-8,-80 -22,-170 8,-262 L32,-256 C8,-168 16,-80 18,2Z', '#a67a4e')
    for i in range(7): y = -24 - i * 34; x = -12 + (i ** 1.6) * .9 - (4 if i < 3 else 0); s += L(f'M{x:.0f},{y} q14,-7 28,0', sw=2.5, op=.55)
    for a in (-200, -172, -140, -105, -70, -38, -8, 22):
        s += f'<g transform="translate(20,-262) rotate({a})">' + P('M0,0 C44,-34 118,-32 170,14 C116,-4 52,2 0,10Z', '#3f8f4a', 4.5) + L('M6,4 C54,-14 112,-12 160,10', '#235233', 2.5, .7) + '</g>'
    for x, y in ((6, -250), (26, -244), (16, -262)): s += E(x, y, 13, 14, '#7a5236', 4)
    return s
def banana():
    s = P('M-12,2 C-10,-40 -8,-70 -4,-96 L12,-96 C12,-70 12,-40 14,2Z', '#9cc77a', 4.5)
    for a in (-158, -125, -92, -60, -28):
        s += f'<g transform="translate(4,-92) rotate({a})">' + P('M0,0 C30,-44 118,-52 160,-8 C118,14 40,16 0,0Z', '#6cc05a', 4.5) + L('M4,-2 C54,-24 116,-24 156,-8', '#3f8f45', 3) + L('M50,-26 L56,-8 M90,-30 L96,-8 M124,-22 L128,-6', '#3f8f45', 2, .6) + '</g>'
    return s
def lamp_pole(): return bamboo(0, -250, 0) + L('M0,-238 L52,-238', '#8a5a34', 7) + G(lantern(), 52, -222, .95)
def torch():
    return (P('M-5,0 L-5,-140 L5,-140 L5,0Z', '#8a5a34', 4) + P('M-16,-158 L16,-158 L10,-136 L-10,-136Z', '#5a3a24', 4)
            + P('M0,-150 C-24,-176 -10,-206 0,-228 C10,-206 24,-176 0,-150Z', '#ff9a2e', 4) + P('M0,-156 C-10,-172 -4,-190 0,-200 C4,-190 10,-172 0,-156Z', '#ffe08a', 0))
def signpost():
    s = P('M-8,0 L-8,-240 L8,-240 L8,0Z', '#8a5a34')
    for y, f in ((-200, 1), (-126, -1)): s += f'<g transform="translate(0,{y})">' + P(f'M{-120*f},-31 L{120*f},-31 L{150*f},0 L{120*f},31 L{-120*f},31Z', '#b98852') + '</g>'
    return s
def gate():
    s = bamboo(-150, -330, 0, 16) + bamboo(150, -330, 0, 16) + thatch(-200, 200, -392, -330, 30)
    s += P('M-176,-334 L176,-334 L176,-254 L-176,-254Z', '#8a5a34') + L('M-164,-322 L164,-322 L164,-266 L-164,-266Z', '#c9965a', 3) + L('M-150,-240 C-60,-216 60,-216 150,-240', '#e8d9c0', 3)
    for i, x in enumerate((-100, -50, 0, 50, 100)): s += G(lantern(), x, -204 - abs(i - 2) * -8, .6)
    return s
def fence():
    s = L('M-160,-34 L160,-34 M-160,-12 L160,-12', '#b98a4a', 6)
    for x in range(-150, 151, 30): s += P(f'M{x-5},0 L{x-5},-46 L{x},-56 L{x+5},-46 L{x+5},0Z', '#d9b25e', 3.5)
    return s
def it_kanom():
    s = P('M-30,0 C-22,16 22,16 30,0 C20,-8 -20,-8 -30,0Z', '#4a9a4e', 3.5)
    for x, c in ((-14, '#ffb3c7'), (0, '#fff3b0'), (14, '#b8e986')): s += E(x, -6, 8.5, 7.5, c, 3)
    return s
def it_drink(): return P('M-14,-42 L14,-42 L12,4 C6,8 -6,8 -12,4Z', '#8fbf6a', 3.5) + E(0, -42, 14, 5, '#f6e3b8', 3) + L('M-13,-18 L13,-18', sw=2.2)

def circ(r, col, w): return f'<circle r="{r}" fill="none" stroke="{OLC}" stroke-width="{w+8}"/><circle r="{r}" fill="none" stroke="{col}" stroke-width="{w}"/>'
def fw_base():
    s = ''
    for f in (-1, 1): s += P(f'M{-200*f},0 L{-164*f},0 L{12*f},-380 L{-12*f},-386Z', '#b0763e')
    s += L('M-120,-130 L120,-130 M-70,-240 L70,-240', OLC, 16) + L('M-120,-130 L120,-130 M-70,-240 L70,-240', '#c9965a', 8)
    s += P('M-216,-18 L216,-18 L226,0 L-226,0Z', '#d9a565') + P('M-150,-92 L150,-92 L150,-26 L-150,-26Z', '#8a5a34') + L('M-138,-80 L138,-80 L138,-38 L-138,-38Z', '#c9965a', 3)
    return s
def fw_wheel():
    s = ''
    for i in range(8):
        a = i * math.pi / 4; x, y = math.cos(a) * 300, math.sin(a) * 300
        s += L(f'M0,0 L{x:.0f},{y:.0f}', OLC, 13) + L(f'M0,0 L{x:.0f},{y:.0f}', '#d9b25e', 6)
    s += circ(300, '#c9965a', 12) + circ(206, '#d9b25e', 7)
    for i in range(24):
        a = i * math.pi / 12 + .13; s += E(round(math.cos(a) * 300), round(math.sin(a) * 300), 10, 10, ['#ffe08a', '#ff8fab', '#8fd3ff', '#b8f29a'][i % 4], 3.5)
    return s + E(0, 0, 36, 36, '#e2574a', OLW) + E(0, 0, 14, 14, GOLD, 4)
def fw_cab(col):
    s = L('M0,0 L-26,12 M0,0 L26,12', sw=3) + P('M-46,30 L46,30 L32,8 L-32,8Z', col) + L('M-32,30 L-32,62 M32,30 L32,62', sw=4)
    s += E(-13, 52, 13, 12, SKIN, 3) + P('M-26,50 C-26,36 0,36 0,50 C-8,44 -18,44 -26,50Z', '#3a2622', 2.5) + E(15, 54, 12, 11, SKIN, 3) + P('M3,52 C3,40 27,40 27,52 C20,46 10,46 3,52Z', '#2e2422', 2.5)
    return s + P('M-38,60 L38,60 L32,96 L-32,96Z', 'url(#weave)')
def car_base():
    s = E(0, 6, 236, 40, '#8a5a34', OLW) + E(0, -14, 236, 40, '#e0ad6c', OLW) + E(0, -14, 150, 24, '#c99a54')
    s += P('M-18,-300 L18,-300 L18,-16 L-18,-16Z', '#fff1dc')
    for y in range(-280, -30, 44): s += L(f'M-18,{y} L18,{y+26}', '#e2574a', 9)
    return s
def car_top():
    s = ''; cols = ['#e2574a', '#fff1dc']
    for i in range(8):
        x0 = -244 + i * 61; s += P(f'M{x0},-250 L{x0+61},-250 L0,-410Z', cols[i % 2], 3.5)
    s += L('M-244,-250 L0,-410 L244,-250', OLC, OLW)
    for i in range(8):
        x0 = -244 + i * 61; s += P(f'M{x0},-250 Q{x0+30.5},-206 {x0+61},-250Z', cols[(i + 1) % 2], 4) + E(x0 + 30.5, -222, 8, 8, '#ffe08a', 3)
    return s + L('M0,-410 L0,-448', OLC, 5) + P('M0,-448 L34,-438 L0,-426Z', GOLD, 3.5)
def horse(col, mane):
    s = L('M0,-196 L0,44', OLC, 10) + L('M0,-196 L0,44', GOLD, 5)
    s += P('M-50,-66 C-78,-72 -88,-44 -76,-22 C-66,-40 -58,-50 -46,-52Z', mane, 4)
    for x in (-36, -16, 18, 38): s += P(f'M{x-8},-44 L{x-8},-8 L{x+8},-8 L{x+8},-44Z', col, 4) + P(f'M{x-9},-12 L{x+9},-12 L{x+9},-2 L{x-9},-2Z', '#5a3a24', 3.5)
    s += E(0, -62, 54, 31, col, OLW) + P('M28,-76 C38,-112 52,-132 72,-134 C96,-132 104,-110 98,-94 C86,-90 78,-90 68,-82 C62,-68 50,-56 34,-50Z', col)
    s += P('M62,-130 L66,-150 L78,-132Z', col, 4) + E(82, -114, 4.5, 5.5, '#2a1a18') + E(84, -100, 7, 4.5, '#ff9aa6', op=.7)
    s += P('M32,-80 C34,-114 48,-134 64,-136 C52,-120 48,-100 46,-76Z', mane, 4) + P('M-24,-92 C-10,-100 14,-100 26,-92 L22,-66 C8,-60 -8,-60 -20,-66Z', '#e2574a', 4) + L('M-20,-78 L22,-78', GOLD, 3)
    return s
def bounce_back():
    s = P('M-236,-64 L236,-64 L256,-8 L-256,-8Z', '#ffd166') + P('M-200,-64 L-200,-236 C-200,-256 200,-256 200,-236 L200,-64Z', '#8fd3ff')
    for x in range(-160, 161, 40): s += L(f'M{x},-244 L{x},-68', '#5aa8dc', 2.5, .6)
    for y in (-200, -150, -100): s += L(f'M-198,{y} L198,{y}', '#5aa8dc', 2.5, .6)
    for x in (-204, 204):
        s += P(f'M{x-36},-44 L{x-36},-276 C{x-36},-298 {x+36},-298 {x+36},-276 L{x+36},-44Z', '#ffd166')
        for y in (-240, -170, -100): s += P(f'M{x-36},{y} L{x+36},{y} L{x+36},{y+26} L{x-36},{y+26}Z', '#e2574a', 3.5)
        s += P(f'M{x-44},-288 L{x+44},-288 L{x},-372Z', '#7c6cf0')
    return s + P('M-172,-254 C-100,-306 100,-306 172,-254 L172,-222 C100,-274 -100,-274 -172,-222Z', '#ff8fab')
def bounce_front():
    s = P('M-256,-44 C-256,-76 256,-76 256,-44 L256,-2 C256,14 -256,14 -256,-2Z', '#e2574a') + L('M-230,-48 C-120,-62 120,-62 230,-48', '#fff', 6, .3)
    for x in (-240, 240):
        s += P(f'M{x-28},0 L{x-28},-120 C{x-28},-140 {x+28},-140 {x+28},-120 L{x+28},0Z', '#ffd166') + P(f'M{x-28},-80 L{x+28},-80 L{x+28},-58 L{x-28},-58Z', '#e2574a', 3.5) + P(f'M{x-34},-130 L{x+34},-130 L{x},-190Z', '#7c6cf0')
    return s
def sala():
    s = P('M-172,-42 L172,-42 L184,0 L-184,0Z', '#b0763e') + L('M-176,-20 L176,-20', sw=2.5, op=.5)
    for x in (-150, -50, 50, 150): s += P(f'M{x-8},-196 L{x-8},-42 L{x+8},-42 L{x+8},-196Z', '#8a5a34', 4)
    s += L('M-158,-92 L158,-92', OLC, 12) + L('M-158,-92 L158,-92', '#b0763e', 6)
    s += P('M-200,-190 C-124,-204 -42,-276 0,-360 C42,-276 124,-204 200,-190Z', '#c9563e')
    s += P('M-150,-196 C-100,-208 -34,-266 0,-326 C34,-266 100,-208 150,-196Z', '#f6e3b8', 4) + E(0, -236, 18, 18, '#c9563e', 4)
    s += L('M0,-360 C2,-380 12,-390 24,-394', GOLD, 7) + L('M-200,-190 C-214,-192 -222,-202 -224,-212', GOLD, 7) + L('M200,-190 C214,-192 222,-202 224,-212', GOLD, 7)
    return s + G(lantern(), -100, -176, .7) + G(lantern(), 100, -176, .7)
def urn():
    s = P('M-30,0 L-22,-34 L22,-34 L30,0Z', '#6a4a2a') + P('M-58,-34 C-70,-70 -62,-104 -44,-112 L44,-112 C62,-104 70,-70 58,-34 C30,-26 -30,-26 -58,-34Z', '#b98a3a')
    s += P('M26,-108 C50,-98 58,-70 48,-40 C42,-62 40,-86 26,-108Z', '#8a6222', 0, op=.5) + E(0, -112, 46, 11, '#d9cdb8', 4) + L('M-50,-74 C-20,-66 20,-66 50,-74', GOLD, 4)
    for i, x in enumerate((-26, -14, -3, 8, 19, 29)):
        tx = x + (i - 2.5) * 5; s += L(f'M{x},-112 L{tx:.0f},-190', '#c9483a', 3) + E(round(tx), -192, 3.4, 3.4, '#ff8a3a')
    return s
def candles():
    s = ''
    for x in (-110, 110): s += P(f'M{x-7},0 L{x-7},-118 L{x+7},-118 L{x+7},0Z', '#8a5a34', 4)
    for y in (-58, -112):
        s += P(f'M-124,{y} L124,{y} L124,{y+14} L-124,{y+14}Z', '#b0763e', 4)
        for i in range(7):
            x = -96 + i * 32; h = 26 + (i * 7 + int(-y)) % 14
            s += P(f'M{x-5},{y} L{x-5},{y-h} L{x+5},{y-h} L{x+5},{y}Z', '#fff6dc', 3)
            s += P(f'M{x},{y-h} C{x-7},{y-h-10} {x-3},{y-h-18} {x},{y-h-24} C{x+3},{y-h-18} {x+7},{y-h-10} {x},{y-h}Z', '#ffb03a', 2, '#e07a1e')
    return s
def boat(o):
    s = P('M-174,-30 C-112,-46 112,-46 174,-30 C122,-14 -122,-14 -174,-30Z', '#5a3a24')
    s += G(legs(o) + upper(o, 'f', 'stand'), -20, -8, .36) + L('M30,-70 L112,26', OLC, 13) + L('M30,-70 L112,26', '#d9b25e', 7)
    s += P('M-174,-30 C-122,-12 122,-12 174,-30 C142,26 -142,26 -174,-30Z', '#b0763e') + L('M-150,-12 C-100,4 100,4 150,-12', sw=2.5, op=.5)
    return s + L('M-140,-22 L-140,-112', OLC, 9) + L('M-140,-22 L-140,-112', '#8a5a34', 5) + G(lantern(), -140, -108, .62)
def stake(): return bamboo(0, -110, 0, 10) + P('M-5,-96 L-22,-88 L-18,-72 L-5,-80Z', '#e2574a', 3)

def kr_candle():
    return L('M-16,-34 L-22,-86 M16,-34 L22,-86', '#a8703c', 3) + P('M-6,-30 L-6,-76 C-3,-80 3,-80 6,-76 L6,-30Z', '#fff6dc', 3)
def kr_leaf():
    s = ''
    for i in range(-3, 4):
        x = i * 19; ln = i * 7
        s += P(f'M{x-13},-8 C{x-13+ln*.3:.0f},-36 {x+ln-4:.0f},-52 {x+ln},-60 C{x+ln+4:.0f},-52 {x+13+ln*.3:.0f},-36 {x+13},-8Z', '#3f8f45', 3.5)
    s += kr_candle() + P('M-76,-8 C-76,26 76,26 76,-8 C46,8 -46,8 -76,-8Z', '#2f6f38')
    for i in range(-4, 5):
        x = i * 16.5; ln = i * 3.5
        s += P(f'M{x-11:.0f},-4 C{x-11:.0f},-24 {x+ln-3:.0f},-36 {x+ln:.0f},-42 C{x+ln+3:.0f},-36 {x+11:.0f},-24 {x+11:.0f},-4Z', '#6cc05a', 3) + L(f'M{x:.0f},-6 L{x+ln*.8:.0f},-34', '#3f8f45', 1.8, .7)
    for i in range(-5, 6): s += E(i * 13, round(8 - i * i * .28), 7.5, 6.5, '#ffb52e', 2.5)
    for x in (-36, 36): s += G(flower('#c95be0', '#fff3b0'), x, -30, .7)
    return s + G(flower('#ffd23e', '#ff9a2e'), 0, -24, .8)
def kr_lotus():
    def pet(x, h, w, c, rot): return f'<g transform="translate({x},-4) rotate({rot})">' + P(f'M0,0 C{-w},{-h*.3:.0f} {-w*.8:.0f},{-h*.8:.0f} 0,{-h} C{w*.8:.0f},{-h*.8:.0f} {w},{-h*.3:.0f} 0,0Z', c, 3.5) + L(f'M0,-6 L0,{-h*.7:.0f}', '#e0608f', 1.6, .5) + '</g>'
    s = P('M-86,2 C-86,-16 86,-16 86,2 C86,22 -86,22 -86,2Z', '#3f8f55') + L('M-66,4 L-22,2 M66,4 L22,2 M0,16 L0,4 M-40,14 L-14,4 M40,14 L14,4', '#2f6f38', 2.5, .7)
    for x, rot in ((-44, -40), (-22, -19), (0, 0), (22, 19), (44, 40)): s += pet(x, 72, 23, '#ff8fb8', rot)
    s += kr_candle()
    for x, rot in ((-56, -60), (-33, -32), (-11, -10), (11, 10), (33, 32), (56, 60)): s += pet(x, 50, 19, '#ffc4d8', rot)
    return s + E(0, -6, 17, 8, '#ffd23e', 3)
def kr_gold():
    s = ''
    for i in range(-2, 3):
        x = i * 17; ln = i * 6
        s += P(f'M{x-11},-34 C{x-11},-54 {x+ln-3},-66 {x+ln},-72 C{x+ln+3},-66 {x+11},-54 {x+11},-34Z', '#3f8f45', 3) + P(f'M{x+ln-5},-62 L{x+ln},-72 L{x+ln+5},-62Z', GOLD, 2)
    s += kr_candle() + P('M-48,-36 C-30,-28 30,-28 48,-36 L46,-26 C30,-18 -30,-18 -46,-26Z', GOLD, 3)
    for f in (-1, 1): s += L(f'M{58*f},-30 L{66*f},-74', '#8a5a34', 3) + P(f'M{66*f},-74 L{88*f},-66 L{66*f},-58Z', '#e2574a', 2.5)
    s += P('M-80,-8 C-80,26 80,26 80,-8 C48,8 -48,8 -80,-8Z', '#2f6f38')
    for i in range(-4, 5):
        x = i * 17.5; ln = i * 3.5
        s += P(f'M{x-12:.0f},-4 C{x-12:.0f},-22 {x+ln-3:.0f},-32 {x+ln:.0f},-38 C{x+ln+3:.0f},-32 {x+12:.0f},-22 {x+12:.0f},-4Z', '#58aa55', 3) + P(f'M{x+ln-5:.0f},-29 L{x+ln:.0f},-38 L{x+ln+5:.0f},-29Z', GOLD, 2)
    for cx in (-52, 0, 52):
        for j in range(-3, 4): s += E(cx + j * 7, round(10 + (9 - j * j) * 1.5), 4.4, 4.4, '#ffffff', 1.8)
        s += E(cx, 28, 5, 6, '#ff8fb0', 2)
    return s + G(flower('#ffffff', GOLD), -22, -40, .55) + G(flower('#ffffff', GOLD), 22, -40, .55)
def kr_coco():
    s = kr_candle() + P('M-58,-18 C-58,30 58,30 58,-18Z', '#8a5a34') + L('M-40,-2 C-36,12 -26,20 -14,24 M40,-2 C36,12 26,20 14,24 M0,6 L0,24', '#5a3a24', 2.5, .6)
    s += E(0, -18, 58, 13, '#fff6e8', 3.5) + E(0, -17, 46, 9, '#f2e2c0')
    for x, c in ((-32, '#ff8fb0'), (32, '#c95be0')): s += G(flower(c, '#fff3b0'), x, -24, .6)
    return s + G(flower('#ffd23e', '#ff9a2e'), 0, -20, .6)

def buddha():
    G1, G2 = '#f5cf5e', '#d9a93a'
    s = P('M0,-478 C-124,-446 -156,-300 -134,-196 L134,-196 C156,-300 124,-446 0,-478Z', '#c9483a') + L('M0,-452 C-100,-424 -128,-300 -110,-206 M0,-452 C100,-424 128,-300 110,-206', GOLD, 5)
    s += P('M-206,0 L206,0 L186,-44 L-186,-44Z', '#a3262a') + L('M-196,-22 L196,-22', GOLD, 5) + P('M-176,-44 L176,-44 L156,-92 L-156,-92Z', GOLD) + L('M-166,-68 L166,-68', '#b9722a', 3, .6)
    for i in range(-5, 6): x = i * 28; s += P(f'M{x-15},-92 C{x-15},-118 {x-5},-130 {x},-134 C{x+5},-130 {x+15},-118 {x+15},-92Z', '#ffb7c5' if i % 2 else '#ff9fb8', 3.5)
    s += P('M-132,-132 C-132,-174 -62,-184 0,-184 C62,-184 132,-174 132,-132 C82,-118 -82,-118 -132,-132Z', G1)
    s += P('M-70,-182 C-86,-242 -72,-292 -46,-306 L46,-306 C72,-292 86,-242 70,-182Z', G1) + L('M40,-300 C10,-270 -30,-230 -62,-196', G2, 6) + L('M52,-286 C24,-256 -18,-216 -50,-186', G2, 4, .7)
    s += P('M-64,-290 C-98,-272 -110,-222 -106,-170 C-102,-150 -84,-150 -84,-168 C-84,-212 -78,-250 -58,-270Z', G1) + E(-95, -156, 12, 9, G1, 4)
    s += P('M64,-290 C94,-268 98,-222 72,-198 C52,-180 12,-176 -10,-186 C-6,-200 20,-202 40,-208 C56,-218 60,-250 52,-272Z', G1)
    s += P('M-12,-306 L-10,-322 L10,-322 L12,-306Z', G1, 4) + E(-45, -344, 8, 16, G1, 4) + E(45, -344, 8, 16, G1, 4) + E(0, -348, 43, 47, G1, OLW)
    s += P('M-43,-358 C-43,-402 43,-402 43,-358 C30,-376 -30,-376 -43,-358Z', G2) + E(0, -400, 17, 14, G2, 4.5) + P('M0,-412 C-10,-428 -4,-446 0,-460 C4,-446 10,-428 0,-412Z', '#ffb03a', 3.5)
    s += L('M-27,-346 Q-17,-340 -8,-346 M8,-346 Q17,-340 27,-346', sw=3.5) + L('M-9,-326 Q0,-320 9,-326', sw=3) + E(0, -362, 3, 3, '#e2574a')
    return s
def altar():
    s = P('M-160,-92 L160,-92 L170,-70 L-170,-70Z', '#c9483a') + P('M-170,-70 L170,-70 L164,-52 L-164,-52Z', GOLD)
    for x in (-150, 150): s += P(f'M{x-9},-52 L{x-9},0 L{x+9},0 L{x+9},-52Z', '#a3262a', 4)
    s += P('M-110,-52 L110,-52 L104,-14 L-104,-14Z', '#a3262a', 4) + L('M-90,-34 L90,-34', GOLD, 4)
    for x in (-120, 120):
        s += P(f'M{x-7},-92 L{x-7},-150 L{x+7},-150 L{x+7},-92Z', '#fff6dc', 3.5) + P(f'M{x},-150 C{x-9},-162 {x-4},-174 {x},-184 C{x+4},-174 {x+9},-162 {x},-150Z', '#ffb03a', 2.5, '#e07a1e') + P(f'M{x-14},-92 L{x+14},-92 L{x+10},-100 L{x-10},-100Z', GOLD, 3)
    for x in (-66, 66):
        s += P(f'M{x-14},-92 C{x-22},-112 {x-12},-128 {x-8},-132 L{x+8},-132 C{x+12},-128 {x+22},-112 {x+14},-92Z', '#6aa8d9', 3.5)
        for dx, c in ((-10, '#ffb7c5'), (0, '#ff8fb0'), (10, '#ffb7c5')): s += L(f'M{x},-132 L{x+dx},-160', '#3f8f45', 3) + P(f'M{x+dx},-158 C{x+dx-7},-166 {x+dx-4},-176 {x+dx},-182 C{x+dx+4},-176 {x+dx+7},-166 {x+dx},-158Z', c, 2.5)
    s += P('M-26,-92 C-34,-108 -26,-122 -18,-126 L18,-126 C26,-122 34,-108 26,-92Z', '#b98a3a', 3.5)
    for i, x in enumerate((-9, 0, 9)): s += L(f'M{x},-126 L{x*1.5:.0f},-172', '#c9483a', 2.5) + E(round(x * 1.5), -173, 2.8, 2.8, '#ff8a3a')
    return s
def column():
    s = P('M-24,0 L-24,-420 L24,-420 L24,0Z', '#a3262a') + P('M10,-400 L24,-400 L24,-20 L10,-20Z', '#7a1c22', 0, op=.5)
    for y in range(-360, -40, 60): s += P(f'M0,{y-14} L10,{y} L0,{y+14} L-10,{y}Z', GOLD, 2.5)
    s += P('M-34,-436 L34,-436 L28,-404 L-28,-404Z', GOLD) + P('M-30,-18 L30,-18 L36,2 L-36,2Z', GOLD)
    return s
def mat(): return P('M-62,-28 L62,-28 L72,6 L-72,6Z', '#c9483a', 4.5) + L('M-52,-20 L52,-20 L60,-2 L-60,-2Z', GOLD, 3)
def chest():
    s = P('M-72,-78 L72,-78 L72,0 L-72,0Z', '#8a5a34') + P('M-78,-104 L78,-104 L72,-78 L-72,-78Z', '#b0763e') + P('M-26,-96 L26,-96 L26,-88 L-26,-88Z', '#2a1a18', 0)
    for x in (-72, 54): s += P(f'M{x},-78 L{x+18},-78 L{x+18},0 L{x},0Z', GOLD, 3.5)
    return s + P('M-40,-60 L40,-60 L40,-20 L-40,-20Z', '#fff6dc', 3.5) + E(0, -70, 8, 7, GOLD, 3)
def seat_back():
    s = P('M-124,-74 L124,-74 L136,-46 L-136,-46Z', '#c98f55') + P('M56,-74 L120,-74 L88,-150Z', '#c9483a') + L('M70,-82 L106,-82 M80,-108 L98,-108', GOLD, 4)
    return s
def seat_front():
    s = P('M-136,-46 L136,-46 L130,0 L-130,0Z', '#8a5a34') + L('M-126,-30 L126,-30', GOLD, 5) + L('M-124,-12 L124,-12', '#5a3a24', 3, .6)
    s += P('M-118,-46 L-62,-46 L-70,-64 L-110,-64Z', '#5a3a24', 4) + P('M-116,-64 C-116,-98 -64,-98 -64,-64Z', GOLD) + E(-90, -90, 22, 6, '#bfe6ff', 3.5)
    return s
def brush():
    s = L('M0,10 L0,-30', OLC, 9) + L('M0,10 L0,-30', '#8a5a34', 5)
    for dx in (-12, -6, 0, 6, 12): s += L(f'M0,-30 L{dx},-66', '#6aa86f', 3.5)
    return s + L('M-5,-32 L5,-32', GOLD, 5)

def it_lantern(): return L('M0,-18 L22,-32', '#8a5a34', 5) + lantern()

# ================================================================ ส่งออก
ASSETS = {}
def add(name, inner, x0, y0, w, h, s):
    ASSETS[name] = dict(svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" width="{w}" height="{h}">{DEFS}{inner}</svg>', ax=-x0, ay=-y0, w=w, h=h, s=s)
CS = .40
for i, o in enumerate(CAST):
    for wk in (0, 1, 2): add(f'c{i}_legs{wk}', legs(o, wk), -60, -50, 120, 60, CS)
    poses = (('f', 'stand'), ('f', 'hold'), ('f', 'up'), ('f', 'wai'), ('f', 'eat'), ('s', 'stand'), ('s', 'hold'), ('b', 'stand'), ('b', 'hold'), ('b', 'kneel'), ('b', 'bow'))
    for v, p in poses:
        ex = {'up': 'laugh', 'wai': 'pray', 'eat': 'eat'}.get(p)
        if o.get('monk') and p == 'eat': continue
        if o.get('monk') and p == 'up': ex = 'pray'
        add(f'c{i}_{v}_{p}', kneel(o, p == 'bow') if p in ('kneel', 'bow') else upper(o, v, p, ex), -170, -350, 340, 362, CS)
add('stall_back', stall_back(), -250, -270, 500, 280, .62)
for k in STYLE: add(f'stallb_{k}', stall_back(STYLE[k]), -250, -270, 500, 280, .62)
for k in ('kanom', 'krathong', 'drink', 'lantern', 'khaolam', 'fruit', 'toy', 'krok', 'coco', 'noodle', 'garland', 'fishtoy', 'corn', 'chicken', 'curry', 'dress', 'mask', 'padthai', 'somtam'): add(f'stall_{k}', stall_front(k), -250, -366, 500, 376, .62)
add('lot', lot_empty(), -190, -164, 380, 174, .62)
add('tree1', tree_big(3), -280, -540, 560, 560, .7); add('tree2', tree_big(8), -280, -540, 560, 560, .55)
add('palm', palm(), -180, -460, 380, 470, .8); add('banana', banana(), -180, -280, 360, 290, .62)
add('lamp', lamp_pole(), -20, -270, 110, 280, .62); add('torch', torch(), -30, -240, 60, 246, .5)
add('jar', jar(), -70, -112, 140, 122, .5); add('sign', signpost(), -160, -250, 320, 256, .7)
add('gate', gate(), -220, -420, 440, 430, .8); add('fence', fence(), -165, -62, 330, 68, .62)
add('lantern', lantern(), -32, -24, 64, 106, .6)
add('fw_base', fw_base(), -236, -400, 472, 410, .6); add('fw_wheel', fw_wheel(), -330, -330, 660, 660, .6)
for i, c in enumerate(('#e2574a', '#7c6cf0', '#3f8f55', '#f08aa8')): add(f'fw_cab{i}', fw_cab(c), -52, -8, 104, 112, .6)
add('car_base', car_base(), -250, -320, 500, 374, .6); add('car_top', car_top(), -260, -460, 520, 266, .6)
for i, (c, m) in enumerate((('#fff6e8', '#ff8fab'), ('#c9965a', '#5a3a24'), ('#ffc4d6', '#fff6e8'))): add(f'horse{i}', horse(c, m), -100, -204, 220, 254, .5)
add('bounce_back', bounce_back(), -270, -384, 540, 392, .6); add('bounce_front', bounce_front(), -270, -200, 540, 220, .6)
add('it_lantern', it_lantern(), -34, -40, 72, 124, .45)
add('stool', stool(), -36, -68, 72, 74, .62); add('bin', trash_bin(), -42, -100, 84, 112, .62)
add('it_banana', it_banana(), -28, -62, 56, 80, .5); add('it_plapao', it_plapao(), -42, -40, 84, 52, .5); add('it_lodchong', it_lodchong(), -28, -26, 56, 40, .5)
add('it_oliang', it_oliang(), -18, -66, 38, 78, .5); add('it_thuay', it_thuay(), -34, -22, 68, 40, .5); add('it_lotus', it_lotus(), -22, -76, 46, 92, .5)
for n, f in (('ngob', hat_ngob), ('crown', hat_crown), ('chada', hat_chada)): add('hat_' + n, f(), -160, -150, 320, 240, CS)
for n, f in (('khon', mask_khon), ('hanuman', mask_hanuman)): add('mask_' + n, f(), -100, -100, 200, 320, CS)
add('it_umbrella', it_umbrella(), -120, -196, 240, 214, .42); add('dish_padthai', dish_padthai(), -40, -34, 80, 44, .55); add('dish_somtam', dish_somtam(), -40, -34, 80, 44, .55)
for i, (c, d, p) in enumerate((('#c9965a', '#8a5a34', None), ('#fff6e8', '#c9965a', '#c9965a'), ('#4a3f3f', '#2a2224', None))):
    for fr in ('a', 'b', 'sit'): add(f'dog{i}_{fr}', dog(c, d, p, fr), -84, -128, 172, 136, .5)
for i, (c, d, st) in enumerate((('#f2a65a', '#c9742a', True), ('#fff6e8', '#d9c9b0', False), ('#9a9aa6', '#6a6a78', True))):
    for fr in ('a', 'b', 'sit', 'sleep'): add(f'cat{i}_{fr}', cat(c, d, st, fr), -84, -128, 172, 136, .45)
add('table', table(), -146, -76, 292, 82, .7); add('sangha_table', sangha_table(), -146, -150, 292, 156, .7); add('it_sangha', it_sangha(), -28, -72, 56, 86, .5)
add('dish_noodle', dish_noodle(), -40, -60, 80, 76, .5); add('dish_rice', dish_rice(), -40, -34, 80, 44, .55); add('dish_curry', dish_curry(), -40, -34, 80, 44, .55)
add('bshop_back', bshop_back(), -170, -150, 340, 180, .62); add('bshop_front', bshop_front(), -170, -50, 340, 80, .62)
add('it_krok', it_krok(), -32, -22, 64, 42, .5); add('it_coco', it_coco(), -24, -62, 48, 66, .5); add('it_noodle', it_noodle(), -28, -46, 56, 60, .5)
add('it_garland', it_garland(), -24, -50, 48, 76, .5); add('it_fish', it_fish(), -20, -48, 40, 68, .5); add('it_corn', it_corn(), -16, -54, 32, 72, .5)
add('buddha', buddha(), -220, -490, 440, 500, .75); add('altar', altar(), -180, -196, 360, 204, .7); add('column', column(), -44, -444, 88, 452, .7)
add('mat', mat(), -78, -34, 156, 46, .7); add('chest', chest(), -86, -112, 172, 120, .7); add('seat_back', seat_back(), -144, -158, 288, 164, .7); add('seat_front', seat_front(), -144, -106, 288, 112, .7); add('brush', brush(), -20, -72, 40, 88, .5)
add('it_khaolam', it_khaolam(), -14, -52, 28, 68, .5); add('it_fruit', it_fruit(), -24, -50, 50, 64, .5); add('it_pinstick', it_pinstick(), -8, -66, 16, 82, .5); add('pin_blades', pin_blades(), -30, -30, 60, 60, .5)
for k, f in (('leaf', kr_leaf), ('lotus', kr_lotus), ('gold', kr_gold), ('coco', kr_coco)): add('kr_' + k, f(), -94, -96, 188, 132, .5)
add('sala', sala(), -236, -410, 472, 420, .62); add('urn', urn(), -80, -204, 160, 212, .62); add('candles', candles(), -132, -160, 264, 168, .62)
add('boat0', boat(CAST[2]), -186, -160, 372, 200, .5); add('boat1', boat(CAST[7]), -186, -160, 372, 200, .5); add('stake', stake(), -30, -118, 60, 124, .6)
add('it_kanom', it_kanom(), -36, -20, 72, 42, .5); add('it_drink', it_drink(), -20, -52, 40, 66, .5)
add('it_krathong', krathong(False), -60, -80, 120, 100, .32); add('it_krathong_lit', krathong(True, False), -60, -80, 120, 100, .32)
META = dict(cast=[dict(name=o['name'], monk=bool(o.get('monk')), vendor=bool(o.get('vendor')), long=o.get('bottom') in ('nung', 'monk')) for o in CAST], cs=CS)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with io.open(os.path.join(root, 'assets.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('// สร้างอัตโนมัติจาก tools/gen_assets.py — อย่าแก้ไฟล์นี้ตรง ๆ\n')
    f.write('const ASSETS = ' + json.dumps(ASSETS, ensure_ascii=False) + ';\n')
    f.write('const META = ' + json.dumps(META, ensure_ascii=False) + ';\n')
print(len(ASSETS), 'sprites', os.path.getsize(os.path.join(root, 'assets.js')) // 1024, 'KB')
