import React from 'react'
import './MaterialStep.css'

function MaterialStep({ data, onUpdate }) {
  // Calculate thickness for each material for both eyes
  const calculateThickness = (index, prescription, diameter) => {
    const D = diameter
    const P = Math.abs(prescription || 0)
    const n = index
    
    // HOYA formula with prescription-dependent divisor
    let divisor;
    if (n <= 1.53) {
      divisor = 5700;
      if (P >= 8) divisor += 900;
    } else if (n <= 1.63) {
      divisor = 8000;
      if (P >= 6) divisor -= 300;
    } else if (n <= 1.70) {
      divisor = 8200;
      if (P >= 6) divisor -= 300;
    } else {
      divisor = 8300;
      if (P >= 6) divisor -= 300;
    }
    
    // HOYA uses index-dependent minimum center thickness
    const minCenterThickness = (n <= 1.53) ? 2.0 : 1.0;
    
    const addition = (D * D * P) / (divisor * (n - 1))
    
    if (prescription < 0) {
      return minCenterThickness + addition
    } else if (prescription > 0) {
      return minCenterThickness + addition
    }
    return minCenterThickness
  }

  const materials = [
    {
      index: 1.50,
      name: '1.50 - Standart',
      rightThickness: calculateThickness(1.50, data.rightPrescription, data.rightDiameter),
      leftThickness: calculateThickness(1.50, data.leftPrescription, data.leftDiameter),
      benefits: ['Ekonomik', 'Dayanıklı'],
      recommended: Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) <= 2
    },
    {
      index: 1.60,
      name: '1.60 - Orta İnce',
      rightThickness: calculateThickness(1.60, data.rightPrescription, data.rightDiameter),
      leftThickness: calculateThickness(1.60, data.leftPrescription, data.leftDiameter),
      benefits: ['İyi fiyat/performans', 'Orta kalınlık'],
      recommended: Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) > 2 && Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) <= 4
    },
    {
      index: 1.67,
      name: '1.67 - Çok İnce',
      rightThickness: calculateThickness(1.67, data.rightPrescription, data.rightDiameter),
      leftThickness: calculateThickness(1.67, data.leftPrescription, data.leftDiameter),
      benefits: ['İnce ve hafif', 'Estetik görünüm'],
      recommended: Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) > 4 && Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) <= 6
    },
    {
      index: 1.74,
      name: '1.74 - Ultra İnce',
      rightThickness: calculateThickness(1.74, data.rightPrescription, data.rightDiameter),
      leftThickness: calculateThickness(1.74, data.leftPrescription, data.leftDiameter),
      benefits: ['En ince seçenek', 'Maksimum konfor'],
      recommended: Math.max(Math.abs(data.rightPrescription || 0), Math.abs(data.leftPrescription || 0)) > 6
    }
  ]

  const standardRight = materials[0].rightThickness
  const standardLeft = materials[0].leftThickness
  
  return (
    <div className="wizard-step material-step">
      <div className="step-content">
        {/* Right Eye Materials */}
        <div className="eye-section">
          <h3 className="eye-section-title">👁️ Sağ Göz (OD)</h3>
          <div className="material-grid">
            {materials.map(material => {
              const standardRight = materials[0].rightThickness
              const savingsRight = ((standardRight - material.rightThickness) / standardRight * 100).toFixed(0)
              
              return (
                <div
                  key={`right-${material.index}`}
                  className={`material-card ${data.rightIndex === material.index ? 'selected' : ''}`}
                  onClick={() => onUpdate({ rightIndex: material.index })}
                >
                  <h3>{material.name}</h3>

                  {/* Thickness */}
                  <div className="thickness-display">
                    <span className="thickness-value">
                      {material.rightThickness.toFixed(1)} mm
                    </span>
                  </div>

                  {/* Savings or Standard badge */}
                  {savingsRight > 0 ? (
                    <div className="savings-badge">
                      %{savingsRight} daha ince
                    </div>
                  ) : (
                    <div className="standard-badge">
                      Standart
                    </div>
                  )}

                  <button className="select-button">
                    {data.rightIndex === material.index ? 'Seçildi ✓' : 'Seç'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Left Eye Materials */}
        <div className="eye-section">
          <h3 className="eye-section-title">👁️ Sol Göz (OS)</h3>
          <div className="material-grid">
            {materials.map(material => {
              const standardLeft = materials[0].leftThickness
              const savingsLeft = ((standardLeft - material.leftThickness) / standardLeft * 100).toFixed(0)
              
              return (
                <div
                  key={`left-${material.index}`}
                  className={`material-card ${data.leftIndex === material.index ? 'selected' : ''}`}
                  onClick={() => onUpdate({ leftIndex: material.index })}
                >
                  <h3>{material.name}</h3>

                  {/* Thickness */}
                  <div className="thickness-display">
                    <span className="thickness-value">
                      {material.leftThickness.toFixed(1)} mm
                    </span>
                  </div>

                  {/* Savings or Standard badge */}
                  {savingsLeft > 0 ? (
                    <div className="savings-badge">
                      %{savingsLeft} daha ince
                    </div>
                  ) : (
                    <div className="standard-badge">
                      Standart
                    </div>
                  )}

                  <button className="select-button">
                    {data.leftIndex === material.index ? 'Seçildi ✓' : 'Seç'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaterialStep
