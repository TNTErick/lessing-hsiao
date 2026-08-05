#!/usr/bin/env python
"""Segment cached OCR into per-sourceId entries using anchor layout + DP alignment.
Usage: python segment.py 600 601 602        # IN ORDER (cross-page carry)
Writes entries_out.json; prints accuracy report.
"""
import json, os, re, sys, difflib
from collections import Counter

CYR_SET = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяөүАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯӨҮ'
def clean_cyr(t):
    t = ''.join(c for c in t if c in CYR_SET or c in ' ,-')
    return re.sub(r'\s+', ' ', t).strip(' ,-')

HERE = os.path.dirname(__file__)
BUILD = os.path.join(HERE, "build")
CACHE = os.path.join(BUILD, "ocr_cache")
ANCHORS = json.load(open(os.path.join(BUILD, "anchors_all.json")))

HEIGHT_JUNK = 55          # boxes taller than this are vertical-script glyphs
HEAD_MARGIN = 38          # px past column-left edge still counts as headword
REPL = {'č':'c','ǰ':'j','š':'s','ü':'u','ö':'o','ȯ':'o','ḵ':'k','γ':'g','x':'q','z':'j'}

def canon(s):
    s = s.lower()
    s = ''.join(REPL.get(c, c) for c in s)
    return re.sub(r'[^a-z\-]', '', s)   # keep hyphens: '-a' vs 'a-' vs 'a' stay distinct

def CJK(s): return any('㐀' <= c <= '鿿' or '豈' <= c <= '﫿' for c in s)
def alnum(s): return re.sub(r'[^A-Za-z0-9]', '', s)
def sim(h, a):
    ch, ca = canon(h), canon(a)
    r = difflib.SequenceMatcher(None, ch, ca).ratio()
    if ch.startswith('-') != ca.startswith('-'): r -= 0.15   # prefix (suffix-entry) must agree
    if ch.endswith('-') != ca.endswith('-'): r -= 0.15       # trailing '-' (verb stem) must agree
    return r
def has_vowel_i(df): return bool(re.search(r'[aeiouöüȯ]i', df))

def upper_ratio(t):
    a = [c for c in t if c.isascii() and c.isalpha()]
    return sum(c.isupper() for c in a) / len(a) if a else 0.0

def is_head_candidate(l):
    """Headwords are bold CAPS. Require mostly-uppercase to exclude flush-left lowercase
    definition lines. (Garbled heads that lose their caps -- e.g. 'BI,1.'->'9' -- can't be
    matched by text anyway; a margin line buried in a body is flagged instead, see MERGED_HEAD.)"""
    return len(alnum(l["t"])) >= 2 and l["s"] >= 0.5 and upper_ratio(l["t"]) >= 0.5

def split_by_gaps(lines, k):
    """Split y-sorted lines into k chunks at the k-1 largest vertical gaps (entry boundaries)."""
    if k <= 1 or len(lines) <= 1:
        return [lines]
    order = sorted(range(len(lines)-1), key=lambda i: lines[i+1]["y0"]-lines[i]["y0"], reverse=True)
    cuts = sorted(order[:k-1])
    chunks, start = [], 0
    for c in cuts:
        chunks.append(lines[start:c+1]); start = c+1
    chunks.append(lines[start:])
    return chunks

def head_left_edge(cands):
    """Column left margin = leftmost x0 among headword candidates that is not a lone outlier
    (>=2 within 45px). Guards against a stray glyph dragging the band."""
    xs = sorted(l["x0"] for l in cands)
    for x in xs:
        if sum(1 for y in xs if x - 1 <= y <= x + 45) >= 2:
            return x
    return xs[0] if xs else 0

def is_junk(l):
    t = l["t"].strip()
    if not t: return True
    if CJK(t): return True
    h, w = l["y1"] - l["y0"], l["x1"] - l["x0"]
    if h >= HEIGHT_JUNK and h > w: return True             # vertical-script glyph: tall AND narrower than tall
    if re.fullmatch(r'-?\d{3,4}-?', t): return True         # page number (3-4 digits); keep 1-2 digit garbled heads
    if l["s"] < 0.4 and len(alnum(t)) <= 2: return True
    return False

def align(heads, anchors):
    """Needleman-Wunsch: returns dict anchor_idx -> head_idx (monotonic, gaps allowed)."""
    H, A, GAP, NEG = len(heads), len(anchors), 0.35, -1e9
    dp = [[0.0]*(A+1) for _ in range(H+1)]
    bt = [[None]*(A+1) for _ in range(H+1)]
    for i in range(1, H+1): dp[i][0] = -GAP*i; bt[i][0] = 'H'
    for j in range(1, A+1): dp[0][j] = -GAP*j; bt[0][j] = 'A'
    for i in range(1, H+1):
        for j in range(1, A+1):
            best, op = NEG, None
            v = dp[i-1][j-1] + sim(heads[i-1]["t"], anchors[j-1]["dicForm"])
            if v > best: best, op = v, 'M'
            v = dp[i-1][j] - GAP
            if v > best: best, op = v, 'H'
            v = dp[i][j-1] - GAP
            if v > best: best, op = v, 'A'
            dp[i][j], bt[i][j] = best, op
    i, j, a2h = H, A, {}
    while i > 0 or j > 0:
        op = bt[i][j]
        if op == 'M': a2h[j-1] = i-1; i -= 1; j -= 1
        elif op == 'H': i -= 1
        else: j -= 1
    return a2h

