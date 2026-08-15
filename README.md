# Servidor local

Un servidor web que corre en tu propia PC y sirve los archivos de este
repositorio (entre ellos los subtítulos de `subs/`). No usa dependencias
externas: solo Python 3, que ya viene instalado en macOS y Linux, y se instala
en un paso en Windows.

## Arrancarlo

```bash
python3 server.py
```

Luego abrí <http://127.0.0.1:8000> en el navegador. Vas a ver los subtítulos en
español e inglés lado a lado, con buscador.

En Windows el comando suele ser `python server.py`.

### Opciones

| Comando | Qué hace |
| --- | --- |
| `python3 server.py --port 8080` | Usa otro puerto (si el 8000 está ocupado) |
| `python3 server.py --open` | Abre el navegador automáticamente |
| `python3 server.py --lan` | Lo hace visible para otros equipos de tu red |
| `python3 server.py --dir otra/carpeta` | Sirve otra carpeta |

Se detiene con `Ctrl+C`.

## Qué expone

- `/` → visor de subtítulos (`index.html`)
- `/subs/...` → los archivos `.srt` tal cual
- `/api/subs` → JSON con la lista de subtítulos disponibles

## Verlo desde el celular o desde otra compu

1. Arrancá con `python3 server.py --lan`. La consola imprime la dirección de red,
   por ejemplo `http://192.168.0.15:8000/`.
2. Abrí esa dirección desde el otro dispositivo, conectado al mismo WiFi.
3. Si no carga, casi siempre es el firewall: hay que permitir a Python aceptar
   conexiones entrantes (en Windows aparece un cartel la primera vez; en macOS
   está en Ajustes → Red → Firewall).

Sin `--lan` el servidor solo escucha en `127.0.0.1`, es decir, únicamente esta
PC. Esa es la opción segura por defecto: no lo expongas a internet ni le abras
puertos en el router, porque no tiene autenticación de ningún tipo.

## Que arranque solo con la PC

Para que el servidor "viva" en la máquina y no haya que levantarlo a mano:

### Linux (systemd, sin permisos de root)

Creá `~/.config/systemd/user/servidor-subs.service`:

```ini
[Unit]
Description=Servidor local de subtitulos

[Service]
ExecStart=/usr/bin/python3 %h/Hello-World-/server.py --port 8000
Restart=on-failure

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now servidor-subs
systemctl --user status servidor-subs     # ver si está corriendo
journalctl --user -u servidor-subs -f     # ver los logs
```

### macOS (launchd)

Creá `~/Library/LaunchAgents/local.servidor-subs.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>local.servidor-subs</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>/Users/TU_USUARIO/Hello-World-/server.py</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/local.servidor-subs.plist
```

### Windows (Programador de tareas)

1. Abrí "Programador de tareas" → *Crear tarea*.
2. Desencadenador: *Al iniciar sesión*.
3. Acción: programa `pythonw.exe`, argumentos `C:\ruta\Hello-World-\server.py`.
   Usar `pythonw.exe` (en vez de `python.exe`) evita que quede una ventana negra
   abierta.

## Limpiar el caché de DaVinci Resolve

`tools/limpiar_cache_davinci.py` libera espacio borrando el caché que Resolve
puede regenerar solo. **Por defecto no borra nada**: primero te muestra qué
encontró y cuánto pesa.

```bash
python3 tools/limpiar_cache_davinci.py                    # solo mira
python3 tools/limpiar_cache_davinci.py --dias 30          # mira lo sin usar hace 30 días
python3 tools/limpiar_cache_davinci.py --dias 30 --borrar # ahora sí borra
```

Si no encuentra las carpetas solo, abrí Resolve → *Project Settings* → *Master
Settings* → *Working Folders*, copiá la ruta de "Cache files location" y pasala:

```bash
python3 tools/limpiar_cache_davinci.py --ruta "D:/DaVinci/CacheClip" --borrar
```

Qué borra y qué no:

| Toca | No toca |
| --- | --- |
| `CacheClip` (render cache y optimized media) | Proyectos y base de datos |
| `ProxyMedia`, solo con `--incluir-proxies` | Stills de la Gallery |
| | LUTs, templates y macros de Fusion |

Se niega a correr si Resolve está abierto, y deja las carpetas raíz en su lugar
porque Resolve espera que existan. Los proxies quedan fuera salvo que los pidas
explícitamente: se regeneran, pero tarda mucho.

Alternativa desde el programa, sin scripts: menú *Playback* → *Delete Render
Cache* → *All*.

## Alternativas de una línea

Si solo querés servir archivos y no te importa el visor:

```bash
python3 -m http.server 8000     # Python, sin instalar nada
npx serve .                     # Node
php -S 127.0.0.1:8000           # PHP
```

`server.py` agrega sobre eso el endpoint `/api/subs`, los tipos MIME correctos
para `.srt`/`.vtt`, y evita que el navegador cachee mientras editás.
