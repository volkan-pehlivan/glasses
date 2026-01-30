import React, { useState } from 'react'
import './PrescriptionStep.css'

function PrescriptionStep({ data, onUpdate }) {
  const handleChange = (eye, field, value) => {
    const key = `${eye}${field.charAt(0).toUpperCase() + field.slice(1)}`
    onUpdate({ [key]: parseFloat(value) || 0 })
  }

  const copyToLeft = () => {
    onUpdate({
      leftPrescription: data.rightPrescription,
      leftCylinder: data.rightCylinder,
      leftAxis: data.rightAxis
    })
  }

  return (
    <div className="wizard-step prescription-step">
      <div className="step-content">
        {/* Prescription table */}
        <div className="prescription-table-container">
          <table className="prescription-table">
            <thead>
              <tr>
                <th className="eye-column"></th>
                <th>
                  Sph (Küre)
                </th>
                <th>
                  Cyl (Silindir)
                </th>
                <th>
                  Axis (Eksen)
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Right Eye */}
              <tr>
                <td className="eye-label">
                  <div className="eye-badge right">
                    <span className="eye-icon">👁️</span>
                    <span className="eye-text">Sağ (OD)</span>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.25"
                    min="-15"
                    max="15"
                    value={data.rightPrescription}
                    onChange={(e) => handleChange('right', 'prescription', e.target.value)}
                    className="prescription-input"
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.25"
                    min="-6"
                    max="6"
                    value={data.rightCylinder}
                    onChange={(e) => handleChange('right', 'cylinder', e.target.value)}
                    className="prescription-input"
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={data.rightAxis}
                    onChange={(e) => handleChange('right', 'axis', e.target.value)}
                    className="prescription-input"
                    placeholder="0"
                  />
                </td>
              </tr>

              {/* Left Eye */}
              <tr>
                <td className="eye-label">
                  <div className="eye-badge left">
                    <span className="eye-icon">👁️</span>
                    <span className="eye-text">Sol (OS)</span>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.25"
                    min="-15"
                    max="15"
                    value={data.leftPrescription}
                    onChange={(e) => handleChange('left', 'prescription', e.target.value)}
                    className="prescription-input"
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.25"
                    min="-6"
                    max="6"
                    value={data.leftCylinder}
                    onChange={(e) => handleChange('left', 'cylinder', e.target.value)}
                    className="prescription-input"
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={data.leftAxis}
                    onChange={(e) => handleChange('left', 'axis', e.target.value)}
                    className="prescription-input"
                    placeholder="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <button className="copy-button" onClick={copyToLeft}>
            📋 Sağ göz değerlerini sol göze kopyala
          </button>
        </div>

        {/* Pupillary Distance (PD) - HIDDEN FOR NOW, KEEP FOR FUTURE USE */}
        {false && (
          <div className="pd-section">
            <h3>👁️ Pupil Mesafesi (PD)</h3>
            <p className="pd-description">Gözbebekleriniz arasındaki mesafe (mm)</p>
            
            <div className="pd-input-group">
              <div className="pd-option">
                <label>
                  <input
                    type="radio"
                    name="pdType"
                    checked={!data.useSeparatePD}
                    onChange={() => onUpdate({ useSeparatePD: false })}
                  />
                  <span>Tek PD (Her iki göz için)</span>
                </label>
                <input
                  type="number"
                  className="pd-input"
                  value={data.totalPD || 63}
                  onChange={(e) => onUpdate({ totalPD: parseFloat(e.target.value) || 63 })}
                  min="50"
                  max="80"
                  step="0.5"
                  disabled={data.useSeparatePD}
                />
                <span className="unit">mm</span>
              </div>

              <div className="pd-option">
                <label>
                  <input
                    type="radio"
                    name="pdType"
                    checked={data.useSeparatePD}
                    onChange={() => onUpdate({ useSeparatePD: true })}
                  />
                  <span>Ayrı PD (Her göz için)</span>
                </label>
                <div className="pd-separate-inputs">
                  <div className="pd-eye-input">
                    <label>Sağ (OD):</label>
                    <input
                      type="number"
                      className="pd-input"
                      value={data.rightPD || 31.5}
                      onChange={(e) => onUpdate({ rightPD: parseFloat(e.target.value) || 31.5 })}
                      min="25"
                      max="40"
                      step="0.5"
                      disabled={!data.useSeparatePD}
                    />
                    <span className="unit">mm</span>
                  </div>
                  <div className="pd-eye-input">
                    <label>Sol (OS):</label>
                    <input
                      type="number"
                      className="pd-input"
                      value={data.leftPD || 31.5}
                      onChange={(e) => onUpdate({ leftPD: parseFloat(e.target.value) || 31.5 })}
                      min="25"
                      max="40"
                      step="0.5"
                      disabled={!data.useSeparatePD}
                    />
                    <span className="unit">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick presets for common prescriptions */}
        <div className="quick-presets-section">
          <h3>Hızlı Seçim (Sph)</h3>
          <div className="preset-grid">
            {[-6, -5, -4, -3, -2, -1, -0.5, 0, 0.5, 1, 2, 3].map(value => (
              <button
                key={value}
                className="preset-chip"
                onClick={() => {
                  onUpdate({ 
                    rightPrescription: value,
                    leftPrescription: value 
                  })
                }}
              >
                {value > 0 ? `+${value}` : value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionStep
