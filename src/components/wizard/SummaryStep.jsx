import React from 'react'
import StepActions from './StepActions'
import html2pdf from 'html2pdf.js'
import './SummaryStep.css'

function SummaryStep({ data, onRestart }) {
  // Calculate final thickness for right eye
  const calculateThickness = (prescription, index, diameter) => {
    const D = diameter
    const P = Math.abs(prescription)
    const n = index
    const addition = (D * D * P) / (2000 * (n - 1))
    
    if (prescription < 0) {
      return {
        center: data.edgeThickness,
        edge: data.edgeThickness + addition,
        max: data.edgeThickness + addition
      }
    } else if (prescription > 0) {
      return {
        center: data.edgeThickness + addition,
        edge: data.edgeThickness,
        max: data.edgeThickness + addition
      }
    }
    return {
      center: data.edgeThickness,
      edge: data.edgeThickness,
      max: data.edgeThickness
    }
  }

  const rightThickness = calculateThickness(data.rightPrescription, data.rightIndex, data.rightDiameter)
  const leftThickness = calculateThickness(data.leftPrescription, data.leftIndex, data.leftDiameter)

  const getMaterialName = (index) => {
    const names = {
      1.50: '1.50 - Standart Plastik',
      1.60: '1.60 - Orta İnce',
      1.67: '1.67 - Çok İnce',
      1.74: '1.74 - Ultra İnce'
    }
    return names[index] || index
  }

  const handleDownloadPDF = () => {
    const element = document.querySelector('.summary-step')
    const opt = {
      margin: 10,
      filename: 'gozluk-cami-hesaplama.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    // Hide buttons before generating PDF
    const actions = document.querySelector('.summary-actions')
    if (actions) actions.style.display = 'none'
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Show buttons again after PDF is generated
      if (actions) actions.style.display = 'flex'
    })
  }

  return (
    <div className="wizard-step summary-step">
      <div className="step-header success">
        <span className="success-icon">✅</span>
        <h2>Hesaplama Tamamlandı!</h2>
        <p className="step-description">
          İşte gözlük camınızın detayları
        </p>
      </div>

      <div className="step-content">
        {/* Summary cards */}
        <div className="summary-grid">
          {/* Right Eye Prescription */}
          <div className="summary-card">
            <div className="card-icon">👁️</div>
            <h3>Sağ Göz (OD)</h3>
            <div className="card-content">
              <div className="info-row">
                <span>SPH:</span>
                <strong>{data.rightPrescription > 0 ? '+' : ''}{data.rightPrescription}D</strong>
              </div>
              {data.rightCylinder !== 0 && (
                <>
                  <div className="info-row">
                    <span>CYL:</span>
                    <strong>{data.rightCylinder}D</strong>
                  </div>
                  <div className="info-row">
                    <span>AXIS:</span>
                    <strong>{data.rightAxis}°</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Left Eye Prescription */}
          <div className="summary-card">
            <div className="card-icon">👁️</div>
            <h3>Sol Göz (OS)</h3>
            <div className="card-content">
              <div className="info-row">
                <span>SPH:</span>
                <strong>{data.leftPrescription > 0 ? '+' : ''}{data.leftPrescription}D</strong>
              </div>
              {data.leftCylinder !== 0 && (
                <>
                  <div className="info-row">
                    <span>CYL:</span>
                    <strong>{data.leftCylinder}D</strong>
                  </div>
                  <div className="info-row">
                    <span>AXIS:</span>
                    <strong>{data.leftAxis}°</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Frame card */}
          <div className="summary-card">
            <div className="card-icon">👓</div>
            <h3>Çerçeve</h3>
            <div className="card-content">
              <div className="info-row">
                <span>Sağ:</span>
                <strong>{data.rightDiameter}mm</strong>
              </div>
              <div className="info-row">
                <span>Sol:</span>
                <strong>{data.leftDiameter}mm</strong>
              </div>
            </div>
          </div>

          {/* Right Eye Material */}
          <div className="summary-card highlight">
            <div className="card-icon">🔬</div>
            <h3>Sağ Göz Malzeme</h3>
            <div className="card-content">
              <div className="material-name">{getMaterialName(data.rightIndex)}</div>
            </div>
          </div>

          {/* Left Eye Material */}
          <div className="summary-card highlight">
            <div className="card-icon">🔬</div>
            <h3>Sol Göz Malzeme</h3>
            <div className="card-content">
              <div className="material-name">{getMaterialName(data.leftIndex)}</div>
            </div>
          </div>

          {/* Right Eye Thickness */}
          <div className="summary-card highlight">
            <div className="card-icon">📏</div>
            <h3>Sağ Göz Kalınlık</h3>
            <div className="card-content">
              <div className="thickness-main">
                <span className="thickness-value">{rightThickness.max.toFixed(2)}</span>
                <span className="thickness-unit">mm</span>
              </div>
              <div className="thickness-details">
                <div>Merkez: {rightThickness.center.toFixed(2)}mm</div>
                <div>Kenar: {rightThickness.edge.toFixed(2)}mm</div>
              </div>
            </div>
          </div>

          {/* Left Eye Thickness */}
          <div className="summary-card highlight">
            <div className="card-icon">📏</div>
            <h3>Sol Göz Kalınlık</h3>
            <div className="card-content">
              <div className="thickness-main">
                <span className="thickness-value">{leftThickness.max.toFixed(2)}</span>
                <span className="thickness-unit">mm</span>
              </div>
              <div className="thickness-details">
                <div>Merkez: {leftThickness.center.toFixed(2)}mm</div>
                <div>Kenar: {leftThickness.edge.toFixed(2)}mm</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="summary-actions">
          <button className="btn-secondary" onClick={onRestart}>
            🔄 Yeni Hesaplama
          </button>
          
          <button 
            className="btn-secondary"
            onClick={handleDownloadPDF}
          >
            📥 PDF İndir
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => window.print()}
          >
            🖨️ Yazdır
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryStep
