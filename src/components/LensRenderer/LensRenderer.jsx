import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import CameraController from './CameraController'
import LensModel from './LensModel'
import './LensRenderer.css'

function LensRenderer({
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
    const [envRotation, setEnvRotation] = React.useState(0)
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
        <div className="lens-renderer" ref={containerRef}>
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

            {/* Environment Rotation Control - Below View Shortcuts */}
            {backgroundEnvironment !== 'none' && (
                <div className="env-rotation-control">
                    <label>🔄 Ortam Döndür</label>
                    <input
                        type="range"
                        min="0"
                        max={Math.PI * 2}
                        step="0.1"
                        value={envRotation}
                        onChange={(e) => setEnvRotation(parseFloat(e.target.value))}
                        className="env-rotation-slider"
                    />
                </div>
            )}

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
                    depth: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0
                }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 250], fov: 50 }}
            >
                {/* Only set solid background color if no environment is active */}
                {backgroundEnvironment === 'none' && (
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
                )}

                <CameraController cameraView={cameraView} controlsRef={controlsRef} viewTrigger={viewTrigger} />

                {/* Improved lighting setup for realistic glass */}
                <ambientLight intensity={0.3} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1.0}
                    castShadow
                />
                <directionalLight position={[-10, 10, -5]} intensity={0.5} />
                <pointLight position={[0, 20, 10]} intensity={0.8} />
                <spotLight
                    position={[0, 30, 0]}
                    angle={0.3}
                    penumbra={1}
                    intensity={0.5}
                    castShadow
                />

                {/* Environment with background - with rotation control */}
                {backgroundEnvironment === 'city' && (
                    <Environment
                        preset="city"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'sunset' && (
                    <Environment
                        preset="sunset"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'studio' && (
                    <Environment
                        preset="studio"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'apartment' && (
                    <Environment
                        files="/hdri/small_empty_room_3_4k.hdr"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'room' && (
                    <Environment
                        files="/hdri/small_empty_room_3_4k.hdr"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'wooden' && (
                    <Environment
                        files="/hdri/university_workshop_4k.hdr"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
                )}
                {backgroundEnvironment === 'photostudio' && (
                    <Environment
                        files="/hdri/brown_photostudio_02_4k.hdr"
                        background={true}
                        blur={0}
                        backgroundRotation={[0, envRotation, 0]}
                        environmentRotation={[0, envRotation, 0]}
                    />
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

                <LensModel params={params} activeEye={activeEye} controlsRef={controlsRef} showDebugLines={showDebugLines} />

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

export default LensRenderer
