import React, { useState } from 'react'
import './ShapeStep.css'

function ShapeStep({ data, onUpdate, onNext, onPrev }) {
  const [selectedShape, setSelectedShape] = useState(data.lensShape || 'classic')

  const shapes = [
    {
      id: 'classic',
      name: 'Klasik Cam',
      description: 'Üstte hafif köşeli, altta yuvarlak',
      preview: (
        <svg viewBox="0 0 140 90" className="shape-preview" preserveAspectRatio="xMidYMid meet">
          {/* Width: 140 (1.4x), Height: 90 (0.9x) - matching diameter ratio */}
          {/* Top corners: 5% radius, Bottom corners: 45% radius */}
          <path 
            d="M 4.5 0 
               L 135.5 0 
               Q 140 0 140 4.5 
               L 140 49.5 
               Q 140 90 99.5 90 
               L 40.5 90 
               Q 0 90 0 49.5 
               L 0 4.5 
               Q 0 0 4.5 0 Z" 
            fill="#e0f2fe" 
            stroke="#2563eb" 
            strokeWidth="2"
          />
        </svg>
      )
    },
    {
      id: 'rectangle',
      name: 'Dikdörtgen',
      description: 'Geniş dikdörtgen, tüm köşeler yuvarlatılmış',
      preview: (
        <svg viewBox="0 0 140 90" className="shape-preview" preserveAspectRatio="xMidYMid meet">
          {/* Width: 140 (1.4x), Height: 90 (0.9x) - matching diameter ratio */}
          {/* All corners: 25% radius */}
          <rect 
            x="0" 
            y="0" 
            width="140" 
            height="90" 
            rx="22.5" 
            ry="22.5"
            fill="#e0f2fe" 
            stroke="#2563eb" 
            strokeWidth="2"
          />
        </svg>
      )
    }
  ]

  const handleShapeSelect = (shapeId) => {
    setSelectedShape(shapeId)
    onUpdate({ lensShape: shapeId })
  }

  const handleNext = () => {
    if (selectedShape) {
      onNext()
    }
  }

  return (
    <div className="wizard-step shape-step">
      <div className="step-header">
        <h2>Cam Şekli Seçimi</h2>
        <p className="step-description">
          Gözlük camınızın şeklini seçin
        </p>
      </div>

      <div className="step-content">
        <div className="shapes-grid">
          {shapes.map((shape) => (
            <div
              key={shape.id}
              className={`shape-card ${selectedShape === shape.id ? 'selected' : ''}`}
              onClick={() => handleShapeSelect(shape.id)}
            >
              <div className="shape-preview-container">
                {shape.preview}
              </div>
              <h3>{shape.name}</h3>
              <p>{shape.description}</p>
              {selectedShape === shape.id && (
                <div className="selected-badge">✓ Seçildi</div>
              )}
            </div>
          ))}
        </div>

        <div className="step-actions">
          <button className="btn-secondary" onClick={onPrev}>
            ← Geri
          </button>
          <button 
            className="btn-primary" 
            onClick={handleNext}
            disabled={!selectedShape}
          >
            İleri →
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShapeStep
