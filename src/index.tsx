import React, { useState, useEffect, useMemo } from 'react';
import { Search, Book, X, Upload, Star, Filter, ChevronRight, Hash, Info, Volume2, Globe } from 'lucide-react';

// --- TYPES ---

interface DictionaryItem {
  id: string;
  cyrillic: string;
  traditional: string;
  romanization: string;
  pronunciation: string;
  definition: string;
  category: string;
  [key: string]: any; // Allow loose typing for other imported fields if necessary
}

interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

/**
 * SAMPLE DATA - Mongolian Dictionary Format
 * Fields: Cyrillic, Traditional, Romanisation, Pronunciation, Definition
 */
const DEFAULT_DATA: DictionaryItem[] = [
  { 
    "id": "1", 
    "cyrillic": "Сайн байна уу", 
    "traditional": "ᠰᠠᠶᠢᠨ ᠪᠠᠶᠢᠨ᠎ᠠ ᠤᠤ", 
    "romanization": "Sain baina uu", 
    "pronunciation": "/sæe̯n pæe̯n ʊː/", 
    "definition": "Hello / How are you?", 
    "category": "Greetings" 
  },
  { 
    "id": "2", 
    "cyrillic": "Баярлалаа", 
    "traditional": "ᠪᠠᠶᠠᠷᠯᠠᠯᠠ", 
    "romanization": "Bayarlalaa", 
    "pronunciation": "/bajr̩ɮaː/", 
    "definition": "Thank you", 
    "category": "Greetings" 
  },
  { 
    "id": "3", 
    "cyrillic": "Ном", 
    "traditional": "ᠨᠣᠮ", 
    "romanization": "Nom", 
    "pronunciation": "/nɔm/", 
    "definition": "Book", 
    "category": "Nouns" 
  },
  { 
    "id": "4", 
    "cyrillic": "Сургууль", 
    "traditional": "ᠰᠤᠷᠭᠠᠭᠤᠯᠢ", 
    "romanization": "Surguuli", 
    "pronunciation": "/sʊrɡʊːlʲ/", 
    "definition": "School", 
    "category": "Nouns" 
  },
  { 
    "id": "5", 
    "cyrillic": "Ус", 
    "traditional": "ᠤᠰᠤ", 
    "romanization": "Us", 
    "pronunciation": "/ʊs/", 
    "definition": "Water", 
    "category": "Nouns" 
  },
  { 
    "id": "6", 
    "cyrillic": "Тэнгэр", 
    "traditional": "ᠲᠩᠷᠢ", 
    "romanization": "Tenger", 
    "pronunciation": "/tʰeŋɡer/", 
    "definition": "Sky / Heaven", 
    "category": "Nature" 
  },
  { 
    "id": "7", 
    "cyrillic": "Морь", 
    "traditional": "ᠮᠣᠷᠢ", 
    "romanization": "Mori", 
    "pronunciation": "/mɔrʲ/", 
    "definition": "Horse", 
    "category": "Animals" 
  },
  { 
    "id": "8", 
    "cyrillic": "Гэр", 
    "traditional": "ᠭᠡᠷ", 
    "romanization": "Ger", 
    "pronunciation": "/ɡer/", 
    "definition": "Home / Yurt", 
    "category": "Culture" 
  }
];

