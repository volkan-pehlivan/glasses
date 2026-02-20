import React, { useRef } from 'react'
import * as THREE from 'three'
import LensGeometry from './LensGeometry'
import { calculateThickness } from '../../utils/lensCalculations'
import { SHAPE_CONFIGS } from '../../utils/shapeConfigs'

function LensModel({ params, activeEye, controlsRef, showDebugLines }) {
    const groupRef = useRef(null)

    const showBoth = params.showBoth
    const rightThickness = showBoth
        ? calculateThickness(params.rightPrescription, params.rightIndex, params.rightDiameter)
        : calculateThickness(params.prescription, params.index, params.diameter)
    const leftThickness = showBoth
        ? calculateThickness(params.leftPrescription, params.leftIndex, params.leftDiameter)
        : rightThickness

    const rightMaxThickness = Math.max(rightThickness.center, rightThickness.edge)
    const leftMaxThickness = Math.max(leftThickness.center, leftThickness.edge)
    const rightYOffset = showBoth ? rightMaxThickness / 2 : 0
    const leftYOffset = showBoth ? leftMaxThickness / 2 : 0

    const lensShape = params.lensShape || 'rectangle'

    // Shape configurations - needed for accurate bridge width calculation
    const shapeConfig = SHAPE_CONFIGS[lensShape] || SHAPE_CONFIGS.rectangle

    // Calculate lens spacing based on bridge width
    const bridgeWidth = params.bridgeWidth || 17
    const rightDiameter = showBoth ? params.rightDiameter : params.diameter
    const leftDiameter = showBoth ? params.leftDiameter : params.diameter

    // Calculate actual lens width at center (bridge level) for each shape
    // Use widthRatio from shape config (approximate width-to-diameter ratio)
    const widthRatio = shapeConfig.widthRatio || 1.0
    const rightCenterWidthMultiplier = widthRatio
    const leftCenterWidthMultiplier = widthRatio

    const rightLensWidth = rightDiameter * rightCenterWidthMultiplier
    const leftLensWidth = leftDiameter * leftCenterWidthMultiplier

    // Use correct bridge width without modification for wide lenses
    const visualBridgeWidth = bridgeWidth

    // Position lenses so the gap between bounding boxes equals visualBridgeWidth
    const rightLensX = -((rightLensWidth + leftLensWidth) / 2 + visualBridgeWidth) / 2
    const leftLensX = ((rightLensWidth + leftLensWidth) / 2 + visualBridgeWidth) / 2

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
                        <LensGeometry
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

                    <group position={[leftLensX, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
                        <LensGeometry
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
                            <boxGeometry args={[visualBridgeWidth, rightDiameter * 0.9, 2]} />
                            <meshBasicMaterial color="#ff6b6b" transparent opacity={0.2} side={THREE.DoubleSide} />
                        </mesh>
                    )}

                    {/* Blue line showing the gap between the inner edges of green boxes */}
                    {showDebugLines && (() => {
                        const rightInnerEdge = rightLensX + rightLensWidth / 2
                        const leftInnerEdge = leftLensX - leftLensWidth / 2
                        const gapLength = leftInnerEdge - rightInnerEdge
                        const gapCenter = (rightInnerEdge + leftInnerEdge) / 2

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
                            <mesh position={[rightLensX + rightLensWidth / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <boxGeometry args={[2, rightDiameter * 0.9, 2]} />
                                <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
                            </mesh>

                            {/* Left lens inner edge (left side) */}
                            <mesh position={[leftLensX - leftLensWidth / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <boxGeometry args={[2, leftDiameter * 0.9, 2]} />
                                <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
                            </mesh>
                        </>
                    )}
                </>
            ) : (
                <group
                    rotation={[Math.PI / 2, 0, 0]}
                    scale={activeEye === 'left' ? [-1, 1, 1] : [1, 1, 1]}
                >
                    <LensGeometry
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

export default LensModel
