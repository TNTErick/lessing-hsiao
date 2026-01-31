import React, { useState, useEffect, useMemo } from 'react';
import { Star, Search, Info, Volume2, X } from 'lucide-react';
import type { DictionaryItem, NotificationState } from './types';
import { Header } from './components/Header';
import { DictionaryCard } from './components/DictionaryCard';


export default function DictionaryApp() {
  const [data, setData] = useState<DictionaryItem[]>(DEFAULT_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState<DictionaryItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Persistence
  useEffect(() => {
    const savedFavs = localStorage.getItem('dict_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  useEffect(() => {
    localStorage.setItem('dict_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          const normalized = json.map((item, index) => {
            const getField = (obj: any, key: string) => {
                const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
                return foundKey ? obj[foundKey] : null;
            };
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
          setData(normalized);
          showNotification(`Successfully imported ${normalized.length} terms!`, 'success');
        }
      } catch (err) { showNotification('Error parsing JSON file.', 'error'); }
    };
    reader.readAsText(file);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const speakTerm = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'mn-MN';
    window.speechSynthesis.speak(utterance);
  };

  // Logic
  const alphabet = ['All', ...'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split('')];
  const filteredData = useMemo(() => {
    let res = data;
    if (showFavoritesOnly) res = res.filter(i => favorites.includes(i.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(i => i.cyrillic.toLowerCase().includes(q) || i.romanization.toLowerCase().includes(q) || i.definition.toLowerCase().includes(q));
    } else if (selectedLetter !== 'All') {
      res = res.filter(i => i.cyrillic.charAt(0).toUpperCase() === selectedLetter);
    }
    return res.sort((a, b) => a.cyrillic.localeCompare(b.cyrillic));
  }, [data, searchQuery, selectedLetter, showFavoritesOnly, favorites]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} onFileUpload={handleFileUpload} />
      
      {/* Alphabet Bar */}
      <div className="bg-white border-b border-gray-200 text-gray-600 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center space-x-1 px-4 py-2 min-w-max">
          <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition mr-4 ${showFavoritesOnly ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100'}`}>
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} /> <span>Saved</span>
          </button>
          <div className="h-6 w-px bg-gray-300 mx-2" />
          {alphabet.map(l => (
            <button key={l} onClick={() => { setSelectedLetter(l); setSearchQuery(''); }} className={`px-2 py-1 rounded text-sm font-medium transition ${selectedLetter === l && !searchQuery ? 'text-blue-700 bg-blue-50 font-bold' : 'hover:text-blue-600 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <p>Showing {filteredData.length} results</p>
        </div>
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map(item => (
              <DictionaryCard key={item.id} item={item} isFavorite={favorites.includes(item.id)} onSelect={setSelectedTerm} onToggleFavorite={toggleFavorite} onSpeak={speakTerm} />
            ))
          ) : (
            <div className="text-center py-20">
                <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No words found</h3>
            </div>
          )}
        </div>
      </main>

      {/* Modal and Toast logic kept inline for simplicity as they are small conditional renders */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTerm(null)}>
            {/* Modal Content - Use the same logic from your index.tsx */}
        </div>
      )}
      {notification && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium z-50 ${notification.type === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}


const DEFAULT_DATA: DictionaryItem[] = [
  { 
    "id": "1", 
    "cyrillic": "Сайн байна уу", 
    "traditional": "ᠰᠠᠶᠢᠨ ᠪᠠᠶᠢᠨ᠎ᠠ ᠤᠤ", 
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
    "romanization": "tngri", 
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