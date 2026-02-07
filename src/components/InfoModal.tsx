import { X, Info } from "lucide-react";
import type { JSX } from "react";


interface InfoModalProps {
  isInfoOpen: boolean;
  setIsInfoOpen: (isOpen: boolean) => void;
}

export default function InfoModal({ isInfoOpen, setIsInfoOpen }: InfoModalProps): JSX.Element {
  return (
    <>
      {
        isInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-blue-800 p-6 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Info className="w-6 h-6" />
                  <h2 className="text-xl font-bold">About the Dictionary</h2>
                </div>
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="p-1 hover:bg-blue-700 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 text-slate-600">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Purpose</h3>
                  <p className="text-sm leading-relaxed">
                    This digital dictionary is designed to help students and linguists bridge the gap between
                    Mongolian Cyrillic and international languages.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-blue-800 font-bold text-lg">25k+</span>
                    <span className="text-xs uppercase tracking-wider font-medium">Entries</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-blue-800 font-bold text-lg">Offline</span>
                    <span className="text-xs uppercase tracking-wider font-medium">Ready</span>
                  </div>
                </div>

                <div className="text-xs border-t border-slate-100 pt-4">
                  <p>Developed for educational purposes. © 2026 Mongolian Linguistics Project.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-900 transition shadow-md"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}