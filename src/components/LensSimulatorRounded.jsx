import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import './LensSimulatorRounded.css'

function AccurateLensGeometry({ 
  centerThickness, 
  edgeThickness, 
  diameter, 
  prescription, 
  index, 
  shape = 'classic', 
  transmission = 0.9, 
  opacity = 0.85, 
  reflection = 1.5, 
  color = '#ffffff',
  roughness = 0.05,
  metalness = 0.1,
  clearcoat = 1.0,
  clearcoatRoughness = 0.1,
  thickness = 0.5,
  ior = 1.5
}) {
  const geometry = useMemo(() => {
    // Shape configurations with trapezoid support
    const shapeConfigs = {
      classic: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.05, topRight: 0.05, bottomLeft: 0.45, bottomRight: 0.45 }
      },
      rectangle: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.25, topRight: 0.25, bottomLeft: 0.25, bottomRight: 0.25 }
      },
      circle: {
        topWidth: 1.0,
        bottomWidth: 1.0,
        height: 1.0,
        cornerRadii: { topLeft: 0.5, topRight: 0.5, bottomLeft: 0.5, bottomRight: 0.5 }
      },
      oval: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.5, topRight: 0.5, bottomLeft: 0.5, bottomRight: 0.5 }
      },
      aviator: {
        topWidth: 1.3,
        bottomWidth: 1.5,
        height: 0.9,
        cornerRadii: { topLeft: 0.25, topRight: 0.25, bottomLeft: 0.15, bottomRight: 0.15 }
      },
      wayfarer: {
        topWidth: 1.5,
        bottomWidth: 1.3,
        height: 0.9,
        cornerRadii: { topLeft: 0.15, topRight: 0.15, bottomLeft: 0.25, bottomRight: 0.25 }
      }
    }
    
    const config = shapeConfigs[shape] || shapeConfigs.classic
    
    const topWidth = diameter * config.topWidth
    const bottomWidth = diameter * config.bottomWidth
    const height = diameter * config.height
    
    const minDim = Math.min(Math.max(topWidth, bottomWidth), height)
    
    // Scale corner radii by minDim
    const cornerRadii = {
      topLeft: minDim * config.cornerRadii.topLeft,
      topRight: minDim * config.cornerRadii.topRight,
      bottomLeft: minDim * config.cornerRadii.bottomLeft,
      bottomRight: minDim * config.cornerRadii.bottomRight
    }
    
    const radialRings = 50
    const boundaryPoints = 120
    
    const positions = []
    const indices = []
    
    const SE = prescription
    
    let baseCurve
    if (prescription < 0) {
      baseCurve = SE / 2 + 6.00
    } else if (prescription > 0) {
      baseCurve = SE + 6.00
    } else {
      baseCurve = 6.00
    }
    
    const F1 = baseCurve
    const F2 = prescription - F1
    const r1 = Math.abs((1000 * (index - 1)) / F1)
    const r2 = Math.abs((1000 * (index - 1)) / F2)
    
    const calculateSagitta = (r, R) => {
      if (R === 0 || r > R) return 0
      return R - Math.sqrt(R * R - r * r)
    }
    
    const getRoundedTrapezoidPoint = (t) => {
      const halfTopW = topWidth / 2
      const halfBottomW = bottomWidth / 2
      const halfH = height / 2
      
      // Calculate side lengths using Pythagorean theorem for angled sides
      const widthDiff = Math.abs(halfTopW - halfBottomW)
      const sideHeight = height - cornerRadii.topRight - cornerRadii.bottomRight
      const rightSideLength = Math.sqrt(widthDiff * widthDiff + sideHeight * sideHeight)
      const leftSideLength = rightSideLength // Symmetric
      
      // Calculate straight edge lengths
      const topLength = topWidth - cornerRadii.topLeft - cornerRadii.topRight
      const bottomLength = bottomWidth - cornerRadii.bottomLeft - cornerRadii.bottomRight
      
      // Calculate corner arc lengths
      const topRightCornerLength = (Math.PI / 2) * cornerRadii.topRight
      const bottomRightCornerLength = (Math.PI / 2) * cornerRadii.bottomRight
      const bottomLeftCornerLength = (Math.PI / 2) * cornerRadii.bottomLeft
      const topLeftCornerLength = (Math.PI / 2) * cornerRadii.topLeft
      
      const totalPerimeter = topLength + topRightCornerLength + rightSideLength + 
                             bottomRightCornerLength + bottomLength + 
                             bottomLeftCornerLength + leftSideLength + topLeftCornerLength
      
      const distance = t * totalPerimeter
      let accumulated = 0
      
      // Top edge
      if (distance < accumulated + topLength) {
        const local = distance - accumulated
        return { 
          x: -halfTopW + cornerRadii.topLeft + local, 
          z: -halfH 
        }
      }
      accumulated += topLength
      
      // Top-right corner
      if (distance < accumulated + topRightCornerLength) {
        const local = (distance - accumulated) / topRightCornerLength
        const angle = -Math.PI / 2 + local * (Math.PI / 2)
        return { 
          x: halfTopW - cornerRadii.topRight + cornerRadii.topRight * Math.cos(angle), 
          z: -halfH + cornerRadii.topRight + cornerRadii.topRight * Math.sin(angle) 
        }
      }
      accumulated += topRightCornerLength
      
      // Right side (angled for trapezoid)
      if (distance < accumulated + rightSideLength) {
        const local = (distance - accumulated) / rightSideLength
        const startX = halfTopW
        const endX = halfBottomW
        const startZ = -halfH + cornerRadii.topRight
        const endZ = halfH - cornerRadii.bottomRight
        return { 
          x: startX + (endX - startX) * local, 
          z: startZ + (endZ - startZ) * local 
        }
      }
      accumulated += rightSideLength
      
      // Bottom-right corner
      if (distance < accumulated + bottomRightCornerLength) {
        const local = (distance - accumulated) / bottomRightCornerLength
        const angle = 0 + local * (Math.PI / 2)
        return { 
          x: halfBottomW - cornerRadii.bottomRight + cornerRadii.bottomRight * Math.cos(angle), 
          z: halfH - cornerRadii.bottomRight + cornerRadii.bottomRight * Math.sin(angle) 
        }
      }
      accumulated += bottomRightCornerLength
      
      // Bottom edge
      if (distance < accumulated + bottomLength) {
        const local = distance - accumulated
        return { 
          x: halfBottomW - cornerRadii.bottomRight - local, 
          z: halfH 
        }
      }
      accumulated += bottomLength
      
      // Bottom-left corner
      if (distance < accumulated + bottomLeftCornerLength) {
        const local = (distance - accumulated) / bottomLeftCornerLength
        const angle = Math.PI / 2 + local * (Math.PI / 2)
        return { 
          x: -halfBottomW + cornerRadii.bottomLeft + cornerRadii.bottomLeft * Math.cos(angle), 
          z: halfH - cornerRadii.bottomLeft + cornerRadii.bottomLeft * Math.sin(angle) 
        }
      }
      accumulated += bottomLeftCornerLength
      
      // Left side (angled for trapezoid)
      if (distance < accumulated + leftSideLength) {
        const local = (distance - accumulated) / leftSideLength
        const startX = -halfBottomW
        const endX = -halfTopW
        const startZ = halfH - cornerRadii.bottomLeft
        const endZ = -halfH + cornerRadii.topLeft
        return { 
          x: startX + (endX - startX) * local, 
          z: startZ + (endZ - startZ) * local 
        }
      }
      accumulated += leftSideLength
      
      // Top-left corner
      const local = (distance - accumulated) / topLeftCornerLength
      const angle = Math.PI + local * (Math.PI / 2)
      return { 
        x: -halfTopW + cornerRadii.topLeft + cornerRadii.topLeft * Math.cos(angle), 
        z: -halfH + cornerRadii.topLeft + cornerRadii.topLeft * Math.sin(angle) 
      }
    }
    
    // Start from a very small ring instead of a single center point to avoid artifacts
    for (let ring = 0; ring <= radialRings; ring++) {
      const ringRatio = ring === 0 ? 0.001 : ring / radialRings
      
      for (let i = 0; i < boundaryPoints; i++) {
        const t = i / boundaryPoints
        const boundaryPt = getRoundedTrapezoidPoint(t)
        const x = boundaryPt.x * ringRatio
        const z = boundaryPt.z * ringRatio
        const r = Math.sqrt(x * x + z * z)
        const s1 = calculateSagitta(r, r1)
        const s2 = calculateSagitta(r, r2)
        const topY = -s1
        const bottomY = -centerThickness - s2
        
        positions.push(x, topY, z)
        positions.push(x, bottomY, z)
      }
    }
    
    // Connect rings
    for (let ring = 0; ring < radialRings; ring++) {
      const ringStart = ring * boundaryPoints * 2
      const nextRingStart = (ring + 1) * boundaryPoints * 2
      
      for (let i = 0; i < boundaryPoints; i++) {
        const next = (i + 1) % boundaryPoints
        const c = ringStart + i * 2
        const n = ringStart + next * 2
        const cn = nextRingStart + i * 2
        const nn = nextRingStart + next * 2
        
        indices.push(c, cn, n)
        indices.push(n, cn, nn)
        indices.push(c + 1, n + 1, cn + 1)
        indices.push(n + 1, nn + 1, cn + 1)
      }
    }
    
    // Close the outer edge
    const outerRingStart = radialRings * boundaryPoints * 2
    for (let i = 0; i < boundaryPoints; i++) {
      const next = (i + 1) % boundaryPoints
      const c = outerRingStart + i * 2
      const n = outerRingStart + next * 2
      indices.push(c, c + 1, n)
      indices.push(n, c + 1, n + 1)
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }, [centerThickness, edgeThickness, diameter, prescription, index, shape])
  
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
        transmission={transmission}
        thickness={thickness}
        ior={ior}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        envMapIntensity={reflection}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function CameraController({ cameraView, controlsRef, viewTrigger }) {
  const { camera } = useThree()
  
  useEffect(() => {
    if (!camera || !controlsRef.current) return
    
    let targetPosition
    // Note: Lenses are rotated 90° around X-axis, so we need to adjust camera positions
    switch(cameraView) {
      case 'top':
        targetPosition = [0, 250, 0] // Looking from top (Y+) shows top view due to rotation
        break
      case 'front':
        targetPosition = [0, 0, 250] // Looking from front (Z+) shows front view due to rotation
        break
      case 'side':
        targetPosition = [250, 0, 0] // Looking from side (X+) shows side view
        break
      default:
        targetPosition = [0, 0, 250]
    }
    
    camera.position.set(...targetPosition)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }, [cameraView, viewTrigger, camera, controlsRef])
  
  return null
}

function LensModel({ params, controlsRef, showDebugLines }) {
  const groupRef = useRef(null)
  
  const calculateThickness = (prescription, index, diameter) => {
    const D = diameter
    const P = Math.abs(prescription)
    const n = index
    const thicknessAddition = (D * D * P) / (2000 * (n - 1))
    
    let centerT, edgeT
    
    if (prescription < 0) {
      centerT = params.edgeThickness || 1.5
      edgeT = centerT + thicknessAddition
    } else if (prescription > 0) {
      centerT = (params.edgeThickness || 1.5) + thicknessAddition
      edgeT = params.edgeThickness || 1.5
    } else {
      centerT = params.edgeThickness || 1.5
      edgeT = params.edgeThickness || 1.5
    }
    
    return {
      center: Math.max(params.edgeThickness || 1.5, centerT),
      edge: Math.max(params.edgeThickness || 1.5, edgeT)
    }
  }
  
  const showBoth = params.showBoth
  const rightThickness = showBoth ? calculateThickness(params.rightPrescription, params.rightIndex, params.rightDiameter) : calculateThickness(params.prescription, params.index, params.diameter)
  const leftThickness = showBoth ? calculateThickness(params.leftPrescription, params.leftIndex, params.leftDiameter) : rightThickness
  
  const rightMaxThickness = Math.max(rightThickness.center, rightThickness.edge)
  const leftMaxThickness = Math.max(leftThickness.center, leftThickness.edge)
  const rightYOffset = showBoth ? rightMaxThickness / 2 : 0
  const leftYOffset = showBoth ? leftMaxThickness / 2 : 0
  
  const lensShape = params.lensShape || 'classic'
  
  // Calculate lens spacing based on bridge width
  const bridgeWidth = params.bridgeWidth || 17
  const rightDiameter = showBoth ? params.rightDiameter : params.diameter
  const leftDiameter = showBoth ? params.leftDiameter : params.diameter
  
  // Lens bounding box width is diameter * 1.4 (as defined in geometry)
  const rightLensWidth = rightDiameter * 1.4
  const leftLensWidth = leftDiameter * 1.4
  
  // Position lenses so the gap between bounding boxes equals bridgeWidth
  // rightLensX + rightLensWidth/2 = right inner edge
  // leftLensX - leftLensWidth/2 = left inner edge
  // We want: (leftLensX - leftLensWidth/2) - (rightLensX + rightLensWidth/2) = bridgeWidth
  // Since lenses are symmetric: rightLensX = -leftLensX
  // So: (-rightLensX - leftLensWidth/2) - (rightLensX + rightLensWidth/2) = bridgeWidth
  // Simplifying: -2*rightLensX - (leftLensWidth + rightLensWidth)/2 = bridgeWidth
  // rightLensX = -((leftLensWidth + rightLensWidth)/2 + bridgeWidth) / 2
  
  const rightLensX = -((rightLensWidth + leftLensWidth) / 2 + bridgeWidth) / 2
  const leftLensX = ((rightLensWidth + leftLensWidth) / 2 + bridgeWidth) / 2
  
  return (
    <group ref={groupRef}>
      {/* Reference dot at origin (0, 0, 0) - RED sphere */}
      {showDebugLines && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
      
      {/* Center markers for each lens - BLUE spheres */}
      {showBoth && showDebugLines && (
        <>
          <mesh position={[rightLensX, 0, 0]}>
            <sphereGeometry args={[3, 16, 16]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
          <mesh position={[leftLensX, 0, 0]}>
            <sphereGeometry args={[3, 16, 16]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
        </>
      )}
      
      {showBoth ? (
        <>
          <group position={[rightLensX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={rightThickness.center}
              edgeThickness={rightThickness.edge}
              diameter={params.rightDiameter}
              prescription={params.rightPrescription}
              index={params.rightIndex}
              shape={lensShape}
              transmission={params.lensTransmission || 0.9}
              opacity={params.lensOpacity || 0.85}
              reflection={params.lensReflection || 1.5}
              color={params.lensColor || '#ffffff'}
              roughness={params.lensRoughness || 0.05}
              metalness={params.lensMetalness || 0.1}
              clearcoat={params.lensClearcoat || 1.0}
              clearcoatRoughness={params.lensClearcoatRoughness || 0.1}
              thickness={params.lensThickness || 0.5}
              ior={params.lensIOR || 1.5}
            />
          </group>
          
          <group position={[leftLensX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={leftThickness.center}
              edgeThickness={leftThickness.edge}
              diameter={params.leftDiameter}
              prescription={params.leftPrescription}
              index={params.leftIndex}
              shape={lensShape}
              transmission={params.lensTransmission || 0.9}
              opacity={params.lensOpacity || 0.85}
              reflection={params.lensReflection || 1.5}
              color={params.lensColor || '#ffffff'}
              roughness={params.lensRoughness || 0.05}
              metalness={params.lensMetalness || 0.1}
              clearcoat={params.lensClearcoat || 1.0}
              clearcoatRoughness={params.lensClearcoatRoughness || 0.1}
              thickness={params.lensThickness || 0.5}
              ior={params.lensIOR || 1.5}
            />
          </group>
          
          {/* Bridge indicator - shows the actual gap between lenses */}
          {showDebugLines && (
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[bridgeWidth, rightDiameter * 0.9, 2]} />
              <meshBasicMaterial color="#ff6b6b" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          )}
          
          {/* Blue line showing the gap between the inner edges of green boxes */}
          {showDebugLines && (() => {
            const rightInnerEdge = rightLensX + rightLensWidth / 2
            const leftInnerEdge = leftLensX - leftLensWidth / 2
            const gapLength = leftInnerEdge - rightInnerEdge
            const gapCenter = (rightInnerEdge + leftInnerEdge) / 2
            
            // Log the values for debugging
            console.log('Bridge Width Input:', bridgeWidth)
            console.log('Right Lens X:', rightLensX)
            console.log('Left Lens X:', leftLensX)
            console.log('Right Lens Width:', rightLensWidth)
            console.log('Left Lens Width:', leftLensWidth)
            console.log('Right Inner Edge:', rightInnerEdge)
            console.log('Left Inner Edge:', leftInnerEdge)
            console.log('Gap Length (Blue Line):', gapLength)
            console.log('---')
            
            return (
              <mesh position={[gapCenter, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[2, gapLength, 2]} />
                <meshBasicMaterial color="#0000ff" transparent opacity={0.8} />
              </mesh>
            )
          })()}
          
          {/* Full width indicators for each lens - shows the bounding box */}
          {showDebugLines && (
            <>
              {/* Right lens full width box */}
              <mesh position={[rightLensX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[rightLensWidth, rightDiameter * 0.9, 0.5]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.15} wireframe />
              </mesh>
              
              {/* Right lens center line (horizontal through green box center) */}
              <mesh position={[rightLensX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[2, rightLensWidth, 2]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
              </mesh>
              
              {/* Left lens full width box */}
              <mesh position={[leftLensX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[leftLensWidth, leftDiameter * 0.9, 0.5]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.15} wireframe />
              </mesh>
              
              {/* Left lens center line (horizontal through green box center) */}
              <mesh position={[leftLensX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[2, leftLensWidth, 2]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
              </mesh>
              
              {/* Edge markers to show inner edges where gap starts */}
              {/* Right lens inner edge (right side) */}
              <mesh position={[rightLensX + rightLensWidth/2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[2, rightDiameter * 0.9, 2]} />
                <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
              </mesh>
              
              {/* Left lens inner edge (left side) */}
              <mesh position={[leftLensX - leftLensWidth/2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[2, leftDiameter * 0.9, 2]} />
                <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
              </mesh>
            </>
          )}
        </>
      ) : (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <AccurateLensGeometry 
            centerThickness={rightThickness.center}
            edgeThickness={rightThickness.edge}
            diameter={params.diameter}
            prescription={params.prescription}
            index={params.index}
            shape={lensShape}
            transmission={params.lensTransmission || 0.9}
            opacity={params.lensOpacity || 0.85}
            reflection={params.lensReflection || 1.5}
            color={params.lensColor || '#ffffff'}
            roughness={params.lensRoughness || 0.05}
            metalness={params.lensMetalness || 0.1}
            clearcoat={params.lensClearcoat || 1.0}
            clearcoatRoughness={params.lensClearcoatRoughness || 0.1}
            thickness={params.lensThickness || 0.5}
            ior={params.lensIOR || 1.5}
          />
        </group>
      )}
    </group>
  )
}

function LensSimulatorRounded({ 
  params, 
  activeEye, 
  onEyeChange, 
  bridgeWidth, 
  onBridgeWidthChange, 
  prescriptionEye, 
  onPrescriptionEyeChange,
  rightDiameter,
  leftDiameter,
  onDiameterChange,
  rightPrescription,
  leftPrescription,
  onPrescriptionChange,
  rightIndex,
  leftIndex,
  onIndexChange
}) {
  const [controlMode] = React.useState('rotate')
  const [showGrid] = React.useState(false)
  const controlsRef = useRef(null)
  const [cameraView, setCameraView] = React.useState('front')
  const [viewTrigger, setViewTrigger] = React.useState(0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showDebugLines, setShowDebugLines] = React.useState(false)
  const [showAxes, setShowAxes] = React.useState(false)
  const containerRef = useRef(null)
  
  const backgroundEnvironment = params.backgroundEnvironment || 'city'
  const backgroundColor = params.backgroundColor || 'default'
  
  const handleViewChange = (view) => {
    setCameraView(view)
    setViewTrigger(prev => prev + 1) // Force update even if same view
  }
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen()
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen()
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }
  
  // Listen for fullscreen changes (e.g., user pressing ESC)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
      
      // Force window resize event to make Three.js Canvas resize properly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])
  
  return (
    <div className="lens-simulator" ref={containerRef}>
      {/* Eye Selection Buttons - Top Left */}
      {onEyeChange && (
        <div className="eye-selector-canvas">
          <button 
            className={`eye-canvas-btn ${activeEye === 'right' ? 'active' : ''}`}
            onClick={() => onEyeChange('right')}
            title="Sağ Göz"
          >
            Sağ
          </button>
          <button 
            className={`eye-canvas-btn ${activeEye === 'both' ? 'active' : ''}`}
            onClick={() => onEyeChange('both')}
            title="Her İkisi"
          >
            İkisi
          </button>
          <button 
            className={`eye-canvas-btn ${activeEye === 'left' ? 'active' : ''}`}
            onClick={() => onEyeChange('left')}
            title="Sol Göz"
          >
            Sol
          </button>
        </div>
      )}
      
      {/* View Shortcut Buttons - Top Right */}
      <div className="view-shortcuts">
        <button 
          className={`view-btn ${cameraView === 'top' ? 'active' : ''}`}
          onClick={() => handleViewChange('top')}
        >
          Üst
        </button>
        <button 
          className={`view-btn ${cameraView === 'front' ? 'active' : ''}`}
          onClick={() => handleViewChange('front')}
        >
          Ön
        </button>
        <button 
          className={`view-btn ${cameraView === 'side' ? 'active' : ''}`}
          onClick={() => handleViewChange('side')}
        >
          Yan
        </button>
      </div>
      
      {/* Edit Eye Selector - Center Top (only when both eyes view is active) */}
      {activeEye === 'both' && onPrescriptionEyeChange && (
        <div className="eye-selector-center">
          <button 
            className={`eye-center-btn ${prescriptionEye === 'right' ? 'active' : ''}`}
            onClick={() => onPrescriptionEyeChange('right')}
          >
            Sağ
          </button>
          <button 
            className={`eye-center-btn ${prescriptionEye === 'left' ? 'active' : ''}`}
            onClick={() => onPrescriptionEyeChange('left')}
          >
            Sol
          </button>
        </div>
      )}
      
      {/* Control Buttons - Bottom Right */}
      <div className="fullscreen-control">
        <button 
          className="control-btn"
          onClick={() => setShowAxes(!showAxes)}
          title={showAxes ? 'Eksenleri Gizle' : 'Eksenleri Göster'}
        >
          {showAxes ? '📐' : '📏'}
        </button>
        <button 
          className="control-btn"
          onClick={() => setShowDebugLines(!showDebugLines)}
          title={showDebugLines ? 'Kontrol Çizgilerini Gizle' : 'Kontrol Çizgilerini Göster'}
        >
          {showDebugLines ? '👁️' : '👁️‍🗨️'}
        </button>
        <button 
          className="control-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>
      
      {/* Bridge Width Control - Bottom Left (when both eyes selected) */}
      {activeEye === 'both' && onBridgeWidthChange && (
        <div className="bridge-width-overlay">
          <label>🔗 Köprü Genişliği</label>
          <div className="control-input-group">
            <input
              type="number"
              min="10"
              max="30"
              step="0.5"
              value={bridgeWidth || 17}
              onChange={(e) => onBridgeWidthChange(parseFloat(e.target.value) || 17)}
            />
            <span className="unit">mm</span>
          </div>
        </div>
      )}
      
      {/* Frame Diameter Control - Below Bridge Width */}
      {onDiameterChange && (
        <div className="frame-diameter-overlay">
          {/* Show diameter control based on view mode and edit selection */}
          {(activeEye === 'right' || (activeEye === 'both' && prescriptionEye === 'right')) && (
            <>
              <label>👁️ Sağ Göz Çap</label>
              <div className="control-input-group">
                <input
                  type="number"
                  min="50"
                  max="85"
                  step="1"
                  value={rightDiameter}
                  onChange={(e) => onDiameterChange('right', e.target.value)}
                />
                <span className="unit">mm</span>
              </div>
            </>
          )}
          
          {(activeEye === 'left' || (activeEye === 'both' && prescriptionEye === 'left')) && (
            <>
              <label>👁️ Sol Göz Çap</label>
              <div className="control-input-group">
                <input
                  type="number"
                  min="50"
                  max="85"
                  step="1"
                  value={leftDiameter}
                  onChange={(e) => onDiameterChange('left', e.target.value)}
                />
                <span className="unit">mm</span>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Prescription Slider - Bottom Center */}
      {onPrescriptionChange && (
        <div className="prescription-slider-overlay">
          <div className="slider-container">
            <div className="slider-wrapper">
              <input
                type="range"
                min="-10"
                max="10"
                step="0.25"
                value={activeEye === 'both' 
                  ? (prescriptionEye === 'right' ? rightPrescription : leftPrescription)
                  : (activeEye === 'right' ? rightPrescription : leftPrescription)
                }
                onChange={(e) => onPrescriptionChange(parseFloat(e.target.value))}
                className="prescription-slider"
              />
              <div className="slider-ticks">
                {[-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                  <span key={val} className="tick">
                    {val > 0 ? `+${val}` : val}
                  </span>
                ))}
              </div>
            </div>
            <span className="slider-value">
              {(() => {
                const value = activeEye === 'both' 
                  ? (prescriptionEye === 'right' ? rightPrescription : leftPrescription)
                  : (activeEye === 'right' ? rightPrescription : leftPrescription);
                return `${value > 0 ? '+' : ''}${value.toFixed(2)} D`;
              })()}
            </span>
          </div>
        </div>
      )}
      
      {/* Material Index Slider - Right Middle (Vertical) */}
      {onIndexChange && (
        <div className="material-slider-overlay">
          <div className="material-slider-wrapper">
            <div className="material-slider-ticks">
              <span className="material-tick">1.50</span>
              <span className="material-tick">1.60</span>
              <span className="material-tick">1.67</span>
              <span className="material-tick">1.74</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={(() => {
                const currentIndex = activeEye === 'both' 
                  ? (prescriptionEye === 'right' ? rightIndex : leftIndex)
                  : (activeEye === 'right' ? rightIndex : leftIndex);
                const indices = [1.50, 1.60, 1.67, 1.74];
                // Find closest index
                let closestIdx = 0;
                let minDiff = Math.abs(currentIndex - indices[0]);
                for (let i = 1; i < indices.length; i++) {
                  const diff = Math.abs(currentIndex - indices[i]);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = i;
                  }
                }
                return 3 - closestIdx; // Reverse for vertical orientation
              })()}
              onChange={(e) => {
                const indices = [1.50, 1.60, 1.67, 1.74];
                const value = indices[3 - parseInt(e.target.value)]; // Reverse for vertical orientation
                if (activeEye === 'both') {
                  onIndexChange(prescriptionEye, value);
                } else {
                  onIndexChange(activeEye, value);
                }
              }}
              className="material-slider-vertical"
            />
          </div>
        </div>
      )}
      
      <Canvas 
        shadows 
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          precision: "highp",
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 250], fov: 50 }}
      >
        <color attach="background" args={
          backgroundColor === 'custom' ? [params.customBackgroundColor || '#1a1a1a'] :
          backgroundColor === 'white' ? ['#ffffff'] :
          backgroundColor === 'black' ? ['#000000'] :
          backgroundColor === 'gray' ? ['#808080'] :
          backgroundColor === 'lightgray' ? ['#f0f0f0'] :
          backgroundColor === 'lightblue' ? ['#87ceeb'] :
          backgroundColor === 'cream' ? ['#f5f5dc'] :
          ['#1a1a1a']
        } />
        
        <CameraController cameraView={cameraView} controlsRef={controlsRef} viewTrigger={viewTrigger} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 30, 20]} 
          intensity={1.5}
        />
        <directionalLight position={[-20, 20, -20]} intensity={0.8} />
        <pointLight position={[0, 50, 0]} intensity={0.5} />
        
        {(backgroundEnvironment === 'city' || backgroundEnvironment === 'sunset' || backgroundEnvironment === 'studio') && (
          <Environment preset={backgroundEnvironment} />
        )}
        
        {showGrid && (
          <Grid 
            args={[100, 100]} 
            cellColor="#333333" 
            sectionColor="#222222"
            fadeDistance={60}
            fadeStrength={1.5}
          />
        )}
        
        {showAxes && <axesHelper args={[30]} />}
        
        <LensModel params={params} controlsRef={controlsRef} showDebugLines={showDebugLines} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={controlMode === 'pan' || controlMode === 'both'}
          enableZoom={true}
          enableRotate={controlMode === 'rotate' || controlMode === 'both'}
          minDistance={100}
          maxDistance={500}
          autoRotate={false}
          target={[0, 0, 0]}
          panSpeed={1.5}
          zoomSpeed={1.0}
          rotateSpeed={1.5}
          mouseButtons={{
            LEFT: controlMode === 'pan' ? THREE.MOUSE.PAN : 
                  controlMode === 'rotate' ? THREE.MOUSE.ROTATE : 
                  THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: controlMode === 'pan' ? THREE.MOUSE.PAN : 
                   controlMode === 'rotate' ? THREE.MOUSE.ROTATE : 
                   THREE.MOUSE.PAN
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
        />
      </Canvas>
    </div>
  )
}

export default LensSimulatorRounded
