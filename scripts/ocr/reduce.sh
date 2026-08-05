cd /mnt/dzidep/Codes/LessingDictWebsiteNew-v3.0.0a-20251202/scripts/ocr
source .venv/bin/activate
export FLAGS_use_mkldnn=0
cp build/entries_out.json build/entries_baseline.json
echo "[1/5] binarize re-OCR flagged pages"
python ocr_pages.py @build/flagged_pages.json --binarize --force >/tmp/reduce_ocr.log 2>&1
echo "[2/5] candidate segment"
python segment.py 1-1226 >/tmp/reduce_seg1.log 2>&1
cp build/entries_out.json build/entries_candidate.json
echo "[3/5] decide + revert regressions"
python decide_revert.py
echo "[4/5] final segment + cyrillic"
python segment.py 1-1226 --cyr >/tmp/reduce_seg2.log 2>&1
grep -aE "^flags:" /tmp/reduce_seg2.log
echo "[5/5] done"
echo "REDUCE DONE exit $?"
