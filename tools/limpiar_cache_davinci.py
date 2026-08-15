#!/usr/bin/env python3
"""Limpia el cache regenerable de DaVinci Resolve.

IMPORTANTE: por defecto NO borra nada. Primero lista lo que encontro y cuanto
ocupa cada carpeta. Recien con --borrar elimina los archivos.

Solo toca cache que Resolve puede volver a generar solo (render cache,
optimized media y, si se lo pedis, proxies). Nunca toca proyectos, la base de
datos, ni los stills de la Gallery.

Ejemplos:
    python3 tools/limpiar_cache_davinci.py                    # solo mira
    python3 tools/limpiar_cache_davinci.py --dias 30          # mira lo viejo
    python3 tools/limpiar_cache_davinci.py --dias 30 --borrar # borra lo viejo
    python3 tools/limpiar_cache_davinci.py --ruta "D:/Cache" --borrar
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

# Carpetas de cache que Resolve regenera sin perder trabajo.
CACHE_SEGURO = {"cacheclip"}
# Los proxies tambien se regeneran, pero tarda mucho: van detras de un flag.
CACHE_PROXIES = {"proxymedia"}

# Si alguna de estas palabras aparece en la ruta, no se toca NUNCA.
# Son proyectos, base de datos o material creado por vos, no cache.
PROHIBIDO = (
    ".gallery",
    "gallery stills",
    "resolve projects",
    "resolve project libraries",
    "projectdatabase",
    "project libraries",
    "postgres",
    ".drp",
    "luts",
    "templates",
    "fusion/macros",
)


def raices_candidatas():
    """Lugares donde suele estar el cache, segun el sistema operativo.

    OJO: la ruta real es configurable dentro de Resolve. La fuente de verdad es
    Project Settings > Master Settings > Working Folders. Si la tuya no esta
    aca, pasala con --ruta.
    """
    casa = Path.home()
    if sys.platform == "darwin":
        return [Path("/Users/Shared/DaVinci Resolve"), casa / "Movies", casa]
    if sys.platform.startswith("win"):
        candidatas = [casa / "Documents", casa / "Videos", casa]
        for letra in "CDEFG":
            unidad = Path(f"{letra}:/")
            if unidad.exists():
                candidatas.append(unidad / "ProgramData/Blackmagic Design")
        return candidatas
    return [casa / ".local/share/DaVinciResolve", Path("/var/BlackmagicDesign"), casa]


def es_prohibido(ruta):
    texto = str(ruta).lower().replace("\\", "/")
    return any(palabra in texto for palabra in PROHIBIDO)


def buscar_cache(raices, nombres, profundidad=4):
    """Busca carpetas de cache sin recorrer el disco entero."""
    encontradas = []
    for raiz in raices:
        if not raiz.is_dir():
            continue
        base = len(raiz.parts)
        for actual, subdirs, _ in os.walk(raiz, onerror=lambda e: None):
            ruta = Path(actual)
            if len(ruta.parts) - base >= profundidad:
                subdirs[:] = []
                continue
            # No entramos a carpetas protegidas ni a las que ya son cache.
            subdirs[:] = [d for d in subdirs if not es_prohibido(ruta / d)]
            for d in list(subdirs):
                if d.lower() in nombres:
                    encontradas.append(ruta / d)
                    subdirs.remove(d)
    return sorted(set(encontradas))


def archivos_de(carpeta, dias):
    """Archivos borrables: todos, o solo los sin usar hace mas de N dias."""
    limite = time.time() - dias * 86400 if dias else None
    for actual, _, archivos in os.walk(carpeta, onerror=lambda e: None):
        for nombre in archivos:
            ruta = Path(actual) / nombre
            try:
                info = ruta.stat()
            except OSError:
                continue
            if limite is None or max(info.st_mtime, info.st_atime) < limite:
                yield ruta, info.st_size


def legible(bytes_):
    for unidad in ("B", "KB", "MB", "GB", "TB"):
        if bytes_ < 1024:
            return f"{bytes_:.1f} {unidad}"
        bytes_ /= 1024
    return f"{bytes_:.1f} PB"


def resolve_abierto():
    """Avisa si Resolve esta corriendo: hay que cerrarlo antes de borrar.

    Compara el nombre del proceso, no la linea de comando completa: buscar
    'resolve' dentro de los argumentos da falsos positivos con cualquier
    programa que mencione esa palabra.
    """
    nombres = {"resolve", "resolve.exe", "davinci resolve", "davinci resolve.exe"}
    try:
        if sys.platform.startswith("win"):
            salida = subprocess.run(
                ["tasklist", "/fo", "csv", "/nh"],
                capture_output=True, text=True, timeout=15,
            ).stdout
            procesos = [l.split('","')[0].strip('"').lower() for l in salida.splitlines() if l.strip()]
        else:
            salida = subprocess.run(
                ["ps", "-A", "-o", "comm="], capture_output=True, text=True, timeout=15
            ).stdout
            procesos = [l.strip().rsplit("/", 1)[-1].lower() for l in salida.splitlines()]
        return any(p in nombres for p in procesos)
    except (OSError, subprocess.SubprocessError):
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ruta", action="append", default=[], help="Carpeta de cache concreta (se puede repetir)")
    parser.add_argument("--dias", type=int, default=0, help="Borrar solo lo sin usar hace mas de N dias (0 = todo)")
    parser.add_argument("--incluir-proxies", action="store_true", help="Incluir tambien ProxyMedia (tarda en regenerarse)")
    parser.add_argument("--borrar", action="store_true", help="Borrar de verdad. Sin esto solo muestra.")
    args = parser.parse_args()

    nombres = set(CACHE_SEGURO)
    if args.incluir_proxies:
        nombres |= CACHE_PROXIES

    if args.ruta:
        carpetas = [Path(r).expanduser().resolve() for r in args.ruta]
        faltantes = [c for c in carpetas if not c.is_dir()]
        for c in faltantes:
            print(f"No existe: {c}", file=sys.stderr)
        carpetas = [c for c in carpetas if c.is_dir()]
    else:
        print("Buscando carpetas de cache...")
        carpetas = buscar_cache(raices_candidatas(), nombres)

    peligrosas = [c for c in carpetas if es_prohibido(c)]
    carpetas = [c for c in carpetas if not es_prohibido(c)]
    for c in peligrosas:
        print(f"Omitida por seguridad (no parece cache): {c}", file=sys.stderr)

    if not carpetas:
        print("\nNo encontre carpetas de cache.")
        print("Abri Resolve > Project Settings > Master Settings > Working Folders,")
        print("copia la ruta de 'Cache files location' y pasala asi:")
        print('  python3 tools/limpiar_cache_davinci.py --ruta "TU/RUTA"')
        return 1

    total = 0
    detalle = []
    for carpeta in carpetas:
        archivos = list(archivos_de(carpeta, args.dias))
        peso = sum(t for _, t in archivos)
        total += peso
        detalle.append((carpeta, archivos, peso))
        print(f"\n{carpeta}\n  {len(archivos)} archivos · {legible(peso)}")

    print(f"\nTotal recuperable: {legible(total)}")

    if not args.borrar:
        print("\nEsto fue solo una vista previa, no se borro nada.")
        print("Si la lista es correcta, volve a correrlo agregando --borrar")
        return 0

    if resolve_abierto():
        print("\nDaVinci Resolve esta abierto. Cerralo antes de borrar el cache.", file=sys.stderr)
        return 1

    borrados = 0
    fallidos = 0
    for carpeta, archivos, _ in detalle:
        for ruta, _ in archivos:
            try:
                ruta.unlink()
                borrados += 1
            except OSError as error:
                print(f"No se pudo borrar {ruta}: {error}", file=sys.stderr)
                fallidos += 1
        # Dejamos la carpeta raiz: Resolve espera que exista.
        for actual, subdirs, _ in os.walk(carpeta, topdown=False):
            for d in subdirs:
                try:
                    (Path(actual) / d).rmdir()
                except OSError:
                    pass

    print(f"\nListo: {borrados} archivos borrados, {legible(total)} liberados.")
    if fallidos:
        print(f"{fallidos} archivos no se pudieron borrar (permisos o en uso).")
    print("Resolve va a regenerar el cache que necesite la proxima vez que abras el proyecto.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
