#!/usr/bin/env bash
# Hojas de contacto con un fotograma por segundo (6x5 = 30 s por hoja) y la marca de tiempo.
# Uso: bash frames.sh <video.mp4> <carpeta_salida> <prefijo>
set -e
mkdir -p "$2"
ffmpeg -v error -y -i "$1" -vf "fps=1,scale=240:-1,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='%{pts\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=6x5" "$2/$3_%02d.png"
ls "$2"/"$3"_*.png
