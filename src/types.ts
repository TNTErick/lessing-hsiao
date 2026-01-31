export interface DictionaryItem {
  id: string;
  cyrillic: string;
  traditional: string;
  romanization: string;
  pronunciation: string;
  definition: string;
  category: string;
  // [key: string]: any;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error';
}