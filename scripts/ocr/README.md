# Lessing dictionary OCR pipeline

OCRs the scanned dictionary pages (`LessingDictImages/**`) and fills the missing
`cyrillic` / `explain` / `examples` fields in `src/data/lessing-dict.ts`.

Uses **PP-OCRv6** (PaddleOCR) for detection + Latin/English recognition, and a
recognition-only **cyrillic PP-OCRv5** pass for the Mongolian Cyrillic field. Every
entry's headword + reading order is already known (`sourceId = L{page}-{col}-{line}`
in `lessing-dict.ts`); those *anchors* are the spine that OCR output is aligned to,
so misreads/misses are flagged rather than silently mis-filled.

## Layout

```
ocr_pages.py     PP-OCRv6 over pages -> build/ocr_cache/NNNN.json (raw boxes+text+scores)
segment.py       column split + DP-align to anchors + flags -> build/entries_out.json
make_anchors.py  regenerate build/anchors_all.json from lessing-dict.ts
build/           generated artifacts (gitignored)
```

## Setup

Needs its own Python 3.12 venv (the parent `scripts/` project is 3.14, which paddle
does not support yet).

### CPU

```bash
cd scripts/ocr
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install paddlepaddle paddleocr pillow numpy
```

### GPU (NVIDIA)

```bash
cd scripts/ocr
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install paddleocr pillow numpy
# GPU wheel from paddle's index (pick cuXXX matching your setup; cu126 works on
# recent drivers via forward-compat, incl. Turing/compute 7.5):
uv pip install paddlepaddle-gpu -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
```

Verify: `python -c "import paddle; paddle.utils.run_check()"`

## Run

```bash
source .venv/bin/activate
export FLAGS_use_mkldnn=0        # CPU only: avoids a oneDNN crash. Harmless on GPU.
python make_anchors.py                         # once (or after lessing-dict.ts changes)
python ocr_pages.py 1-2540                      # ranges or explicit page numbers
python segment.py 1-2540 --cyr                 # --cyr adds the cyrillic pass
```

`ocr_pages.py` is resumable — it skips pages already cached in `build/ocr_cache/`.
Override the image location with `LESSING_IMG_ROOT=/path/to/LessingDictImages`.

## Output & review flags

`build/entries_out.json` — one object per `sourceId` with `lessingForm` (raw OCR
headword, kept for record), `cyrillicRaw`, `bodyLines`, `matchRatio`, and `flags`:

| flag | meaning |
| --- | --- |
| `EMPTY_BODY` | real entry, no body text detected (faint / missed line) |
| `NO_HEADWORD` | anchor had no matching OCR headword (dense region) |
| `HEADWORD_MISMATCH` | OCR headword ≠ dicForm (usually a Γ misread; body may still be fine) |
| `VOWEL_I_CHECK` | dicForm has vowel+i — Lessing `AI`↔Hsiao `ayi`/`ai` is manual |
| `GAMMA_CHECK` | `y` between vowels in body — likely a γ misread as y |
| `CYR_LOW_CONF` | cyrillic recognition score < 0.6 |
| `CROSS_PAGE` / `CROSS_COLUMN` | entry body spilled across a page/column boundary |

Flags mark rows for manual review; nothing is written back to `lessing-dict.ts`
automatically.
