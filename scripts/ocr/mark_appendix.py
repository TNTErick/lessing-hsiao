#!/usr/bin/env python
"""Mark appendix (supplement) entries in the canonical dictionary.

The Lessing dictionary body ends at page 1086 (last headword `ǰarm_a`). A supplement
then restarts the alphabet A->Z from page 1159 (`abi`) and runs to the end (page 1226).
Everything on page >= APPENDIX_START_PAGE is part of that supplement.

The older SUPPL *ocr flag* only covered pages 1180+, so ~427 supplement entries on
pages 1159-1179 (e.g. `adistid` at L1159) were never marked. This sets a structural
`appendix: true` field on every entry in the supplement, which the website's
"Main entries only" toggle and review.html rely on. Re-run after re-segmenting data,
then regenerate web assets:  python scripts/gen_web_data.py
"""
import json, os, re, sys

HERE = os.path.dirname(__file__)
SRC = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.json"))
APPENDIX_START_PAGE = 1159  # first supplement page (alphabet resets to 'a' here)


def page_of(entry):
    m = re.match(r"L(\d+)", entry.get("sourceId", ""))
    return int(m.group(1)) if m else 0


def main(write=False):
    data = json.load(open(SRC, encoding="utf-8"))
    changed = 0
    for e in data:
        is_app = page_of(e) >= APPENDIX_START_PAGE
        if is_app:
            if not e.get("appendix"):
                e["appendix"] = True
                changed += 1
        elif "appendix" in e:  # keep it clean if boundary ever moves
            del e["appendix"]
            changed += 1
    total_app = sum(1 for e in data if e.get("appendix"))
    print(f"appendix entries: {total_app}  (changed {changed})  boundary: page >= {APPENDIX_START_PAGE}")
    if write:
        json.dump(data, open(SRC, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"wrote {SRC}")
    else:
        print("dry run — pass --write to save")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
