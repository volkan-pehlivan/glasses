import React from 'react'
import './StepActions.css'

function StepActions({ onPrev, onNext, prevLabel = '← Geri', nextLabel = 'İleri →', showPrev = true, showNext = true }) {
  return (
    <div className="step-actions">
      {showPrev && (
        <button
          className="btn-secondary"
          onClick={onPrev}
          disabled={!onPrev}
        >
          {prevLabel}
        </button>
      )}
      
      {showNext && (
        <button
          className="btn-primary"
          onClick={onNext}
        >
          {nextLabel}
        </button>
      )}
    </div>
  )
}

export default StepActions
