---
name: ae-of-miami-guiones
description: Escribe el paquete mensual de guiones de reels para AE of Miami (cliente de La Nostra Production / Juan Morón) — 12 reels en 4 semanas (Educación, Entretenimiento con trends, Ventas) — con el formato PLANO por PLANO, el tono de Daniela a cámara, 5 opciones de hook y CTA, notas de producción y el PDF de entrega. Úsala siempre que Juan pida guiones, ideas, reels, contenido del mes, adaptar trends o “el plan del próximo mes” para AE of Miami / AE / Pablo / el dealer de carros salvage, aunque no diga “guion” ni “skill”, y también para corregir, reemplazar o agregar guiones sueltos de AE.
---

# Guiones mensuales de AE of Miami

Juan Morón (La Nostra Production) produce cada mes 12 reels para **AE of Miami**, un dealer de carros salvage / reparables en Miami. Esta skill reproduce el sistema que se armó en el mes 1: misma organización, mismo tono, mismo formato de guion y mismo PDF. El objetivo es que Juan reciba algo que pueda grabar sin editar, y que Pablo (AE) lo pueda revisar.

Antes de escribir, lee:
- `references/marca-ae.md` — qué es AE, datos confirmados, reglas de su playbook, qué está prohibido decir.
- `references/formato-y-tono.md` — anatomía de un guion, tono, hooks de Pablo, convenciones.
- `references/historial.md` — todo lo que ya se hizo, para no repetir.
- `references/trends.md` — solo si Juan manda videos de trends.

## El plan del mes (no cambia salvo que Juan diga)

- **12 reels, 4 semanas, 3 por semana:** cada semana 1 Educación (🔵 `E`), 1 Entretenimiento (🟡 `T`) y 1 Ventas (🟢 `V`). Códigos E1–E4, T1–T4, V1–V4; el número es la semana.
- **Educación y Ventas los escribe Claude** con lo que se sabe de AE y las dudas típicas de sus clientes (títulos, subastas, cómo comprar, exportación, precios, transparencia del daño). Si Juan pide un tema específico, manda.
- **Entretenimiento = trends que manda Juan** (videos o links). Se adaptan a AE con detalle plano por plano. Si no hay trends todavía, deja los 4 espacios como “Pendiente: guion según la referencia que mande Juan” y avanza con el resto.
- **2 días de grabación** (6 reels por día, ver contrato). Día 1 = semanas 1 y 2; día 2 = semanas 3 y 4. Un guion de Ventas tipo “¿cuánto duró?” se reparte entre los dos días.
- **No tocar:** días de publicación, fechas de grabación y quién sale a cámara los decide Juan. La música de los trends la pone Juan en edición.

## Flujo de trabajo

1. **Contexto.** Lee las referencias. Si hay conectores de Gmail / Drive, busca novedades de AE (correos de pablo@aeofmiami.com, la hoja “AE OF MIAMI - Master Content”, “Plan de Reels”) para ver qué se publicó y qué pidió Pablo. Si Juan dio confirmaciones nuevas, úsalas y anótalas en `references/marca-ae.md`.
2. **Elegir temas.** 4 de Educación y 4 de Ventas que no repitan el historial (se puede repetir una idea si cambia el hook, el formato o la ejecución: “evoluciona, no copies” es regla de AE). Mezcla formatos: FAQ, POV, recorrido, comparación, lista, trivia, reacción, cuenta regresiva.
3. **Trends.** Si Juan manda videos, procésalos con `references/trends.md`: fotogramas, transcripción, link de Instagram, y luego la adaptación.
4. **Escribir** cada guion con la anatomía de `references/formato-y-tono.md`. Guárdalos en un `guiones.json` con la estructura de `assets/mes-01/guiones.json` (es el mes 1 completo y sirve de ejemplo de tono y de formato).
5. **PDF.** `python3 scripts/build_pdf.py <guiones.json> <salida.pdf>`. Revisa que cada guion quepa en **una página** (`pdftotext -f N -l N` por página: cada página debe empezar con “Guion …”). Si uno se sale: junta planos cortos, acorta la referencia o fusiona notas. No achiques la letra más.
6. **Entregar.** Manda el PDF y, en el chat, un resumen corto en el estilo de Juan (ver abajo). Después de entregar, agrega el mes a `references/historial.md`.

Para cambios sueltos (“reemplaza estos dos de educación por…”), edita el `guiones.json` del mes, marca los nuevos con `"nuevo": true` (salen con la etiqueta NUEVO), vuelve a generar el PDF y explica en una tabla qué salió y qué entró.

## PDF por rodaje

En cada día de grabación Juan escoge qué guiones del mes se graban (normalmente 4 y 1 de backup) y pide un PDF aparte solo con esos. Arma un JSON con esos guiones copiados del mes, sin reescribirlos, como en `assets/rodaje-ejemplo.json`:
- `"etiqueta_semana": "Orden"` y `w` = orden sugerido para grabar (agrupa por locación: oficina → subasta → exteriores → carros).
- Al backup ponle `"estado": "BACKUP — SOLO SI DA EL TIEMPO"`.
- **El PDF del rodaje va al cliente (Pablo):** sin la página “Antes de grabar” (deja `checklist` y `grabacion` vacíos). Lo interno (qué confirmar, qué grabar extra) se lo dices a Juan en el chat.
- Al final agrega un banco con **5 hooks y 5 CTA más por guion** (`"banco"`: por código, numerados del 6 al 10), distintos a los del guion, con ★ donde encaje un hook de Pablo. Sirven para escoger después de grabar o en edición.
Si Juan no dijo cuáles completan el día, escoge los más rápidos de grabar (un solo carro, sin vestuario) y dile que se cambian en un minuto.

## Cómo hablarle a Juan

Español, directo, cercano, sin relleno. Empieza por el resultado (“Ya están los 12 guiones…”), luego bullets o una tabla corta. Explica cambios y decisiones en una línea cada uno. Lo que falta confirmar con Pablo va en una lista al final. Nada de jerga técnica: no le hables de JSON, scripts ni HTML.
