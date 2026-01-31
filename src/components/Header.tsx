import { Globe, Search, Star, Upload } from "lucide-react";
import type { JSX } from "react";

export interface HeaderProps {
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedLetter: string;
    setSelectedLetter: (letter: string) => void;
    showFavoritesOnly: boolean;
    setShowFavoritesOnly: (show: boolean) => void;
}

export function Header({ handleFileUpload, searchQuery, setSearchQuery, selectedLetter, setSelectedLetter, showFavoritesOnly, setShowFavoritesOnly }: HeaderProps): JSX.Element {
    
    
    
    // Mongolian Cyrillic Alphabet (Simplified for filtering)
    const alphabet = ['All', ...'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split('')];

    return (
            <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <Globe className="w-6 h-6 text-blue-100" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Mongolian Dictionary</h1>
                        <p className="text-xs text-blue-200">Монгол хэлний толь бичиг</p>
                    </div>
                    </div>

                    <div className="flex items-center space-x-3">
                    <label className="cursor-pointer bg-blue-900 hover:bg-blue-950 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-2 border border-blue-700">
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import JSON</span>
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border-none rounded-lg leading-5 bg-blue-900 text-white placeholder-blue-300 focus:outline-none focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-400 transition shadow-inner"
                    placeholder="Search in Cyrillic, Romanization, or English..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    )}
                </div>
                </div>

                {/* Alphabet Filter Bar */}
                <div className="bg-white border-b border-gray-200 text-gray-600 overflow-x-auto">
                <div className="max-w-4xl mx-auto flex items-center space-x-1 px-4 py-2 min-w-max">
                    <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition mr-4 ${showFavoritesOnly ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100'
                        }`}
                    >
                    <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    <span>Saved</span>
                    </button>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    {alphabet.map((letter) => (
                    <button
                        key={letter}
                        onClick={() => { setSelectedLetter(letter); setSearchQuery(''); }}
                        className={`px-2 py-1 rounded text-sm font-medium transition ${selectedLetter === letter && !searchQuery
                            ? 'text-blue-700 bg-blue-50 font-bold'
                            : 'hover:text-blue-600 hover:bg-gray-50'
                        }`}
                    >
                        {letter}
                    </button>
                    ))}
                </div>
                </div>
            </header>
    );
}