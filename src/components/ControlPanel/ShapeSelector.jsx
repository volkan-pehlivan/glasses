import React from 'react'
import { SHAPE_CONFIGS } from '../../utils/shapeConfigs'

const shapes = [
    //     { id: 'rectangle', name: 'Dikdörtgen', desc: 'Keskin hatlar' },
    //     { id: 'square', name: 'Kare', desc: 'Eşit kenarlar' },
    //     { id: 'round', name: 'Yuvarlak', desc: 'Mükemmel daire' },
    //     { id: 'oval', name: 'Oval', desc: 'Yatay elips' },
    //     { id: 'wayfarer', name: 'Wayfarer', desc: 'Üstte geniş' },
    //     { id: 'aviator', name: 'Aviator', desc: 'Damla şekli' },
    //     { id: 'pilot', name: 'Pilot', desc: 'Büyük damla' },
    //     { id: 'clubmaster', name: 'Clubmaster', desc: 'Düz üst, yuvarlak alt' },
    //     { id: 'catEye', name: 'Kedi Gözü', desc: 'Kıvrık köşeler' },
    //     { id: 'catEyeNarrow', name: 'Dar Kedi Gözü', desc: 'Dar kıvrık' },
    //     { id: 'navigator', name: 'Navigator', desc: 'Geniş dikdörtgen' },
    //     { id: 'pantos', name: 'Pantos', desc: 'Yuvarlak alt' },
    //     { id: 'butterfly', name: 'Kelebek', desc: 'Geniş dış kenar' },
    //     { id: 'geometric', name: 'Geometrik', desc: 'Altıgen köşeli' },
    //     { id: 'hexagonal', name: 'Altıgen', desc: 'Altı kenar' },
    //     { id: 'octagonal', name: 'Sekizgen', desc: 'Sekiz kenar' },
    { id: 'realShape1', name: 'Gerçek Şekil 1', desc: 'PNG çıkarılmış' },
    { id: 'realShape2', name: 'Gerçek Şekil 2', desc: 'İkinci lens şekli' },
    { id: 'realShape3', name: 'Gerçek Şekil 3', desc: 'Üçüncü lens şekli' },
    { id: 'realShape4', name: 'Gerçek Şekil 4', desc: 'Dördüncü lens şekli' },
    { id: 'realShape5', name: 'Gerçek Şekil 5', desc: 'Beşinci lens şekli' },
    { id: 'realShape6', name: 'Gerçek Şekil 6', desc: 'Altıncı lens şekli' },
    { id: 'realShape7', name: 'Gerçek Şekil 7', desc: 'Yedinci lens şekli' },
    { id: 'realShape8', name: 'Gerçek Şekil 8', desc: 'Sekizinci lens şekli' },
    { id: 'realShape9', name: 'Gerçek Şekil 9', desc: 'Dokuzuncu lens şekli' },
    { id: 'realShape10', name: 'Gerçek Şekil 10', desc: 'Onuncu lens şekli' },
    { id: 'realShape11', name: 'Gerçek Şekil 11', desc: 'On birinci lens şekli' },
    { id: 'realShape12', name: 'Gerçek Şekil 12', desc: 'On ikinci lens şekli' },
    { id: 'realShape13', name: 'Gerçek Şekil 13', desc: 'On üçüncü lens şekli' },
    { id: 'realShape14', name: 'Gerçek Şekil 14', desc: 'On dördüncü lens şekli' },
    { id: 'realShape15', name: 'Gerçek Şekil 15', desc: 'On beşinci lens şekli' },
    { id: 'realShape16', name: 'Gerçek Şekil 16', desc: 'On altıncı lens şekli' },
    //     { id: 'realShape1Raw', name: 'Gerçek Şekil 1 (Keskin)', desc: 'Yumuşatma yapılmamış' },
    //     { id: 'realShape1Sharp', name: 'Gerçek Şekil 1 (Net)', desc: 'Optimize edilmiş net' }
]

const ShapePreview = ({ shapeId, isSelected }) => {
    const config = SHAPE_CONFIGS[shapeId]
    if (!config || !config.generator) return null

    // Generate points for the preview
    // Use 100 points for a smooth preview
    const points = config.generator(100)

    if (!points || points.length === 0) return null

    // Create SVG path
    // Points are in normalized coordinate space (approx -0.5 to 0.5)
    // We map them to SVG path command
    let d = `M ${points[0].x} ${points[0].z}`
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].z}`
    }
    d += ' Z'

    return (
        <div className="shape-preview-container" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isSelected ? 1 : 0.7,
            transition: 'opacity 0.2s'
        }}>
            <svg
                viewBox="-0.6 -0.6 1.2 1.2"
                style={{
                    width: '90%',
                    height: '90%',
                    overflow: 'visible'
                }}
            >
                <path
                    d={d}
                    fill="none"
                    stroke={isSelected ? "#4dabf7" : "#adb5bd"} // Blue when selected, gray otherwise
                    strokeWidth="0.03" // Slightly thinner since it's bigger
                    strokeLinecap="round"
                    strokeLinejoin="round"
                // Mirroring removed to show raw orientation (Right Eye convention)
                />
            </svg>
        </div>
    )
}

function ShapeSelector({ data, onUpdate }) {
    return (
        <div className="accordion-content">
            <div className="shape-selector-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
            }}>
                {shapes.map((shape) => (
                    <div
                        key={shape.id}
                        className={`shape-option ${data.lensShape === shape.id ? 'selected' : ''}`}
                        onClick={() => onUpdate({ lensShape: shape.id })}
                        style={{
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ShapePreview shapeId={shape.id} isSelected={data.lensShape === shape.id} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ShapeSelector