def process_page(pg, rec=None):
    """Segment ONE page. Returns (entries_sorted, col0_preamble_texts). col0 preamble belongs to
    the PREVIOUS page's last entry (caller attaches it). Cyrillic filled here, per page, so only
    one image + that page's crops are ever in memory (bounded)."""
    cf = os.path.join(CACHE, f"{pg:04d}.json")
    if not os.path.exists(cf):
        return [], []
    doc = json.load(open(cf)); anc = ANCHORS.get(str(pg), [])
    mid = doc["W"]/2.0
    good = [l for l in doc["lines"] if not is_junk(l)]
    cols = {0: [l for l in good if l["x0"] < mid], 1: [l for l in good if l["x0"] >= mid]}
    acol = {0: [a for a in anc if a["col"] == 1], 1: [a for a in anc if a["col"] == 2]}
    entries = []
    col0_pre = []
    if True:
        for col in (0, 1):
            # group anchors sharing a sourceId -> one printed headword may hold several dicForm variants
            groups = []
            for a in acol[col]:
                if groups and groups[-1][0]["sourceId"] == a["sourceId"]:
                    groups[-1].append(a)
                else:
                    groups.append([a])
            cl = sorted(cols[col], key=lambda l: l["y0"])
            if not cl:
                for g in groups:
                    for a in g: entries.append(mk(a, None, [], "", pg, col))
                continue
            cands = [l for l in cl if is_head_candidate(l)]
            if not cands:
                for g in groups:
                    for a in g: entries.append(mk(a, None, [], "", pg, col))
                continue
            left = head_left_edge(cands)
            heads = [l for l in cands if l["x0"] <= left + HEAD_MARGIN]
            heads.sort(key=lambda l: l["y0"])
            # collapse heads within same y-cluster (keep leftmost)
            hh = []
            for h in heads:
                if hh and abs(h["y0"] - hh[-1]["y0"]) < 22: continue
                hh.append(h)
            heads = hh
            reps = [g[0] for g in groups]
            if len(heads) == len(groups):
                g2h = {i: i for i in range(len(groups))}   # counts match -> reading-order 1:1 (robust vs homographs)
            else:
                g2h = align(heads, reps)                   # counts differ -> DP align, gaps allowed
            matched = sorted(((heads[hi]["y0"], gi, hi) for gi, hi in g2h.items()))
            matched_ids = {id(heads[hi]) for hi in g2h.values()}
            body_lines = [l for l in cl if id(l) not in matched_ids]  # skipped head-candidates rejoin body
            # lines above the first matched head are spillover from the previous entry
            first_y = matched[0][0] if matched else 1e9
            pre = [l["t"] for l in sorted((l for l in body_lines if l["y0"] < first_y - 8),
                                          key=lambda l: (l["y0"], l["x0"]))]
            if pre:
                if col == 0:
                    col0_pre = pre                       # belongs to previous PAGE's last entry
                elif entries:
                    entries[-1]["bodyLines"] += pre      # previous COLUMN's last entry (same page)
                    entries[-1]["flags"].add("CROSS_COLUMN")
            ys = [m[0] for m in matched]
            mgis = [m[1] for m in matched]
            split_body = {}   # orphan group_idx -> recovered body (from a merged neighbour)
            split_from = set()  # matched group_idx whose body was auto-split
            for k, (y0, gi, hi) in enumerate(matched):
                y_end = ys[k+1] if k+1 < len(ys) else 1e9
                h = heads[hi]
                blines = [l for l in body_lines if y0-8 <= l["y0"] < y_end-8]
                cyr_toks = [l for l in blines if abs(l["y0"]-y0) < 22 and l["x0"] > h["x1"]+5]
                body_ls = sorted((l for l in blines if l not in cyr_toks), key=lambda l: (l["y0"], l["x0"]))
                cyr = " ".join(l["t"].lstrip("/ ").strip() for l in sorted(cyr_toks, key=lambda l: l["x0"]))
                # next anchor group(s) with no headword: their text fell into this range. Split the
                # body at the largest vertical gaps (entry boundaries) and hand chunks to the orphans.
                next_gi = mgis[k+1] if k+1 < len(mgis) else len(groups)
                n_orphan = next_gi - gi - 1
                if n_orphan > 0 and len(body_ls) >= n_orphan + 1:
                    chunks = split_by_gaps(body_ls, n_orphan + 1)
                    body = [l["t"] for l in chunks[0]]
                    for j in range(1, len(chunks)):
                        split_body[gi + j] = [l["t"] for l in chunks[j]]
                    split_from.add(gi)
                else:
                    body = [l["t"] for l in body_ls]
                merged = n_orphan > 0 and bool(body_ls)
                box = (int(h["x1"])-18, max(0, int(h["y0"])-6),
                       (int(mid)-20 if col == 0 else doc["W"]-20), int(h["y1"])+6)
                for a in groups[gi]:                       # all variants share the head/body/cyrillic
                    e = mk(a, h, body, cyr, pg, col)
                    if merged: e["flags"].add("MERGED_HEAD")
                    e["_cyrbox"] = box; e["_img"] = doc["img"]
                    entries.append(e)
            for gi, g in enumerate(groups):
                if gi not in g2h:
                    b = split_body.get(gi, [])
                    for a in g:
                        e = mk(a, None, b, "", pg, col)
                        if b: e["flags"].add("SPLIT_GUESS")   # body recovered by gap-split, verify
                        entries.append(e)
    entries.sort(key=lambda e: e["_order"])       # anchor order; stable for dup sourceIds
    if rec is not None:
        fill_cyrillic_page(entries, rec)           # one image + this page's crops only
    return entries, col0_pre

