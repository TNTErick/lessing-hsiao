import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
// import DictionaryApp from './DictionaryApp.tsx'
import DictionaryApp from './index'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DictionaryApp />
  </StrictMode>,
)
