import React, { useState } from 'react'
import Tooltip from '../common/Tooltip'
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
      <div className="step-header">
        <h2>Gözlük Reçetesi</h2>
        <p className="step-description">
          Reçete değerlerinizi girin
        </p>
      </div>

      <div className="step-content">
        {/* Prescription table */}
        <div className="prescription-table-container">
          <table className="prescription-table">
            <thead>
              <tr>
                <th className="eye-column"></th>
                <th>
                  Sph (Küre)
                  <Tooltip content="Sphere - Ana görme düzeltmesi. Negatif (-) miyop, pozitif (+) hipermetrop" />
                </th>
                <th>
                  Cyl (Silindir)
                  <Tooltip content="Cylinder - Astigmat düzeltmesi (varsa)" />
                </th>
                <th>
                  Axis (Eksen)
                  <Tooltip content="Astigmat açısı (0-180°)" />
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

        {/* Info box */}
        <div className="info-box">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <strong>İpucu:</strong> Reçetenizde sadece Sph (Küre) değeri varsa, Cyl ve Axis alanlarını boş bırakabilirsiniz.
            Değerler 0.25 adımlarla artırılabilir.
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionStep
