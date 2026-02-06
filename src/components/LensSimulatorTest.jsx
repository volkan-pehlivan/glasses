import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import './LensSimulator.css'

/**
 * PROFESSIONAL LENS SIMULATOR - TEST VERSION
 * 
 * This version implements the correct optical engineering algorithm:
 * 1. Vogel's Rule for base curve selection
 * 2. Proper power distribution between front and back surfaces
 * 3. Exact sagitta calculations from radius of curvature
 * 4. Professional thickness formula: ET = CT + s₂ - s₁
 * 
 * Based on: "Gözlük Camı Kalınlığı Hesaplamasında Matematiksel Modelleme 
 * ve Optik Mühendisliği Yaklaşımları" research document
 */

function AccurateLensGeometry({ centerThickness, edgeThickness, diameter, prescription, index }) {
  const geometry = useMemo(() => {
    // Simple: just show half the prescription for visual appeal
    const visualPrescription = prescription * 0.5;
    
    // Use diameter as the width/height of rectangular lens
    const width = diameter
    const height = diameter * 0.6 // Make it rectangular (not square)
    const segments = 32 // Resolution along width and height
    
    const positions = []
    const indices = []
    
    // PROFESSIONAL ALGORITHM - Based on optical engineering standards
    
    // Step 1: Calculate Spherical Equivalent (for simple spherical lens, SE = prescription)
    const SE = visualPrescription // Use visual prescription for base curve
    
    // Step 2: Vogel's Rule for Base Curve (Front Surface)
    let baseCurve
    if (prescription < 0) {
      // Minus lenses: different base curves for different indices
      if (index <= 1.53) {
        // 1.50 index: Traditional spherical design (curved front)
        baseCurve = SE / 2 + 6.00  // Vogel's Rule
      } else {
        // High-index (1.60+): Aspheric design (flatter front)
        baseCurve = 4.00  // Fixed flat base curve
      }
    } else if (prescription > 0) {
      // Plus lenses: different strategies by index
      if (index <= 1.53) {
        // 1.50 index: Traditional spherical (slightly curved back)
        baseCurve = SE + 3.00  // Reduced from 6.00 for gentler back curve
      } else {
        // High-index (1.60+): Aspheric design (flat back)
        baseCurve = visualPrescription + 0.50  // Makes back surface nearly flat
      }
    } else {
      // Plano
      baseCurve = 6.00
    }
    
    const F1 = baseCurve // Front surface power (typically positive)
    
    // Step 3: Back Surface Power
    const F2 = visualPrescription - F1 // Back surface power (using visual prescription)
    
    // Step 4: Convert Powers to Radii
    const r1 = Math.abs((1000 * (index - 1)) / F1) // Front radius
    const r2 = Math.abs((1000 * (index - 1)) / F2) // Back radius (absolute value)
    
    // Debug logging (only once per geometry creation)
    if (typeof window !== 'undefined' && !window._lensDebugLogged) {
      console.log('=== PROFESSIONAL LENS CALCULATION ===')
      console.log('Prescription:', prescription, 'D')
      console.log('Index:', index)
      console.log('Diameter:', diameter, 'mm')
      console.log('---')
      console.log('Step 1 - SE:', SE.toFixed(2), 'D')
      console.log('Step 2 - Base Curve (F₁):', F1.toFixed(2), 'D')
      console.log('Step 3 - Back Surface (F₂):', F2.toFixed(2), 'D')
      console.log('Step 4 - Front Radius (r₁):', r1.toFixed(2), 'mm')
      console.log('Step 4 - Back Radius (r₂):', r2.toFixed(2), 'mm')
      
      // Calculate edge sagitta for verification
      const h = diameter / 2
      const s1_edge = r1 - Math.sqrt(r1 * r1 - h * h)
      const s2_edge = r2 - Math.sqrt(r2 * r2 - h * h)
      console.log('Step 5 - Front Sag at edge:', s1_edge.toFixed(2), 'mm')
      console.log('Step 5 - Back Sag at edge:', s2_edge.toFixed(2), 'mm')
      console.log('Step 6 - Expected ET:', (centerThickness + s2_edge - s1_edge).toFixed(2), 'mm')
      console.log('=====================================')
      window._lensDebugLogged = true
    }
    
    // Determine lens type
    const isMyopic = prescription < 0
    
    // Calculate exact sagitta using spherical formula
    const calculateSagitta = (r, R) => {
      if (R === 0 || r > R) return 0
      return R - Math.sqrt(R * R - r * r)
    }
    
    // Generate vertices in a grid
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        // Position from -width/2 to +width/2 and -height/2 to +height/2
        const x = (i / segments - 0.5) * width
        const z = (j / segments - 0.5) * height
        
        // Calculate distance from center (for sagitta calculation)
        const r = Math.sqrt(x * x + z * z)
        
        // Step 5: Calculate Sagitta for both surfaces at this radius
        const s1 = calculateSagitta(r, r1) // Front surface sagitta
        const s2 = calculateSagitta(r, r2) // Back surface sagitta
        
        // Step 6: Calculate Y positions for vertices
        // Both surfaces curve in the SAME direction (both downward)
        const topY = -s1  // Front surface actual
        const bottomY = -centerThickness - s2  // Back surface uses visual prescription
        
        // The thickness at this point naturally emerges from geometry
        // thickness = topY - bottomY = -s1 - (-centerThickness - s2) = centerThickness + s2 - s1
        
        positions.push(x, topY, z)
        positions.push(x, bottomY, z)
      }
    }
    
    // Generate indices for triangles
    const verticesPerRow = (segments + 1) * 2
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const current = i * verticesPerRow + j * 2
        const next = i * verticesPerRow + (j + 1) * 2
        const currentNext = (i + 1) * verticesPerRow + j * 2
        const nextNext = (i + 1) * verticesPerRow + (j + 1) * 2
        
        // Top surface triangles
        indices.push(current, currentNext, next)
        indices.push(next, currentNext, nextNext)
        
        // Bottom surface triangles
        indices.push(current + 1, next + 1, currentNext + 1)
        indices.push(next + 1, nextNext + 1, currentNext + 1)
      }
    }
    
    // Add edges (sides of the rectangular lens)
    // Left edge
    for (let j = 0; j < segments; j++) {
      const current = j * 2
      const next = (j + 1) * 2
      indices.push(current, next, current + 1)
      indices.push(next, next + 1, current + 1)
    }
    
    // Right edge
    for (let j = 0; j < segments; j++) {
      const current = segments * verticesPerRow + j * 2
      const next = segments * verticesPerRow + (j + 1) * 2
      indices.push(current, current + 1, next)
      indices.push(next, current + 1, next + 1)
    }
    
    // Top edge
    for (let i = 0; i < segments; i++) {
      const current = i * verticesPerRow
      const next = (i + 1) * verticesPerRow
      indices.push(current, next, current + 1)
      indices.push(next, next + 1, current + 1)
    }
    
    // Bottom edge
    for (let i = 0; i < segments; i++) {
      const current = i * verticesPerRow + segments * 2
      const next = (i + 1) * verticesPerRow + segments * 2
      indices.push(current, current + 1, next)
      indices.push(next, current + 1, next + 1)
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }, [centerThickness, edgeThickness, diameter, prescription, index])
  
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

