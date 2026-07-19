#!/usr/bin/env python
"""Generate a self-contained review.html for proofreading OCR'd entries.
Reads src/data/lessing-dict.ts, embeds all entries inline, no external deps."""
import json, os, re, html

HERE = os.path.dirname(__file__)
TS = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.ts"))
OUT = os.path.join(HERE, "build", "review.html")

t = open(TS, encoding="utf-8").read()
data = json.loads(t[t.index("[\n"):t.rindex("]")+1])

def pg(e):
    m = re.match(r'L(\d+)', e["sourceId"]); return int(m.group(1)) if m else 0

rows = [{"i": e["index"], "p": pg(e), "s": e["sourceId"], "r": e.get("tradRom", ""),
         "l": e.get("lessingForm", ""), "c": e.get("cyrillic", ""),
         "e": e.get("explain", ""), "f": list(e.get("ocrFlags") or [])} for e in data]
n_cru = sum(1 for r in rows if set(r["f"]) & {"NO_HEADWORD","EMPTY_BODY","MERGED_HEAD","HEADWORD_MISMATCH","SPLIT_GUESS","NO_LINE","SUPPL_MISMATCH"})
n_any = sum(1 for r in rows if r["f"])
payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>Lessing OCR review</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:0;color:#1a1a1a;background:#fafafa}
 header{position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd;padding:10px 16px;z-index:5}
 header h1{font-size:15px;margin:0 0 8px}
 button{font:inherit;padding:5px 12px;border:1px solid #bbb;background:#fff;border-radius:6px;cursor:pointer}
 button.on{background:#1a4b8c;color:#fff;border-color:#1a4b8c}
 input[type=search]{font:inherit;padding:5px 10px;border:1px solid #bbb;border-radius:6px;width:280px}
 #stat{color:#666;margin-left:8px}
 table{border-collapse:collapse;width:100%}
 th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;vertical-align:top}
 th{position:sticky;top:76px;background:#f0f0f0;font-size:12px}
 td.rom{font-weight:600;white-space:nowrap}
 td.ex{max-width:560px}
 .cru{color:#b30000;font-weight:700}          /* [!] */
 .gen{color:#c58a00}                            /* ⓘ */
 .flag{font-size:11px;background:#eee;border-radius:4px;padding:1px 5px;margin-right:3px;white-space:nowrap}
 .flag.c{background:#fde0e0;color:#b30000}
 .flag.g{background:#fff3cf;color:#8a6500}
 tr.ok{background:#eafaea}
 tr.fix{background:#fff0f0}
 textarea{width:100%;font:inherit;min-height:34px;border:1px solid #ccc;border-radius:4px}
 .pager{padding:12px 16px;text-align:center}
 .mk{cursor:pointer;font-size:16px;margin-right:4px;opacity:.4}
 .mk.act{opacity:1}
</style></head><body>
<header>
 <h1>Lessing dictionary — OCR proofreading &nbsp;<span id=stat></span></h1>
 <button id=f-cru class=on>Crucial [!] (__NCRU__)</button>
 <button id=f-any>Any flag (__NANY__)</button>
 <button id=f-all>All (__NALL__)</button>
 &nbsp; <input type=search id=q placeholder="search romanised / cyrillic / english / id">
 &nbsp; <button id=exp>Export my marks (CSV)</button>
 &nbsp;<span style="color:#666">page <span id=pg>1</span></span>
 <button id=prev>&larr;</button><button id=next>&rarr;</button>
</header>
<table><thead><tr><th></th><th>page</th><th>sourceId</th><th>romanised</th><th>Lessing</th><th>cyrillic</th><th>english (OCR)</th><th>flags</th><th>correction</th></tr></thead>
<tbody id=tb></tbody></table>
<div class=pager><button id=prev2>&larr; prev</button> &nbsp; <button id=next2>next &rarr;</button></div>
<script>
const DATA=__PAYLOAD__;
const CRU=new Set(["NO_HEADWORD","EMPTY_BODY","MERGED_HEAD","HEADWORD_MISMATCH","SPLIT_GUESS","NO_LINE","SUPPL_MISMATCH"]);
const GEN=new Set(["CYR_LOW_CONF","GAMMA_CHECK","VOWEL_I_CHECK","CROSS_PAGE","CROSS_COLUMN","SUPPL"]);
const tier=f=>f.some(x=>CRU.has(x))?"crucial":f.length?"general":"clean";
const PS=150; let mode="crucial", q="", page=0, marks=JSON.parse(localStorage.getItem("ocrmarks")||"{}");
function filt(){
 let a=DATA;
 if(mode==="crucial") a=a.filter(r=>r.f.some(x=>CRU.has(x)));
 else if(mode==="any") a=a.filter(r=>r.f.length);
 if(q){const s=q.toLowerCase();a=a.filter(r=>(r.r+" "+r.l+" "+r.c+" "+r.e+" "+r.s).toLowerCase().includes(s));}
 return a;
}
function esc(s){return (s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function flagHtml(f){return f.map(x=>`<span class="flag ${CRU.has(x)?'c':'g'}">${x}</span>`).join("");}
function render(){
 const a=filt(); const pages=Math.max(1,Math.ceil(a.length/PS));
 if(page>=pages)page=pages-1; if(page<0)page=0;
 const slice=a.slice(page*PS,page*PS+PS);
 document.getElementById("stat").textContent=`${a.length} items · ${Object.keys(marks).length} marked`;
 document.getElementById("pg").textContent=(page+1)+"/"+pages;
 const tb=document.getElementById("tb"); tb.innerHTML="";
 for(const r of slice){
  const t=tier(r.f), ic=t==="crucial"?'<span class=cru>[!]</span>':t==="general"?'<span class=gen>&#9432;</span>':'';
  const m=marks[r.i]||{}; const tr=document.createElement("tr");
  tr.className=m.v==="ok"?"ok":m.v==="fix"?"fix":"";
  tr.innerHTML=`<td>${ic}<span class="mk ${m.v==='ok'?'act':''}" data-i=${r.i} data-v=ok title=correct>&#10003;</span>`
   +`<span class="mk ${m.v==='fix'?'act':''}" data-i=${r.i} data-v=fix title="needs fix">&#9998;</span></td>`
   +`<td>${r.p}</td><td style=color:#888>${r.s}</td><td class=rom>${esc(r.r)}</td><td>${esc(r.l)}</td>`
   +`<td>${esc(r.c)}</td><td class=ex>${esc(r.e)}</td><td>${flagHtml(r.f)}</td>`
   +`<td><textarea data-i=${r.i} placeholder="fix...">${esc(m.corr||"")}</textarea></td>`;
  tb.appendChild(tr);
 }
}
function setMode(x){mode=x;page=0;["cru","any","all"].forEach(k=>document.getElementById("f-"+k).classList.toggle("on",("crucial any all".split(" ")[["cru","any","all"].indexOf(k)])===x));render();}
document.getElementById("f-cru").onclick=()=>setMode("crucial");
document.getElementById("f-any").onclick=()=>setMode("any");
document.getElementById("f-all").onclick=()=>setMode("all");
document.getElementById("q").oninput=e=>{q=e.target.value;page=0;render();};
const nxt=()=>{page++;render();window.scrollTo(0,0);}, prv=()=>{page--;render();window.scrollTo(0,0);};
["next","next2"].forEach(id=>document.getElementById(id).onclick=nxt);
["prev","prev2"].forEach(id=>document.getElementById(id).onclick=prv);
document.getElementById("tb").addEventListener("click",e=>{
 const mk=e.target.closest(".mk"); if(!mk)return;
 const i=mk.dataset.i, v=mk.dataset.v; marks[i]=marks[i]||{};
 marks[i].v=marks[i].v===v?null:v; localStorage.setItem("ocrmarks",JSON.stringify(marks)); render();
});
document.getElementById("tb").addEventListener("input",e=>{
 if(e.target.tagName!=="TEXTAREA")return; const i=e.target.dataset.i;
 marks[i]=marks[i]||{}; marks[i].corr=e.target.value; localStorage.setItem("ocrmarks",JSON.stringify(marks));
});
document.getElementById("exp").onclick=()=>{
 let csv="index,verdict,correction\\n";
 for(const [i,m] of Object.entries(marks)){if(m.v||m.corr)csv+=`${i},${m.v||""},"${(m.corr||"").replace(/"/g,'""')}"\\n`;}
 const b=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(b);
 const a=document.createElement("a");a.href=u;a.download="ocr_corrections.csv";a.click();
};
render();
</script></body></html>"""

out = (PAGE.replace("__PAYLOAD__", payload).replace("__NCRU__", str(n_cru))
       .replace("__NANY__", str(n_any)).replace("__NALL__", str(len(rows))))
open(OUT, "w", encoding="utf-8").write(out)
print(f"wrote {OUT}  ({os.path.getsize(OUT)//1024} KB) | crucial={n_cru} any={n_any} all={len(rows)}")
