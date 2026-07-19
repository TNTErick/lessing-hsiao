import { BookOpen, Image as ImageIcon, Info, X, ZoomIn, ZoomOut } from "lucide-react";
import type { LessingDictEntry } from "../data/lessing-dict";
import { useCallback, useRef, useState, type JSX } from "react";
import { convertToRomanised, convertToTraditional, type RomanizationScheme } from "../utils/script-conversion";
import { CRUCIAL_FLAGS, FLAG_LABELS } from "../utils/ocr-flags";


interface DetailModalProps {
  selectedTerm: LessingDictEntry | null;
  setSelectedTerm: (term: LessingDictEntry | null) => void;
  romanisationScheme: RomanizationScheme;
};

export function DetailModal({ 
  selectedTerm,
  setSelectedTerm,
  romanisationScheme,
}: DetailModalProps): JSX.Element {
    const [imageZoom, setImageZoom] = useState(2);
    const zoomIn = () => setImageZoom(z => Math.min(z + 0.5, 5));
    const zoomOut = () => setImageZoom(z => Math.max(z - 0.5, 1));

    // Drag-to-pan state
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    const onMouseDown = useCallback((e: React.MouseEvent) => {
      const el = imageContainerRef.current;
      if (!el) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
      el.style.cursor = 'grabbing';
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const el = imageContainerRef.current;
      if (!el) return;
      e.preventDefault();
      el.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
      el.scrollTop = dragStart.current.scrollTop - (e.clientY - dragStart.current.y);
    }, []);

    const onMouseUp = useCallback(() => {
      isDragging.current = false;
      const el = imageContainerRef.current;
      if (el) el.style.cursor = 'grab';
    }, []);

    // Shift+scroll to scroll horizontally, regular scroll to zoom
    const onWheel = useCallback((e: React.WheelEvent) => {
      const el = imageContainerRef.current;
      if (!el) return;
      if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }, []);

    return (
      <>
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTerm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>

            {/* LEFT Panel: Traditional Script (Sidebar) */}
            <div className="bg-slate-100 md:w-2/5 flex items-center justify-center p-8 overflow-x-auto border-b md:border-b-0 md:border-r border-slate-200 shadow-inner">
              <div
                className="text-6xl text-slate-800 font-serif leading-loose select-text whitespace-nowrap"
                style={{
                  writingMode: 'vertical-lr',
                  textOrientation: 'mixed',
                  fontFamily: '"MongolianScript", "Mongolian Script", "Classic Mongolian Dashtseden", "Mongolian Baiti", "Noto Sans Mongolian", serif'
                }}
              >
                {convertToTraditional(selectedTerm.tradRom)}
              </div>
            </div>

            {/* RIGHT Panel: Details */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 flex justify-between items-start border-b border-slate-100">
                <div className="pt-2">
                  <div className="flex flex-col space-y-1">
                    <h2 className="text-3xl font-bold text-slate-900 mb-1 romanised">{convertToRomanised(selectedTerm.tradRom, romanisationScheme)}</h2>
                    {selectedTerm.cyrillic && (
                      <span className="text-xl text-slate-600 font-medium">{selectedTerm.cyrillic}</span>
                    )}
                    <span className="font-mono text-xs text-slate-400">({selectedTerm.sourceId})</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTerm(null)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm mt-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">

                {/* OCR review flags */}
                {selectedTerm.ocrFlags && selectedTerm.ocrFlags.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                      OCR review flags
                    </h3>
                    <ul className="space-y-1">
                      {selectedTerm.ocrFlags.map((f) => {
                        const crucial = CRUCIAL_FLAGS.has(f);
                        return (
                          <li key={f} className="text-sm flex items-start gap-2">
                            <span className={crucial ? "font-bold text-amber-600" : "text-blue-500"}>
                              {crucial ? "[!]" : "ⓘ"}
                            </span>
                            <span className="text-slate-700">{FLAG_LABELS[f] ?? f}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Explanation */}
                {selectedTerm.explain && (
                  <div>
                    <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center">
                      <Info className="w-3 h-3 mr-1" /> Explanation
                    </h3>
                    <p className="text-lg text-slate-800 leading-relaxed border-l-4 border-blue-100 pl-3">
                      {selectedTerm.explain}
                    </p>
                  </div>
                )}

                {/* Examples */}
                {selectedTerm.examples && (
                  <div>
                    <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" /> Examples
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedTerm.examples}
                    </div>
                  </div>
                )}

                {/* Dictionary Page Image */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" /> Dictionary Page
                    </h3>
                    <div className="flex items-center space-x-1">
                      <button onClick={zoomOut} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition" title="Zoom out">
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-400 w-10 text-center">{Math.round(imageZoom * 100)}%</span>
                      <button onClick={zoomIn} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition" title="Zoom in">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div
                    ref={imageContainerRef}
                    className="overflow-auto max-h-[50vh] rounded-lg border border-slate-200 shadow-sm cursor-grab select-none"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onWheel={onWheel}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/TNTErick/lessing-hsiao/assets/lessing-images/${selectedTerm.imageName}`}
                      alt={`Dictionary page for ${selectedTerm.tradRom}`}
                      className="block"
                      style={{ width: `${imageZoom * 100}%`, maxWidth: 'none' }}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
}