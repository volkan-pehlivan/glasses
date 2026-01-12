import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, Grid } from '@react-three/drei'
import * as THREE from 'three'
import './LensSimulator.css'

function LensGeometry({ params }) {
  const meshRef = useRef()
  
  const { geometry, centerThickness, edgeThickness, maxEdgeThickness } = useMemo(() => {
    const { diameter, prescription, index, baseCurve, edgeThickness: minEdge, viewMode } = params
    
    const radius = diameter / 2
    const segments = 64
    
    // Daha doğru kalınlık hesaplaması
    // Base curve'den sagitta (eğrilik yüksekliği)
    const baseCurveRadius = 1000 / baseCurve // mm cinsinden base curve yarıçapı
    const sagitta = baseCurveRadius - Math.sqrt(baseCurveRadius * baseCurveRadius - radius * radius)
    
    // Prescription'dan kaynaklanan ek kalınlık
    const prescriptionFactor = Math.abs(prescription) * radius * (index - 1) / index
    
    let centerT, edgeT
    
    if (prescription < 0) {
      // Miyop lens - kenarlar kalın
      centerT = minEdge + sagitta
      edgeT = centerT + prescriptionFactor
    } else if (prescription > 0) {
      // Hipermetrop lens - merkez kalın
      centerT = minEdge + sagitta + prescriptionFactor
      edgeT = minEdge + sagitta
    } else {
      // Plano lens
      centerT = minEdge + sagitta
      edgeT = centerT
    }
    
    const centerThickness = Math.max(minEdge, centerT)
    const maxEdgeThickness = Math.max(minEdge, edgeT)
    
    let geometry
    
    if (viewMode === 'side') {
      // Yandan görünüm - kalınlığı göster
      const shape = new THREE.Shape()
      const width = diameter
      const points = 100 // Profil çizimi için nokta sayısı (daha yumuşak eğri için artırıldı)
      
      // Lens yüzey profilini oluştur (spherical surface yaklaşımı)
      const profilePoints = []
      
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width
        const distanceFromCenter = Math.abs(x - width / 2)
        const normalizedDistance = distanceFromCenter / radius // 0 (merkez) ile 1 (kenar) arası
        
        // Spherical surface kalınlığı hesapla (sagitta formülü kullanarak)
        let thickness
        if (prescription < 0) {
          // Miyop (negatif): kenarlar kalın, merkez ince
          // Lens eğrisi: merkezde minimum, kenarlarda maksimum
          const curveFactor = 1 - (normalizedDistance * normalizedDistance) // Parabolik eğri
          thickness = centerThickness + prescriptionFactor * curveFactor
        } else if (prescription > 0) {
          // Hipermetrop (pozitif): merkez kalın, kenarlar ince
          // Lens eğrisi: merkezde maksimum, kenarlarda minimum
          const curveFactor = normalizedDistance * normalizedDistance // Parabolik eğri (ters)
          thickness = centerThickness - prescriptionFactor * curveFactor
        } else {
          // Plano: sadece base curve eğrisi var
          const localRadius = Math.sqrt(radius * radius - (distanceFromCenter * distanceFromCenter))
          const localSagitta = baseCurveRadius > 0 
            ? baseCurveRadius - Math.sqrt(baseCurveRadius * baseCurveRadius - localRadius * localRadius)
            : 0
          thickness = minEdge + localSagitta
        }
        
        // Minimum kalınlık kontrolü
        thickness = Math.max(thickness, minEdge)
        
        profilePoints.push([x, thickness])
      }
      
      // Shape'e noktaları ekle
      if (profilePoints.length > 0) {
        shape.moveTo(profilePoints[0][0], profilePoints[0][1])
        for (let i = 1; i < profilePoints.length; i++) {
          shape.lineTo(profilePoints[i][0], profilePoints[i][1])
        }
      }
      
      // Alt yüzeyi tamamla (düz alt yüzey)
      shape.lineTo(width, 0)
      shape.lineTo(0, 0)
      shape.closePath()
      
      const extrudeSettings = {
        steps: 1,
        depth: 20,
        bevelEnabled: false
      }
      
      geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometry.rotateX(-Math.PI / 2)
      geometry.translate(-width / 2, 0, -10)
    } else {
      // Üstten görünüm - şekli göster (yuvarlak)
      geometry = new THREE.CylinderGeometry(radius, radius, centerThickness, segments)
    }
    
    return { geometry, centerThickness, edgeThickness: minEdge, maxEdgeThickness }
  }, [params])
  
  useFrame(() => {
    if (meshRef.current) {
      // Hafif döndürme animasyonu (opsiyonel)
      // meshRef.current.rotation.y += 0.005
    }
  })
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#4a90e2"
        transparent
        opacity={0.8}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  )
}

