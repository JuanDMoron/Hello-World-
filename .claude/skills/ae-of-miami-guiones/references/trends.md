# Cómo procesar los trends que manda Juan

Juan manda los trends como videos (.mp4 descargados de Instagram con SnapInsta) o como links. Claude no puede abrir Instagram desde la nube, así que se trabaja con los archivos.

## 1. Ver el video
`bash scripts/frames.sh <video.mp4> <carpeta> <prefijo>` → hojas de contacto con 1 fotograma por segundo y la marca de tiempo. Léelas para sacar: planos, ritmo de cortes, texto en pantalla, personajes, vestuario, locación.

## 2. Transcribir lo que dicen
`scripts/transcribe.py` usa Whisper vía sherpa-onnx con el modelo descargado de **GitHub** (HuggingFace suele estar bloqueado en la nube; faster-whisper falla por eso). Instrucciones de instalación dentro del script. Corre en trozos de 10 s; si el video tiene una parte de más de 30 s sin pausa, así no se pierde nada.
- Si sale “(Música)” o letras sin sentido, **no hay diálogo**: es una canción. Entonces lo que importa es el texto en pantalla y la acción.
- Corrige errores obvios del modelo (“su basta” → subasta).
- Entrégale a Juan la transcripción limpia de cada trend antes o junto con los guiones: es lo que más le interesa.

## 3. Link de referencia
`python3 scripts/ig_link.py <archivos>` saca el link del reel desde el número del nombre del archivo (SnapInsta-Ai_<media_id>_<user_id>.mp4). No se puede verificar desde la nube: pídele a Juan que lo abra una vez. El link va al inicio de la “Referencia” del guion (en el PDF queda clicable para verlo en el celular mientras graban).

## 4. Adaptar a AE
- Copiar la **estructura y el chiste** del trend, cambiar el contenido para que refuerce algo real de AE (transparencia, subastas, títulos, precio directo, exportación).
- Quitar lo que choca con la marca (en la referencia de “George” la vendedora miente; en la de Mapa se vende un curso) y explicarlo en una nota.
- Si el trend pide un caso real (cliente estafado, carro vendido rápido), marcarlo `[CONFIRMAR caso real]` y dar una versión alternativa si no existe.
- Dirigir todo: quién hace qué, vestuario, carro, trípode o gimbal, en qué beat va el corte.
- **Música:** la pone Juan en edición; no se escribe la canción. Si sale el tema, explicar que el audio se agrega desde la app de Instagram (para que quede con licencia) y que las cuentas Business tienen la música comercial limitada.
