import html, re
from data import G as GB, REF_PROPIA
from trends import T
from pablo import PABLO
for g in GB:
    if g['code'] in PABLO: g['hooks']=[PABLO[g['code']]]+g['hooks'][:4]
ORDER={'edu':0,'ent':1,'ven':2}
G=sorted(GB+T, key=lambda g:(g['w'],ORDER[g['cat']]))
LABEL={"edu":"Educación","ven":"Ventas","ent":"Entretenimiento"}
def c(s):
    s=html.escape(s)
    s=re.sub(r"\[(CONFIRMAR[^\]]*)\]", r'<span class="conf">\1</span>', s)
    s=re.sub(r"\[([^\]]+)\]", r'<span class="ph">\1</span>', s)
    s=re.sub(r"(https://\S+?/)(?=\s|$)", r'<a href="\1">\1</a>', s)
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
<div class="lbl">Referencia</div><p class="ref">{c(g.get('ref', REF_PROPIA))}</p>
<div class="lbl">Guion</div>{pl}
<div class="opts"><div><div class="lbl">Opciones de hook (Planos 1–2)</div><ol>{hk}</ol></div>
<div><div class="lbl">Opciones de CTA (cierre)</div><ol>{ct}</ol></div></div>{nt}</section>"""
def cell(w,cat):
    g=[x for x in G if x['w']==w and x['cat']==cat][0]
    return f"{g['code']} · {html.escape(g['title'])}" + ('<span class="new">NUEVO</span>' if g.get('nuevo') else '')
grid="".join(f"<tr><td><b>Semana {w}</b></td><td>{cell(w,'edu')}</td><td>{cell(w,'ent')}</td><td>{cell(w,'ven')}</td></tr>" for w in range(1,5))
css=open('style.css').read()
doc=f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>AE of Miami — Guiones</title><style>{css}</style></head><body>
<div class="cover"><div class="brand">La Nostra Production × AE of Miami</div>
<h1>Guiones para reels<br>Plan de 4 semanas</h1>
<p class="lead">Plan de 4 semanas · 12 reels · 3 por semana (1 Educación, 1 Entretenimiento, 1 Ventas). Los 12 guiones completos: 4 de Educación, 4 de Entretenimiento (trends) y 4 de Ventas.</p>
<div class="cats"><div class="cat edu"><h4>Educación</h4><p>Quiénes somos, subastas, tipos de títulos y exportación.</p></div>
<div class="cat ent"><h4>Entretenimiento</h4><p>Trends, humor y situaciones con clientes. Contenido que engancha.</p></div>
<div class="cat ven"><h4>Ventas</h4><p>Carros, precios y oportunidades reales. Motivar al cliente a comprar.</p></div></div>
<h3>Calendario</h3>
<table class="grid"><thead><tr><th></th><th class="edu">Educación</th><th class="ent">Entretenimiento</th><th class="ven">Ventas</th></tr></thead><tbody>{grid}</tbody></table>
<div class="rules"><b>Cómo leer los guiones:</b> el hook va partido en dos planos (Plano 1 abre, Plano 2 remata). Cada guion trae 5 opciones de hook y 5 de CTA para escoger el día de grabación.
<div class="legend"><b>★</b> = hook del video de Pablo · <span class="conf">CONFIRMAR</span> = dato que debe validar AE antes de grabar · <span class="ph">texto gris</span> = completar según el carro grabado.</div></div></div>
{''.join(guion(g) for g in G)}
<section class="final"><h2>Antes de grabar</h2><div class="lbl">Confirmar con AE</div>
<ul class="check">
<li>Horario para poner en pantalla y si atienden en español e inglés (E1). Dirección y sede única ya confirmadas; sin número de teléfono.</li>
<li>En qué subastas compran, si el precio final incluye todo o hay fee de documentación, y si se nombra a Copart / IAA en cámara (E2)</li>
<li>Explicación de salvage / rebuilt en Florida y si venden carros rebuilt (E3)</li>
<li>Exportación: países, documentos que maneja AE y cuáles el cliente, agente de carga (E4)</li>
<li>Precio y título de cada carro que salga en cámara, confirmados el día de grabación (V1–V4)</li>
<li>Acceso a una pantalla con subasta en vivo para grabar (E2)</li>
<li>Un caso real de cliente con millas alteradas y su reporte; si AE entrega Carfax o AutoCheck antes de la compra (T3)</li>
<li>Ficha del carro de la trivia: cámara, título, año y precio (T4)</li>
<li>Vestuario para T2: sombrero y botas, mochila, coche de bebé, lentes oscuros, maletas. Gente del equipo que se preste a actuar.</li>
</ul>
<div class="lbl" style="margin-top:6mm">Qué grabar cada día</div>
<div class="shoot"><div><b>Grabación 1</b>E1 · T1 · V1<br>E2 · T2 · V2<br>Llegada del carro de V4</div><div><b>Grabación 2</b>E3 · T3 · V3<br>E4 · T4<br>Venta del carro de V4</div></div>
</section></body></html>"""
open('guiones.html','w').write(doc)
