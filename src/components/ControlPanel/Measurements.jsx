import React from 'react'
import { calculateThickness } from '../../utils/lensCalculations'

function Measurements({ data, activeEye }) {
    const rightThickness = calculateThickness(data.rightPrescription, data.rightIndex, data.rightDiameter)
    const leftThickness = calculateThickness(data.leftPrescription, data.leftIndex, data.leftDiameter)

    return (
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
    )
}

export default Measurements
