import React from 'react'
import './ControlPanel.css'

function ControlPanel({ params, onUpdate }) {
  // Kalınlık hesaplaması (geliştirilmiş)
  const calculateThickness = () => {
    const { diameter, prescription, index, baseCurve, edgeThickness } = params
    const radius = diameter / 2
    
    // Base curve'den sagitta hesapla
    const baseCurveRadius = 1000 / baseCurve // mm
    const sagitta = baseCurveRadius - Math.sqrt(baseCurveRadius * baseCurveRadius - radius * radius)
    
    // Prescription faktörü
    const prescriptionFactor = Math.abs(prescription) * radius * (index - 1) / index
    
    let centerT, edgeT, maxEdgeT
    
    if (prescription < 0) {
      // Miyop - kenarlar kalın
      centerT = edgeThickness + sagitta
      edgeT = centerT + prescriptionFactor
      maxEdgeT = edgeT
    } else if (prescription > 0) {
      // Hipermetrop - merkez kalın
      centerT = edgeThickness + sagitta + prescriptionFactor
      edgeT = edgeThickness + sagitta
      maxEdgeT = centerT
    } else {
      // Plano
      centerT = edgeThickness + sagitta
      edgeT = centerT
      maxEdgeT = centerT
    }
    
    return {
      center: Math.max(edgeThickness, centerT),
      edge: Math.max(edgeThickness, edgeT),
      maxEdge: Math.max(edgeThickness, maxEdgeT),
      min: edgeThickness
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
            <span className="value">{thickness.center.toFixed(2)} mm</span>
          </div>
          <div className="thickness-item">
            <span className="label">Maks. {params.prescription < 0 ? 'Kenar' : 'Merkez'} Kalınlık:</span>
            <span className="value">{(params.prescription < 0 ? thickness.maxEdge : thickness.center).toFixed(2)} mm</span>
          </div>
          <div className="thickness-item">
            <span className="label">Min. Kenar Kalınlık:</span>
            <span className="value">{thickness.min.toFixed(2)} mm</span>
          </div>
        </div>

        <div className="info-box">
          <p>💡 <strong>Not:</strong> Bu değerler kesildikten sonraki cam kalınlıklarını gösterir. Müşteriye gösterim için 1:1 ölçek kullanılmaktadır.</p>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
