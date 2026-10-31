"""Saca el link de Instagram a partir del nombre de un video descargado.

Los descargadores tipo SnapInsta nombran el archivo SnapInsta-Ai_<media_id>_<user_id>.mp4.
El media_id se convierte al código corto del reel (base64 de Instagram).
Uso: python3 ig_link.py <archivo.mp4> [más archivos...]
"""
import os, re, sys

A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"


def shortcode(media_id: int) -> str:
    s = ""
    while media_id:
        media_id, r = divmod(media_id, 64)
        s = A[r] + s
    return s


for f in sys.argv[1:]:
    m = re.search(r"_(\d{15,})_\d+", os.path.basename(f))
    print(f, "->", f"https://www.instagram.com/reel/{shortcode(int(m.group(1)))}/" if m else "sin ID en el nombre")
