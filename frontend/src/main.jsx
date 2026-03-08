import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registra o Service Worker para PWA e Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Inicializa o tema antes do registro do SW
    const savedTheme = localStorage.getItem('config_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registrado com sucesso:', registration.scope);
      })
      .catch(err => {
        console.log('Falha ao registrar SW:', err);
      });
  });
}
