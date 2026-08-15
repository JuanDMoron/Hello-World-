# AE of Miami — graffiti wall background

Fondo vertical **2160 × 3840** (9:16, 4K para móvil / stories): el monograma
**AE of Miami** en blanco, grafiteado muchas veces sobre una **fotografía real**
de muro de hormigón negro.

![preview](ae-miami-graffiti-wall-2160x3840.png)

## Archivos

| Archivo | Qué es |
| --- | --- |
| `ae-miami-graffiti-wall-2160x3840.png` | El fondo final, listo para usar |
| `wall-source.jpg` | La placa fotográfica (Adobe Stock, licenciada) |
| `generate.js` | Genera `wall.html`: foto + pintura + integración |
| `render.sh` | Regenera el HTML y lo captura a PNG con Chromium (~20 s) |
| `measure.py` | Mide luminancia media/percentiles del PNG |
| `generate-synthetic.js` | La versión anterior, 100 % procedural (ver abajo) |

## Regenerar

```bash
./render.sh                      # -> ae-miami-graffiti-wall-2160x3840.png
./render.sh /ruta/otro-nombre.png
```

Requiere Node y Chromium. La captura necesita `--allow-file-access-from-files`,
porque el SVG referencia la foto por ruta local.

## La placa

`wall-source.jpg` es Adobe Stock **285565957** ("Grunge textured dark concrete
wall background"), 5184 × 3456, disparada con una Canon EOS 7D. Es de nivel
**gratuito** y quedó licenciada en la cuenta de Adobe conectada — no consumió
créditos de pago.

Se rota 90° para ponerla vertical y se escala a cubrir 9:16. Rotar en vez de
recortar en horizontal significa que el resultado se **reduce** (×0,74) en lugar
de ampliarse: el grano llega nítido en vez de interpolado.

## Lo que hace que la pintura pertenezca al muro

Un solo truco, y es el que lo cambia todo:

```
1. la foto                                    (el muro)
2. las letras en blanco, erosionadas          (la pintura)
3. la foto OTRA VEZ, enmascarada con el alfa
   de las letras, en multiply                 (la integración)
```

El paso 3 hace que cada arañazo, poro y sombra de la fotografía atraviese el
blanco **exactamente igual** que atraviesa el hormigón de alrededor. Sin él la
pintura es una calcomanía; con él, es pintura sobre esa pared concreta.

La foto no se puede multiplicar en crudo — es demasiado oscura y aplastaría el
blanco. El filtro `asModulator` la renivela a un rango de ~[0,55, 1,25] para que
**module** el blanco en lugar de agujerearlo. Ese es el mando a tocar si quieres
más o menos textura atravesando las letras.

## El desgaste va por erosión, no por transparencia

La pintura vieja no se vuelve translúcida — se cae. Cada pieza pasa por un
filtro `wear{nivel}_{semilla}` que mantiene el blanco opaco donde sobrevive y le
arranca el alfa donde no: placas grandes con rampa de alfa abrupta, más un
moteado fino para el polvillo. Tres niveles × tres semillas.

Las letras se redibujan en cada pieza: la polilínea se subdivide y cada punto
interior se desplaza en perpendicular (una lata en la mano nunca traza recto), y
cada trazo se pinta en dos pasadas con grosores algo distintos.

## Ajustes rápidos

En `generate.js`:

- `makeRng(20260815)` — la semilla. Otra distribución, mismo estilo.
- `WHITES` — los blancos (fresco / desgastado / apagado).
- Bloques de composición (`ghost`, `mid`, `hero`, `tag`) — cantidad, escala y
  densidad de cada capa.
- `PLATE` — cambiar de foto. Ajusta `w`/`h` a las de la nueva imagen; el
  encuadre se recalcula solo.

## Por qué se abandonó la vía 100 % procedural

`generate-synthetic.js` sintetiza el muro entero con ruido fractal: campo de
altura de tres bandas, iluminación difusa y especular, poros, escurridos, curva
de grado. Técnicamente funciona y no depende de ninguna foto, pero tiene un
techo: **el ruido es estadísticamente uniforme y las superficies reales no lo
son.** Una pared de verdad tiene zonas parcheadas, llanas de fratás, arañazos
que vienen de algún sitio y manchas con historia. Esa homogeneidad es lo que
hacía que se leyera como gráfico y no como fotografía, por muy afinados que
estuvieran los parámetros.

Sigue en el repo por si hiciera falta un fondo sin dependencias de licencia, o
a otra resolución arbitraria sin límite de la placa.

## Dos trampas técnicas

- Los filtros SVG trabajan por defecto en `linearRGB`, lo que convierte
  cualquier curva de gamma en un lavado sobre fondo negro. El CSS fuerza
  `color-interpolation-filters: sRGB`.
- Contra una fotografía, los efectos sintéticos cantan al instante. Hubo que
  quitar la sombra dura de las piezas (una sombra paralela de Photoshop de
  manual), el perfilado negro de las letras y los halos de overspray con ruido,
  que se leían como manchas de moho.
