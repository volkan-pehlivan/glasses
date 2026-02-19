import React from 'react'

const shapes = [
    { id: 'classic', name: 'Klasik', desc: 'Üstte köşeli, altta yuvarlak' },
    { id: 'rectangle', name: 'Dikdörtgen', desc: 'Tüm köşeler yuvarlatılmış' },
    { id: 'circle', name: 'Yuvarlak', desc: 'Mükemmel daire' },
    { id: 'oval', name: 'Oval', desc: 'Yatay elips' },
    { id: 'wayfarer', name: 'Wayfarer', desc: 'Üstte geniş, altta dar' }
]

function ShapeSelector({ data, onUpdate }) {
    return (
        <div className="accordion-content">
            <div className="shape-selector-grid">
                {shapes.map((shape) => (
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
    )
}

export default ShapeSelector
