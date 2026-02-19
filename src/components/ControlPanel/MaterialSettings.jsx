import React from 'react'

function MaterialSettings({ data, onUpdate }) {
    return (
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
    )
}

export default MaterialSettings
