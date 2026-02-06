import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, useGLTF, Environment, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
import './GLBLensViewer.css'

// Lens Geometry Component
function AccurateLensGeometry({ centerThickness, edgeThickness, diameter, prescription, index }) {
  const geometry = useMemo(() => {
    // Simple: just show half the prescription for visual appeal
    const visualPrescription = prescription * 0.5;
    
    const width = diameter * 1.4
    const height = diameter * 0.9
    
    const minDim = Math.min(width, height)
    const cornerRadii = {
      topLeft: minDim * 0.05,
      topRight: minDim * 0.05,
      bottomRight: minDim * 0.45,
      bottomLeft: minDim * 0.45
    }
    
    const radialRings = 50
    const boundaryPoints = 120
    
    const positions = []
    const indices = []
    
    const SE = visualPrescription
    
    let baseCurve
    if (prescription < 0) {
      // Minus lenses: different base curves for different indices
      if (index <= 1.53) {
        // 1.50 index: Traditional spherical design (curved front)
        baseCurve = SE / 2 + 6.00  // Vogel's Rule
      } else {
        // High-index (1.60+): Aspheric design (flatter front)
        baseCurve = 4.00  // Fixed flat base curve for modern look
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
    
    const F1 = baseCurve
    const F2 = visualPrescription - F1  // Use visual prescription for back surface
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
        return { x: -halfW + cornerRadii.topLeft + local, z: -halfH }
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
        return { x: halfW, z: -halfH + cornerRadii.topRight + local }
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
        return { x: halfW - cornerRadii.bottomRight - local, z: halfH }
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
        return { x: -halfW, z: halfH - cornerRadii.bottomLeft - local }
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
    const centerS1 = calculateSagitta(centerR, r1)  // Front surface actual
    const centerS2 = calculateSagitta(centerR, r2)  // Back surface uses visual prescription
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
        const s1 = calculateSagitta(r, r1)  // Front surface actual
        const s2 = calculateSagitta(r, r2)  // Back surface uses visual prescription
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

// Custom Lens Model Component
function CustomLensModel({ lensParams, controlsRef, cameraView = 'side' }) {
  const groupRef = useRef(null)
  const { camera } = useThree()
  
  // Simple camera positioning for custom lens
  useEffect(() => {
    if (!camera || !controlsRef.current) return
    
    const distance = 100
    let cameraPosition
    let targetPosition = new THREE.Vector3(0, 0, 0)
    
    switch (cameraView) {
      case 'front':
        cameraPosition = new THREE.Vector3(0, 0, distance)
        break
      case 'side':
        cameraPosition = new THREE.Vector3(distance, 0, 0)
        break
      case 'top':
        cameraPosition = new THREE.Vector3(0, distance, 0)
        camera.rotation.set(-Math.PI / 2, 0, Math.PI)
        break
      case 'center':
        cameraPosition = new THREE.Vector3(distance * 0.7, distance * 0.7, distance * 0.7)
        camera.rotation.set(0, 0, 0)
        break
      default:
        cameraPosition = new THREE.Vector3(distance, 0, 0)
        camera.rotation.set(0, 0, 0)
    }
    
    camera.position.copy(cameraPosition)
    controlsRef.current.target.copy(targetPosition)
    
    if (cameraView !== 'top') {
      camera.lookAt(targetPosition)
    }
    
    controlsRef.current.update()
  }, [cameraView, camera, controlsRef])
  
  const calculateThickness = (prescription, index, diameter) => {
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
      centerT = minCenterThickness
      edgeT = centerT + thicknessAddition
    } else if (prescription > 0) {
      centerT = minCenterThickness + thicknessAddition
      edgeT = minCenterThickness
    } else {
      centerT = minCenterThickness
      edgeT = minCenterThickness
    }
    
    return {
      center: centerT,
      edge: edgeT
    }
  }
  
  const showBoth = lensParams.showBoth
  const rightThickness = showBoth ? calculateThickness(lensParams.rightPrescription, lensParams.rightIndex, lensParams.rightDiameter) : calculateThickness(lensParams.rightPrescription, lensParams.rightIndex, lensParams.rightDiameter)
  const leftThickness = showBoth ? calculateThickness(lensParams.leftPrescription, lensParams.leftIndex, lensParams.leftDiameter) : rightThickness
  
  const rightMaxThickness = Math.max(rightThickness.center, rightThickness.edge)
  const leftMaxThickness = Math.max(leftThickness.center, leftThickness.edge)
  const rightYOffset = showBoth ? rightMaxThickness / 2 : 0
  const leftYOffset = showBoth ? leftMaxThickness / 2 : 0
  
  return (
    <group ref={groupRef}>
      {showBoth ? (
        <>
          <group position={[-lensParams.rightDiameter * 1.1, rightYOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={rightThickness.center}
              edgeThickness={rightThickness.edge}
              diameter={lensParams.rightDiameter}
              prescription={lensParams.rightPrescription}
              index={lensParams.rightIndex}
            />
          </group>
          
          <group position={[lensParams.leftDiameter * 1.1, leftYOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <AccurateLensGeometry 
              centerThickness={leftThickness.center}
              edgeThickness={leftThickness.edge}
              diameter={lensParams.leftDiameter}
              prescription={lensParams.leftPrescription}
              index={lensParams.leftIndex}
            />
          </group>
        </>
      ) : (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <AccurateLensGeometry 
            centerThickness={rightThickness.center}
            edgeThickness={rightThickness.edge}
            diameter={lensParams.rightDiameter}
            prescription={lensParams.rightPrescription}
            index={lensParams.rightIndex}
          />
        </group>
      )}
    </group>
  )
}

function Model({ url, scale: externalScale = 1, animations: modelAnimations = [], currentAnimation = null, morphTargetValues = {}, selectedMorphTarget = null, morphTarget2Value = -2, cameraView = 'side', controlMode = 'rotate', cameraRef, controlsRef, onAnimationsDetected }) {
  const { scene, animations: detectedAnimations } = useGLTF(url)
  const groupRef = useRef(null)
  const baseScaleRef = useRef(1)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const morphTargetsRef = useRef([])
  
  // Environment map'i al
  const envMap = useEnvironment({ preset: 'city' })
  
  // Animasyonları parent'a bildir
  useEffect(() => {
    console.log('🔍 Animasyon Tespiti:', {
      detectedAnimations: detectedAnimations,
      animasyonSayısı: detectedAnimations?.length || 0,
      onAnimationsDetected: !!onAnimationsDetected
    })
    
    if (detectedAnimations) {
      if (detectedAnimations.length > 0) {
        console.log('✅ Animasyonlar bulundu!')
        if (onAnimationsDetected) {
          onAnimationsDetected(detectedAnimations, false)
        }
      } else {
        console.log('❌ Modelde animasyon yok (animations array boş)')
        if (onAnimationsDetected) {
          onAnimationsDetected([], false)
        }
      }
    } else {
      console.log('⚠️ Animasyon verisi henüz yüklenmedi')
    }
  }, [detectedAnimations, onAnimationsDetected])
  
  // Material helper fonksiyonu - Cam material
  const applyGlassMaterial = (object, envMapTexture) => {
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        // Geometry normal'lerini düzelt ve smooth shading için hesapla
        if (child.geometry) {
          const geometry = child.geometry
          
          // Eğer normal'ler yoksa veya bozuksa yeniden hesapla
          if (!geometry.attributes.normal || geometry.attributes.normal.count === 0) {
            console.log('⚠️ Normal bulunamadı, yeniden hesaplanıyor:', child.name || 'Unnamed')
            geometry.computeVertexNormals()
          }
          
          // Normal'leri normalize et (smooth shading için önemli)
          if (geometry.attributes.normal) {
            geometry.attributes.normal.needsUpdate = true
            geometry.normalizeNormals()
          }
          
          // Tangent'leri hesapla (daha iyi lighting için)
          if (!geometry.attributes.tangent) {
            try {
              geometry.computeTangents()
            } catch (e) {
              console.log('Tangent hesaplanamadı (normal):', e.message)
            }
          }
          
          // Geometry'yi güncelle
          geometry.computeBoundingBox()
          geometry.computeBoundingSphere()
          
          // Geometry'nin güncellenmesi gerektiğini işaretle
          geometry.attributes.position.needsUpdate = true
          if (geometry.attributes.normal) {
            geometry.attributes.normal.needsUpdate = true
          }
          if (geometry.attributes.uv) {
            geometry.attributes.uv.needsUpdate = true
          }
        }
        
        // Gerçekçi cam material - linkteki örneğe göre
        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff, // Beyaz
          transparent: true,
          opacity: 1.0, // Transmission kullanıldığı için opacity 1
          roughness: 0.0, // Çok düşük pürüzlülük (parlak cam)
          metalness: 0.0, // Metal değil
          side: THREE.DoubleSide, // İki taraflı
          flatShading: false, // Smooth shading
          
          // Gerçekçi cam özellikleri
          transmission: 1.0, // Maksimum ışık geçirgenliği
          thickness: 3.0, // Cam kalınlığı
          ior: 1.5, // Index of refraction (gerçek cam için standart)
          clearcoat: 1.0, // Yüksek şeffaf kaplama
          clearcoatRoughness: 0.0, // Pürüzsüz clearcoat
          envMap: envMapTexture, // Environment map'i manuel olarak ekle
          envMapIntensity: 1.0, // Environment map yoğunluğu (daha dengeli)
          
          // Rendering kalitesi
          precision: 'highp'
        })
        
        // Environment map yoksa bile material'i güncelle
        if (envMapTexture) {
          glassMaterial.needsUpdate = true
        }
        
        child.material = glassMaterial
        child.castShadow = false
        child.receiveShadow = false
      }
    })
  }
  
  // Front model oluştur ve morph targets'ları tespit et
  const frontModel = useMemo(() => {
    if (!scene) return null
    const model = scene.clone()
    applyGlassMaterial(model, envMap)
    
    // Morph targets'ları tespit et
    const morphTargets = []
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry
        
        console.log(`🔍 Mesh kontrol ediliyor: ${child.name || 'Unnamed'}`, {
          hasMorphAttributes: !!geometry.morphAttributes,
          morphAttributesKeys: geometry.morphAttributes ? Object.keys(geometry.morphAttributes) : [],
          hasMorphTargets: !!geometry.morphTargets,
          morphTargetsLength: geometry.morphTargets?.length || 0,
          morphTargetNames: geometry.morphTargetNames,
          morphTargetNamesLength: geometry.morphTargetNames?.length || 0
        })
        
        // Morph targets kontrolü (yeni format - morphAttributes)
        if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).length > 0) {
          // Position morph attributes'ını kontrol et (ana morph target'lar burada)
          const positionMorphs = geometry.morphAttributes.position
          
          if (positionMorphs && Array.isArray(positionMorphs) && positionMorphs.length > 0) {
            // morphTargetInfluences array'ini doğru boyutta başlat
            // Morph target sayısı position morph attributes array'inin uzunluğuna eşit olmalı
            const morphCount = positionMorphs.length
            
            // Eğer morphTargetInfluences yoksa veya yanlış boyuttaysa, yeniden oluştur
            if (!child.morphTargetInfluences || child.morphTargetInfluences.length !== morphCount) {
              child.morphTargetInfluences = new Array(morphCount).fill(0)
              console.log(`✅ morphTargetInfluences array'i başlatıldı: ${morphCount} eleman`)
            }
            
            // Morph target'ları tespit et - morphTargetNames varsa kullan
            positionMorphs.forEach((targetBuffer, index) => {
              // Morph target ismi için önce morphTargetNames array'ini kontrol et
              let targetName
              if (geometry.morphTargetNames && geometry.morphTargetNames.length > index) {
                targetName = geometry.morphTargetNames[index]
              } else {
                // İsim yoksa otomatik isim oluştur
                targetName = `MorphTarget_${index}`
              }
              
              // Her morph target için bir entry ekle (sadece bir kez)
              if (!morphTargets.find(m => m.targetName === targetName && m.meshName === (child.name || 'Unnamed'))) {
                morphTargets.push({
                  meshName: child.name || 'Unnamed',
                  attributeName: 'position',
                  targetIndex: index, // Doğru index - position array'indeki sıra
                  targetName,
                  mesh: child
                })
              }
            })
            
            console.log(`✅ ${morphCount} morph target tespit edildi`, {
              morphTargetNames: geometry.morphTargetNames,
              influencesLength: child.morphTargetInfluences.length
            })
          }
        }
        
        // Eski format kontrolü (morphTargets array - Three.js r125+ için)
        else if (geometry.morphTargets && geometry.morphTargets.length > 0) {
          const morphCount = geometry.morphTargets.length
          
          // morphTargetInfluences array'ini başlat
          if (!child.morphTargetInfluences || child.morphTargetInfluences.length !== morphCount) {
            child.morphTargetInfluences = new Array(morphCount).fill(0)
            console.log(`✅ morphTargetInfluences array'i başlatıldı (eski format): ${morphCount} eleman`)
          }
          
          geometry.morphTargets.forEach((target, index) => {
            const targetName = (geometry.morphTargetNames && geometry.morphTargetNames[index]) 
              || `MorphTarget_${index}`
            
            morphTargets.push({
              meshName: child.name || 'Unnamed',
              attributeName: 'position',
              targetIndex: index,
              targetName,
              mesh: child
            })
          })
        }
      }
    })
    
    morphTargetsRef.current = morphTargets
    
    if (morphTargets.length > 0 && onAnimationsDetected) {
      console.log('🎭 Morph Targets (Shape Keys) bulundu:', morphTargets.length)
      // Morph targets'ları parent'a bildir
      onAnimationsDetected(morphTargets, true) // true = morph targets
    } else {
      console.log('🔍 Morph targets kontrolü yapıldı, bulunamadı')
      if (onAnimationsDetected) {
        // Boş array gönder, böylece callback çağrıldı ama bulunamadı bilgisi verilir
        onAnimationsDetected([], true)
      }
    }
    
    return model
  }, [scene, onAnimationsDetected, envMap])
  
  // Morph target değerlerini uygula
  useEffect(() => {
    if (!frontModel || morphTargetsRef.current.length === 0) return
    
    // Front model'deki tüm mesh'leri bul ve morph target'ları uygula
    frontModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Bu mesh için ilgili morph target'ları bul
        const meshMorphTargets = morphTargetsRef.current.filter(
          mt => mt.meshName === (child.name || 'Unnamed') || mt.mesh === child
        )
        
        // Morph target influences array'inin doğru boyutta olduğundan emin ol
        const geometry = child.geometry
        const positionMorphs = geometry.morphAttributes?.position
        
        if (positionMorphs && Array.isArray(positionMorphs)) {
          const morphCount = positionMorphs.length
          
          // morphTargetInfluences array'ini doğru boyutta başlat
          if (!child.morphTargetInfluences || child.morphTargetInfluences.length !== morphCount) {
            child.morphTargetInfluences = new Array(morphCount).fill(0)
          }
          
          // Sadece morph target 2'ye değer uygula, diğerlerine dokunma
          if (selectedMorphTarget) {
            meshMorphTargets.forEach((morphTarget) => {
              const { targetIndex, targetName } = morphTarget
              
              // Sadece seçili morph target 2'ye değer uygula
              if (selectedMorphTarget === targetName) {
                // -2 ile -8 arası değeri 0-1 arasına normalize et
                // -2 → 0, -8 → 1
                const normalized = (-morphTarget2Value - 2) / 6
                const value = Math.max(0, Math.min(1, normalized))
                
                if (targetIndex >= 0 && targetIndex < child.morphTargetInfluences.length) {
                  child.morphTargetInfluences[targetIndex] = value
                }
              }
              // Diğer morph target'lara dokunma (zaten 0 olarak başlatıldı)
            })
          }
          
          // Morph target uygulandıktan sonra normal'leri yeniden hesapla
          // (Vertex pozisyonları değiştiği için normal'ler de değişmeli)
          geometry.computeVertexNormals()
          geometry.attributes.normal.needsUpdate = true
          
        } else if (geometry.morphTargets && geometry.morphTargets.length > 0) {
          // Eski format için
          if (!child.morphTargetInfluences || child.morphTargetInfluences.length !== geometry.morphTargets.length) {
            child.morphTargetInfluences = new Array(geometry.morphTargets.length).fill(0)
          }
          
          // Sadece morph target 2'ye değer uygula, diğerlerine dokunma
          if (selectedMorphTarget) {
            meshMorphTargets.forEach((morphTarget) => {
              const { targetIndex, targetName } = morphTarget
              
              // Sadece seçili morph target 2'ye değer uygula
              if (selectedMorphTarget === targetName) {
                // -2 ile -8 arası değeri 0-1 arasına normalize et
                // -2 → 0, -8 → 1
                const normalized = (-morphTarget2Value - 2) / 6
                const value = Math.max(0, Math.min(1, normalized))
                
                if (targetIndex >= 0 && targetIndex < child.morphTargetInfluences.length) {
                  child.morphTargetInfluences[targetIndex] = value
                }
              }
              // Diğer morph target'lara dokunma (zaten 0 olarak başlatıldı)
            })
          }
          
          // Morph target uygulandıktan sonra normal'leri yeniden hesapla
          geometry.computeVertexNormals()
          geometry.attributes.normal.needsUpdate = true
        } else if (meshMorphTargets.length === 0) {
          // Morph target yoksa bile normal'leri hesapla (genel kalite için)
          if (geometry.attributes.position) {
            geometry.computeVertexNormals()
            if (geometry.attributes.normal) {
              geometry.attributes.normal.needsUpdate = true
            }
          }
        }
      }
    })
  }, [frontModel, morphTargetValues, selectedMorphTarget, morphTarget2Value])
  
  // Modeli merkeze hizala ve otomatik ölçeklendir
  useEffect(() => {
    if (frontModel && baseScaleRef.current === 1) {
      // Bounding box hesapla
      const box = new THREE.Box3().setFromObject(frontModel)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      // Merkeze taşı ve biraz yukarı kaydır
      frontModel.position.sub(center)
      frontModel.position.y += size.y * 0.3 // Modeli biraz yukarı kaydır
      
      // Modeli büyüt - maksimum boyuta göre ölçeklendir
      const maxDim = Math.max(size.x, size.y, size.z)
      
      // Modelin boyutuna göre otomatik ölçeklendirme yap
      let autoScale = 1
      
      if (maxDim < 0.1) {
        autoScale = 100
      } else if (maxDim < 1) {
        autoScale = 50
      } else if (maxDim < 5) {
        autoScale = 20
      } else if (maxDim < 20) {
        autoScale = 5
      } else if (maxDim < 50) {
        autoScale = 2
      }
      
      // Temel ölçeği kaydet
      baseScaleRef.current = autoScale
      
      // Debug: boyut bilgilerini konsola yazdır
      console.log('Model boyutu:', size, 'Maks boyut:', maxDim, 'Otomatik ölçek:', autoScale)
    }
    
    // Ölçeklendirme uygula
    if (frontModel && baseScaleRef.current !== 1) {
      const totalScale = baseScaleRef.current * externalScale
      frontModel.scale.set(totalScale, totalScale, totalScale)
    }
  }, [frontModel, externalScale])
  
  // Animasyon mixer'ı oluştur ve yönet
  useEffect(() => {
    if (detectedAnimations && detectedAnimations.length > 0 && frontModel) {
      console.log('🎬 Animation Mixer oluşturuluyor...', {
        animasyonSayısı: detectedAnimations.length,
        frontModel: !!frontModel
      })
      
      // Animation mixer oluştur
      mixerRef.current = new THREE.AnimationMixer(frontModel)
      actionsRef.current = {}
      
      // Tüm animasyonları mixer'a ekle
      detectedAnimations.forEach((clip) => {
        const action = mixerRef.current.clipAction(clip)
        actionsRef.current[clip.name] = action
        console.log(`📹 Action oluşturuldu: "${clip.name}"`, {
          action: action,
          clipDuration: clip.duration,
          tracksCount: clip.tracks.length
        })
      })
      
      console.log('✅ Tüm Actions:', Object.keys(actionsRef.current))
      
      return () => {
        // Cleanup
        if (mixerRef.current) {
          detectedAnimations.forEach((clip) => {
            const action = actionsRef.current[clip.name]
            if (action) {
              action.stop()
              action.reset()
            }
          })
          mixerRef.current = null
        }
        actionsRef.current = {}
      }
    } else {
      console.log('⚠️ Animation Mixer oluşturulamadı:', {
        hasAnimations: !!detectedAnimations,
        animationsLength: detectedAnimations?.length || 0,
        hasFrontModel: !!frontModel
      })
    }
  }, [detectedAnimations, frontModel])
  
  // Seçili animasyonu oynat
  useEffect(() => {
    if (!currentAnimation) {
      console.log('⏸️ Animasyon seçilmedi, tüm animasyonlar durduruldu')
      // Tüm animasyonları durdur
      Object.values(actionsRef.current).forEach((action) => {
        action.stop()
        action.reset()
      })
      return
    }
    
    if (!mixerRef.current) {
      console.log('⚠️ Animation Mixer yok, animasyon oynatılamıyor')
      return
    }
    
    console.log('▶️ Animasyon oynatılıyor:', currentAnimation)
    console.log('📋 Mevcut Actions:', Object.keys(actionsRef.current))
    
    // Tüm animasyonları durdur
    Object.values(actionsRef.current).forEach((action) => {
      action.stop()
      action.reset()
    })
    
    // Seçili animasyonu oynat
    const action = actionsRef.current[currentAnimation]
    if (action) {
      console.log('✅ Action bulundu, oynatılıyor:', action)
      action.reset()
      action.play()
      action.setLoop(THREE.LoopRepeat) // Sürekli tekrar
    } else {
      console.error('❌ Action bulunamadı:', currentAnimation)
      console.log('Mevcut action isimleri:', Object.keys(actionsRef.current))
    }
  }, [currentAnimation])
  
  // Kamera açısını değiştir - sadece cameraView değiştiğinde direkt ayarla
  const { camera } = useThree()
  
  useEffect(() => {
    if (!frontModel || !controlsRef.current || baseScaleRef.current === 1) return
    if (!camera) return
    
    const box = new THREE.Box3().setFromObject(frontModel)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    
    const distance = maxDim * 2.5
    const totalScale = baseScaleRef.current * externalScale
    const scaledDistance = distance * totalScale
    
    let cameraPosition
    let targetPosition
    
    switch (cameraView) {
      case 'front':
        cameraPosition = new THREE.Vector3(0, center.y + size.y * 0.3, scaledDistance)
        targetPosition = new THREE.Vector3(0, center.y + size.y * 0.3, 0)
        break
      case 'side':
        cameraPosition = new THREE.Vector3(scaledDistance, center.y + size.y * 0.3, 0)
        targetPosition = new THREE.Vector3(0, center.y + size.y * 0.3, 0)
        break
      case 'top':
        // TOP view: Y ekseninde yukarıdan bakış
        // Kamera Y ekseninde yukarıda, model merkezine bakıyor
        const modelCenterY = center.y + size.y * 0.3
        // Kamerayı Y ekseninde yukarıda konumlandır
        cameraPosition = new THREE.Vector3(0, scaledDistance + modelCenterY, 0)
        targetPosition = new THREE.Vector3(0, modelCenterY, 0)
        break
      case 'center':
        // Modelin merkezine odaklan
        const modelCenter = new THREE.Vector3(center.x, center.y + size.y * 0.3, center.z)
        cameraPosition = new THREE.Vector3(scaledDistance * 0.7, scaledDistance * 0.7 + modelCenter.y, scaledDistance * 0.7)
        targetPosition = modelCenter.clone()
        // Reset rotation for center view
        camera.rotation.set(0, 0, 0)
        break
      default:
        cameraPosition = new THREE.Vector3(scaledDistance, center.y + size.y * 0.3, 0)
        targetPosition = new THREE.Vector3(0, center.y + size.y * 0.3, 0)
        // Reset rotation for default view
        camera.rotation.set(0, 0, 0)
    }
    
    // Direkt olarak kamera pozisyonunu ayarla - sadece butona basıldığında
    if (camera && controlsRef.current) {
      camera.position.copy(cameraPosition)
      controlsRef.current.target.copy(targetPosition)
      
      // Top view için özel açı ayarı: X: -90°, Y: 0°, Z: 180°
      if (cameraView === 'top') {
        // Top view için kamera rotation'ını direkt set et
        // X: -90° (yukarıdan bakış), Y: 0°, Z: 180° (kare açısı)
        camera.rotation.set(-Math.PI / 2, 0, Math.PI)
        // lookAt kullanma çünkü rotation'ı override eder
      } else {
        // Diğer view'lar için normal lookAt
        camera.lookAt(targetPosition)
      }
      
      controlsRef.current.update()
    }
  }, [cameraView, frontModel, externalScale, camera, controlsRef])
  
  // Animation mixer'ı her frame'de güncelle - kamera kontrolünü etkilemesin
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Top view için ortografik kamera */}
      <TopViewCamera 
        frontModel={frontModel} 
        externalScale={externalScale}
        cameraView={cameraView}
        controlsRef={controlsRef}
      />
      {frontModel && <primitive object={frontModel} />}
    </group>
  )
}

