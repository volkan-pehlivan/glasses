import { useState } from 'react'

const initialData = {
    // Prescription - Right Eye
    rightPrescription: -3.0,
    rightCylinder: 0,
    rightAxis: 0,

    // Prescription - Left Eye
    leftPrescription: -3.0,
    leftCylinder: 0,
    leftAxis: 0,

    hasAstigmatism: false,

    // Frame - separate for each eye
    rightDiameter: 65,
    rightFrameSize: 'medium-large',
    leftDiameter: 65,
    leftFrameSize: 'medium-large',
    bridgeWidth: 17, // Distance between lenses (DBL)

    // Material - separate for each eye
    rightIndex: 1.60,
    leftIndex: 1.60,

    // Shape
    lensShape: 'classic',

    // Background
    backgroundEnvironment: 'photostudio',
    backgroundColor: 'default',
    customBackgroundColor: '#1a1a1a',

    // Lens Material (Optimized for realistic glass with better transparency)
    lensTransmission: 1.0,
    lensOpacity: 1.0,
    lensReflection: 0.2,
    lensColor: '#ffffff',
    lensRoughness: 0.05,
    lensMetalness: 0.0,
    lensClearcoat: 0.5,
    lensClearcoatRoughness: 0.1,
    lensThickness: 2.0,
    lensIOR: 1.5,

    // Pupillary Distance (PD)
    totalPD: 63,
    rightPD: 31.5,
    leftPD: 31.5,
    useSeparatePD: false,

    // Advanced (optional)
    edgeThickness: 1.5,
    baseCurve: 4.0
}

/**
 * Custom hook that manages all lens configuration state.
 * Replaces the LensConfigurator wrapper component.
 * 
 * @returns {{ data: object, updateData: function }}
 */
export function useLensState() {
    const [data, setData] = useState(initialData)

    const updateData = (newData) => {
        setData(prev => ({ ...prev, ...newData }))
    }

    return { data, updateData }
}
