import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { DictionaryItem, langType, NotificationState } from './interface';
import { Header } from './components/Header';

import untypedDefaultData from './data/test-data.json';
import { DetailModal } from './components/DetailModal';
import { NotificationToast } from './components/NotificationToast';
import DictionaryCard from './components/DictionaryCard';
import InfoModal from './components/InfoModal';
const DEFAULT_DATA = untypedDefaultData as DictionaryItem[];

export default function DictionaryApp() {
  // --- STATE ---
  // const [data, setData] = useState<DictionaryItem[]>(DEFAULT_DATA);
  const data = DEFAULT_DATA; // Temporarily disable data import feature
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<DictionaryItem | null>(null); // For the modal
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  // ts-expect-error ts(2322)
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<langType>('en');

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

  // const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     try {
  //       const result = e.target?.result as string;
  //       const json = JSON.parse(result);

  //       if (Array.isArray(json)) {
  //         // Map FileMaker export fields to our internal schema
  //         const normalizedData: DictionaryItem[] = json.map((item: any, index: number) => {
  //           // Helper to find field ignoring case
  //           const getField = (obj: any, key: string) => {
  //             const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  //             return foundKey ? obj[foundKey] : null;
  //           };

  //           // Check standard object or fieldData (FileMaker XML/JSON format often uses fieldData)
  //           const src = item.fieldData || item;

  //           return {
  //             id: item.id || item.ID || `imported-${index}`,
  //             cyrillic: getField(src, 'cyrillic') || getField(src, 'term') || "Untitled",
  //             traditional: getField(src, 'traditional') || "",
  //             romanization: getField(src, 'romanization') || getField(src, 'latin') || "",
  //             pronunciation: getField(src, 'pronunciation') || getField(src, 'ipa') || "",
  //             definition: getField(src, 'definition') || getField(src, 'meaning') || "No definition",
  //             category: getField(src, 'category') || "General"
  //           };
  //         });

  //         setData(normalizedData);
  //         showNotification(`Successfully imported ${normalizedData.length} terms!`, 'success');
  //       } else {
  //         showNotification('Invalid JSON format. Expected an array of records.', 'error');
  //       }
  //     } catch (err) {
  //       showNotification('Error parsing JSON file.', 'error');
  //     }
  //   };
  //   reader.readAsText(file);
  // };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // const showNotification = (message: string, type: 'success' | 'error') => {
  //   setNotification({ message, type });
  //   setTimeout(() => setNotification(null), 3000);
  // };

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

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLetter={selectedLetter}
        setSelectedLetter={setSelectedLetter}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        language={language}
        setLanguage={setLanguage}
        setIsInfoOpen={setIsInfoOpen}
      />

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
            filteredData.map((item) => <DictionaryCard
              key={item.id}
              item={item}
              setSelectedTerm={setSelectedTerm}
              speakTerm={speakTerm}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />)
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


      {/* Pop-up things that are invisible by default */}

      <DetailModal
        selectedTerm={selectedTerm}
        setSelectedTerm={setSelectedTerm}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <InfoModal isInfoOpen={isInfoOpen} setIsInfoOpen={setIsInfoOpen} language={language} />

      <NotificationToast notification={notification} />
    </div>
  );
}