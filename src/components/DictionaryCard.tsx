import { ChevronRight, Star, Volume2 } from "lucide-react";
import type { DictionaryItem } from "../interface";
import type { JSX } from "react";

interface DictionaryCardProps {
  item: DictionaryItem;
  setSelectedTerm: (term: DictionaryItem | null) => void;
  speakTerm: (text: string, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  // toggleFavorite: (id: string, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  // favorites: string[];
}

export default function DictionaryCard({ 
  item,
  setSelectedTerm,
  speakTerm,
  // toggleFavorite,
  // favorites
  }: DictionaryCardProps): JSX.Element {
  return (
    <div
      key={item.id}
      onClick={() => setSelectedTerm(item)}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="flex-1">
        {/* Primary Row: Traditional (Large) | Cyrillic & Metadata */}
        <div className="flex items-center space-x-4 mb-2">

          {/* Vertical Script Display (with fixed height to prevent massive expansion) */}
          <div className="h-16 flex items-center bg-slate-50 px-2 rounded border border-slate-100">
            <h2
              className="text-3xl text-slate-800 font-serif leading-none"
              style={{
                writingMode: 'vertical-lr',
                textOrientation: 'mixed',
                fontFamily: '"MongolianScript", "Mongolian Script", "Classic Mongolian Dashtseden", "Mongolian Baiti", "Noto Sans Mongolian", serif'
              }}
            >
              {item.traditional}
            </h2>
          </div>

          {/* Horizontal Text Stack */}
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-xl font-bold text-slate-900">{item.romanisation}</h2>
              <span className="text-sm text-slate-500 font-medium">({item.cyrillic ?? ""})</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
              <span className="font-mono bg-slate-100 px-1 rounded text-xs">{item.pronunciation}</span>
              <span>•</span>
              <span className="uppercase text-xs font-bold tracking-wider text-blue-600">{item.category}</span>
            </div>

            
        <p className="text-slate-600 mt-1 ml-1">{item.definition}</p>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
        {/* <button
          onClick={(e) => speakTerm(item.cyrillic, e)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
          title="Pronounce"
        >
          <Volume2 className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => toggleFavorite(item.id, e)}
          className={`p-2 rounded-full transition ${favorites.includes(item.id)
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
            }`}
        >
          <Star className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
        </button> */}
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>
    </div>
  );
}