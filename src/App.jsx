import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import LensSimulator from './components/LensSimulator'
import ControlPanel from './components/ControlPanel'
import GLBLensViewer from './components/GLBLensViewer'
import './App.css'

function SimulatorPage() {
  const [params, setParams] = useState({
    diameter: 75, // mm - lens çapı
    prescription: -3.0, // dioptri (negatif = miyop, pozitif = hipermetrop)
    index: 1.6, // refraktif indeks
    baseCurve: 4.0, // base curve (dioptri)
    edgeThickness: 1.5, // kenar kalınlığı (mm)
    viewMode: 'side' // 'side' veya 'top'
  })

  const updateParam = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Gözlük Camı Kalınlık Simülatörü</h1>
        <p>Kesildikten sonraki cam kalınlığını birebir görselleştirin</p>
      </header>
      
      <div className="app-container">
        <ControlPanel params={params} onUpdate={updateParam} />
        <LensSimulator params={params} />
      </div>
    </div>
  )
}

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="main-nav">
      <Link 
        to="/" 
        className={location.pathname === '/' ? 'active' : ''}
      >
        📐 Simülatör
      </Link>
      <Link 
        to="/glb-viewer" 
        className={location.pathname === '/glb-viewer' ? 'active' : ''}
      >
        🔍 3D Model Görüntüleyici
      </Link>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<SimulatorPage />} />
        <Route path="/glb-viewer" element={<GLBLensViewer />} />
      </Routes>
    </Router>
  )
}

export default App
