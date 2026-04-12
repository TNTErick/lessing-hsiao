import { Globe, Search, Info, ChevronDown, X } from "lucide-react";
import { useState, type JSX } from "react";
import { LANGUAGES, type langType, type SearchField, SEARCH_FIELD_LABELS } from "../interface";
import { romanisationSchemes, type RomanizationScheme } from "../utils/script-conversion";

export interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedLetter: string;
    setSelectedLetter: (letter: string) => void;

    language: langType;
    setLanguage: (lang: langType) => void;
    setIsInfoOpen: (isOpen: boolean) => void;

    romanisationScheme: RomanizationScheme;
    setRomanisationScheme: (scheme: RomanizationScheme) => void;

    searchField: SearchField;
    setSearchField: (field: SearchField) => void;
}

export function Header({
    searchQuery, 
    setSearchQuery, 
    selectedLetter, 
    setSelectedLetter, 

    language,
    setLanguage,
    setIsInfoOpen,

    romanisationScheme,
    setRomanisationScheme,

    searchField,
    setSearchField,
}: HeaderProps): JSX.Element {
    
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isSchemeOpen, setIsSchemeOpen] = useState(false);
    const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
    const alphabet = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

    return (
        <header className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white shadow-lg sticky top-0 z-30 border-b border-indigo-800/50">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    {/* Brand Section */}
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm shadow-inner border border-white/5">
                            <Globe className="w-6 h-6 text-indigo-100" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Mongolian Dictionary</h1>
                            <p className="text-xs text-indigo-300/80 font-medium">Монгол хэлний толь бичиг</p>
                        </div>
                    </div>

                    {/* New Actions Section */}
                    <div className="flex items-center space-x-2">
                        {/* Info Button */}
                        <button 
                            className="p-2 hover:bg-white/10 rounded-full transition backdrop-blur-sm"
                            title="About Dictionary"
                            onClick={() => setIsInfoOpen(true)}
                        >
                            <Info className="w-5 h-5 text-indigo-100" />
                        </button>

                        {/* i18n Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center space-x-1 bg-white/10 border border-white/20 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/20 transition backdrop-blur-sm"
                            >
                                <span>{language.toUpperCase()}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isLangOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-xl py-1 z-50 text-slate-800 border border-gray-200">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                setLanguage(lang);
                                                setIsLangOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                        >
                                            {lang === 'en' ? 'English' : lang === 'mn' ? 'Монгол' : '日本語'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto flex shadow-md rounded-lg overflow-hidden">
                    {/* Search field dropdown */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setIsSearchFieldOpen(!isSearchFieldOpen)}
                            className="h-full flex items-center space-x-1 bg-indigo-800/80 border-r border-indigo-700/50 px-3 py-3 text-sm font-medium hover:bg-indigo-700 transition text-white backdrop-blur-sm"
                        >
                            <span className="whitespace-nowrap">{SEARCH_FIELD_LABELS[searchField]}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isSearchFieldOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSearchFieldOpen && (
                            <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-md shadow-xl py-1 z-50 text-slate-800 border border-gray-200">
                                {(Object.keys(SEARCH_FIELD_LABELS) as SearchField[]).map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => { setSearchField(field); setIsSearchFieldOpen(false); }}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                                            searchField === field ? 'font-bold text-indigo-700 bg-indigo-50' : ''
                                        }`}
                                    >
                                        {SEARCH_FIELD_LABELS[field]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-indigo-300" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border-none leading-5 bg-black/20 text-white placeholder-indigo-300/70 focus:outline-none focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-indigo-400 transition"
                            placeholder={`Search by ${SEARCH_FIELD_LABELS[searchField].toLowerCase()}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Alphabet Filter Bar */}
            <div className="bg-white border-b border-gray-200 text-gray-600 overflow-x-auto shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center space-x-1 px-4 py-2 min-w-max">

                    {/* Romanisation Scheme Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSchemeOpen(!isSchemeOpen)}
                            className="flex items-center space-x-1 border border-gray-300 px-2 py-1 rounded-md text-sm font-medium hover:bg-gray-50 transition text-gray-700 shadow-sm"
                        >
                            <span>{romanisationScheme}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isSchemeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSchemeOpen && (
                            <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-50 text-slate-800 border border-gray-200">
                                {romanisationSchemes.map((scheme) => (
                                    <button
                                        key={scheme}
                                        onClick={() => {
                                            setRomanisationScheme(scheme);
                                            setIsSchemeOpen(false);
                                        }}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                                            romanisationScheme === scheme ? 'font-bold text-indigo-700 bg-indigo-50' : ''
                                        }`}
                                    >
                                        {scheme}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    {alphabet.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => { setSelectedLetter(letter); setSearchQuery(''); }}
                            className={`px-2 py-1 rounded text-sm font-medium transition ${
                                selectedLetter === letter && !searchQuery
                                    ? 'text-indigo-700 bg-indigo-50 font-bold shadow-sm ring-1 ring-indigo-200'
                                    : 'hover:text-indigo-600 hover:bg-gray-50'
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
