# AE of Miami — graffiti wall background

Fondo vertical **2160 × 3840** (9:16, 4K para móvil / stories): monogramas **AE
of Miami** grafiteados sobre un muro de hormigón negro con mucha textura.

![preview](ae-miami-graffiti-wall-2160x3840.png)

## Archivos

| Archivo | Qué es |
| --- | --- |
| `ae-miami-graffiti-wall-2160x3840.png` | El fondo final, listo para usar |
| `generate.js` | Genera `wall.html` (un solo SVG a pantalla completa) |
| `render.sh` | Regenera el HTML y lo captura a PNG con Chromium |
| `wall.html` | Salida intermedia, editable en el navegador |
| `measure.py` | Mide la luminancia media/percentiles del PNG |

Todo es vectorial y procedural: no hay fotos ni bitmaps de origen, así que el
muro se puede regenerar a cualquier resolución sin perder nitidez.

## Regenerar

```bash
./render.sh                      # -> ae-miami-graffiti-wall-2160x3840.png
./render.sh /ruta/otro-nombre.png
```

Requiere Node y Chromium (`CHROME=/ruta/al/chrome ./render.sh` para apuntar a
otro binario).

## Ajustes rápidos

En `generate.js`:

- `W` / `H` — cambia el formato (p. ej. `3840 × 2160` para horizontal, o
  `3000 × 3000` cuadrado). Recuerda pasar el mismo `--window-size` en
  `render.sh`.
- `makeRng(20260815)` — la semilla. Cámbiala para obtener otra distribución de
  piezas manteniendo el mismo estilo.
- `MIAMI` — la paleta de colores de spray.
- Bloques de composición (`ghost`, `mid`, `hero`, `tag`) — cantidad, escala y
  densidad de cada capa de pintura.

## Cómo está construido el muro

El realismo sale de apilar capas, no de una sola textura:

1. **Base** — degradado casi negro.
2. **Manchas** (`blotch`) — humedad y suciedad a gran escala, en `soft-light`.
3. **Relieve** (`reliefMid`, `reliefFine`) — mapas de ruido iluminados y luego
   aplastados con gamma, mezclados en `screen`: solo se encienden los picos del
   árido, que es lo que hace legible el hormigón sobre negro.
4. **Poros y grano** (`poresCoarse`, `poresFine`, `grit`) — negro puro sobre
   alfa ruidoso, así muerde tanto el muro como la pintura.
5. **Escurridos** — churretes verticales de suciedad lavada por la lluvia.
6. **Pintura** — fantasmas antiguos, piezas medias, piezas frescas y tags.
7. **Muro otra vez por encima** — el grano vuelve a cortar sobre el color, para
   que ningún spray flote por encima de la pared.

> Nota técnica: los filtros SVG trabajan por defecto en `linearRGB`, lo que
> convierte cualquier curva de gamma en un lavado sobre fondo negro. El CSS
> fuerza `color-interpolation-filters: sRGB`.
