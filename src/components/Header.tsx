import React from 'react';
import { Search, X, Upload, Globe } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, onFileUpload }) => (
  <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-30">
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-lg"><Globe className="w-6 h-6 text-blue-100" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mongolian Dictionary</h1>
            <p className="text-xs text-blue-200">Монгол хэлний толь бичиг</p>
          </div>
        </div>
        <label className="cursor-pointer bg-blue-900 hover:bg-blue-950 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-2 border border-blue-700">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import JSON</span>
          <input type="file" accept=".json" onChange={onFileUpload} className="hidden" />
        </label>
      </div>
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-blue-300" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border-none rounded-lg bg-blue-900 text-white placeholder-blue-300 focus:outline-none focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-400 transition shadow-inner"
          placeholder="Search in Cyrillic, Romanization, or English..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  </header>
);