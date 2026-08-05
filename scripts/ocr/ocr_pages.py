#!/usr/bin/env python
"""Run PP-OCRv6 over given pages, cache raw results to build/ocr_cache/NNNN.json.
Usage:
  python ocr_pages.py 600 601 602          # explicit pages / ranges (1-1226)
  python ocr_pages.py @build/issue_pages_main.json --binarize --force
Flags:
  --binarize   adaptive-threshold the image before OCR (recovers faint text; keeps resolution
               so box coords stay comparable to raw runs)
  --force      re-OCR even if a cache file already exists (default: skip cached)
Env: FLAGS_use_mkldnn=0 required on CPU.
"""
import os, sys, json, glob
os.environ.setdefault("FLAGS_use_mkldnn", "0")

IMG_ROOT = os.environ.get(
    "LESSING_IMG_ROOT",
    "/mnt/dzidep/Codes/monggol/辭典/Suying LQD/LessingDict/LessingDictImages")
CACHE = os.path.join(os.path.dirname(__file__), "build", "ocr_cache")
os.makedirs(CACHE, exist_ok=True)

def find_image(page: int):
    hits = glob.glob(os.path.join(IMG_ROOT, "*", f"LessingDict_Page_{page:04d}.jpg"))
    return hits[0] if hits else None

def load_input(path, binarize):
    """Return an OCR input (path str, or numpy array if preprocessing). Same resolution either way."""
    from PIL import Image
    im = Image.open(path).convert("RGB")
    if not binarize:
        return path, im.size
    import numpy as np
    g = np.array(im.convert("L"))
    t = int(g.mean() - 0.5 * g.std())        # simple adaptive threshold
    b = (g > t).astype(np.uint8) * 255
    return np.stack([b, b, b], axis=-1), im.size

def main(pages, binarize=False, force=False):
    from paddleocr import PaddleOCR
    ocr = PaddleOCR(use_doc_orientation_classify=False, use_doc_unwarping=False,
                    use_textline_orientation=False, enable_mkldnn=False)  # lang=None -> PP-OCRv6_medium
    for p in pages:
        out = os.path.join(CACHE, f"{p:04d}.json")
        if os.path.exists(out) and not force:
            print("cached", p); continue
        img = find_image(p)
        if not img:
            print("MISSING image for page", p); continue
        inp, (W, H) = load_input(img, binarize)
        r = ocr.predict(inp)[0]
        lines = []
        for t, b, s in zip(r["rec_texts"], r["rec_polys"], r["rec_scores"]):
            xs = [float(pt[0]) for pt in b]; ys = [float(pt[1]) for pt in b]
            lines.append({"t": t, "x0": min(xs), "x1": max(xs),
                          "y0": min(ys), "y1": max(ys), "s": round(float(s), 3)})
        json.dump({"page": p, "img": img, "W": W, "H": H, "pp": ("binarize" if binarize else "raw"),
                   "lines": lines}, open(out, "w"), ensure_ascii=False)
        print("ocr'd", p, len(lines), "lines", "(binarize)" if binarize else "")

def parse_pages(argv):
    pages = []
    for a in argv:
        if a.startswith("@"):
            pages += [int(x) for x in json.load(open(a[1:]))]
        elif "-" in a and all(p.isdigit() for p in a.split("-")):
            lo, hi = (int(x) for x in a.split("-"))
            pages += list(range(lo, hi + 1))
        elif a.isdigit():
            pages.append(int(a))
    return pages

if __name__ == "__main__":
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(parse_pages(argv), binarize="--binarize" in sys.argv, force="--force" in sys.argv)
