"""Genera el PDF de guiones de AE of Miami a partir de un guiones.json.

Uso:  python3 build_pdf.py <guiones.json> <salida.pdf>

Necesita Node con Playwright (require('playwright')) y las fuentes Inter / Inter Display.
El formato del JSON está en assets/mes-01/guiones.json (ejemplo real del mes 1).
"""
import html, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
LABEL = {"edu": "Educación", "ent": "Entretenimiento", "ven": "Ventas"}
ORDER = {"edu": 0, "ent": 1, "ven": 2}


def c(s):
    """Escapa texto y marca [CONFIRMAR ...] en naranja, [placeholders] en gris y links clicables."""
    s = html.escape(s)
    s = re.sub(r"\[(CONFIRMAR[^\]]*)\]", r'<span class="conf">\1</span>', s)
    s = re.sub(r"\[([^\]]+)\]", r'<span class="ph">\1</span>', s)
    s = re.sub(r"(https://\S+?/)(?=\s|$)", r'<a href="\1">\1</a>', s)
    return s


def guion(g):
    planos = "".join(
        f'<div class="plano"><div class="ph-t">PLANO {i} — {c(p["desc"])}</div>'
        + "".join(f'<div class="line">{c(l)}</div>' for l in p["lineas"])
        + ('<div class="corte">[Corte]</div>' if p.get("corte") else "")
        + "</div>"
        for i, p in enumerate(g["planos"], 1))
    hk = "".join(f"<li>{c(h)}</li>" for h in g["hooks"])
    ct = "".join(f"<li>{c(h)}</li>" for h in g["ctas"])
    nt = "".join(f"<p class='note'><b>Nota de producción:</b> {c(n)}</p>" for n in g.get("notes", []))
    nw = '<span class="new">NUEVO</span>' if g.get("nuevo") else ""
    estado = g.get("estado", "DRAFT — PENDIENTE DE CORRECCIONES")
    return f"""<section class="g {g['cat']}">
<div class="ghead"><span class="pill {g['cat']}">{LABEL[g['cat']]}</span><span class="code">Semana {g['w']} · {g['code']}</span>{nw}<span class="status">{html.escape(estado)}</span></div>
<h2>Guion {g['code']} — “{c(g['title'])}”</h2>
<div class="sub">Pilar: {html.escape(g['pilar'])} · Duración objetivo: {html.escape(g['dur'])}</div>
<div class="lbl">Referencia</div><p class="ref">{c(g.get('ref', 'Sin trend de referencia — idea propia.'))}</p>
<div class="lbl">Guion</div>{planos}
<div class="opts"><div><div class="lbl">Opciones de hook (Planos 1–2)</div><ol>{hk}</ol></div>
<div><div class="lbl">Opciones de CTA (cierre)</div><ol>{ct}</ol></div></div>{nt}</section>"""


def build_html(doc):
    G = sorted(doc["guiones"], key=lambda g: (g["w"], ORDER[g["cat"]]))
    semanas = sorted({g["w"] for g in G})

    def cell(w, cat):
        gs = [g for g in G if g["w"] == w and g["cat"] == cat]
        if not gs:
            return "<span class='muted'>—</span>"
        return "<br>".join(f"{g['code']} · {html.escape(g['title'])}" + ('<span class="new">NUEVO</span>' if g.get("nuevo") else "") for g in gs)

    grid = "".join(f"<tr><td><b>Semana {w}</b></td><td>{cell(w,'edu')}</td><td>{cell(w,'ent')}</td><td>{cell(w,'ven')}</td></tr>" for w in semanas)
    cats = doc.get("categorias", {})
    check = "".join(f"<li>{c(x)}</li>" for x in doc.get("checklist", []))
    shoot = "".join(f"<div><b>{html.escape(k)}</b>{'<br>'.join(html.escape(x) for x in v)}</div>" for k, v in doc.get("grabacion", {}).items())
    css = open(os.path.join(HERE, "style.css")).read()
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>AE of Miami — {html.escape(doc.get('mes',''))}</title><style>{css}</style></head><body>
<div class="cover"><div class="brand">La Nostra Production × AE of Miami · {html.escape(doc.get('mes',''))}</div>
<h1>{html.escape(doc.get('titulo','Guiones para reels'))}<br>{html.escape(doc.get('subtitulo',''))}</h1>
<p class="lead">{html.escape(doc.get('lead',''))}</p>
<div class="cats"><div class="cat edu"><h4>Educación</h4><p>{html.escape(cats.get('edu',''))}</p></div>
<div class="cat ent"><h4>Entretenimiento</h4><p>{html.escape(cats.get('ent',''))}</p></div>
<div class="cat ven"><h4>Ventas</h4><p>{html.escape(cats.get('ven',''))}</p></div></div>
<h3>Calendario</h3>
<table class="grid"><thead><tr><th></th><th class="edu">Educación</th><th class="ent">Entretenimiento</th><th class="ven">Ventas</th></tr></thead><tbody>{grid}</tbody></table>
<div class="rules"><b>Cómo leer los guiones:</b> el hook va partido en dos planos (Plano 1 abre, Plano 2 remata). Cada guion trae 5 opciones de hook y 5 de CTA para escoger el día de grabación.
<div class="legend"><b>★</b> = hook del video de Pablo · <span class="conf">CONFIRMAR</span> = dato que debe validar AE antes de grabar · <span class="ph">texto gris</span> = completar según el carro grabado.</div></div></div>
{''.join(guion(g) for g in G)}
<section class="final"><h2>Antes de grabar</h2><div class="lbl">Confirmar con AE</div><ul class="check">{check}</ul>
<div class="lbl" style="margin-top:6mm">Qué grabar cada día</div><div class="shoot">{shoot}</div></section></body></html>"""


def main():
    src, out = sys.argv[1], os.path.abspath(sys.argv[2])
    doc = json.load(open(src, encoding="utf-8"))
    tmp = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8")
    tmp.write(build_html(doc)); tmp.close()
    js = ("const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();"
          f"await p.goto('file://{tmp.name}');await p.pdf({{path:{json.dumps(out)},format:'Letter',printBackground:true,preferCSSPageSize:true}});await b.close();}})();")
    subprocess.run(["node", "-e", js], check=True)
    os.unlink(tmp.name)
    print("PDF:", out)


if __name__ == "__main__":
    main()
