import React from 'react'
import { useLensState } from './hooks/useLensState'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const { data, updateData } = useLensState()

  return (
    <div className="app">
      <ControlPanel data={data} onUpdate={updateData} />
    </div>
  )
}

export default App
