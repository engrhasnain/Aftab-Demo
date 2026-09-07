import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './components/ToastProvider'
import { I18nProvider } from './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataProvider>
      <I18nProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </I18nProvider>
    </DataProvider>
  </React.StrictMode>,
)
