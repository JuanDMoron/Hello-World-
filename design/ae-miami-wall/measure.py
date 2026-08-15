"""Mean/percentile luminance of a PNG, so wall darkness can be tuned by number
instead of by eye. Pure stdlib: zlib + manual PNG unfiltering."""
import sys, zlib, struct

def read_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    pos, idat, w, h, depth, ctype = 8, b'', 0, 0, 0, 0
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]
        typ = d[pos+4:pos+8]
        body = d[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', body[:10])
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break
        pos += 12 + ln
    assert depth == 8, depth
    nch = {0: 1, 2: 3, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * nch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if f == 1:
            for i in range(nch, stride):
                line[i] = (line[i] + line[i-nch]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i-nch] if i >= nch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i-nch] if i >= nch else 0
                b = prev[i]
                c = prev[i-nch] if i >= nch else 0
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w, h, nch, out

w, h, nch, px = read_png(sys.argv[1])
lums = []
step = max(1, (w * h) // 200000)
for i in range(0, w * h, step):
    o = i * nch
    r, g, b = px[o], px[o+1], px[o+2]
    lums.append(0.2126*r + 0.7152*g + 0.0722*b)
lums.sort()
q = lambda p: lums[int(p * (len(lums)-1))]
print(f"{sys.argv[1]}  n={len(lums)}")
print(f"  mean {sum(lums)/len(lums):6.1f}   p05 {q(.05):5.1f}  p50 {q(.5):5.1f}  p95 {q(.95):5.1f}")
