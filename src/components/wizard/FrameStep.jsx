import React from 'react'
import './FrameStep.css'

function FrameStep({ data, onUpdate }) {
  return (
    <div className="wizard-step frame-step">
      <div className="step-content">
        <div className="manual-controls-container">
          {/* Right Eye Diameter */}
          <div className="manual-control-group">
            <label>👁️ Sağ Göz (OD) - Çap</label>
            <div className="manual-input-wrapper">
              <input
                type="number"
                min="50"
                max="85"
                step="1"
                value={data.rightDiameter}
                onChange={(e) => onUpdate({ rightDiameter: parseInt(e.target.value) || 50 })}
              />
              <span className="unit">mm</span>
            </div>
          </div>

          {/* Left Eye Diameter */}
          <div className="manual-control-group">
            <label>👁️ Sol Göz (OS) - Çap</label>
            <div className="manual-input-wrapper">
              <input
                type="number"
                min="50"
                max="85"
                step="1"
                value={data.leftDiameter}
                onChange={(e) => onUpdate({ leftDiameter: parseInt(e.target.value) || 50 })}
              />
              <span className="unit">mm</span>
            </div>
          </div>

          {/* Bridge Width */}
          <div className="manual-control-group">
            <label>🔗 Köprü Genişliği</label>
            <div className="manual-input-wrapper">
              <input
                type="number"
                min="10"
                max="30"
                step="0.5"
                value={data.bridgeWidth || 17}
                onChange={(e) => onUpdate({ bridgeWidth: parseFloat(e.target.value) || 17 })}
              />
              <span className="unit">mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrameStep
