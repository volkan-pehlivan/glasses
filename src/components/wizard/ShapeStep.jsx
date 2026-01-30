import React, { useState } from 'react'
import './ShapeStep.css'

function ShapeStep({ data, onUpdate, onNext, onPrev }) {
  const [selectedShape, setSelectedShape] = useState(data.lensShape || 'classic')

  const shapes = [
    {
      id: 'classic',
      name: 'Klasik',
      description: 'Üstte köşeli, altta yuvarlak',
      preview: (
        <svg viewBox="-70 -45 140 90" className="shape-preview">
          <path d="M -65,-45 L 65,-45 L 65,20 Q 65,45 40,45 L -40,45 Q -65,45 -65,20 L -65,-45 Z" 
                fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'rectangle',
      name: 'Dikdörtgen',
      description: 'Tüm köşeler yuvarlatılmış',
      preview: (
        <svg viewBox="-70 -45 140 90" className="shape-preview">
          <rect x="-65" y="-40" width="130" height="80" rx="20" 
                fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'circle',
      name: 'Yuvarlak',
      description: 'Mükemmel daire',
      preview: (
        <svg viewBox="-50 -50 100 100" className="shape-preview">
          <circle cx="0" cy="0" r="45" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'oval',
      name: 'Oval',
      description: 'Yatay elips',
      preview: (
        <svg viewBox="-70 -45 140 90" className="shape-preview">
          <rect x="-65" y="-40" width="130" height="80" rx="40" ry="40" 
                fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'wayfarer',
      name: 'Wayfarer',
      description: 'Üstte geniş, altta dar',
      preview: (
        <svg viewBox="-75 -45 150 90" className="shape-preview">
          <path d="M -70,-45 Q -75,-45 -75,-40 L -54,35 Q -54,40 -49,40 L 49,40 Q 54,40 54,35 L 75,-40 Q 75,-45 70,-45 Z" 
                fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
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
      </div>
    </div>
  )
}

export default ShapeStep
