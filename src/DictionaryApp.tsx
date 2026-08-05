import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { List, useDynamicRowHeight } from 'react-window';
import type { RowComponentProps } from 'react-window';
import type { langType, SearchField } from './interface';
import { Header } from './components/Header';
import type { RomanizationScheme } from './utils/script-conversion';

import type { LessingDictEntry } from './data/lessing-dict';
import { DetailModal } from './components/DetailModal';
import { NotificationToast } from './components/NotificationToast';
import DictionaryCard from './components/DictionaryCard';
import InfoModal from './components/InfoModal';
import { convertToRomanised } from './utils/script-conversion';

interface DictionaryRowProps {
  items: LessingDictEntry[];
  setSelectedTerm: (term: LessingDictEntry | null) => void;
  speakTerm: (text: string, e?: React.MouseEvent) => void;
  romanisationScheme: RomanizationScheme;
  observeRowElements: (elements: Element[] | NodeListOf<Element>) => () => void;
}

function DictionaryListRow({
  index,
  style,
  items,
  setSelectedTerm,
  speakTerm,
  romanisationScheme,
  observeRowElements,
}: RowComponentProps<DictionaryRowProps>) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      return observeRowElements([innerRef.current]);
    }
  }, [observeRowElements]);

  return (
    <div style={style}>
      <div ref={innerRef} data-react-window-index={index} className="pb-3">
        <DictionaryCard
          item={items[index]}
          setSelectedTerm={setSelectedTerm}
          speakTerm={speakTerm}
          romanisationScheme={romanisationScheme}
        />
      </div>
    </div>
  );
}

