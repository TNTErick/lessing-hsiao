export interface DictionaryItem {
  id: string;
  cyrillic: string;
  traditional: string;
  romanization: string;
  pronunciation: string;
  definition: string;
  category: string;
  // [key: string]: any; // Allow loose typing for other imported fields if necessary
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

export const LANGUAGES = [
  'en',
  'mn',
  'jp',
  'zh'
] as const;
export type langType = typeof LANGUAGES[number];