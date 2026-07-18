#!/usr/bin/env python
"""Segmenter for the tail sections (Buddhist Terms, Additions and Corrections, Third Supplement).
These use a DIFFERENT layout than the main dictionary: headword and definition on the SAME line
(`GESEL = GEDESYN  Belly; bowels.`), continuation lines indented, no cyrillic/vertical-script cols.

Each margin-starting line is a new entry; its leading ALL-CAPS tokens (+ '='/'<'/digits/symbols)
are the headword (lessingForm), the rest is the definition. Aligns to anchors by reading order.
Writes build/entries_suppl.json. Usage: python segment_suppl.py 1218-1226
"""
import json, os, re, sys, difflib, importlib.util

_spec = importlib.util.spec_from_file_location("_seg", os.path.join(os.path.dirname(__file__), "segment.py"))
_seg = importlib.util.module_from_spec(_spec)
_argv = list(sys.argv); sys.argv = [sys.argv[0]]      # segment.py reads sys.argv at import; shield it
_spec.loader.exec_module(_seg); sys.argv = _argv
canon, sim = _seg.canon, _seg.sim

def align(heads_text, groups):
    """DP align block-headwords to anchor groups (skips spurious blocks / missing entries)."""
    class H: pass
    hs = [{"t": t} for t in heads_text]
    reps = [{"dicForm": g[0]["dicForm"]} for g in groups]
    return _seg.align(hs, reps)   # returns {group_idx: head_idx}

HERE = os.path.dirname(__file__)
BUILD = os.path.join(HERE, "build")
CACHE = os.path.join(BUILD, "ocr_cache")
ANCHORS = json.load(open(os.path.join(BUILD, "anchors_all.json")))
MARGIN_TOL = 70   # px past the column-left edge still counts as an entry-start line

def alnum(s): return re.sub(r'[^A-Za-z0-9]', '', s)

def is_head_token(tok):
    """Headword-side token: all-uppercase letters, or a pure symbol/number (= < 3. , -)."""
    letters = [c for c in tok if c.isalpha()]
    if not letters:
        return True
    return all(c.isupper() for c in letters)

def split_head(text):
    """Split a start line into (lessingForm, definition) at the first non-headword token."""
    toks = text.split()
    i = 0
    while i < len(toks) and is_head_token(toks[i]):
        i += 1
    if i == 0:            # no leading caps (rare) -> treat whole as def
        return "", text.strip()
    return " ".join(toks[:i]).strip(), " ".join(toks[i:]).strip()

def left_edge(lines):
    xs = sorted(l["x0"] for l in lines)
    for x in xs:
        if sum(1 for y in xs if x-1 <= y <= x+40) >= 2:
            return x
    return xs[0] if xs else 0

def process_page(pg):
    d = json.load(open(os.path.join(CACHE, f"{pg:04d}.json")))
    mid = d["W"]/2.0
    anc = ANCHORS.get(str(pg), [])
    out = []
    for col in (0, 1):
        cl = sorted([l for l in d["lines"] if (l["x0"] < mid) == (col == 0)
                     and l["t"].strip() and not any('㐀' <= c <= '鿿' for c in l["t"])],
                    key=lambda l: l["y0"])
        if not cl:
            continue
        left = left_edge(cl)
        # entry-start = line beginning with an ALL-CAPS headword token (>=2 upper letters) near the
        # margin. Continuation (wrapped def) lines start lowercase/symbol or are deeply indented.
        blocks = []
        for l in cl:
            first = l["t"].split()[0] if l["t"].split() else ""
            letters = [c for c in first if c.isalpha()]
            starts_head = len(letters) >= 2 and all(c.isupper() for c in letters)
            if not blocks or starts_head:
                blocks.append([l])
            else:
                blocks[-1].append(l)
        acol = [a for a in anc if a["col"] == col+1]
        groups = []                              # one printed headword line -> several dicForm variants
        for a in acol:
            if groups and groups[-1][0]["sourceId"] == a["sourceId"]: groups[-1].append(a)
            else: groups.append([a])
        parsed = [split_head(" ".join(x["t"] for x in b)) for b in blocks]   # (lessingForm, def) per block
        g2b = align([p[0] for p in parsed], groups)      # {group_idx: block_idx}, DP by headword sim
        for k, g in enumerate(groups):
            bi = g2b.get(k)
            if bi is not None:
                less, expl = parsed[bi]
                ratio = sim(less, g[0]["dicForm"])
                flags = ["SUPPL"] + (["SUPPL_MISMATCH"] if ratio < 0.4 else [])
            else:
                less, expl, ratio, flags = "", "", 0.0, ["SUPPL", "NO_LINE"]
            for a in g:                          # variants share the parsed line
                out.append({"sourceId": a["sourceId"], "index": a["index"], "dicForm": a["dicForm"],
                            "lessingForm": less, "explain": expl, "flags": list(flags),
                            "matchRatio": round(ratio, 2)})
    return out

def parse_pages(argv):
    pages = []
    for a in argv:
        if "-" in a and all(p.isdigit() for p in a.split("-")):
            lo, hi = (int(x) for x in a.split("-")); pages += range(lo, hi+1)
        elif a.isdigit(): pages.append(int(a))
    return pages

if __name__ == "__main__":
    pages = parse_pages(sys.argv[1:])
    allout = []
    for pg in pages:
        if os.path.exists(os.path.join(CACHE, f"{pg:04d}.json")):
            allout += process_page(pg)
    json.dump(allout, open(os.path.join(BUILD, "entries_suppl.json"), "w"), ensure_ascii=False, indent=1)
    from collections import Counter
    print("entries:", len(allout))
    print("flags:", dict(Counter(f for e in allout for f in e["flags"])))
