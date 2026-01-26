import React from 'react'
import './ProgressIndicator.css'

function ProgressIndicator({ steps, currentStep, onStepClick }) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="progress-indicator">
      {/* Progress bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="progress-steps">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <div
              key={step.id}
              className={`progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} clickable`}
              onClick={() => onStepClick(stepNumber)}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <span className="check-icon">✓</span>
                ) : (
                  <span className="step-icon">{step.icon}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressIndicator
