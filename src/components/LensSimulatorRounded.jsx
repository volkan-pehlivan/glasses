import React, { useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import './LensSimulatorRounded.css'

function AccurateLensGeometry({ centerThickness, edgeThickness, diameter, prescription, index, shape = 'classic' }) {
  const geometry = useMemo(() => {
    const width = diameter * 1.4
    const height = diameter * 0.9
    
    const minDim = Math.min(width, height)
    
    // Define corner radii based on shape
    let cornerRadii
    if (shape === 'rectangle') {
      // Rectangle: 25% radius on all corners
      cornerRadii = {
        topLeft: minDim * 0.25,
        topRight: minDim * 0.25,
        bottomRight: minDim * 0.25,
        bottomLeft: minDim * 0.25
      }
    } else {
      // Classic: 5% top, 45% bottom
      cornerRadii = {
        topLeft: minDim * 0.05,
        topRight: minDim * 0.05,
        bottomRight: minDim * 0.45,
        bottomLeft: minDim * 0.45
      }
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
    
    const getRoundedRectPoint = (t) => {
      const halfW = width / 2
      const halfH = height / 2
      
      const topLength = width - cornerRadii.topLeft - cornerRadii.topRight
      const rightLength = height - cornerRadii.topRight - cornerRadii.bottomRight
      const bottomLength = width - cornerRadii.bottomRight - cornerRadii.bottomLeft
      const leftLength = height - cornerRadii.bottomLeft - cornerRadii.topLeft
      
      const topRightCornerLength = (Math.PI / 2) * cornerRadii.topRight
      const bottomRightCornerLength = (Math.PI / 2) * cornerRadii.bottomRight
      const bottomLeftCornerLength = (Math.PI / 2) * cornerRadii.bottomLeft
      const topLeftCornerLength = (Math.PI / 2) * cornerRadii.topLeft
      
      const totalPerimeter = topLength + topRightCornerLength + rightLength + 
                             bottomRightCornerLength + bottomLength + 
                             bottomLeftCornerLength + leftLength + topLeftCornerLength
      
      const distance = t * totalPerimeter
      let accumulated = 0
      
      if (distance < accumulated + topLength) {
        const local = distance - accumulated
        return { 
          x: -halfW + cornerRadii.topLeft + local, 
          z: -halfH 
        }
      }
      accumulated += topLength
      
      if (distance < accumulated + topRightCornerLength) {
        const local = (distance - accumulated) / topRightCornerLength
        const angle = -Math.PI / 2 + local * (Math.PI / 2)
        return { 
          x: halfW - cornerRadii.topRight + cornerRadii.topRight * Math.cos(angle), 
          z: -halfH + cornerRadii.topRight + cornerRadii.topRight * Math.sin(angle) 
        }
      }
      accumulated += topRightCornerLength
      
      if (distance < accumulated + rightLength) {
        const local = distance - accumulated
        return { 
          x: halfW, 
          z: -halfH + cornerRadii.topRight + local 
        }
      }
      accumulated += rightLength
      
      if (distance < accumulated + bottomRightCornerLength) {
        const local = (distance - accumulated) / bottomRightCornerLength
        const angle = 0 + local * (Math.PI / 2)
        return { 
          x: halfW - cornerRadii.bottomRight + cornerRadii.bottomRight * Math.cos(angle), 
          z: halfH - cornerRadii.bottomRight + cornerRadii.bottomRight * Math.sin(angle) 
        }
      }
      accumulated += bottomRightCornerLength
      
      if (distance < accumulated + bottomLength) {
        const local = distance - accumulated
        return { 
          x: halfW - cornerRadii.bottomRight - local, 
          z: halfH 
        }
      }
      accumulated += bottomLength
      
      if (distance < accumulated + bottomLeftCornerLength) {
        const local = (distance - accumulated) / bottomLeftCornerLength
        const angle = Math.PI / 2 + local * (Math.PI / 2)
        return { 
          x: -halfW + cornerRadii.bottomLeft + cornerRadii.bottomLeft * Math.cos(angle), 
          z: halfH - cornerRadii.bottomLeft + cornerRadii.bottomLeft * Math.sin(angle) 
        }
      }
      accumulated += bottomLeftCornerLength
      
      if (distance < accumulated + leftLength) {
        const local = distance - accumulated
        return { 
          x: -halfW, 
          z: halfH - cornerRadii.bottomLeft - local 
        }
      }
      accumulated += leftLength
      
      const local = (distance - accumulated) / topLeftCornerLength
      const angle = Math.PI + local * (Math.PI / 2)
      return { 
        x: -halfW + cornerRadii.topLeft + cornerRadii.topLeft * Math.cos(angle), 
        z: -halfH + cornerRadii.topLeft + cornerRadii.topLeft * Math.sin(angle) 
      }
    }
    
    const centerR = 0
    const centerS1 = calculateSagitta(centerR, r1)
    const centerS2 = calculateSagitta(centerR, r2)
    positions.push(0, -centerS1, 0)
    positions.push(0, -centerThickness - centerS2, 0)
    
    for (let ring = 1; ring <= radialRings; ring++) {
      const ringRatio = ring / radialRings
      
      for (let i = 0; i < boundaryPoints; i++) {
        const t = i / boundaryPoints
        const boundaryPt = getRoundedRectPoint(t)
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
    
    for (let i = 0; i < boundaryPoints; i++) {
      const next = (i + 1) % boundaryPoints
      const current = 1 + i * 2
      const nextVertex = 1 + next * 2
      indices.push(0, current, nextVertex)
      indices.push(1, nextVertex + 1, current + 1)
    }
    
    for (let ring = 0; ring < radialRings - 1; ring++) {
      const ringStart = 1 + ring * boundaryPoints * 2
      const nextRingStart = 1 + (ring + 1) * boundaryPoints * 2
      
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
    
    const outerRingStart = 1 + (radialRings - 1) * boundaryPoints * 2
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
        color="#4a90e2"
        transparent={true}
        opacity={0.85}
        roughness={0.05}
        metalness={0.1}
        transmission={0.9}
        thickness={0.5}
        ior={1.5}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        envMapIntensity={1.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function LensModel({ params, controlsRef }) {
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
  
  return (
    <group ref={groupRef}>
      {showBoth ? (
        <>
          <group position={[-params.rightDiameter * 1.1, rightYOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={rightThickness.center}
              edgeThickness={rightThickness.edge}
              diameter={params.rightDiameter}
              prescription={params.rightPrescription}
              index={params.rightIndex}
              shape={lensShape}
            />
          </group>
          
          <group position={[params.leftDiameter * 1.1, leftYOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={leftThickness.center}
              edgeThickness={leftThickness.edge}
              diameter={params.leftDiameter}
              prescription={params.leftPrescription}
              index={params.leftIndex}
              shape={lensShape}
            />
          </group>
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
          />
        </group>
      )}
    </group>
  )
}

function LensSimulatorRounded({ params }) {
  const [controlMode] = React.useState('rotate')
  const [showGrid] = React.useState(false)
  const controlsRef = useRef(null)
  
  return (
    <div className="lens-simulator">
      <Canvas 
        shadows 
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          precision: "highp",
          stencil: false,
          depth: true,
          useLegacyLights: false
        }}
        dpr={[1, 2]}
      >
        <perspectiveCamera
          makeDefault
          position={[0, 0, 120]}
          fov={50}
        />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 30, 20]} 
          intensity={1.5}
        />
        <directionalLight position={[-20, 20, -20]} intensity={0.8} />
        <pointLight position={[0, 50, 0]} intensity={0.5} />
        
        <Environment preset="city" />
        
        {showGrid && (
          <Grid 
            args={[100, 100]} 
            cellColor="#333333" 
            sectionColor="#222222"
            fadeDistance={60}
            fadeStrength={1.5}
          />
        )}
        
        <axesHelper args={[30]} />
        
        <LensModel params={params} controlsRef={controlsRef} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={controlMode === 'pan' || controlMode === 'both'}
          enableZoom={true}
          enableRotate={controlMode === 'rotate' || controlMode === 'both'}
          minDistance={100}
          maxDistance={300}
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
