import React from 'react'
import ReactDOM from 'react-dom/client'
import Demo from './demo.jsx'
import './index.css'
import './components/MicPlacementOptimizer.jsx'
import MicPlacementOptimizer from './demo.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MicPlacementOptimizer/>
  </React.StrictMode>,
)
