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
        <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-30">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    {/* Brand Section */}
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Globe className="w-6 h-6 text-blue-100" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Mongolian Dictionary</h1>
                            <p className="text-xs text-blue-200">Монгол хэлний толь бичиг</p>
                        </div>
                    </div>

                    {/* New Actions Section */}
                    <div className="flex items-center space-x-2">
                        {/* Info Button */}
                        <button 
                            className="p-2 hover:bg-blue-700 rounded-full transition"
                            title="About Dictionary"
                            onClick={() => setIsInfoOpen(true)}
                        >
                            <Info className="w-5 h-5" />
                        </button>

                        {/* i18n Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center space-x-1 bg-blue-900 border border-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-950 transition"
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
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
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
                <div className="relative max-w-2xl mx-auto flex">
                    {/* Search field dropdown */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setIsSearchFieldOpen(!isSearchFieldOpen)}
                            className="h-full flex items-center space-x-1 bg-blue-700 border border-blue-600 border-r-0 px-3 py-3 rounded-l-lg text-sm font-medium hover:bg-blue-600 transition text-white"
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
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                                            searchField === field ? 'font-bold text-blue-700 bg-blue-50' : ''
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
                            <Search className="h-5 w-5 text-blue-300" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border-none rounded-r-lg leading-5 bg-blue-900 text-white placeholder-blue-300 focus:outline-none focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-400 transition shadow-inner"
                            placeholder={`Search by ${SEARCH_FIELD_LABELS[searchField].toLowerCase()}...`}
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
            </div>

            {/* Alphabet Filter Bar */}
            <div className="bg-white border-b border-gray-200 text-gray-600 overflow-x-auto">
                <div className="max-w-4xl mx-auto flex items-center space-x-1 px-4 py-2 min-w-max">

                    {/* Romanisation Scheme Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSchemeOpen(!isSchemeOpen)}
                            className="flex items-center space-x-1 border border-gray-300 px-2 py-1 rounded-md text-sm font-medium hover:bg-gray-50 transition text-gray-700"
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
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                                            romanisationScheme === scheme ? 'font-bold text-blue-700 bg-blue-50' : ''
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