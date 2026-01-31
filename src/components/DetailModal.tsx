import React from 'react';
import { X, Info, Volume2, Star } from 'lucide-react';
import type { DictionaryItem } from '../types';

interface Props {
  term: DictionaryItem;
  isOpen: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const DetailModal: React.FC<Props> = ({ term, isFavorite, onClose, onToggleFavorite }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row min-h-[400px]" onClick={e => e.stopPropagation()}>
      <div className="bg-slate-100 md:w-2/5 flex items-center justify-center p-8 border-r border-slate-200">
        <div className="text-6xl text-slate-800 font-serif" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
          {term.traditional}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 flex justify-between items-start border-b">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{term.cyrillic}</h2>
            <p className="text-xl text-slate-600">{term.romanization}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>
        <div className="px-6 py-6 flex-1">
          <h3 className="text-xs font-semibold text-blue-600 uppercase mb-2 flex items-center"><Info className="w-3 h-3 mr-1" /> Meaning</h3>
          <p className="text-lg text-slate-800 border-l-4 border-blue-100 pl-3">{term.definition}</p>
        </div>
        <div className="p-4 bg-slate-50 flex space-x-3">
           {/* Add Action Buttons Here */}
        </div>
      </div>
    </div>
  </div>
);