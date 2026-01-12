import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './GLBLensViewer.css'

function Model({ url, scale: externalScale = 1, animations: modelAnimations = [], currentAnimation = null, morphTargetValues = {}, cameraView = 'side', controlMode = 'rotate', cameraRef, controlsRef, onAnimationsDetected }) {
  const { scene, animations: detectedAnimations } = useGLTF(url)
  const groupRef = useRef(null)
  const baseScaleRef = useRef(1)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const morphTargetsRef = useRef([])
  
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
  const applyGlassMaterial = (object) => {
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
        
        // Cam material - modeli bozmadan, dengeli parametrelerle
        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff, // Beyaz
          transparent: true,
          opacity: 0.4, // Orta şeffaflık (modeli bozmadan görünür kalır)
          roughness: 0.1, // Çok düşük pürüzlülük (pürüzsüz cam)
          metalness: 0.0, // Metal değil
          side: THREE.DoubleSide, // İki taraflı
          flatShading: false, // Smooth shading
          
          // Cam özellikleri - dengeli değerler (modeli bozmadan)
          transmission: 0.7, // Orta ışık geçirgenliği (çok yüksek olmasın)
          thickness: 0.3, // Cam kalınlığı
          ior: 1.5, // Index of refraction (gerçek cam)
          clearcoat: 0.8, // Şeffaf kaplama (biraz düşük)
          clearcoatRoughness: 0.1, // Biraz pürüzlü clearcoat (daha doğal)
          
          // Rendering kalitesi
          precision: 'highp'
        })
        
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
    applyGlassMaterial(model)
    
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
  }, [scene, onAnimationsDetected])
  
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
          
          // Her morph target için değeri uygula
          meshMorphTargets.forEach((morphTarget) => {
            const { targetIndex, targetName } = morphTarget
            const value = morphTargetValues[targetName] !== undefined ? morphTargetValues[targetName] : 0
            
            if (targetIndex >= 0 && targetIndex < child.morphTargetInfluences.length) {
              child.morphTargetInfluences[targetIndex] = value
            }
          })
          
          // Morph target uygulandıktan sonra normal'leri yeniden hesapla
          // (Vertex pozisyonları değiştiği için normal'ler de değişmeli)
          geometry.computeVertexNormals()
          geometry.attributes.normal.needsUpdate = true
          
        } else if (geometry.morphTargets && geometry.morphTargets.length > 0) {
          // Eski format için
          if (!child.morphTargetInfluences || child.morphTargetInfluences.length !== geometry.morphTargets.length) {
            child.morphTargetInfluences = new Array(geometry.morphTargets.length).fill(0)
          }
          
          meshMorphTargets.forEach((morphTarget) => {
            const { targetIndex, targetName } = morphTarget
            const value = morphTargetValues[targetName] !== undefined ? morphTargetValues[targetName] : 0
            
            if (targetIndex >= 0 && targetIndex < child.morphTargetInfluences.length) {
              child.morphTargetInfluences[targetIndex] = value
            }
          })
          
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
  }, [frontModel, morphTargetValues])
  
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
function CameraRotationTracker({ onRotationChange, manualRotation, useManualRotation, controlsRef }) {
  const { camera } = useThree()
  
  // Manuel rotation uygula - her frame'de uygula (OrbitControls'tan sonra)
  useFrame(() => {
    if (!camera) return
    
    if (useManualRotation && manualRotation) {
      // Dereceyi radyan'a çevir ve rotation'ı direkt uygula
      // Her frame'de uygula ki başka bir şey override edemesin
      const radX = (manualRotation.x * Math.PI) / 180
      const radY = (manualRotation.y * Math.PI) / 180
      const radZ = (manualRotation.z * Math.PI) / 180
      
      camera.rotation.set(radX, radY, radZ)
      
      // Rotation değiştiğinde parent'a bildir (görüntüleme için)
      if (onRotationChange) {
        onRotationChange({
          x: manualRotation.x,
          y: manualRotation.y,
          z: manualRotation.z
        })
      }
    } else {
      // Normal rotation tracking - mevcut rotation'ı dereceye çevir
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
    }
  })
  
  return null
}