// Top view için ortografik kamera component'i
function TopViewCamera({ frontModel, externalScale, cameraView, controlsRef }) {
  const cameraRef = useRef()
  const orthoSizeRef = useRef(50)
  
  useEffect(() => {
    if (cameraView === 'top' && frontModel && cameraRef.current && cameraRef.current.isOrthographicCamera) {
      // Model boyutuna göre ortografik kamera ayarları
      const box = new THREE.Box3().setFromObject(frontModel)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.z) // Top view için X ve Z eksenleri
      const totalScale = externalScale
      
      // Ortografik kamera boyutunu ayarla (zoom için)
      const orthoSize = (maxDim * totalScale) * 0.8 // Biraz margin
      orthoSizeRef.current = orthoSize
      
      cameraRef.current.left = -orthoSize
      cameraRef.current.right = orthoSize
      cameraRef.current.top = orthoSize
      cameraRef.current.bottom = -orthoSize
      cameraRef.current.near = 0.1
      cameraRef.current.far = 1000
      cameraRef.current.updateProjectionMatrix()
      
      // Kamera pozisyonu
      const modelCenterY = box.getCenter(new THREE.Vector3()).y + size.y * 0.3
      cameraRef.current.position.set(0, 100, 0) // Sabit yükseklik
      cameraRef.current.rotation.set(-Math.PI / 2, 0, Math.PI)
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, modelCenterY, 0)
        controlsRef.current.update()
      }
    }
  }, [cameraView, frontModel, externalScale, controlsRef])
  
  // Ortografik kamera zoom için her frame kontrol et (OrbitControls zoom için)
  useFrame(() => {
    if (cameraView === 'top' && cameraRef.current && cameraRef.current.isOrthographicCamera && controlsRef.current) {
      // OrbitControls'un zoom değerini ortografik kamera size'ına çevir
      // OrbitControls zoom değerini distance olarak tutar, biz bunu size'a çevirmeliyiz
      // Ancak OrbitControls ortografik kamera ile çalışırken zoom'u otomatik handle eder
    }
  })
  
  // Top view için ortografik kamera render et
  if (cameraView === 'top') {
    return (
      <orthographicCamera
        ref={cameraRef}
        makeDefault
        position={[0, 100, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        left={-orthoSizeRef.current}
        right={orthoSizeRef.current}
        top={orthoSizeRef.current}
        bottom={-orthoSizeRef.current}
        near={0.1}
        far={1000}
      />
    )
  }
  
  return null
}

// Kamera rotation bilgisini takip eden component
function CameraRotationTracker({ onRotationChange, controlsRef }) {
  const { camera } = useThree()
  
  // Normal rotation tracking - mevcut rotation'ı dereceye çevir
  useFrame(() => {
    if (!camera) return
    
    if (onRotationChange) {
      const rotationX = (camera.rotation.x * 180) / Math.PI
      const rotationY = (camera.rotation.y * 180) / Math.PI
      const rotationZ = (camera.rotation.z * 180) / Math.PI
      
      onRotationChange({
        x: rotationX,
        y: rotationY,
        z: rotationZ
      })
    }
  })
  
  return null
}

function GLBLensViewer({ useCustomGeometry = false, lensParams = null }) {
  const [scale, setScale] = useState(1)
  const [availableAnimations, setAvailableAnimations] = useState([])
  const [availableMorphTargets, setAvailableMorphTargets] = useState([])
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [morphTargetValues, setMorphTargetValues] = useState({})
  const [selectedMorphTarget, setSelectedMorphTarget] = useState(null) // Seçili morph target
  const [morphTarget2Value, setMorphTarget2Value] = useState(-2) // Morph target 2 değeri (-2 ile -8 arası)
  const [cameraView, setCameraView] = useState('side') // 'side', 'top', 'front', 'center'
  const [controlMode, setControlMode] = useState('rotate') // 'rotate', 'pan', 'both'
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 }) // Kamera rotation bilgisi
  const [showGrid, setShowGrid] = useState(true) // Grid göster/gizle
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const modelUrl = '/Lens/L_Glass_3_4.glb'
  
  // Model yüklendiğinde animasyonları ve morph targets'ları tespit et
  const handleModelLoad = React.useCallback((data, isMorphTargets = false) => {
    if (isMorphTargets) {
      // Morph targets (Shape Keys)
      console.log('📥 Morph Targets tespit edildi:', {
        morphTargets: data,
        length: data?.length || 0
      })
      
      if (data && data.length > 0) {
        setAvailableMorphTargets(data)
        
        // Morph target değerlerini başlat (0'dan başla)
        const initialValues = {}
        data.forEach((morph) => {
          initialValues[morph.targetName] = 0
        })
        setMorphTargetValues(initialValues)
        
        // Morph target 2'yi bul ve başlangıç değerini ayarla
        const morphTarget2 = data.find((morph, index) => 
          morph.targetName.includes('2') || 
          morph.targetName.toLowerCase().includes('morphtarget_2') ||
          index === 1
        )
        
        if (morphTarget2) {
          // Başlangıç değeri -2 (slider 0)
          setMorphTarget2Value(-2)
        }
        
        console.log('')
        console.log('═══════════════════════════════════════')
        console.log('🎭 MORPH TARGETS (SHAPE KEYS) LİSTESİ')
        console.log('═══════════════════════════════════════')
        console.log(`📊 Toplam morph target sayısı: ${data.length}`)
        console.log('───────────────────────────────────────')
        
        data.forEach((morph, index) => {
          console.log(`${index + 1}. Morph Target: "${morph.targetName}"`)
          console.log(`   🎭 Mesh: ${morph.meshName}`)
          console.log(`   📍 Attribute: ${morph.attributeName}`)
          console.log(`   🔢 Index: ${morph.targetIndex}`)
          console.log('───────────────────────────────────────')
        })
        console.log('═══════════════════════════════════════')
        console.log('')
      }
    } else {
      // Normal animasyonlar
      console.log('📥 Animasyon verisi alındı:', {
        animations: data,
        length: data?.length || 0
      })
      
      if (data && data.length > 0) {
        const animNames = data.map((clip) => clip.name || `Animasyon_${data.indexOf(clip)}`)
        setAvailableAnimations(animNames)
        
        console.log('')
        console.log('═══════════════════════════════════════')
        console.log('🎬 ANİMASYON CLIP LİSTESİ')
        console.log('═══════════════════════════════════════')
        console.log(`📊 Toplam animasyon sayısı: ${data.length}`)
        console.log('───────────────────────────────────────')
        
        data.forEach((clip, index) => {
          const clipName = clip.name || `Animasyon_${index}`
          console.log(`${index + 1}. Animasyon: "${clipName}"`)
          console.log(`   ⏱️  Süre: ${clip.duration.toFixed(2)} saniye`)
          console.log(`   🎞️  Tracks: ${clip.tracks.length}`)
          if (clip.tracks.length > 0) {
            console.log(`   📝 İlk track: ${clip.tracks[0].name || 'isimsiz'}`)
          }
          console.log('───────────────────────────────────────')
        })
        console.log('═══════════════════════════════════════')
        console.log('')
      } else {
        console.log('')
        console.log('❌ MODELDE ANİMASYON CLIP BULUNAMADI')
        console.log('Model animasyon içermiyor veya animasyon verisi yüklenemedi.')
        console.log('')
      }
    }
  }, [])
  
  // Morph target 2'yi bul ve seç
  useEffect(() => {
    if (availableMorphTargets.length > 0 && !selectedMorphTarget) {
      // Morph target 2'yi bul (isimde "2" geçen veya index 2 olan)
      const morphTarget2 = availableMorphTargets.find((morph, index) => 
        morph.targetName.includes('2') || 
        morph.targetName.toLowerCase().includes('morphtarget_2') ||
        index === 1 // İkinci morph target (0-indexed)
      )
      
      if (morphTarget2) {
        setSelectedMorphTarget(morphTarget2.targetName)
        // Morph target 2 için başlangıç değerini -2 olarak ayarla (slider 0)
        setMorphTargetValues(prev => ({
          ...prev,
          [morphTarget2.targetName]: 0 // Slider değeri 0 (morph değeri -2'ye denk gelir)
        }))
        setMorphTarget2Value(-2)
      }
    }
  }, [availableMorphTargets, selectedMorphTarget])
  
  // Morph değerini slider değerine çevir (0-1 arası)
  // Slider 0 → Morph -2, Slider 1 → Morph -8
  const morphValueToSlider = (morphValue) => {
    // morphValue = -2 - 6*sliderValue
    // sliderValue = -(morphValue + 2) / 6
    return Math.max(0, Math.min(1, -(morphValue + 2) / 6))
  }
  
  // Slider değerini morph değerine çevir (-2 ile -8 arası)
  const sliderToMorphValue = (sliderValue) => {
    // morphValue = -2 - 6*sliderValue
    return -2 - (sliderValue * 6)
  }
  
  // Morph target 2 için mevcut morph değerini al
  const getCurrentMorphValue = () => {
    if (!selectedMorphTarget) return -2
    const sliderValue = morphTargetValues[selectedMorphTarget] || 0
    return sliderToMorphValue(sliderValue)
  }
  
  // Morph target 2 için değeri güncelle (input'tan)
  const updateMorphValue = (morphValue) => {
    if (!selectedMorphTarget) return
    // Değeri -2 ile -8 arasında sınırla
    const clampedValue = Math.max(-8, Math.min(-2, morphValue))
    // Morph değerini slider değerine çevir
    const sliderValue = morphValueToSlider(clampedValue)
    setMorphTargetValues(prev => ({
      ...prev,
      [selectedMorphTarget]: sliderValue
    }))
    setMorphTarget2Value(clampedValue)
  }
  
  // Slider değiştiğinde morph değeri güncelle
  const handleSliderChange = (sliderValue) => {
    if (!selectedMorphTarget) return
    const morphValue = sliderToMorphValue(parseFloat(sliderValue))
    setMorphTargetValues(prev => ({
      ...prev,
      [selectedMorphTarget]: parseFloat(sliderValue)
    }))
    setMorphTarget2Value(morphValue)
  }
  
  // Kamera açısını değiştir
  const handleCameraView = (view) => {
    setCameraView(view)
  }
  
  return (
    <div className="glb-lens-viewer">
      <div className="viewer-main-layout">
        {/* Sol taraf - 3D Scene (%75) */}
        <div className="viewer-scene-container">
          {/* Kamera açısı butonları - Header yerine */}
          <div className="camera-controls">
            <div className="camera-view-buttons">
              <button 
                className={`camera-btn ${cameraView === 'front' ? 'active' : ''}`}
                onClick={() => handleCameraView('front')}
              >
                📐 Front
              </button>
              <button 
                className={`camera-btn ${cameraView === 'side' ? 'active' : ''}`}
                onClick={() => handleCameraView('side')}
              >
                👁️ Side
              </button>
              <button 
                className={`camera-btn ${cameraView === 'top' ? 'active' : ''}`}
                onClick={() => handleCameraView('top')}
              >
                🔝 Top
              </button>
              <button 
                className={`camera-btn ${cameraView === 'center' ? 'active' : ''}`}
                onClick={() => handleCameraView('center')}
              >
                🎯 Ortala
              </button>
            </div>
            
            {/* Grid toggle */}
            <div className="camera-options">
              <label className="grid-toggle">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span>📊 Grid Göster</span>
              </label>
            </div>
          </div>
          
          <div className="canvas-container">
            {/* Scene üzerinde kontrol butonları */}
            <div className="scene-controls-overlay">
              <button
                className={`scene-control-btn ${controlMode === 'rotate' ? 'active' : ''}`}
                onClick={() => setControlMode('rotate')}
                title="Sol tık ile döndür"
              >
                🔄 Döndür
              </button>
              <button
                className={`scene-control-btn ${controlMode === 'pan' ? 'active' : ''}`}
                onClick={() => setControlMode('pan')}
                title="Sol tık ile kaydır"
              >
                ↔️ Pan (Kaydır)
              </button>
              <button
                className={`scene-control-btn ${controlMode === 'both' ? 'active' : ''}`}
                onClick={() => setControlMode('both')}
                title="Her ikisi de aktif"
              >
                🎯 Her İkisi
              </button>
            </div>
            
            {/* Kamera rotation bilgisi */}
            <div className="camera-rotation-display">
              <div className="rotation-info">
                <strong>📐 Kamera Açısı:</strong>
                <div className="rotation-values">
                  <span>X: {cameraRotation.x.toFixed(1)}°</span>
                  <span>Y: {cameraRotation.y.toFixed(1)}°</span>
                  <span>Z: {cameraRotation.z.toFixed(1)}°</span>
                </div>
              </div>
            </div>
            
            <Canvas 
              shadows 
              gl={{ 
                antialias: true, 
                alpha: false,
                powerPreference: "high-performance",
                precision: "highp",
                stencil: false,
                depth: true,
                useLegacyLights: false // Physically correct lights için
              }}
              dpr={[1, 2]}
            >
              <Suspense fallback={null}>
                {/* Kameralar - cameraView'a göre conditionally render */}
                {cameraView === 'top' ? (
                  // Top view için ortografik kamera - TopViewCamera component'i içinde render edilecek
                  null
                ) : (
                  // Diğer view'lar için perspective kamera
                  <perspectiveCamera
                    makeDefault
                    position={[0, 0, 40]}
                    fov={50}
                  />
                )}
                
                {/* Işıklandırma - gerçekçi cam için */}
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[10, 10, 10]} 
                  intensity={2.0} 
                  castShadow={false}
                />
                <directionalLight 
                  position={[-10, 10, -10]} 
                  intensity={1.0} 
                />
                <directionalLight 
                  position={[0, -10, 0]} 
                  intensity={0.3} 
                />
                
                {/* Environment Map - gerçekçi cam yansımaları için */}
                <Environment preset="city" />
                
                {/* Grid - koyu gri arka plan üzerinde */}
                {showGrid && (
                  <Grid 
                    args={[100, 100]} 
                    cellColor="#333333" 
                    sectionColor="#222222"
                    fadeDistance={60}
                    fadeStrength={1.5}
                  />
                )}
                
                {/* Eksenler */}
                <axesHelper args={[30]} />
                
                {/* GLB Model or Custom Lens */}
                {useCustomGeometry && lensParams ? (
                  <CustomLensModel 
                    lensParams={lensParams}
                    controlsRef={controlsRef}
                    cameraView={cameraView}
                  />
                ) : (
                  <Model 
                    url={modelUrl} 
                    scale={scale} 
                    currentAnimation={currentAnimation}
                    morphTargetValues={morphTargetValues}
                    selectedMorphTarget={selectedMorphTarget}
                    morphTarget2Value={morphTarget2Value}
                    cameraView={cameraView}
                    controlMode={controlMode}
                    onAnimationsDetected={handleModelLoad}
                    controlsRef={controlsRef}
                  />
                )}
                
                {/* Kamera rotation takibi */}
                <CameraRotationTracker 
                  onRotationChange={setCameraRotation}
                  controlsRef={controlsRef}
                />
                
                {/* Kamera kontrolleri */}
                <OrbitControls
                  ref={controlsRef}
                  enablePan={controlMode === 'pan' || controlMode === 'both'}
                  enableZoom={true}
                  enableRotate={controlMode === 'rotate' || controlMode === 'both'}
                  minDistance={15}
                  maxDistance={150}
                  autoRotate={false}
                  target={[0, 3, 0]}
                  panSpeed={1.5}
                  zoomSpeed={1.0}
                  rotateSpeed={1.0}
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
              </Suspense>
            </Canvas>
          </div>
        </div>
        
        {/* Sağ taraf - Kontrol Paneli (%25) */}
        <div className="viewer-controls-panel">
          <div className="controls-header">
            <h3>⚙️ Kontroller</h3>
          </div>
          
          <div className="control-section">
            <div className="control-item scale-control">
              <label>
                <strong>Ölçek:</strong>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                />
                <span>{scale.toFixed(1)}x</span>
              </label>
            </div>
            
            {availableAnimations.length > 0 && (
              <div className="control-item animation-control">
                <label>
                  <strong>Animasyon:</strong>
                  <select
                    value={currentAnimation || ''}
                    onChange={(e) => setCurrentAnimation(e.target.value || null)}
                  >
                    <option value="">Animasyon Seçin</option>
                    {availableAnimations.map((animName) => (
                      <option key={animName} value={animName}>
                        {animName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          
          {/* SPH Kontrolü */}
          {selectedMorphTarget && (
            <div className="control-section morph-targets-section">
              <div className="section-header">
                <strong>🔍 SPH (Göz Bozukluk Derecesi)</strong>
              </div>
              
              {/* Input ile değer girişi */}
              <div className="control-item morph-target-input">
                <label>
                  <strong>SPH (-2 ile -8 arası):</strong>
                  <input
                    type="number"
                    min="-8"
                    max="-2"
                    step="0.1"
                    value={morphTarget2Value.toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (!isNaN(value)) {
                        updateMorphValue(value)
                      }
                    }}
                  />
                </label>
              </div>
              
              {/* Slider */}
              <div className="control-item morph-target-slider">
                <label>
                  <strong>SPH Slider:</strong>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={morphTargetValues[selectedMorphTarget] || 0}
                    onChange={(e) => handleSliderChange(e.target.value)}
                  />
                  <span className="morph-value">{getCurrentMorphValue().toFixed(2)}</span>
                </label>
                <div className="slider-labels">
                  <span>-2</span>
                  <span>-8</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="control-item">
            <div><strong>💡 Kontroller:</strong></div>
            <div style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '5px', lineHeight: '1.5' }}>
              • <strong>Döndür:</strong> Sol tık + sürükle ile modeli döndürün<br/>
              • <strong>Pan:</strong> Sol tık + sürükle ile görünümü kaydırın<br/>
              • <strong>Her İkisi:</strong> Hem döndürme hem pan aktif<br/>
              • Mouse tekerleği = Yakınlaştır/Uzaklaştır<br/>
              • Kamera butonları = Hızlı görünüm değiştir
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// GLB dosyasını önceden yükle (preload)
useGLTF.preload('/Lens/L_Glass_3_4.glb')

export default GLBLensViewer
