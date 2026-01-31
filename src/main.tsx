import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
// import DictionaryApp from './components/DictionaryApp.tsx'
import DictionaryApp from './DictionaryApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DictionaryApp />
  </StrictMode>,
)