function GLBLensViewer() {
  const [scale, setScale] = useState(1)
  const [availableAnimations, setAvailableAnimations] = useState([])
  const [availableMorphTargets, setAvailableMorphTargets] = useState([])
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [morphTargetValues, setMorphTargetValues] = useState({})
  const [cameraView, setCameraView] = useState('side') // 'side', 'top', 'front', 'center'
  const [controlMode, setControlMode] = useState('rotate') // 'rotate', 'pan', 'both'
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 }) // Kamera rotation bilgisi
  const [showGrid, setShowGrid] = useState(true) // Grid göster/gizle
  const [manualRotation, setManualRotation] = useState({ x: 0, y: 0, z: 0 }) // Manuel kamera açısı
  const [useManualRotation, setUseManualRotation] = useState(false) // Manuel açı kullan
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
  
  // Kamera açısını değiştir
  const handleCameraView = (view) => {
    setCameraView(view)
  }
  
  // Manuel rotation aktif edildiğinde mevcut açıları yükle
  useEffect(() => {
    if (useManualRotation) {
      setManualRotation({
        x: cameraRotation.x,
        y: cameraRotation.y,
        z: cameraRotation.z
      })
    }
  }, [useManualRotation]) // Sadece useManualRotation değiştiğinde çalış
  
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
                onClick={() => {
                  setUseManualRotation(false)
                  handleCameraView('front')
                }}
              >
                📐 Front
              </button>
              <button 
                className={`camera-btn ${cameraView === 'side' ? 'active' : ''}`}
                onClick={() => {
                  setUseManualRotation(false)
                  handleCameraView('side')
                }}
              >
                👁️ Side
              </button>
              <button 
                className={`camera-btn ${cameraView === 'top' ? 'active' : ''}`}
                onClick={() => {
                  setUseManualRotation(false)
                  handleCameraView('top')
                }}
              >
                🔝 Top
              </button>
              <button 
                className={`camera-btn ${cameraView === 'center' ? 'active' : ''}`}
                onClick={() => {
                  setUseManualRotation(false)
                  handleCameraView('center')
                }}
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
            
            {/* Manuel kamera açısı girişi */}
            <div className="camera-rotation-inputs">
              <label className="manual-rotation-toggle">
                <input
                  type="checkbox"
                  checked={useManualRotation}
                  onChange={(e) => setUseManualRotation(e.target.checked)}
                />
                <span>📐 Manuel Açı Girişi</span>
              </label>
              
              {useManualRotation && (
                <div className="rotation-inputs">
                  <div className="rotation-input-group">
                    <label>X:</label>
                    <input
                      type="number"
                      value={manualRotation.x}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setManualRotation(prev => ({ ...prev, x: value }))
                      }}
                      step="1"
                    />
                    <span>°</span>
                  </div>
                  <div className="rotation-input-group">
                    <label>Y:</label>
                    <input
                      type="number"
                      value={manualRotation.y}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setManualRotation(prev => ({ ...prev, y: value }))
                      }}
                      step="1"
                    />
                    <span>°</span>
                  </div>
                  <div className="rotation-input-group">
                    <label>Z:</label>
                    <input
                      type="number"
                      value={manualRotation.z}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setManualRotation(prev => ({ ...prev, z: value }))
                      }}
                      step="1"
                    />
                    <span>°</span>
                  </div>
                  <button
                    className="reset-rotation-btn"
                    onClick={() => {
                      setManualRotation({ x: 0, y: 0, z: 0 })
                    }}
                  >
                    🔄 Sıfırla
                  </button>
                </div>
              )}
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
                depth: true
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
                
                {/* Işıklandırma - cam için daha iyi */}
                <ambientLight intensity={1.2} />
                <directionalLight 
                  position={[10, 10, 10]} 
                  intensity={1.5} 
                  castShadow={false}
                />
                <directionalLight 
                  position={[-10, 10, -10]} 
                  intensity={0.8} 
                />
                <directionalLight 
                  position={[0, -10, 0]} 
                  intensity={0.5} 
                />
                
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
                
                {/* GLB Model */}
                <Model 
                  url={modelUrl} 
                  scale={scale} 
                  currentAnimation={currentAnimation}
                  morphTargetValues={morphTargetValues}
                  cameraView={cameraView}
                  controlMode={controlMode}
                  onAnimationsDetected={handleModelLoad}
                  controlsRef={controlsRef}
                />
                
                {/* Kamera rotation takibi */}
                <CameraRotationTracker 
                  onRotationChange={setCameraRotation}
                  manualRotation={manualRotation}
                  useManualRotation={useManualRotation}
                  controlsRef={controlsRef}
                />
                
                {/* Kamera kontrolleri - dinamik mod */}
                {!useManualRotation && (
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
                )}
                {/* Manuel mod aktifken sadece zoom için minimal kontrol */}
                {useManualRotation && (
                  <OrbitControls
                    ref={controlsRef}
                    enablePan={false}
                    enableZoom={true}
                    enableRotate={false}
                    minDistance={15}
                    maxDistance={150}
                    autoRotate={false}
                    target={[0, 3, 0]}
                  />
                )}
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
          
          {/* Morph Targets - Sağ panelde */}
          {availableMorphTargets.length > 0 && (
            <div className="control-section morph-targets-section">
              <div className="section-header">
                <strong>🎭 Morph Targets</strong>
                <span className="morph-count">{availableMorphTargets.length}</span>
              </div>
              <div className="morph-targets-list">
                {availableMorphTargets.map((morph) => (
                  <div key={morph.targetName} className="morph-target-control">
                    <label>
                      <span className="morph-label">{morph.targetName}</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={morphTargetValues[morph.targetName] || 0}
                        onChange={(e) => {
                          setMorphTargetValues(prev => ({
                            ...prev,
                            [morph.targetName]: parseFloat(e.target.value)
                          }))
                        }}
                      />
                      <span className="morph-value">{(morphTargetValues[morph.targetName] || 0).toFixed(2)}</span>
                    </label>
                  </div>
                ))}
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
