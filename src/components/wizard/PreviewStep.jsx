import React, { useState } from 'react'
import LensSimulator from '../LensSimulator'
import LensSimulatorRounded from '../LensSimulatorRounded'
import './PreviewStep.css'

function PreviewStep({ data, onUpdate }) {
  const [useRounded, setUseRounded] = useState(true) // Always use rounded
  const [activeEye, setActiveEye] = useState('both') // 'right', 'left', or 'both' - controls VIEW
  const [prescriptionEye, setPrescriptionEye] = useState('right') // Which eye's data to EDIT when both view is active
  const [openAccordion, setOpenAccordion] = useState(null) // 'shape', 'colors', 'materials', 'measurements', or null (all closed by default)
  
  // Calculate thickness for a specific eye
  const calculateThickness = (prescription, index, diameter) => {
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
    
    const addition = (D * D * P) / (divisor * (n - 1))
    
    if (prescription < 0) {
      return {
        center: minCenterThickness,
        edge: minCenterThickness + addition
      }
    } else if (prescription > 0) {
      return {
        center: minCenterThickness + addition,
        edge: minCenterThickness
      }
    }
    return {
      center: minCenterThickness,
      edge: minCenterThickness
    }
  }

  const rightThickness = calculateThickness(data.rightPrescription, data.rightIndex, data.rightDiameter)
  const leftThickness = calculateThickness(data.leftPrescription, data.leftIndex, data.leftDiameter)

  const SimulatorComponent = useRounded ? LensSimulatorRounded : LensSimulator
  
  // Handle prescription change
  const handlePrescriptionChange = (value) => {
    const newValue = parseFloat(value)
    if (activeEye === 'both') {
      // Update based on which eye is selected in toggle
      if (prescriptionEye === 'right') {
        onUpdate({ rightPrescription: newValue })
      } else {
        onUpdate({ leftPrescription: newValue })
      }
    } else if (activeEye === 'right') {
      onUpdate({ rightPrescription: newValue })
    } else {
      onUpdate({ leftPrescription: newValue })
    }
  }

  return (
    <div className="wizard-step preview-step">
      <div className="step-content">
        {/* 3D Viewer and Measurements - Side by side */}
        <div className="preview-layout">
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
                lensShape: data.lensShape || 'classic',
                backgroundEnvironment: data.backgroundEnvironment || 'city',
                backgroundColor: data.backgroundColor || 'default',
                customBackgroundColor: data.customBackgroundColor || '#1a1a1a',
                lensTransmission: data.lensTransmission || 0.9,
                lensOpacity: data.lensOpacity || 0.85,
                lensReflection: data.lensReflection || 1.5,
                lensColor: data.lensColor || '#ffffff',
                lensRoughness: data.lensRoughness || 0.05,
                lensMetalness: data.lensMetalness || 0.1,
                lensClearcoat: data.lensClearcoat || 1.0,
                lensClearcoatRoughness: data.lensClearcoatRoughness || 0.1,
                lensThickness: data.lensThickness || 0.5,
                lensIOR: data.lensIOR || 1.5
              }}
              activeEye={activeEye}
              onEyeChange={setActiveEye}
              prescriptionEye={prescriptionEye}
              onPrescriptionEyeChange={setPrescriptionEye}
              bridgeWidth={data.bridgeWidth || 17}
              onBridgeWidthChange={(value) => onUpdate({ bridgeWidth: value })}
              rightDiameter={data.rightDiameter}
              leftDiameter={data.leftDiameter}
              onDiameterChange={(eye, value) => {
                if (eye === 'right') {
                  onUpdate({ rightDiameter: parseInt(value) || 50 })
                } else {
                  onUpdate({ leftDiameter: parseInt(value) || 50 })
                }
              }}
              rightPrescription={data.rightPrescription}
              leftPrescription={data.leftPrescription}
              onPrescriptionChange={handlePrescriptionChange}
              rightIndex={data.rightIndex}
              leftIndex={data.leftIndex}
              onIndexChange={(eye, value) => {
                if (eye === 'right') {
                  onUpdate({ rightIndex: parseFloat(value) })
                } else {
                  onUpdate({ leftIndex: parseFloat(value) })
                }
              }}
            />
          </div>

          {/* Measurements panel - Right side */}
          <div className="measurements-panel-combined">
            {/* Lens Shape Accordion */}
            <div className="appearance-accordion">
              <button 
                className={`accordion-header ${openAccordion === 'shape' ? 'open' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'shape' ? null : 'shape')}
              >
                <span>⭕ Cam Şekli</span>
                <span className="accordion-icon">{openAccordion === 'shape' ? '▼' : '▶'}</span>
              </button>
              
              {openAccordion === 'shape' && (
                <div className="accordion-content">
                  <div className="shape-selector-grid">
                    {[
                      { id: 'classic', name: 'Klasik', desc: 'Üstte köşeli, altta yuvarlak' },
                      { id: 'rectangle', name: 'Dikdörtgen', desc: 'Tüm köşeler yuvarlatılmış' },
                      { id: 'circle', name: 'Yuvarlak', desc: 'Mükemmel daire' },
                      { id: 'oval', name: 'Oval', desc: 'Yatay elips' },
                      { id: 'wayfarer', name: 'Wayfarer', desc: 'Üstte geniş, altta dar' }
                    ].map((shape) => (
                      <div
                        key={shape.id}
                        className={`shape-option ${data.lensShape === shape.id ? 'selected' : ''}`}
                        onClick={() => onUpdate({ lensShape: shape.id })}
                      >
                        <div className="shape-name">{shape.name}</div>
                        <div className="shape-desc">{shape.desc}</div>
                        {data.lensShape === shape.id && <div className="shape-check">✓</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colors & Environment Accordion */}
            <div className="appearance-accordion">
              <button 
                className={`accordion-header ${openAccordion === 'colors' ? 'open' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'colors' ? null : 'colors')}
              >
                <span>🎨 Renkler ve Ortam</span>
                <span className="accordion-icon">{openAccordion === 'colors' ? '▼' : '▶'}</span>
              </button>
              
              {openAccordion === 'colors' && (
                <div className="accordion-content">
                  {/* Lens Color - TEMPORARILY HIDDEN */}
                  {false && (
                    <div className="appearance-control">
                      <label>Cam Rengi</label>
                      <div className="color-options">
                        <button 
                          className={`color-btn ${(data.lensColor || '#ffffff') === '#ffffff' ? 'active' : ''}`}
                          style={{ background: '#ffffff', border: '1px solid #ddd' }}
                          onClick={() => onUpdate({ lensColor: '#ffffff' })}
                          title="Beyaz"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#4a90e2' ? 'active' : ''}`}
                          style={{ background: '#4a90e2' }}
                          onClick={() => onUpdate({ lensColor: '#4a90e2' })}
                          title="Klasik Mavi"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#f0f8ff' ? 'active' : ''}`}
                          style={{ background: '#f0f8ff' }}
                          onClick={() => onUpdate({ lensColor: '#f0f8ff' })}
                          title="Açık Mavi"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#fffacd' ? 'active' : ''}`}
                          style={{ background: '#fffacd' }}
                          onClick={() => onUpdate({ lensColor: '#fffacd' })}
                          title="Sarı"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#ffe4e1' ? 'active' : ''}`}
                          style={{ background: '#ffe4e1' }}
                          onClick={() => onUpdate({ lensColor: '#ffe4e1' })}
                          title="Pembe"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#e0f0e0' ? 'active' : ''}`}
                          style={{ background: '#e0f0e0' }}
                          onClick={() => onUpdate({ lensColor: '#e0f0e0' })}
                          title="Yeşil"
                        />
                        <button 
                          className={`color-btn ${data.lensColor === '#f0e0ff' ? 'active' : ''}`}
                          style={{ background: '#f0e0ff' }}
                          onClick={() => onUpdate({ lensColor: '#f0e0ff' })}
                          title="Mor"
                        />
                      </div>
                      <div className="color-picker-wrapper">
                        <label className="color-picker-label">Özel Renk:</label>
                        <input
                          type="color"
                          value={data.lensColor || '#ffffff'}
                          onChange={(e) => onUpdate({ lensColor: e.target.value })}
                          className="color-picker"
                        />
                        <span className="color-value">{data.lensColor || '#ffffff'}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Background Environment */}
                  <div className="appearance-control">
                    <label>Arka Plan Ortamı (Yansıma)</label>
                    <select
                      value={data.backgroundEnvironment || 'city'}
                      onChange={(e) => onUpdate({ backgroundEnvironment: e.target.value })}
                      className="appearance-select"
                    >
                      <option value="photostudio">Fotoğraf Stüdyosu (HD)</option>
                      <option value="wooden">Ahşap Stüdyo (HD)</option>
                      <option value="apartment">Daire (HD)</option>
                      <option value="room">Oda (HD)</option>
                      <option value="city">Şehir</option>
                      <option value="sunset">Gün Batımı</option>
                      <option value="studio">Stüdyo</option>
                      <option value="none">Yok</option>
                    </select>
                  </div>
                  
                  {/* Background Color */}
                  <div className="appearance-control">
                    <label>Arka Plan Rengi</label>
                    <div className="color-options">
                      <button 
                        className={`color-btn ${(data.backgroundColor || 'default') === 'default' ? 'active' : ''}`}
                        style={{ background: '#1a1a1a' }}
                        onClick={() => onUpdate({ backgroundColor: 'default' })}
                        title="Varsayılan"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'white' ? 'active' : ''}`}
                        style={{ background: '#ffffff', border: '1px solid #ddd' }}
                        onClick={() => onUpdate({ backgroundColor: 'white' })}
                        title="Beyaz"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'lightgray' ? 'active' : ''}`}
                        style={{ background: '#f0f0f0' }}
                        onClick={() => onUpdate({ backgroundColor: 'lightgray' })}
                        title="Açık Gri"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'gray' ? 'active' : ''}`}
                        style={{ background: '#808080' }}
                        onClick={() => onUpdate({ backgroundColor: 'gray' })}
                        title="Gri"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'black' ? 'active' : ''}`}
                        style={{ background: '#000000' }}
                        onClick={() => onUpdate({ backgroundColor: 'black' })}
                        title="Siyah"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'lightblue' ? 'active' : ''}`}
                        style={{ background: '#87ceeb' }}
                        onClick={() => onUpdate({ backgroundColor: 'lightblue' })}
                        title="Açık Mavi"
                      />
                      <button 
                        className={`color-btn ${data.backgroundColor === 'cream' ? 'active' : ''}`}
                        style={{ background: '#f5f5dc' }}
                        onClick={() => onUpdate({ backgroundColor: 'cream' })}
                        title="Krem"
                      />
                    </div>
                    <div className="color-picker-wrapper">
                      <label className="color-picker-label">Özel Renk:</label>
                      <input
                        type="color"
                        value={data.backgroundColor === 'custom' ? (data.customBackgroundColor || '#1a1a1a') : '#1a1a1a'}
                        onChange={(e) => onUpdate({ backgroundColor: 'custom', customBackgroundColor: e.target.value })}
                        className="color-picker"
                      />
                      <span className="color-value">
                        {data.backgroundColor === 'custom' ? (data.customBackgroundColor || '#1a1a1a') : 
                         data.backgroundColor === 'white' ? '#ffffff' :
                         data.backgroundColor === 'lightgray' ? '#f0f0f0' :
                         data.backgroundColor === 'gray' ? '#808080' :
                         data.backgroundColor === 'black' ? '#000000' :
                         data.backgroundColor === 'lightblue' ? '#87ceeb' :
                         data.backgroundColor === 'cream' ? '#f5f5dc' :
                         '#1a1a1a'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Material Properties Accordion */}
            <div className="appearance-accordion">
              <button 
                className={`accordion-header ${openAccordion === 'materials' ? 'open' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'materials' ? null : 'materials')}
              >
                <span>⚙️ Malzeme Özellikleri</span>
                <span className="accordion-icon">{openAccordion === 'materials' ? '▼' : '▶'}</span>
              </button>
              
              {openAccordion === 'materials' && (
                <div className="accordion-content">
                  <div className="appearance-control">
                    <label>Şeffaflık (Transmission)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={data.lensTransmission || 0.9}
                      onChange={(e) => onUpdate({ lensTransmission: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensTransmission || 0.9) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Görünürlük (Opacity)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={data.lensOpacity || 0.85}
                      onChange={(e) => onUpdate({ lensOpacity: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensOpacity || 0.85) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Yansıma (Reflection)</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={data.lensReflection || 1.5}
                      onChange={(e) => onUpdate({ lensReflection: parseFloat(e.target.value) })}
                    />
                    <span className="value">{(data.lensReflection || 1.5).toFixed(1)}</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Pürüzlülük (Roughness)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={data.lensRoughness || 0.05}
                      onChange={(e) => onUpdate({ lensRoughness: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensRoughness || 0.05) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Metaliklik (Metalness)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={data.lensMetalness || 0.1}
                      onChange={(e) => onUpdate({ lensMetalness: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensMetalness || 0.1) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Parlak Kaplama (Clearcoat)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={data.lensClearcoat || 1.0}
                      onChange={(e) => onUpdate({ lensClearcoat: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensClearcoat || 1.0) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Kaplama Pürüzü (Clearcoat Roughness)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={data.lensClearcoatRoughness || 0.1}
                      onChange={(e) => onUpdate({ lensClearcoatRoughness: parseFloat(e.target.value) })}
                    />
                    <span className="value">{((data.lensClearcoatRoughness || 0.1) * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Kalınlık Etkisi (Thickness)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={data.lensThickness || 0.5}
                      onChange={(e) => onUpdate({ lensThickness: parseFloat(e.target.value) })}
                    />
                    <span className="value">{(data.lensThickness || 0.5).toFixed(1)}</span>
                  </div>
                  
                  <div className="appearance-control">
                    <label>Kırılma İndeksi (IOR)</label>
                    <input
                      type="range"
                      min="1.0"
                      max="2.0"
                      step="0.05"
                      value={data.lensIOR || 1.5}
                      onChange={(e) => onUpdate({ lensIOR: parseFloat(e.target.value) })}
                    />
                    <span className="value">{(data.lensIOR || 1.5).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Measurements Accordion */}
            <div className="appearance-accordion">
              <button 
                className={`accordion-header ${openAccordion === 'measurements' ? 'open' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'measurements' ? null : 'measurements')}
              >
                <span>📏 Ölçümler</span>
                <span className="accordion-icon">{openAccordion === 'measurements' ? '▼' : '▶'}</span>
              </button>
              
              {openAccordion === 'measurements' && (
                <div className="accordion-content">
                  <div className="measurements-grid">
              {(activeEye === 'right' || activeEye === 'both') && (
                <div className="eye-measurements">
                  <h4>👁️ Sağ Göz (OD)</h4>
                  <div className="measurement-item">
                    <span className="label">Reçete:</span>
                    <span className="value">{data.rightPrescription > 0 ? '+' : ''}{data.rightPrescription.toFixed(1)} D</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Çap:</span>
                    <span className="value">{data.rightDiameter} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Merkez:</span>
                    <span className="value">{rightThickness.center.toFixed(1)} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Kenar:</span>
                    <span className="value">{rightThickness.edge.toFixed(1)} mm</span>
                  </div>
                  <div className="measurement-item highlight">
                    <span className="label">Maksimum:</span>
                    <span className="value">{Math.max(rightThickness.center, rightThickness.edge).toFixed(1)} mm</span>
                  </div>
                </div>
              )}

              {(activeEye === 'left' || activeEye === 'both') && (
                <div className="eye-measurements">
                  <h4>👁️ Sol Göz (OS)</h4>
                  <div className="measurement-item">
                    <span className="label">Reçete:</span>
                    <span className="value">{data.leftPrescription > 0 ? '+' : ''}{data.leftPrescription.toFixed(1)} D</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Çap:</span>
                    <span className="value">{data.leftDiameter} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Merkez:</span>
                    <span className="value">{leftThickness.center.toFixed(1)} mm</span>
                  </div>
                  <div className="measurement-item">
                    <span className="label">Kenar:</span>
                    <span className="value">{leftThickness.edge.toFixed(1)} mm</span>
                  </div>
                  <div className="measurement-item highlight">
                    <span className="label">Maksimum:</span>
                    <span className="value">{Math.max(leftThickness.center, leftThickness.edge).toFixed(1)} mm</span>
                  </div>
                </div>
              )}
            </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewStep
