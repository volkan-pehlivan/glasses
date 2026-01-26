import React, { useState } from 'react'
import './Tooltip.css'

function Tooltip({ content, children }) {
  const [show, setShow] = useState(false)

  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-trigger"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault()
          setShow(!show)
        }}
        aria-label="Yardım"
      >
        {children || '?'}
      </button>

      {show && (
        <div className="tooltip-content">
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}
    </span>
  )
}

export default Tooltip