def fill_cyrillic_page(entries, rec):
    """Cyrillic recognition for ONE page: open its image once, crop the headword-right regions,
    recognize, release. Bounded memory (~1 image + ~20 crops)."""
    from PIL import Image
    import numpy as np
    boxed = [e for e in entries if e.get("_cyrbox")]
    if not boxed: return
    img = Image.open(boxed[0]["_img"]).convert("RGB")
    crops, refs = [], []
    for e in boxed:
        x0, y0, x1, y1 = e["_cyrbox"]
        if x1 - x0 < 30 or y1 - y0 < 8: continue
        crops.append(np.array(img.crop((x0, y0, x1, y1)))); refs.append(e)
    img.close()
    if not crops: return
    for e, r in zip(refs, rec.predict(crops)):
        c = clean_cyr(r["rec_text"])
        if c:
            e["cyrillicRaw"] = c
            if float(r["rec_score"]) < 0.6: e["flags"].add("CYR_LOW_CONF")

def mk(a, h, body, cyr, pg, col):
    flags = set()
    less = h["t"].split("/")[0].strip() if h else ""   # drop merged "/ CYRILLIC" tail
    ratio = sim(less, a["dicForm"]) if h else 0.0
    if not h: flags.add("NO_HEADWORD")
    elif ratio < 0.6: flags.add("HEADWORD_MISMATCH")
    if has_vowel_i(a["dicForm"]): flags.add("VOWEL_I_CHECK")
    if not body and h: flags.add("EMPTY_BODY")
    # γ↔y confusion: 'y' between vowels in romanised text usually should be γ
    if any(re.search(r'[aeiou]y[aeiou]', b) for b in body): flags.add("GAMMA_CHECK")
    return {"sourceId": a["sourceId"], "dicForm": a["dicForm"], "page": pg, "col": col+1,
            "lessingForm": less, "matchRatio": round(ratio, 2),
            "cyrillicRaw": cyr, "bodyLines": body, "flags": flags, "_order": a["index"]}

CYR = "--cyr" in sys.argv

def parse_pages(argv):
    """Accept explicit nums and 'START-END' ranges: e.g. 600 601, or 1-2540."""
    pages = []
    for a in argv:
        if "-" in a and all(p.isdigit() for p in a.split("-")):
            lo, hi = (int(x) for x in a.split("-"))
            pages += list(range(lo, hi + 1))
        elif a.isdigit():
            pages.append(int(a))
    return pages

def clean_out(e):
    return {k: (sorted(v) if k == "flags" else v) for k, v in e.items() if not k.startswith("_")}

if __name__ == "__main__":
    pages = parse_pages(sys.argv[1:])
    rec = None
    if CYR:
        from paddleocr import TextRecognition
        rec = TextRecognition(model_name="cyrillic_PP-OCRv5_mobile_rec")

    out_path = os.path.join(BUILD, "entries_out.json")
    out = open(out_path, "w", encoding="utf-8")
    out.write("[\n")
    state = {"first": True, "n": 0}
    counts = Counter()

    def flush(ents):                               # stream entries to disk; keep nothing
        for e in ents:
            counts.update(e["flags"])
            out.write(("" if state["first"] else ",\n") + json.dumps(clean_out(e), ensure_ascii=False))
            state["first"] = False; state["n"] += 1

    prev = None                                    # 1-page lookback (for cross-page spillover)
    for i, pg in enumerate(pages):
        ents, col0_pre = process_page(pg, rec)
        if prev is not None:
            if col0_pre and prev:                  # this page's col0 top belongs to prev page's last entry
                prev[-1]["bodyLines"] += col0_pre
                prev[-1]["flags"].add("CROSS_PAGE")
            flush(prev)
        prev = ents
        if i % 100 == 0: print(f"...page {pg} ({state['n']} entries so far)", flush=True)
    if prev is not None: flush(prev)
    out.write("\n]\n"); out.close()

    print(f"\nTOTAL {state['n']}")
    print("flags:", dict(counts.most_common()))
