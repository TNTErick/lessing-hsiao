import json,re,os,shutil,sys
from flag_tiers import CRUCIAL
def pg(x):
    m=re.match(r'L(\d+)',x["sourceId"]); return int(m.group(1)) if m else 0
def score_by_page(path):
    e=json.load(open(path)); s={}
    for x in e:
        p=pg(x); s.setdefault(p,0)
        # badness: crucial flags + empty body + headword mismatch weigh in
        b=len(set(x["flags"])&CRUCIAL) + (1 if not x["bodyLines"] else 0)
        s[p]+=b
    return s
base=score_by_page("build/entries_baseline.json")
cand=score_by_page("build/entries_candidate.json")
flagged=json.load(open("build/flagged_pages.json"))
reverted=0
for p in flagged:
    if cand.get(p,0) > base.get(p,0):          # candidate worse -> revert this page to raw
        raw=f"build/ocr_cache_raw_bak/{p:04d}.json"
        if os.path.exists(raw):
            shutil.copy(raw,f"build/ocr_cache/{p:04d}.json"); reverted+=1
print(f"reverted {reverted}/{len(flagged)} pages (kept {len(flagged)-reverted} improved/equal)")