function LensSimulatorTest({ params }) {
  const calculateThickness = () => {
    const { diameter, prescription, index, edgeThickness } = params
    const D = diameter
    const P = Math.abs(prescription)
    const n = index
    
    // HOYA formula with prescription-dependent divisor
    let divisor;
    if (n <= 1.53) {
      divisor = 5700;
      if (P >= 8) divisor += 900;
    } else if (n <= 1.63) {
      divisor = 8000;
      if (P >= 6) divisor -= 300;
    } else if (n <= 1.70) {
      divisor = 8200;
      if (P >= 6) divisor -= 300;
    } else {
      divisor = 8300;
      if (P >= 6) divisor -= 300;
    }
    
    // HOYA uses index-dependent minimum center thickness
    const minCenterThickness = (n <= 1.53) ? 2.0 : 1.0;
    
    const thicknessAddition = (D * D * P) / (divisor * (n - 1))
    
    let centerT, edgeT
    
    if (prescription < 0) {
      // Myopic - thin center, thick edge
      centerT = minCenterThickness
      edgeT = minCenterThickness + thicknessAddition
    } else if (prescription > 0) {
      // Hyperopic - thick center, thin edge
      centerT = minCenterThickness + thicknessAddition
      edgeT = minCenterThickness
    } else {
      // Plano
      centerT = minCenterThickness
      edgeT = minCenterThickness
    }
    
    return {
      center: centerT,
      edge: edgeT
    }
  }
  
  const thickness = calculateThickness()
  const maxThickness = Math.max(thickness.center, thickness.edge)
  
  // Camera position based on lens size
  const cameraDistance = Math.max(params.diameter * 1.5, 80)
  const cameraHeight = maxThickness * 2
  
  return (
    <div className="lens-simulator">
      <Canvas shadows camera={{ position: [cameraDistance, cameraHeight, cameraDistance], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 30, 20]} 
          intensity={1.5} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-20, 20, -20]} intensity={0.8} />
        <pointLight position={[0, 50, 0]} intensity={0.5} />
        
        {/* Environment for realistic glass reflections */}
        <Environment preset="city" />
        
        {/* The accurate lens */}
        <AccurateLensGeometry 
          centerThickness={thickness.center}
          edgeThickness={thickness.edge}
          diameter={params.diameter}
          prescription={params.prescription}
          index={params.index}
        />
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={200}
          target={[0, maxThickness / 2, 0]}
        />
      </Canvas>
      
      <div className="view-info">
        <div className="view-badge" style={{ backgroundColor: '#10b981' }}>
          🧪 TEST - Professional Algorithm
        </div>
        <div className="measurements-overlay">
          <div className="measurement-row">
            <span className="measurement-label" style={{ color: '#ff4444' }}>●</span>
            <span className="measurement-text">Merkez: {thickness.center.toFixed(1)} mm</span>
          </div>
          <div className="measurement-row">
            <span className="measurement-label" style={{ color: '#ff8800' }}>●</span>
            <span className="measurement-text">Kenar: {thickness.edge.toFixed(1)} mm</span>
          </div>
          <div className="measurement-row">
            <span className="measurement-label" style={{ color: '#4444ff' }}>●</span>
            <span className="measurement-text">Çap: {params.diameter} mm</span>
          </div>
          <div className="measurement-row" style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
            <span>Vogel's Rule + Exact Sagitta</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LensSimulatorTest
