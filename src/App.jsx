import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import LensWizard from './components/LensWizard'
import GLBLensViewer from './components/GLBLensViewer'
import './App.css'

// Create context for wizard controls
export const WizardControlsContext = createContext(null)

function WizardPage() {
  return (
    <div className="app">
      <LensWizard />
    </div>
  )
}

function Navigation() {
  // Navigation is now hidden - buttons moved to wizard header
  return null
}

/* Original navigation - kept for future use
function Navigation() {
  const location = useLocation()
  const { wizardControls } = useContext(WizardControlsContext) || {}
  
  return (
    <nav className="main-nav">
      {location.pathname === '/' && wizardControls && (
        <div className="nav-center">
          <button 
            className="nav-btn"
            onClick={wizardControls.onPrev}
            disabled={wizardControls.isFirstStep}
          >
            ← Geri
          </button>
          <button 
            className="nav-btn nav-btn-primary"
            onClick={wizardControls.isLastStep ? wizardControls.onRestart : wizardControls.onNext}
          >
            {wizardControls.isLastStep ? '🔄 Yeni' : 'İleri →'}
          </button>
        </div>
      )}
      <div className="nav-right">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          🧙 Hesaplayıcı
        </Link>
        <Link to="/glb-viewer" className={location.pathname === '/glb-viewer' ? 'active' : ''}>
          🔍 3D Model Görüntüleyici
        </Link>
      </div>
    </nav>
  )
}
*/

function AppContent() {
  const [wizardControls, setWizardControls] = useState(null)
  
  return (
    <WizardControlsContext.Provider value={{ wizardControls, setWizardControls }}>
      <Navigation />
      <Routes>
        <Route path="/" element={<WizardPage />} />
        <Route path="/glb-viewer" element={<GLBLensViewer />} />
      </Routes>
    </WizardControlsContext.Provider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
