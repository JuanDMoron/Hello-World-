#!/usr/bin/env python3
"""Servidor local para este repositorio.

Sirve los archivos de la carpeta del proyecto (incluida `subs/`) usando solo
la biblioteca estandar de Python: no hace falta instalar nada.

Uso rapido:
    python3 server.py                 # http://127.0.0.1:8000
    python3 server.py --port 9000     # otro puerto
    python3 server.py --lan           # accesible desde otros equipos de la red
"""

import argparse
import http.server
import json
import os
import socket
import socketserver
import sys
import webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
EXTENSIONES_SUBTITULOS = {".srt", ".vtt", ".ass", ".ssa"}


class Manejador(http.server.SimpleHTTPRequestHandler):
    """Sirve archivos estaticos y expone /api/subs con la lista de subtitulos."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".srt": "text/plain; charset=utf-8",
        ".vtt": "text/vtt; charset=utf-8",
    }

    def do_GET(self):
        if self.path.split("?")[0] == "/api/subs":
            self.responder_json(self.listar_subtitulos())
            return
        super().do_GET()

    def listar_subtitulos(self):
        carpeta = RAIZ / "subs"
        if not carpeta.is_dir():
            return []
        archivos = [
            {
                "nombre": ruta.name,
                "url": f"/subs/{ruta.name}",
                "bytes": ruta.stat().st_size,
            }
            for ruta in sorted(carpeta.iterdir())
            if ruta.is_file() and ruta.suffix.lower() in EXTENSIONES_SUBTITULOS
        ]
        return archivos

    def responder_json(self, datos):
        cuerpo = json.dumps(datos, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def end_headers(self):
        # En desarrollo conviene que el navegador no cachee nada.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, formato, *args):
        sys.stderr.write("%s  %s\n" % (self.log_date_time_string(), formato % args))


class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def ip_local():
    """IP del equipo en la red local (sin abrir conexiones reales)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 1))  # direccion de prueba, no se envia trafico
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    parser = argparse.ArgumentParser(description="Servidor local del proyecto")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)))
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Interfaz de escucha (por defecto solo esta PC)",
    )
    parser.add_argument(
        "--lan",
        action="store_true",
        help="Atajo para --host 0.0.0.0: visible en tu red local",
    )
    parser.add_argument("--dir", default=str(RAIZ), help="Carpeta a servir")
    parser.add_argument("--open", action="store_true", help="Abrir el navegador")
    args = parser.parse_args()

    host = "0.0.0.0" if args.lan else args.host
    carpeta = str(Path(args.dir).resolve())

    def fabrica(*a, **kw):
        return Manejador(*a, directory=carpeta, **kw)

    try:
        servidor = Servidor((host, args.port), fabrica)
    except OSError as error:
        print(f"No se pudo abrir {host}:{args.port} -> {error}", file=sys.stderr)
        print("Probá con otro puerto: python3 server.py --port 8080", file=sys.stderr)
        return 1

    url = f"http://127.0.0.1:{args.port}/"
    print(f"Sirviendo {carpeta}")
    print(f"  Local:  {url}")
    if host == "0.0.0.0":
        print(f"  Red:    http://{ip_local()}:{args.port}/")
    print("Ctrl+C para detener.")

    if args.open:
        webbrowser.open(url)

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        servidor.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