function MeasurementLines({ params, thickness }) {
  const { diameter, prescription, viewMode } = params
  
  if (viewMode !== 'side') return null
  
  const lineLength = 8
  const offset = diameter / 2 + 5
  
  // Merkez kalınlık çizgisi (kırmızı)
  const centerThicknessY = prescription < 0 ? thickness.center : thickness.center
  const edgeThicknessY = prescription < 0 ? thickness.maxEdge : thickness.min
  
  return (
    <>
      {/* Merkez kalınlık ölçümü */}
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                0, centerThicknessY, 0,
                0, 0, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="red" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -2, centerThicknessY, 0,
                2, centerThicknessY, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="red" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -2, 0, 0,
                2, 0, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="red" linewidth={2} />
        </line>
        <Text
          position={[offset, centerThicknessY / 2, 0]}
          fontSize={2.5}
          color="red"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#ffffff"
        >
          {thickness.center.toFixed(2)} mm (Merkez)
        </Text>
      </group>
      
      {/* Kenar kalınlık ölçümü */}
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -diameter / 2, edgeThicknessY, 0,
                -diameter / 2, 0, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="orange" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -diameter / 2 - 2, edgeThicknessY, 0,
                -diameter / 2 + 2, edgeThicknessY, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="orange" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -diameter / 2 - 2, 0, 0,
                -diameter / 2 + 2, 0, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="orange" linewidth={2} />
        </line>
        <Text
          position={[-offset, edgeThicknessY / 2, 0]}
          fontSize={2.5}
          color="orange"
          anchorX="right"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#ffffff"
        >
          {(prescription < 0 ? thickness.maxEdge : thickness.min).toFixed(2)} mm (Kenar)
        </Text>
      </group>
      
      {/* Lens genişliği ölçümü */}
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -diameter / 2, -3, 0,
                diameter / 2, -3, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="blue" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -diameter / 2, -3 - 2, 0,
                -diameter / 2, -3 + 2, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="blue" linewidth={2} />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                diameter / 2, -3 - 2, 0,
                diameter / 2, -3 + 2, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="blue" linewidth={2} />
        </line>
        <Text
          position={[0, -8, 0]}
          fontSize={2.5}
          color="blue"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.1}
          outlineColor="#ffffff"
        >
          {diameter} mm (Çap)
        </Text>
      </group>
    </>
  )
}

function LensSimulator({ params }) {
  const calculateThickness = () => {
    const { diameter, prescription, index, baseCurve, edgeThickness } = params
    const radius = diameter / 2
    
    // Base curve'den sagitta hesapla
    const baseCurveRadius = 1000 / baseCurve // mm
    const sagitta = baseCurveRadius - Math.sqrt(baseCurveRadius * baseCurveRadius - radius * radius)
    
    // Prescription faktörü
    const prescriptionFactor = Math.abs(prescription) * radius * (index - 1) / index
    
    let centerT, edgeT, maxEdgeT
    
    if (prescription < 0) {
      // Miyop - kenarlar kalın
      centerT = edgeThickness + sagitta
      edgeT = centerT + prescriptionFactor
      maxEdgeT = edgeT
    } else if (prescription > 0) {
      // Hipermetrop - merkez kalın
      centerT = edgeThickness + sagitta + prescriptionFactor
      edgeT = edgeThickness + sagitta
      maxEdgeT = centerT
    } else {
      // Plano
      centerT = edgeThickness + sagitta
      edgeT = centerT
      maxEdgeT = centerT
    }
    
    return {
      center: Math.max(edgeThickness, centerT),
      edge: Math.max(edgeThickness, edgeT),
      maxEdge: Math.max(edgeThickness, maxEdgeT),
      min: edgeThickness
    }
  }
  
  const thickness = calculateThickness()
  
  // Kamera pozisyonunu görünüm moduna göre ayarla
  const cameraPosition = params.viewMode === 'side' 
    ? [0, 15, 40]
    : [0, 0, 50]
  
  return (
    <div className="lens-simulator">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
        
        {/* Işıklandırma */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Grid ve eksenler */}
        <Grid args={[50, 50]} cellColor="#cccccc" sectionColor="#888888" />
        <axesHelper args={[20]} />
        
        {/* Lens geometrisi */}
        <LensGeometry params={params} />
        
        {/* Ölçüm çizgileri */}
        <MeasurementLines params={params} thickness={thickness} />
        
        {/* Kontroller */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={100}
        />
      </Canvas>
      
      <div className="view-info">
        <div className="view-badge">
          {params.viewMode === 'side' ? '👁️ Yandan Görünüm' : '🔍 Üstten Görünüm'}
        </div>
        <div className="scale-info">
          <strong>Ölçek:</strong> 1:1 (Birebir ölçek - mm cinsinden)
        </div>
      </div>
    </div>
  )
}

export default LensSimulator
