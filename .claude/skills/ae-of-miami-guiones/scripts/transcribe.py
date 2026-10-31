"""Transcribe el audio de videos de trends (español o inglés) sin depender de HuggingFace.

Usa sherpa-onnx + Whisper small, que se descargan de GitHub (HuggingFace suele estar bloqueado
en las sesiones en la nube). Corta el audio en trozos de 10 s porque Whisper solo procesa 30 s.

Preparación (una vez):
  pip install sherpa-onnx
  curl -sSL -o ws.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2
  tar xjf ws.tar.bz2   # crea sherpa-onnx-whisper-small/
Uso:
  python3 -I transcribe.py <carpeta_modelo> <idioma es|en|""> <video1.mp4> [video2.mp4 ...]
Si sale "(Música)" o texto sin sentido, el video no tiene diálogo: es solo canción.
"""
import os, subprocess, sys, tempfile, wave
import numpy as np, sherpa_onnx

d, lang, files = sys.argv[1].rstrip("/") + "/", sys.argv[2], sys.argv[3:]
r = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=d + "small-encoder.int8.onnx", decoder=d + "small-decoder.int8.onnx",
    tokens=d + "small-tokens.txt", language=lang, task="transcribe", num_threads=4)
for f in files:
    wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-ac", "1", "-ar", "16000", wav], check=True)
    with wave.open(wav) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    os.unlink(wav)
    print("=====", os.path.basename(f), f"{len(x)/16000:.1f}s")
    for a in range(0, len(x), 10 * 16000):
        s = r.create_stream(); s.accept_waveform(16000, x[a:a + 10 * 16000]); r.decode_stream(s)
        print(f"[{a/16000:4.0f}s] {s.result.text.strip()}")
