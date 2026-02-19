import React, { useMemo } from 'react'
import * as THREE from 'three'
import { SHAPE_CONFIGS } from '../../utils/shapeConfigs'

function LensGeometry({
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
        // Simple: just show half the prescription for visual appeal
        // User enters -8D, we calculate geometry for -4D
        const visualPrescription = prescription * 0.5;

        const config = SHAPE_CONFIGS[shape] || SHAPE_CONFIGS.classic

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
                const s1 = calculateSagitta(r, r1)  // Front surface stays actual
                const s2 = calculateSagitta(r, r2)  // Back surface uses visual prescription
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

export default LensGeometry
