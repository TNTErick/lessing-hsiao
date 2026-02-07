import { Info, Star, Volume2, X } from "lucide-react";
import type { DictionaryItem } from "../interface";
import type { JSX } from "react";


interface DetailModalProps {
  selectedTerm: DictionaryItem | null;
  setSelectedTerm: (term: DictionaryItem | null) => void;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export function DetailModal({ selectedTerm, setSelectedTerm, favorites, toggleFavorite }: DetailModalProps): JSX.Element {
    return (
      <>
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTerm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row min-h-[400px]" onClick={e => e.stopPropagation()}>

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
                {selectedTerm.traditional}
              </div>
            </div>

            {/* RIGHT Panel: Details */}
            <div className="flex-1 flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 flex justify-between items-start border-b border-slate-100">
                <div className="pt-2">
                  <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedTerm.cyrillic}</h2>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xl text-slate-600 font-medium">{selectedTerm.romanization}</span>
                    <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-500 self-start">{selectedTerm.pronunciation}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTerm(null)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm mt-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">

                {/* Definition */}
                <div>
                  <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center">
                    <Info className="w-3 h-3 mr-1" /> Meaning
                  </h3>
                  <p className="text-lg text-slate-800 leading-relaxed border-l-4 border-blue-100 pl-3">
                    {selectedTerm.definition}
                  </p>
                </div>

                {/* Category tag */}
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Category: {selectedTerm.category}
                  </span>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3">
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(selectedTerm.cyrillic);
                    utterance.lang = 'mn-MN';
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Pronounce</span>
                </button>
                <button
                  onClick={(e) => toggleFavorite(selectedTerm.id, e)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 border rounded-lg text-sm font-medium transition shadow-sm ${favorites.includes(selectedTerm.id)
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Star className={`w-4 h-4 ${favorites.includes(selectedTerm.id) ? 'fill-current' : ''}`} />
                  <span>{favorites.includes(selectedTerm.id) ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
}