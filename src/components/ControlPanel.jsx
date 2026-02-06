import React from 'react'
import './ControlPanel.css'

function ControlPanel({ params, onUpdate }) {
  // Kalınlık hesaplaması (düzeltilmiş - endüstri standardı)
  const calculateThickness = () => {
    const { diameter, prescription, index, edgeThickness } = params
    const D = diameter
    const P = Math.abs(prescription)
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
    
    const thicknessAddition = (D * D * P) / (divisor * (n - 1))
    
    let centerT, edgeT, maxEdgeT
    
    if (prescription < 0) {
      // Miyop - kenarlar kalın
      centerT = minCenterThickness
      edgeT = centerT + thicknessAddition
      maxEdgeT = edgeT
    } else if (prescription > 0) {
      // Hipermetrop - merkez kalın
      edgeT = minCenterThickness
      centerT = edgeT + thicknessAddition
      maxEdgeT = centerT
    } else {
      // Plano
      centerT = minCenterThickness
      edgeT = minCenterThickness
      maxEdgeT = minCenterThickness
    }
    
    return {
      center: centerT,
      edge: edgeT,
      maxEdge: maxEdgeT,
      min: minCenterThickness
    }
  }

  const thickness = calculateThickness()

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h2>📐 Parametreler</h2>
        
        <div className="control-group">
          <label>
            <span>Lens Çapı (mm)</span>
            <input
              type="number"
              min="50"
              max="85"
              step="1"
              value={params.diameter}
              onChange={(e) => onUpdate('diameter', e.target.value)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Dioptri (Prescription)</span>
            <input
              type="number"
              min="-10"
              max="10"
              step="0.25"
              value={params.prescription}
              onChange={(e) => onUpdate('prescription', e.target.value)}
            />
            <small>{params.prescription > 0 ? 'Hipermetrop' : params.prescription < 0 ? 'Miyop' : 'Plano'}</small>
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Refraktif İndeks</span>
            <select
              value={params.index}
              onChange={(e) => onUpdate('index', e.target.value)}
            >
              <option value="1.5">1.50 - Standart</option>
              <option value="1.6">1.60 - Orta</option>
              <option value="1.67">1.67 - İnce</option>
              <option value="1.74">1.74 - Çok İnce</option>
            </select>
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Base Curve (dioptri)</span>
            <input
              type="number"
              min="2"
              max="8"
              step="0.25"
              value={params.baseCurve}
              onChange={(e) => onUpdate('baseCurve', e.target.value)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Min. Kenar Kalınlığı (mm)</span>
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.1"
              value={params.edgeThickness}
              onChange={(e) => onUpdate('edgeThickness', e.target.value)}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Görünüm</span>
            <select
              value={params.viewMode}
              onChange={(e) => onUpdate('viewMode', e.target.value)}
            >
              <option value="side">Yandan (Kalınlık Görünümü)</option>
              <option value="top">Üstten (Şekil Görünümü)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h2>📏 Hesaplanan Kalınlıklar</h2>
        
        <div className="thickness-display">
          <div className="thickness-item">
            <span className="label">Merkez Kalınlık:</span>
            <span className="value">{thickness.center.toFixed(1)} mm</span>
          </div>
          <div className="thickness-item">
            <span className="label">Maks. {params.prescription < 0 ? 'Kenar' : 'Merkez'} Kalınlık:</span>
            <span className="value">{(params.prescription < 0 ? thickness.maxEdge : thickness.center).toFixed(1)} mm</span>
          </div>
          <div className="thickness-item">
            <span className="label">Min. Kenar Kalınlık:</span>
            <span className="value">{thickness.min.toFixed(1)} mm</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
