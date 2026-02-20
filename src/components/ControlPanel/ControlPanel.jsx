import React, { useState } from 'react'
import LensRenderer from '../LensRenderer'
import ShapeSelector from './ShapeSelector'
import ColorSettings from './ColorSettings'
import MaterialSettings from './MaterialSettings'
import Measurements from './Measurements'
import './ControlPanel.css'

function ControlPanel({ data, onUpdate }) {
    const [activeEye, setActiveEye] = useState('both') // 'right', 'left', or 'both' - controls VIEW
    const [prescriptionEye, setPrescriptionEye] = useState('right') // Which eye's data to EDIT when both view is active
    const [openAccordion, setOpenAccordion] = useState(null) // 'shape', 'colors', 'materials', 'measurements', or null (all closed by default)

    // Handle prescription change
    const handlePrescriptionChange = (value) => {
        const newValue = parseFloat(value)
        if (activeEye === 'both') {
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
        <div className="control-panel">
            <div className="panel-content">
                {/* 3D Viewer and Measurements - Side by side */}
                <div className="preview-layout">
                    <div className="canvas-wrapper-full">
                        <LensRenderer
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
                                lensShape: data.lensShape || 'rectangle',
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
                            {openAccordion === 'shape' && <ShapeSelector data={data} onUpdate={onUpdate} />}
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
                            {openAccordion === 'colors' && <ColorSettings data={data} onUpdate={onUpdate} />}
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
                            {openAccordion === 'materials' && <MaterialSettings data={data} onUpdate={onUpdate} />}
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
                            {openAccordion === 'measurements' && <Measurements data={data} activeEye={activeEye} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ControlPanel