export default function DictionaryApp() {
  // --- STATE ---
  const [data, setData] = useState<DictionaryItem[]>(DEFAULT_DATA);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<DictionaryItem | null>(null); // For the modal
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // --- EFFECTS ---
  
  // Load favorites from local storage on boot
  useEffect(() => {
    const savedFavs = localStorage.getItem('dict_favorites');
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
  }, []);

  // Save favorites whenever they change
  useEffect(() => {
    localStorage.setItem('dict_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- HANDLERS ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const json = JSON.parse(result);
        
        if (Array.isArray(json)) {
          // Map FileMaker export fields to our internal schema
          const normalizedData: DictionaryItem[] = json.map((item: any, index: number) => {
             // Helper to find field ignoring case
             const getField = (obj: any, key: string) => {
                const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
                return foundKey ? obj[foundKey] : null;
             };
             
             // Check standard object or fieldData (FileMaker XML/JSON format often uses fieldData)
             const src = item.fieldData || item;

             return {
                id: item.id || item.ID || `imported-${index}`,
                cyrillic: getField(src, 'cyrillic') || getField(src, 'term') || "Untitled",
                traditional: getField(src, 'traditional') || "",
                romanization: getField(src, 'romanization') || getField(src, 'latin') || "",
                pronunciation: getField(src, 'pronunciation') || getField(src, 'ipa') || "",
                definition: getField(src, 'definition') || getField(src, 'meaning') || "No definition",
                category: getField(src, 'category') || "General"
             };
          });
          
          setData(normalizedData);
          showNotification(`Successfully imported ${normalizedData.length} terms!`, 'success');
        } else {
          showNotification('Invalid JSON format. Expected an array of records.', 'error');
        }
      } catch (err) {
        showNotification('Error parsing JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const speakTerm = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    // Attempt to set Mongolian voice if available, otherwise default
    // Note: Browser support for Mongolian TTS is limited
    utterance.lang = 'mn-MN'; 
    window.speechSynthesis.speak(utterance);
  };

  // --- FILTERING LOGIC ---

  const filteredData = useMemo(() => {
    let result = data;

    // 1. Filter by Favorites
    if (showFavoritesOnly) {
      result = result.filter(item => favorites.includes(item.id));
    }

    // 2. Filter by Search Query (Cyrillic, Romanization, or Definition)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.cyrillic.toLowerCase().includes(lowerQuery) || 
        item.romanization.toLowerCase().includes(lowerQuery) ||
        item.definition.toLowerCase().includes(lowerQuery)
      );
    }

    // 3. Filter by Letter (Based on Romanization for easier sorting, or Cyrillic if preferred)
    if (selectedLetter !== 'All' && !searchQuery) {
      result = result.filter(item => 
        // Using Cyrillic for alphabet filtering usually makes sense for Mongolian dictionaries,
        // but can be switched to romanization.charAt(0) if preferred.
        item.cyrillic.charAt(0).toUpperCase() === selectedLetter
      );
    }

    // 4. Sort Alphabetically (by Cyrillic)
    return result.sort((a, b) => a.cyrillic.localeCompare(b.cyrillic));
  }, [data, searchQuery, selectedLetter, showFavoritesOnly, favorites]);

  // Mongolian Cyrillic Alphabet (Simplified for filtering)
  const alphabet = ['All', ...'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split('')];

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      
      {/* HEADER */}
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
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition mr-4 ${
                  showFavoritesOnly ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100'
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

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        
        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <p>Showing {filteredData.length} result{filteredData.length !== 1 && 's'}</p>
          {searchQuery && <p>Filtering by "{searchQuery}"</p>}
        </div>

        {/* List of Terms */}
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
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
                        <h2 className="text-xl font-bold text-slate-900">{item.cyrillic}</h2>
                        <span className="text-sm text-slate-500 font-medium">({item.romanization})</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                        <span className="font-mono bg-slate-100 px-1 rounded text-xs">{item.pronunciation}</span>
                        <span>•</span>
                        <span className="uppercase text-xs font-bold tracking-wider text-blue-600">{item.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mt-1 ml-1">{item.definition}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                  <button 
                    onClick={(e) => speakTerm(item.cyrillic, e)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                    title="Pronounce"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className={`p-2 rounded-full transition ${
                      favorites.includes(item.id) 
                        ? 'text-amber-500 hover:bg-amber-50' 
                        : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No words found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL */}
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
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 border rounded-lg text-sm font-medium transition shadow-sm ${
                    favorites.includes(selectedTerm.id)
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

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium animate-bounce z-50 ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}