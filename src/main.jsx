import React from 'react'
import ReactDOM from 'react-dom/client'
import Demo from './demo.jsx'
import './index.css'
import MicPlacementOptimizer from './components/MicPlacementOptimizer.jsx'



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MicPlacementOptimizer/>
  </React.StrictMode>,
)
