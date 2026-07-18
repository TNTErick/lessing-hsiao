#!/usr/bin/env python
"""Does image preprocessing recover missed headwords? Test on one page, several variants."""
import os, sys, json, numpy as np
os.environ.setdefault("FLAGS_use_mkldnn", "0")
from PIL import Image
from paddleocr import PaddleOCR

pg = int(sys.argv[1]) if len(sys.argv) > 1 else 90
targets = sys.argv[2:] or ["BASANG", "BASAR", "BASU", "BASX"]
doc = json.load(open(f"build/ocr_cache/{pg:04d}.json"))
img = Image.open(doc["img"]).convert("RGB")
W, H = img.size

def binar(im):
    g = np.array(im.convert("L"))
    t = int(g.mean() - 0.5 * g.std())          # simple adaptive threshold
    b = (g > t).astype(np.uint8) * 255
    return np.stack([b, b, b], axis=-1)

def upscale(im, f=1.6):
    return np.array(im.resize((int(W*f), int(H*f)), Image.LANCZOS))

variants = {"raw": np.array(img), "binarized": binar(img), "upscaled1.6": upscale(img)}
ocr = PaddleOCR(use_doc_orientation_classify=False, use_doc_unwarping=False,
                use_textline_orientation=False, enable_mkldnn=False)
for name, arr in variants.items():
    r = ocr.predict(arr)[0]
    texts = r["rec_texts"]
    hits = {t: [x for x in texts if t in x.upper()] for t in targets}
    print(f"\n=== {name}: {len(texts)} lines ===")
    for t, h in hits.items():
        print(f"  {t}: {h[:3]}")