export default function DictionaryApp() {
  // --- STATE ---
  // Two-phase load (kept out of the JS bundle so the shell paints instantly):
  //  1. dict-index.json — light (no explain/examples): list + romanised/cyrillic search.
  //  2. dict-detail.json — heavy definitions, merged in afterwards (English search + modal
  //     text light up once it arrives). See scripts/gen_web_data.py.
  const [data, setData] = useState<LessingDictEntry[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [detailLoaded, setDetailLoaded] = useState<boolean>(false);
  useEffect(() => {
    let alive = true;
    const base = import.meta.env.BASE_URL;
    fetch(`${base}dict-index.json`)
      .then((r) => r.json())
      .then((idx: LessingDictEntry[]) => {
        if (!alive) return;
        setData(idx);
        setDataLoading(false);
        // Phase 2: definitions, in the background. Mutate the same objects so an already-open
        // modal (which holds a reference) fills in too, then trigger a re-render.
        fetch(`${base}dict-detail.json`)
          .then((r) => r.json())
          .then((detail: Record<string, { explain?: string; examples?: string; sourceId?: string; imageName?: string }>) => {
            if (!alive) return;
            for (const e of idx) {
              const d = detail[e.index];
              if (d) {
                if (d.explain) e.explain = d.explain;
                if (d.examples) e.examples = d.examples;
                if (d.sourceId) e.sourceId = d.sourceId;
                if (d.imageName) e.imageName = d.imageName;
              }
            }
            setData([...idx]);
            setDetailLoaded(true);
          })
          .catch(() => { if (alive) setDetailLoaded(true); });
      })
      .catch(() => { if (alive) setDataLoading(false); });
    return () => { alive = false; };
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<LessingDictEntry | null>(null); // For the modal
  // const [favorites, setFavorites] = useState<string[]>([]);
  // const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  // const showFavoritesOnly = false; // Temporarily disable favorites filter
  // const favorites: string[] = [] as const; // Temporarily disable favorites feature
  // const setShowFavoritesOnly = () => {}; // Placeholder function to avoid errors
  
  const notification = null; // Temporarily disable notifications
  // const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<langType>('en');
  const [romanisationScheme, setRomanisationScheme] = useState<RomanizationScheme>('hsiao');
  const [searchField, setSearchField] = useState<SearchField>('romanisation');
  const [mainOnly, setMainOnly] = useState<boolean>(true); // hide appendix/supplement entries by default

  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: 100,
    key: selectedLetter + '|' + searchQuery,
  });

  // --- EFFECTS ---

  // Load favorites from local storage on boot
  // useEffect(() => {
  //   const savedFavs = localStorage.getItem('dict_favorites');
  //   if (savedFavs) {
  //     setFavorites(JSON.parse(savedFavs));
  //   }
  // }, []);

  // Save favorites whenever they change
  // useEffect(() => {
  //   localStorage.setItem('dict_favorites', JSON.stringify(favorites));
  // }, [favorites]);



  // const toggleFavorite = (id: string, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   if (favorites.includes(id)) {
  //     setFavorites(favorites.filter(favId => favId !== id));
  //   } else {
  //     setFavorites([...favorites, id]);
  //   }
  // };

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
    let result: LessingDictEntry[] = [...data];

    // 0. Hide appendix/supplement entries unless the user opts in
    if (mainOnly) {
      result = result.filter(item => !item.appendix);
    }

    // 1. Filter by Favorites
    // if (showFavoritesOnly) {
    //   result = result.filter(item => favorites.includes(item.id));
    // }

    // 2. Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      if (searchField === 'cyrillic') {
        result = result.filter(item => item.cyrillic?.toLowerCase().includes(lowerQuery));
      } else if (searchField === 'english') {
        result = result.filter(item => item.explain?.toLowerCase().includes(lowerQuery));
      } else {
        // romanisation: match against the converted form for the active scheme
        result = result.filter(item =>
          convertToRomanised(item.tradRom, romanisationScheme).toLowerCase().includes(lowerQuery)
        );
      }
    }

    // 3. Filter by Letter (Based on tradRom for alphabet filtering)
    if (selectedLetter !== 'All' && !searchQuery) {
      result = result.filter(item =>
        item.tradRom.charAt(0).toUpperCase() === selectedLetter
      );
    }

    // 4. Sort Alphabetically (by tradRom)
    return result.sort((a, b) => a.tradRom.localeCompare(b.tradRom));
  }, [data, searchQuery, selectedLetter, searchField, romanisationScheme, mainOnly
    // , showFavoritesOnly, favorites
  ]);

  // --- RENDER ---

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans flex flex-col">

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLetter={selectedLetter}
        setSelectedLetter={setSelectedLetter}
        language={language}
        setLanguage={setLanguage}
        setIsInfoOpen={setIsInfoOpen}
        romanisationScheme={romanisationScheme}
        setRomanisationScheme={setRomanisationScheme}
        searchField={searchField}
        setSearchField={setSearchField}
        mainOnly={mainOnly}
        setMainOnly={setMainOnly}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto px-4 pt-4 pb-0">

        {/* Results Count */}
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <p>Showing {filteredData.length} result{filteredData.length !== 1 && 's'}</p>
          {searchField === 'english' && searchQuery && !detailLoaded
            ? <p className="text-amber-600">Loading definitions…</p>
            : searchQuery && <p>Filtering by "{searchQuery}"</p>}
        </div>

        {/* List of Terms */}
        <div className="flex-1 min-h-0">
          {dataLoading ? (
            <div className="text-center py-20 text-slate-500">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Loading dictionary…</h3>
            </div>
          ) : filteredData.length > 0 ? (
            <List
              style={{ height: '100%' }}
              rowCount={filteredData.length}
              rowHeight={dynamicRowHeight}
              overscanCount={10}
              rowProps={{
                items: filteredData,
                setSelectedTerm,
                speakTerm,
                romanisationScheme,
                observeRowElements: dynamicRowHeight.observeRowElements,
              }}
              rowComponent={DictionaryListRow}
            />
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
        romanisationScheme={romanisationScheme}
      />

      <InfoModal isInfoOpen={isInfoOpen} setIsInfoOpen={setIsInfoOpen} />

      <NotificationToast notification={notification} />
    </div>
  );
}