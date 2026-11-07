import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { EDITIONS } from './editions'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App edition={EDITIONS.holiday} />
  </React.StrictMode>
)
