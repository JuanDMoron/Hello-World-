import html, re
from data import G, REF_PROPIA
LABEL={"edu":"Educación","ven":"Ventas"}
def c(s):
    s=html.escape(s)
    s=re.sub(r"\[(CONFIRMAR[^\]]*)\]", r'<span class="conf">\1</span>', s)
    s=re.sub(r"\[([^\]]+)\]", r'<span class="ph">\1</span>', s)
    return s
def guion(g):
    pl="".join(f"""<div class="plano"><div class="ph-t">PLANO {i} — {c(t)}</div>{''.join(f'<div class="line">{c(l)}</div>' for l in ls)}{'<div class="corte">[Corte]</div>' if cut else ''}</div>""" for i,(t,ls,cut) in enumerate(g['planos'],1))
    hk="".join(f"<li>{c(h)}</li>" for h in g['hooks']); ct="".join(f"<li>{c(h)}</li>" for h in g['ctas'])
    nt="".join(f"<p class='note'><b>Nota de producción:</b> {c(n)}</p>" for n in g['notes'])
    nw='<span class="new">NUEVO</span>' if g.get('nuevo') else ''
    return f"""<section class="g {g['cat']}">
<div class="ghead"><span class="pill {g['cat']}">{LABEL[g['cat']]}</span><span class="code">Semana {g['w']} · {g['code']}</span>{nw}<span class="status">DRAFT — PENDIENTE DE CORRECCIONES</span></div>
<h2>Guion {g['code']} — “{c(g['title'])}”</h2>
<div class="sub">Pilar: {g['pilar']} · Duración objetivo: {g['dur']}</div>
<div class="lbl">Referencia</div><p class="ref">{REF_PROPIA}</p>
<div class="lbl">Guion</div>{pl}
<div class="opts"><div><div class="lbl">Opciones de hook (Planos 1–2)</div><ol>{hk}</ol></div>
<div><div class="lbl">Opciones de CTA (cierre)</div><ol>{ct}</ol></div></div>{nt}</section>"""
def cell(w,cat):
    g=[x for x in G if x['w']==w and x['cat']==cat][0]
    return f"{g['code']} · {html.escape(g['title'])}" + ('<span class="new">NUEVO</span>' if g.get('nuevo') else '')
grid="".join(f"<tr><td><b>Semana {w}</b></td><td>{cell(w,'edu')}</td><td class='muted'>T{w} · Trend (pendiente)</td><td>{cell(w,'ven')}</td></tr>" for w in range(1,5))
css=open('style.css').read()
doc=f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>AE of Miami — Guiones</title><style>{css}</style></head><body>
<div class="cover"><div class="brand">La Nostra Production × AE of Miami</div>
<h1>Guiones para reels<br>Educación y Ventas</h1>
<p class="lead">Plan de 4 semanas · 12 reels · 3 por semana (1 Educación, 1 Entretenimiento, 1 Ventas). Este documento tiene los 8 guiones de Educación y Ventas. Los 4 de Entretenimiento salen de los trends de referencia.</p>
<div class="cats"><div class="cat edu"><h4>Educación</h4><p>Quiénes somos, subastas, tipos de títulos y exportación.</p></div>
<div class="cat ent"><h4>Entretenimiento</h4><p>Trends, humor y situaciones con clientes. Contenido que engancha.</p></div>
<div class="cat ven"><h4>Ventas</h4><p>Carros, precios y oportunidades reales. Motivar al cliente a comprar.</p></div></div>
<h3>Calendario</h3>
<table class="grid"><thead><tr><th></th><th class="edu">Educación</th><th class="ent">Entretenimiento</th><th class="ven">Ventas</th></tr></thead><tbody>{grid}</tbody></table>
<div class="rules"><b>Cómo leer los guiones:</b> el hook va partido en dos planos (Plano 1 abre, Plano 2 remata). Cada guion trae 5 opciones de hook y 5 de CTA para escoger el día de grabación.
<div class="legend"><span class="conf">CONFIRMAR</span> = dato que debe validar AE antes de grabar · <span class="ph">texto gris</span> = completar según el carro grabado.</div></div></div>
{''.join(guion(g) for g in G)}
<section class="final"><h2>Antes de grabar</h2><div class="lbl">Confirmar con AE</div>
<ul class="check">
<li>Dirección actual, horario para poner en pantalla, si mencionan la sede de Denver y si atienden en español e inglés (E1)</li>
<li>En qué subastas compran, si el precio final incluye todo o hay fee de documentación, y si se nombra a Copart / IAA en cámara (E2)</li>
<li>Explicación de salvage / rebuilt en Florida y si venden carros rebuilt (E3)</li>
<li>Exportación: países, documentos que maneja AE y cuáles el cliente, agente de carga (E4)</li>
<li>Precio y título de cada carro que salga en cámara, confirmados el día de grabación (V1–V4)</li>
<li>Acceso a una pantalla con subasta en vivo para grabar (E2)</li>
</ul>
<div class="lbl" style="margin-top:6mm">Qué grabar cada día</div>
<div class="shoot"><div><b>Grabación 1</b>E1 · V1 · E2 · V2<br>Llegada del carro de V4<br>Trends T1 y T2</div><div><b>Grabación 2</b>E3 · V3 · E4<br>Venta del carro de V4<br>Trends T3 y T4</div></div>
</section></body></html>"""
open('guiones.html','w').write(doc)
