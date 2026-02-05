import React, { useState, useEffect, useContext } from 'react'
import { WizardControlsContext } from '../App'
import ShapeStep from './wizard/ShapeStep'
import PreviewStep from './wizard/PreviewStep'
import SummaryStep from './wizard/SummaryStep'
import ProgressIndicator from './wizard/ProgressIndicator'
import './LensWizard.css'

function LensWizard() {
  const { setWizardControls } = useContext(WizardControlsContext) || {}
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState({
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
    rightDiameter: 70,
    rightFrameSize: 'medium-large',
    leftDiameter: 70,
    leftFrameSize: 'medium-large',
    bridgeWidth: 17, // Distance between lenses (DBL)
    
    // Material - separate for each eye
    rightIndex: 1.60,
    leftIndex: 1.60,
    
    // Shape
    lensShape: 'classic',
    
    // Background
    backgroundEnvironment: 'city',
    backgroundColor: 'default',
    customBackgroundColor: '#1a1a1a',
    
    // Lens Material (Optimized for realistic glass with better transparency)
    lensTransmission: 1.0,
    lensOpacity: 1.0,
    lensReflection: 0.5,
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
  })

  const steps = [
    { id: 1, label: 'Şekil', icon: '⭕' },
    { id: 2, label: 'Önizleme', icon: '👁️' },
    { id: 3, label: 'Sonuç', icon: '✅' }
  ]

  const updateData = (newData) => {
    setData(prev => ({ ...prev, ...newData }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const restart = () => {
    setCurrentStep(1)
    setData({
      rightPrescription: -3.0,
      rightCylinder: 0,
      rightAxis: 0,
      leftPrescription: -3.0,
      leftCylinder: 0,
      leftAxis: 0,
      hasAstigmatism: false,
      rightDiameter: 70,
      rightFrameSize: 'medium-large',
      leftDiameter: 70,
      leftFrameSize: 'medium-large',
      rightIndex: 1.60,
      leftIndex: 1.60,
      lensShape: 'classic',
      backgroundEnvironment: 'city',
      backgroundColor: 'default',
      customBackgroundColor: '#1a1a1a',
      lensTransmission: 1.0,
      lensOpacity: 1.0,
      lensReflection: 0.5,
      lensColor: '#ffffff',
      lensRoughness: 0.05,
      lensMetalness: 0.0,
      lensClearcoat: 0.5,
      lensClearcoatRoughness: 0.1,
      lensThickness: 2.0,
      lensIOR: 1.5,
      bridgeWidth: 17,
      totalPD: 63,
      rightPD: 31.5,
      leftPD: 31.5,
      useSeparatePD: false,
      edgeThickness: 1.5,
      baseCurve: 4.0
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Provide controls to the top navigation
  useEffect(() => {
    if (setWizardControls) {
      setWizardControls({
        onNext: nextStep,
        onPrev: prevStep,
        onRestart: restart,
        isFirstStep: currentStep === 1,
        isLastStep: currentStep === steps.length,
        currentStep
      })
    }
  }, [currentStep, setWizardControls])

  const renderStep = () => {
    const stepProps = {
      data,
      onUpdate: updateData,
      onNext: nextStep,
      onPrev: prevStep,
      onRestart: restart
    }

    switch (currentStep) {
      case 1:
        return <ShapeStep {...stepProps} />
      case 2:
        return <PreviewStep {...stepProps} />
      case 3:
        return <SummaryStep {...stepProps} />
      default:
        return <ShapeStep {...stepProps} />
    }
  }

  return (
    <div className="lens-wizard">
      <div className="wizard-header">
        <button 
          className="nav-btn"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          ← Geri
        </button>
        
        <ProgressIndicator 
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            // Allow navigation to any step
            setCurrentStep(step)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
        
        <button 
          className="nav-btn nav-btn-primary"
          onClick={currentStep === steps.length ? restart : nextStep}
        >
          {currentStep === steps.length ? '🔄 Yeni' : 'İleri →'}
        </button>
      </div>

      <div className="wizard-content">
        {renderStep()}
      </div>
    </div>
  )
}

export default LensWizard
