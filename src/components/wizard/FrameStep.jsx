import React from 'react'
import Tooltip from '../common/Tooltip'
import './FrameStep.css'

function FrameStep({ data, onUpdate }) {
  const frameSizes = [
    { id: 'xs', name: '50mm', diameter: 50, desc: 'Çok küçük' },
    { id: 'small', name: '55mm', diameter: 55, desc: 'Küçük' },
    { id: 'medium-small', name: '60mm', diameter: 60, desc: 'Orta-Küçük' },
    { id: 'medium', name: '65mm', diameter: 65, desc: 'Orta' },
    { id: 'medium-large', name: '70mm', diameter: 70, desc: 'Orta-Büyük' },
    { id: 'large', name: '75mm', diameter: 75, desc: 'Büyük' }
  ]

  const handleSizeSelect = (size, eye) => {
    if (eye === 'right') {
      onUpdate({ 
        rightFrameSize: size.id,
        rightDiameter: size.diameter
      })
    } else {
      onUpdate({ 
        leftFrameSize: size.id,
        leftDiameter: size.diameter
      })
    }
  }

  return (
    <div className="wizard-step frame-step">
      <div className="step-header">
        <h2>Çerçeve Bilgileri</h2>
        <p className="step-description">
          Her göz için çerçeve boyutunu seçin
        </p>
      </div>

      <div className="step-content">
        {/* Right Eye Frame size selection */}
        <div className="selection-group">
          <h3>
            👁️ Sağ Göz (OD) - Çerçeve Boyutu
            <Tooltip content="Çerçeve boyutu cam kalınlığını etkiler. Büyük çerçeveler daha kalın cam gerektirir." />
          </h3>
          
          <div className="size-grid">
            {frameSizes.map(size => (
              <button
                key={`right-${size.id}`}
                className={`size-card ${data.rightFrameSize === size.id ? 'selected' : ''}`}
                onClick={() => handleSizeSelect(size, 'right')}
              >
                <h4>{size.name}</h4>
                <p className="card-desc">{size.desc}</p>
              </button>
            ))}
            
            {/* Manual input card */}
            <div className="size-card manual-card">
              <h4>Manuel</h4>
              <div className="manual-input-inline">
                <input
                  type="number"
                  min="50"
                  max="85"
                  step="1"
                  value={data.rightDiameter}
                  onChange={(e) => onUpdate({ rightDiameter: parseInt(e.target.value) })}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Left Eye Frame size selection */}
        <div className="selection-group">
          <h3>
            👁️ Sol Göz (OS) - Çerçeve Boyutu
            <Tooltip content="Çerçeve boyutu cam kalınlığını etkiler. Büyük çerçeveler daha kalın cam gerektirir." />
          </h3>
          
          <div className="size-grid">
            {frameSizes.map(size => (
              <button
                key={`left-${size.id}`}
                className={`size-card ${data.leftFrameSize === size.id ? 'selected' : ''}`}
                onClick={() => handleSizeSelect(size, 'left')}
              >
                <h4>{size.name}</h4>
                <p className="card-desc">{size.desc}</p>
              </button>
            ))}
            
            {/* Manual input card */}
            <div className="size-card manual-card">
              <h4>Manuel</h4>
              <div className="manual-input-inline">
                <input
                  type="number"
                  min="50"
                  max="85"
                  step="1"
                  value={data.leftDiameter}
                  onChange={(e) => onUpdate({ leftDiameter: parseInt(e.target.value) })}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="info-box">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <strong>İpucu:</strong> Çerçeve boyutu ne kadar büyükse, cam o kadar kalın olur. 
            Yüksek reçeteler için daha küçük çerçeve seçmek cam kalınlığını azaltır.
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrameStep
