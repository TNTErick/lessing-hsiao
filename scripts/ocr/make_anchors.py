#!/usr/bin/env python
"""Extract per-page anchors from src/data/lessing-dict.ts -> build/anchors_all.json.
Anchors = the known (sourceId, dicForm, col, line, index) for every entry, grouped by
page. They are the reliable spine that segment.py aligns noisy OCR headwords against.
Run whenever lessing-dict.ts changes.
"""
import re, json, os

HERE = os.path.dirname(__file__)
TS = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.ts"))
OUT = os.path.join(HERE, "build", "anchors_all.json")

def main():
    t = open(TS, encoding="utf-8").read()
    blocks = re.findall(r'\{[^{}]*?"imageName"\s*:\s*"[^"]+"[^{}]*\}', t, re.S)
    pages = {}
    for b in blocks:
        sid = re.search(r'"sourceId":\s*"([^"]+)"', b)
        df = re.search(r'"dicForm":\s*"((?:[^"\\]|\\.)*)"', b)
        idx = re.search(r'"index":\s*(\d+)', b)
        if not (sid and df and idx):
            continue
        m = re.match(r'L(\d+)-(\d+)-(\d+)', sid.group(1))
        if not m:
            continue
        pg, col, ln = (int(g) for g in m.groups())
        pages.setdefault(pg, []).append({"sourceId": sid.group(1), "dicForm": df.group(1),
                                         "col": col, "line": ln, "index": int(idx.group(1))})
    for pg in pages:
        pages[pg].sort(key=lambda e: (e["col"], e["line"]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(pages, open(OUT, "w"), ensure_ascii=False)
    print(f"pages={len(pages)} entries={sum(len(v) for v in pages.values())} -> {OUT}")

if __name__ == "__main__":
    main()
