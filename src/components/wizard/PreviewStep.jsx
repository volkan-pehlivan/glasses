import React, { useState } from 'react'
import LensSimulator from '../LensSimulator'
import LensSimulatorRounded from '../LensSimulatorRounded'
import './PreviewStep.css'

function PreviewStep({ data }) {
  const [useRounded, setUseRounded] = useState(true) // Always use rounded
  const [activeEye, setActiveEye] = useState('both') // 'right', 'left', or 'both'
  
  // Calculate thickness for a specific eye
  const calculateThickness = (prescription, index, diameter) => {
    const D = diameter
    const P = Math.abs(prescription)
    const n = index
    const addition = (D * D * P) / (2000 * (n - 1))
    
    if (prescription < 0) {
      return {
        center: data.edgeThickness,
        edge: data.edgeThickness + addition
      }
    } else if (prescription > 0) {
      return {
        center: data.edgeThickness + addition,
        edge: data.edgeThickness
      }
    }
    return {
      center: data.edgeThickness,
      edge: data.edgeThickness
    }
  }

  const rightThickness = calculateThickness(data.rightPrescription, data.rightIndex, data.rightDiameter)
  const leftThickness = calculateThickness(data.leftPrescription, data.leftIndex, data.leftDiameter)

  const SimulatorComponent = useRounded ? LensSimulatorRounded : LensSimulator

  return (
    <div className="wizard-step preview-step">
      <div className="step-header">
        <h2>3D Önizleme</h2>
        <p className="step-description">
          Gözlük camlarınızın gerçek kalınlığını görün
        </p>
      </div>

      <div className="step-content">
        {/* 3D Viewer and Measurements - Side by side with eye selector on left */}
        <div className="preview-layout">
          {/* Eye selector - Left side vertical */}
          <div className="eye-selector-vertical">
            <button 
              className={`eye-btn ${activeEye === 'right' ? 'active' : ''}`}
              onClick={() => setActiveEye('right')}
            >
              <span className="eye-icon">👁️</span>
              <span>Sağ Göz</span>
            </button>
            <button 
              className={`eye-btn ${activeEye === 'both' ? 'active' : ''}`}
              onClick={() => setActiveEye('both')}
            >
              <span className="eye-icon">👓</span>
              <span>Her İkisi</span>
            </button>
            <button 
              className={`eye-btn ${activeEye === 'left' ? 'active' : ''}`}
              onClick={() => setActiveEye('left')}
            >
              <span className="eye-icon">👁️</span>
              <span>Sol Göz</span>
            </button>
          </div>

          <div className="canvas-wrapper-full">
            <SimulatorComponent 
              params={{ 
                ...data, 
                prescription: activeEye === 'left' ? data.leftPrescription : data.rightPrescription,
                index: activeEye === 'left' ? data.leftIndex : data.rightIndex,
                diameter: activeEye === 'left' ? data.leftDiameter : data.rightDiameter,
                viewMode: 'side',
                showBoth: activeEye === 'both',
                rightPrescription: data.rightPrescription,
                leftPrescription: data.leftPrescription,
                rightIndex: data.rightIndex,
                leftIndex: data.leftIndex,
                rightDiameter: data.rightDiameter,
                leftDiameter: data.leftDiameter,
                lensShape: data.lensShape || 'classic'
              }} 
            />
          </div>

          {/* Measurements panel - Right side */}
          <div className="measurements-panel-combined">
            <h3>Ölçümler</h3>
            
            <div className="measurements-grid">
              {(activeEye === 'right' || activeEye === 'both') && (
                <div className="eye-measurements">
                  <h4>👁️ Sağ Göz (OD)</h4>
                  <div className="measurement-item">
                    <span className="label">Reçete:</span>
                    <span className="value">{data.rightPrescription > 0 ? '+' : ''}{data.rightPrescription.toFixed(2)} D</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Çap:</span>
                    <span className="value">{data.rightDiameter} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Merkez:</span>
                    <span className="value">{rightThickness.center.toFixed(2)} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Kenar:</span>
                    <span className="value">{rightThickness.edge.toFixed(2)} mm</span>
                  </div>
                  <div className="measurement-item highlight">
                    <span className="label">Maksimum:</span>
                    <span className="value">{Math.max(rightThickness.center, rightThickness.edge).toFixed(2)} mm</span>
                  </div>
                </div>
              )}

              {(activeEye === 'left' || activeEye === 'both') && (
                <div className="eye-measurements">
                  <h4>👁️ Sol Göz (OS)</h4>
                  <div className="measurement-item">
                    <span className="label">Reçete:</span>
                    <span className="value">{data.leftPrescription > 0 ? '+' : ''}{data.leftPrescription.toFixed(2)} D</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Çap:</span>
                    <span className="value">{data.leftDiameter} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Merkez:</span>
                    <span className="value">{leftThickness.center.toFixed(2)} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Kenar:</span>
                    <span className="value">{leftThickness.edge.toFixed(2)} mm</span>
                  </div>
                  <div className="measurement-item highlight">
                    <span className="label">Maksimum:</span>
                    <span className="value">{Math.max(leftThickness.center, leftThickness.edge).toFixed(2)} mm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="info-box">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <strong>İpucu:</strong> 3D modeli döndürmek için fare ile sürükleyin. 
            Yakınlaştırmak için mouse tekerleğini kullanın.
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewStep
