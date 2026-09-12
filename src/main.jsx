import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // This line is crucial for styles to load

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)