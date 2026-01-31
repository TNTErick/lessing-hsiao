import React from 'react';
import { Star } from 'lucide-react';

interface SearchBarProps {
  alphabet: string[];
  selectedLetter: string;
  setSelectedLetter: (l: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (b: boolean) => void;
  clearSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  alphabet, selectedLetter, setSelectedLetter, showFavoritesOnly, setShowFavoritesOnly, clearSearch 
}) => (
  <div className="bg-white border-b border-gray-200 text-gray-600 overflow-x-auto">
    <div className="max-w-4xl mx-auto flex items-center space-x-1 px-4 py-2 min-w-max">
      <button
        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition mr-4 ${
          showFavoritesOnly ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100'
        }`}
      >
        <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
        <span>Saved</span>
      </button>
      <div className="h-6 w-px bg-gray-300 mx-2" />
      {alphabet.map((letter) => (
        <button
          key={letter}
          onClick={() => { setSelectedLetter(letter); clearSearch(); }}
          className={`px-2 py-1 rounded text-sm font-medium transition ${
            selectedLetter === letter ? 'text-blue-700 bg-blue-50 font-bold' : 'hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  </div>
);