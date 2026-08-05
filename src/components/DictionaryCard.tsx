import { ChevronRight } from "lucide-react";
import type { LessingDictEntry } from "../data/lessing-dict";
import type { JSX } from "react";
import { convertToRomanised, convertToTraditional, type RomanizationScheme } from "../utils/script-conversion";
import { flagTier, flagTitle } from "../utils/ocr-flags";

interface DictionaryCardProps {
  item: LessingDictEntry;
  setSelectedTerm: (term: LessingDictEntry | null) => void;
  speakTerm: (text: string, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  romanisationScheme: RomanizationScheme;
}

export default function DictionaryCard({ 
  item,
  setSelectedTerm,
  romanisationScheme,
  }: DictionaryCardProps): JSX.Element {
  const displayRomanisation = convertToRomanised(item.tradRom, romanisationScheme);
  const traditionalScript = convertToTraditional(item.tradRom);
  const tier = flagTier(item.ocrFlags);
  return (
    <div
      onClick={() => setSelectedTerm(item)}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="flex-1">
        {/* Primary Row: Traditional (Horizontal, wrapped) | Romanisation & Metadata */}
        <div className="flex items-center space-x-4 mb-2">

          {/* Traditional Script Display (horizontal, wrapping per word) */}
          <div className="flex flex-wrap items-center bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-[120px]">
            <span
              className="text-2xl text-slate-800 font-serif break-all vertical-script "
              style={{
                fontFamily: '"MongolianScript", "Mongolian Script", "Classic Mongolian Dashtseden", "Mongolian Baiti", "Noto Sans Mongolian", serif'
              }}
            >
              {traditionalScript}
            </span>
          </div>

          {/* Horizontal Text Stack */}
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-xl font-bold text-slate-900 romanised">{displayRomanisation}</h2>
              {item.cyrillic && <span className="text-sm text-slate-500 font-medium">({item.cyrillic})</span>}
              {tier === "crucial" && (
                <span title={flagTitle(item.ocrFlags!)} className="text-sm font-bold text-amber-600 cursor-help select-none">[!]</span>
              )}
              {tier === "general" && (
                <span title={flagTitle(item.ocrFlags!)} className="text-sm text-blue-500 cursor-help select-none">&#9432;</span>
              )}
            </div>

            {item.explain && (
              <p className="text-slate-600 mt-1 ml-1 line-clamp-2">{item.explain}</p>
            )}
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>
    </div>
  );
}