import React from 'react'
import ReactDOM from 'react-dom/client'
import Demo from './demo.jsx'
import './index.css'
import './styles/custom-animations.css' // Add this line to import custom animations
import MicPlacementOptimizer from './components/MicPlacementOptimizer.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MicPlacementOptimizer/>
  </React.StrictMode>,
)