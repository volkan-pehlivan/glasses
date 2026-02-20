/**
 * Parametric shape generators for lens outlines.
 * Each generator returns an array of {x, z} points centered at origin,
 * normalized to fit within [-0.5, 0.5] range (then scaled by diameter in LensGeometry).
 *
 * All shapes are defined as parametric functions of t ∈ [0, 1),
 * where t=0 is the rightmost point and traversal is clockwise.
 */

// ─── Helper: Generate a rounded polygon from corner points ───────────────
function roundedPolygon(corners, radii, numPoints) {
    // corners: [{x, z}, ...] in order (clockwise)
    // radii: [r0, r1, ...] corner radius for each corner
    // Returns evenly-spaced boundary points

    const n = corners.length
    const arcs = []
    let totalLength = 0

    for (let i = 0; i < n; i++) {
        const prev = corners[(i - 1 + n) % n]
        const curr = corners[i]
        const next = corners[(i + 1) % n]
        const r = Math.min(radii[i], 0.49) // clamp radius

        // Direction vectors
        const dx1 = prev.x - curr.x, dz1 = prev.z - curr.z
        const dx2 = next.x - curr.x, dz2 = next.z - curr.z
        const len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1)
        const len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2)

        if (len1 === 0 || len2 === 0) continue

        const nx1 = dx1 / len1, nz1 = dz1 / len1
        const nx2 = dx2 / len2, nz2 = dz2 / len2

        // Half angle between edges
        const dot = nx1 * nx2 + nz1 * nz2
        const halfAngle = Math.acos(Math.max(-1, Math.min(1, dot))) / 2

        // How far from the corner to the tangent point
        const rClamped = Math.min(r, len1 / 2, len2 / 2)
        const dist = rClamped / Math.tan(halfAngle || 0.001)

        // Tangent points on each edge
        const t1 = { x: curr.x + nx1 * dist, z: curr.z + nz1 * dist }
        const t2 = { x: curr.x + nx2 * dist, z: curr.z + nz2 * dist }

        // Center of the arc
        const cross = nx1 * nz2 - nz1 * nx2
        const perpSign = cross > 0 ? 1 : -1
        const cx = t1.x + perpSign * (-nz1) * rClamped
        const cz = t1.z + perpSign * (nx1) * rClamped

        // Start and end angles
        const startAngle = Math.atan2(t1.z - cz, t1.x - cx)
        let endAngle = Math.atan2(t2.z - cz, t2.x - cx)

        // Ensure correct arc direction
        if (perpSign > 0) {
            while (endAngle > startAngle) endAngle -= 2 * Math.PI
        } else {
            while (endAngle < startAngle) endAngle += 2 * Math.PI
        }

        const arcLen = Math.abs(endAngle - startAngle) * rClamped

        arcs.push({
            type: 'arc',
            cx, cz, r: rClamped,
            startAngle, endAngle,
            length: arcLen,
            t1, t2
        })
        totalLength += arcLen

        // Straight edge from t2 of this corner to t1 of next corner
        // (will be computed after all arcs)
    }

    // Now build segments: arc + straight edge, arc + straight edge, ...
    const segments = []
    for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i]
        const nextArc = arcs[(i + 1) % arcs.length]

        segments.push({ type: 'arc', ...arc })

        const edgeDx = nextArc.t1.x - arc.t2.x
        const edgeDz = nextArc.t1.z - arc.t2.z
        const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDz * edgeDz)
        if (edgeLen > 0.001) {
            segments.push({
                type: 'line',
                x1: arc.t2.x, z1: arc.t2.z,
                x2: nextArc.t1.x, z2: nextArc.t1.z,
                length: edgeLen
            })
            totalLength += edgeLen
        }
    }

    // Sample evenly along total perimeter
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const targetDist = (i / numPoints) * totalLength
        let accumulated = 0
        let found = false

        for (const seg of segments) {
            if (accumulated + seg.length >= targetDist) {
                const localT = seg.length > 0 ? (targetDist - accumulated) / seg.length : 0
                if (seg.type === 'arc') {
                    const angle = seg.startAngle + localT * (seg.endAngle - seg.startAngle)
                    points.push({
                        x: seg.cx + seg.r * Math.cos(angle),
                        z: seg.cz + seg.r * Math.sin(angle)
                    })
                } else {
                    points.push({
                        x: seg.x1 + localT * (seg.x2 - seg.x1),
                        z: seg.z1 + localT * (seg.z2 - seg.z1)
                    })
                }
                found = true
                break
            }
            accumulated += seg.length
        }

        if (!found && segments.length > 0) {
            const last = segments[segments.length - 1]
            if (last.type === 'arc') {
                points.push({
                    x: last.cx + last.r * Math.cos(last.endAngle),
                    z: last.cz + last.r * Math.sin(last.endAngle)
                })
            } else {
                points.push({ x: last.x2, z: last.z2 })
            }
        }
    }

    return points
}

// ─── Helper: Ellipse points ──────────────────────────────────────────────
function ellipsePoints(rx, rz, numPoints) {
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        points.push({
            x: rx * Math.cos(t),
            z: rz * Math.sin(t)
        })
    }
    return points
}

// ─── Helper: Superellipse (squircle) ─────────────────────────────────────
function superEllipsePoints(rx, rz, exponent, numPoints) {
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)
        const x = Math.sign(cosT) * rx * Math.pow(Math.abs(cosT), 2 / exponent)
        const z = Math.sign(sinT) * rz * Math.pow(Math.abs(sinT), 2 / exponent)
        points.push({ x, z })
    }
    return points
}

// ─── Helper: Normalize points to [-0.5, 0.5] ────────────────────────────
function normalize(points) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const p of points) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.z < minZ) minZ = p.z
        if (p.z > maxZ) maxZ = p.z
    }
    const w = maxX - minX || 1
    const h = maxZ - minZ || 1
    const scale = 1 / Math.max(w, h)
    const cx = (minX + maxX) / 2
    const cz = (minZ + maxZ) / 2

    return points.map(p => ({
        x: (p.x - cx) * scale,
        z: (p.z - cz) * scale
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// Shape Generators
// ═══════════════════════════════════════════════════════════════════════════

// ─── Helper: Rotate points ───────────────────────────────────────────────
function rotatePoints(points, angle) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return points.map(p => ({
        x: p.x * cos - p.z * sin,
        z: p.x * sin + p.z * cos
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// Shape Generators
// ═══════════════════════════════════════════════════════════════════════════

export function generateRectangle(numPoints = 120) {
    const w = 1.4, h = 0.9, r = 0.08
    const corners = [
        { x: w / 2, z: -h / 2 },
        { x: w / 2, z: h / 2 },
        { x: -w / 2, z: h / 2 },
        { x: -w / 2, z: -h / 2 }
    ]
    return normalize(roundedPolygon(corners, [r, r, r, r], numPoints))
}

export function generateSquare(numPoints = 120) {
    const s = 1.0, r = 0.1
    const corners = [
        { x: s / 2, z: -s / 2 },
        { x: s / 2, z: s / 2 },
        { x: -s / 2, z: s / 2 },
        { x: -s / 2, z: -s / 2 }
    ]
    return normalize(roundedPolygon(corners, [r, r, r, r], numPoints))
}

export function generateWayfarer(numPoints = 120) {
    // Wider top, narrower bottom, angular edges
    const topW = 1.5, botW = 1.2, h = 0.9
    const corners = [
        { x: topW / 2, z: -h / 2 },
        { x: botW / 2, z: h / 2 },
        { x: -botW / 2, z: h / 2 },
        { x: -topW / 2, z: -h / 2 }
    ]
    return normalize(roundedPolygon(corners, [0.12, 0.2, 0.2, 0.12], numPoints))
}

export function generateAviator(numPoints = 120) {
    // Teardrop shape, wider at bottom — using blended ellipse approach
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)
        // Wider at bottom (positive z), narrower at top
        const rx = 0.7 + 0.08 * sinT
        const rz = 0.45
        points.push({
            x: rx * cosT,
            z: rz * sinT + 0.02 // slight downward shift
        })
    }
    return normalize(points)
}

export function generatePilot(numPoints = 120) {
    // Large teardrop, more angular than aviator
    const topW = 1.3, botW = 1.5, h = 1.0
    const corners = [
        { x: topW / 2, z: -h / 2 },
        { x: botW / 2, z: h / 3 },
        { x: 0, z: h / 2 },
        { x: -botW / 2, z: h / 3 },
        { x: -topW / 2, z: -h / 2 }
    ]
    return normalize(roundedPolygon(corners, [0.15, 0.2, 0.25, 0.2, 0.15], numPoints))
}

export function generateClubmaster(numPoints = 120) {
    // Flat/angular top, rounded bottom (browline)
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)

        let rx, rz
        if (sinT < 0) {
            // Top half: flatter, more angular
            rx = 0.7
            rz = 0.32
        } else {
            // Bottom half: rounder
            rx = 0.65
            rz = 0.45
        }

        // Blend between the two halves for smooth transition
        const blend = Math.abs(sinT)
        const finalRx = sinT < 0 ? rx : 0.7 - 0.05 * blend
        const finalRz = rz

        points.push({
            x: finalRx * cosT,
            z: finalRz * sinT
        })
    }
    return normalize(points)
}

export function generateCatEye(numPoints = 120) {
    // Upswept outer corners
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)

        // Base ellipse
        let rx = 0.7
        let rz = 0.42

        // Upswept effect on outer-top corners
        const lift = sinT < 0 ? Math.pow(Math.abs(cosT), 1.5) * 0.12 : 0

        points.push({
            x: rx * cosT,
            z: rz * sinT - lift
        })
    }
    return normalize(points)
}

export function generateNavigator(numPoints = 120) {
    // Wide rectangular with slight curve
    const w = 1.5, h = 0.85, r = 0.15
    const corners = [
        { x: w / 2, z: -h / 2 },
        { x: w / 2, z: h / 2 },
        { x: -w / 2, z: h / 2 },
        { x: -w / 2, z: -h / 2 }
    ]
    return normalize(roundedPolygon(corners, [r, r, r, r], numPoints))
}

export function generateCatEyeNarrow(numPoints = 120) {
    // Narrower upswept cat-eye
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)

        let rx = 0.65
        let rz = 0.35

        // Stronger upswept effect
        const lift = sinT < 0 ? Math.pow(Math.abs(cosT), 1.3) * 0.15 : 0

        points.push({
            x: rx * cosT,
            z: rz * sinT - lift
        })
    }
    return normalize(points)
}

export function generateRound(numPoints = 120) {
    return normalize(ellipsePoints(0.5, 0.5, numPoints))
}

export function generateOval(numPoints = 120) {
    return normalize(ellipsePoints(0.7, 0.45, numPoints))
}

export function generatePantos(numPoints = 120) {
    // Rounded bottom, flatter top (inverted D shape)
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)

        let rx = 0.6
        let rz

        if (sinT < 0) {
            // Top: flatter
            rz = 0.3
        } else {
            // Bottom: rounder
            rz = 0.5
        }

        points.push({
            x: rx * cosT,
            z: rz * sinT + 0.05 // shift down slightly
        })
    }
    return normalize(points)
}

export function generateGeometric(numPoints = 120) {
    // Hexagonal/angular shape with slight rounding
    const sides = 6
    const corners = []
    for (let i = 0; i < sides; i++) {
        // Start from right, go clockwise. Rotate by π/6 to have flat top
        const angle = (i / sides) * 2 * Math.PI - Math.PI / 6
        corners.push({
            x: 0.5 * Math.cos(angle),
            z: 0.5 * Math.sin(angle)
        })
    }
    const radii = new Array(sides).fill(0.06)
    return normalize(roundedPolygon(corners, radii, numPoints))
}

export function generateButterfly(numPoints = 120) {
    // Wide outer corners that taper to narrower inner/center, like butterfly wings
    const points = []
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI
        const cosT = Math.cos(t)
        const sinT = Math.sin(t)

        // Base shape: wider at sides, narrower top/bottom
        const rx = 0.7 + 0.1 * Math.abs(cosT)
        const rz = 0.38 + 0.08 * Math.pow(Math.abs(cosT), 2)

        // Upswept effect on outer-top
        const lift = sinT < 0 ? Math.pow(Math.abs(cosT), 2) * 0.08 : 0

        points.push({
            x: rx * cosT,
            z: rz * sinT - lift
        })
    }
    return normalize(points)
}

export function generateHexagonal(numPoints = 120) {
    // Regular hexagon with flat top and bottom
    const sides = 6
    const corners = []
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI
        corners.push({
            x: 0.5 * Math.cos(angle),
            z: 0.5 * Math.sin(angle)
        })
    }
    const radii = new Array(sides).fill(0.04)
    return normalize(roundedPolygon(corners, radii, numPoints))
}

export function generateOctagonal(numPoints = 120) {
    // Regular octagon
    const sides = 8
    const corners = []
    for (let i = 0; i < sides; i++) {
        // Start from right, offset by half a side for symmetric orientation
        const angle = (i / sides) * 2 * Math.PI - Math.PI / sides
        corners.push({
            x: 0.5 * Math.cos(angle),
            z: 0.5 * Math.sin(angle)
        })
    }
    const radii = new Array(sides).fill(0.03)
    return normalize(roundedPolygon(corners, radii, numPoints))
}

// ─── PNG-Extracted Shape: lenses01.png (v4 Raw/Sharp) ───────────────────
export function generateRealShape1Raw(/* numPoints = 120 */) {
    return [
        { x: -0.47382, z: -0.00524 }, { x: -0.46755, z: 0.02300 }, { x: -0.45658, z: 0.04865 }, { x: -0.44964, z: 0.07130 },
        { x: -0.44515, z: 0.09175 }, { x: -0.44098, z: 0.11280 }, { x: -0.43194, z: 0.13558 }, { x: -0.42147, z: 0.16017 },
        { x: -0.41175, z: 0.18322 }, { x: -0.39939, z: 0.20737 }, { x: -0.39005, z: 0.22512 }, { x: -0.37958, z: 0.24757 },
        { x: -0.36063, z: 0.26789 }, { x: -0.33887, z: 0.28694 }, { x: -0.31070, z: 0.29246 }, { x: -0.28714, z: 0.30002 },
        { x: -0.25832, z: 0.30243 }, { x: -0.23495, z: 0.30677 }, { x: -0.21164, z: 0.30890 }, { x: -0.18829, z: 0.31273 },
        { x: -0.16628, z: 0.30935 }, { x: -0.14921, z: 0.31327 }, { x: -0.12304, z: 0.31602 }, { x: -0.10512, z: 0.31684 },
        { x: -0.08170, z: 0.31937 }, { x: -0.05649, z: 0.32089 }, { x: -0.03408, z: 0.31938 }, { x: -0.01309, z: 0.32142 },
        { x: 0.01215, z: 0.31956 }, { x: 0.03582, z: 0.32461 }, { x: 0.05733, z: 0.32461 }, { x: 0.07885, z: 0.32461 },
        { x: 0.10037, z: 0.32461 }, { x: 0.11448, z: 0.32461 }, { x: 0.13374, z: 0.31960 }, { x: 0.15096, z: 0.31981 },
        { x: 0.17405, z: 0.31937 }, { x: 0.20297, z: 0.31937 }, { x: 0.22238, z: 0.31427 }, { x: 0.24894, z: 0.31702 },
        { x: 0.27487, z: 0.31130 }, { x: 0.29922, z: 0.31414 }, { x: 0.32291, z: 0.30890 }, { x: 0.35183, z: 0.30890 },
        { x: 0.37552, z: 0.30366 }, { x: 0.39918, z: 0.29804 }, { x: 0.42796, z: 0.29516 }, { x: 0.45525, z: 0.28812 },
        { x: 0.46951, z: 0.26609 }, { x: 0.47665, z: 0.23913 }, { x: 0.48429, z: 0.21559 }, { x: 0.48429, z: 0.18667 },
        { x: 0.48953, z: 0.16298 }, { x: 0.49333, z: 0.13944 }, { x: 0.49476, z: 0.11613 }, { x: 0.49439, z: 0.09424 },
        { x: 0.49935, z: 0.07330 }, { x: 0.49965, z: 0.05095 }, { x: 0.49914, z: 0.02797 }, { x: 0.50000, z: 0.00482 },
        { x: 0.50000, z: -0.02410 }, { x: 0.50000, z: -0.05302 }, { x: 0.50000, z: -0.08194 }, { x: 0.50000, z: -0.11087 },
        { x: 0.50000, z: -0.13238 }, { x: 0.49776, z: -0.15483 }, { x: 0.50000, z: -0.18282 }, { x: 0.49619, z: -0.20276 },
        { x: 0.49476, z: -0.23109 }, { x: 0.48742, z: -0.25452 }, { x: 0.47146, z: -0.27664 }, { x: 0.44764, z: -0.28580 },
        { x: 0.42153, z: -0.29319 }, { x: 0.39529, z: -0.29588 }, { x: 0.36898, z: -0.30018 }, { x: 0.34012, z: -0.30211 },
        { x: 0.31649, z: -0.30885 }, { x: 0.29058, z: -0.30616 }, { x: 0.26440, z: -0.30890 }, { x: 0.24151, z: -0.31219 },
        { x: 0.22251, z: -0.31137 }, { x: 0.20002, z: -0.31258 }, { x: 0.17786, z: -0.31414 }, { x: 0.16109, z: -0.31746 },
        { x: 0.14598, z: -0.31775 }, { x: 0.13055, z: -0.31937 }, { x: 0.10209, z: -0.31984 }, { x: 0.08535, z: -0.32461 },
        { x: 0.06430, z: -0.32347 }, { x: 0.04231, z: -0.32461 }, { x: 0.01339, z: -0.32461 }, { x: -0.00281, z: -0.31956 },
        { x: -0.02964, z: -0.32461 }, { x: -0.04551, z: -0.32038 }, { x: -0.06527, z: -0.32461 }, { x: -0.07990, z: -0.32336 },
        { x: -0.09665, z: -0.32440 }, { x: -0.11987, z: -0.32251 }, { x: -0.14636, z: -0.31937 }, { x: -0.16701, z: -0.31728 },
        { x: -0.19416, z: -0.31894 }, { x: -0.21778, z: -0.31320 }, { x: -0.24667, z: -0.31195 }, { x: -0.27557, z: -0.31069 },
        { x: -0.30446, z: -0.30943 }, { x: -0.32807, z: -0.30247 }, { x: -0.35684, z: -0.29945 }, { x: -0.38560, z: -0.29642 },
        { x: -0.41436, z: -0.29339 }, { x: -0.44189, z: -0.28464 }, { x: -0.46593, z: -0.26901 }, { x: -0.47766, z: -0.24444 },
        { x: -0.48831, z: -0.21819 }, { x: -0.49481, z: -0.19001 }, { x: -0.50000, z: -0.16168 }, { x: -0.49680, z: -0.13337 },
        { x: -0.49426, z: -0.11112 }, { x: -0.49067, z: -0.08242 }, { x: -0.48766, z: -0.06123 }, { x: -0.48005, z: -0.03332 },
    ];
}

// ─── PNG-Extracted Shape: lenses01.png (v4 Sharp/Clean) ────────────────
export function generateRealShape1Sharp(/* numPoints = 120 */) {
    return [
        { x: -0.47382, z: -0.00524 }, { x: -0.46829, z: 0.01873 }, { x: -0.46276, z: 0.04269 }, { x: -0.45661, z: 0.06645 },
        { x: -0.44715, z: 0.08915 }, { x: -0.43769, z: 0.11184 }, { x: -0.43194, z: 0.13528 }, { x: -0.42398, z: 0.15808 },
        { x: -0.41340, z: 0.18028 }, { x: -0.40283, z: 0.20248 }, { x: -0.39226, z: 0.22468 }, { x: -0.38169, z: 0.24688 },
        { x: -0.36476, z: 0.26428 }, { x: -0.34626, z: 0.28047 }, { x: -0.32516, z: 0.29214 }, { x: -0.30159, z: 0.29843 },
        { x: -0.27700, z: 0.29843 }, { x: -0.25356, z: 0.30553 }, { x: -0.22958, z: 0.31029 }, { x: -0.20512, z: 0.31273 },
        { x: -0.18059, z: 0.31414 }, { x: -0.15600, z: 0.31414 }, { x: -0.13141, z: 0.31414 }, { x: -0.10899, z: 0.31937 },
        { x: -0.08440, z: 0.31937 }, { x: -0.06146, z: 0.32336 }, { x: -0.03739, z: 0.32461 }, { x: -0.01280, z: 0.32461 },
        { x: 0.01179, z: 0.32461 }, { x: 0.03639, z: 0.32461 }, { x: 0.06098, z: 0.32461 }, { x: 0.08557, z: 0.32461 },
        { x: 0.11016, z: 0.32461 }, { x: 0.13475, z: 0.32461 }, { x: 0.15934, z: 0.32461 }, { x: 0.18176, z: 0.31913 },
        { x: 0.20633, z: 0.31818 }, { x: 0.23090, z: 0.31724 }, { x: 0.25547, z: 0.31629 }, { x: 0.28005, z: 0.31535 },
        { x: 0.30462, z: 0.31440 }, { x: 0.32704, z: 0.30890 }, { x: 0.35163, z: 0.30890 }, { x: 0.37591, z: 0.30515 },
        { x: 0.40016, z: 0.30111 }, { x: 0.42442, z: 0.29706 }, { x: 0.44851, z: 0.29261 }, { x: 0.46549, z: 0.27631 },
        { x: 0.47326, z: 0.25298 }, { x: 0.48104, z: 0.22965 }, { x: 0.48587, z: 0.20568 }, { x: 0.48859, z: 0.18124 },
        { x: 0.49130, z: 0.15680 }, { x: 0.49402, z: 0.13236 }, { x: 0.49674, z: 0.10792 }, { x: 0.49945, z: 0.08347 },
        { x: 0.50000, z: 0.05891 }, { x: 0.50000, z: 0.03432 }, { x: 0.50000, z: 0.00973 }, { x: 0.50000, z: -0.01486 },
        { x: 0.50000, z: -0.03945 }, { x: 0.50000, z: -0.06404 }, { x: 0.50000, z: -0.08863 }, { x: 0.50000, z: -0.11322 },
        { x: 0.50000, z: -0.13781 }, { x: 0.50000, z: -0.16240 }, { x: 0.50000, z: -0.18699 }, { x: 0.49861, z: -0.21151 },
        { x: 0.49589, z: -0.23595 }, { x: 0.48832, z: -0.25896 }, { x: 0.47183, z: -0.27636 }, { x: 0.44972, z: -0.28587 },
        { x: 0.42576, z: -0.29140 }, { x: 0.40180, z: -0.29693 }, { x: 0.37742, z: -0.29971 }, { x: 0.35289, z: -0.30146 },
        { x: 0.32836, z: -0.30321 }, { x: 0.30597, z: -0.30944 }, { x: 0.28141, z: -0.31067 }, { x: 0.25685, z: -0.31190 },
        { x: 0.23229, z: -0.31312 }, { x: 0.20773, z: -0.31435 }, { x: 0.18317, z: -0.31558 }, { x: 0.15861, z: -0.31681 },
        { x: 0.13405, z: -0.31804 }, { x: 0.10949, z: -0.31926 }, { x: 0.08707, z: -0.32461 }, { x: 0.06248, z: -0.32461 },
        { x: 0.03789, z: -0.32461 }, { x: 0.01330, z: -0.32461 }, { x: -0.01129, z: -0.32461 }, { x: -0.03588, z: -0.32461 },
        { x: -0.06047, z: -0.32461 }, { x: -0.08506, z: -0.32461 }, { x: -0.10965, z: -0.32461 }, { x: -0.13250, z: -0.32038 },
        { x: -0.15663, z: -0.31805 }, { x: -0.18118, z: -0.31665 }, { x: -0.20573, z: -0.31524 }, { x: -0.23028, z: -0.31384 },
        { x: -0.25483, z: -0.31244 }, { x: -0.27938, z: -0.31104 }, { x: -0.30393, z: -0.30963 }, { x: -0.32827, z: -0.30660 },
        { x: -0.35239, z: -0.30177 }, { x: -0.37650, z: -0.29695 }, { x: -0.40061, z: -0.29213 }, { x: -0.42473, z: -0.28731 },
        { x: -0.44862, z: -0.28199 }, { x: -0.46829, z: -0.26724 }, { x: -0.47942, z: -0.24535 }, { x: -0.48737, z: -0.22226 },
        { x: -0.49290, z: -0.19830 }, { x: -0.49843, z: -0.17434 }, { x: -0.49816, z: -0.15002 }, { x: -0.49558, z: -0.12557 },
        { x: -0.49301, z: -0.10111 }, { x: -0.49043, z: -0.07666 }, { x: -0.48495, z: -0.05278 }, { x: -0.47788, z: -0.02923 },
    ];
}

// ─── PNG-Extracted Shape: lenses01.png (v4 Restored & Fixed) ────────────
export function generateRealShape1(/* numPoints = 120 */) {
    return [
        { x: 0.47300, z: -0.00558 }, { x: 0.46581, z: 0.02068 }, { x: 0.45850, z: 0.04574 }, { x: 0.45154, z: 0.06934 },
        { x: 0.44490, z: 0.09188 }, { x: 0.43795, z: 0.11416 }, { x: 0.42999, z: 0.13675 }, { x: 0.42082, z: 0.15966 },
        { x: 0.41069, z: 0.18243 }, { x: 0.39978, z: 0.20457 }, { x: 0.38763, z: 0.22579 }, { x: 0.37322, z: 0.24578 },
        { x: 0.35556, z: 0.26369 }, { x: 0.33450, z: 0.27838 }, { x: 0.31083, z: 0.28926 }, { x: 0.28584, z: 0.29675 },
        { x: 0.26068, z: 0.30188 }, { x: 0.23611, z: 0.30555 }, { x: 0.21248, z: 0.30824 }, { x: 0.18983, z: 0.31021 },
        { x: 0.16796, z: 0.31183 }, { x: 0.14646, z: 0.31347 }, { x: 0.12490, z: 0.31526 }, { x: 0.10293, z: 0.31703 },
        { x: 0.08045, z: 0.31850 }, { x: 0.05759, z: 0.31954 }, { x: 0.03456, z: 0.32026 }, { x: 0.01149, z: 0.32097 },
        { x: -0.01155, z: 0.32188 }, { x: -0.03430, z: 0.32292 }, { x: -0.05633, z: 0.32377 }, { x: -0.07725, z: 0.32408 },
        { x: -0.09695, z: 0.32370 }, { x: -0.11584, z: 0.32272 }, { x: -0.13490, z: 0.32144 }, { x: -0.15518, z: 0.32017 },
        { x: -0.17715, z: 0.31899 }, { x: -0.20052, z: 0.31775 }, { x: -0.22471, z: 0.31637 }, { x: -0.24934, z: 0.31490 },
        { x: -0.27425, z: 0.31337 }, { x: -0.29937, z: 0.31163 }, { x: -0.32468, z: 0.30943 }, { x: -0.35010, z: 0.30651 },
        { x: -0.37556, z: 0.30264 }, { x: -0.40073, z: 0.29730 }, { x: -0.42463, z: 0.28931 }, { x: -0.44547, z: 0.27707 },
        { x: -0.46166, z: 0.25976 }, { x: -0.47289, z: 0.23809 }, { x: -0.48021, z: 0.21385 }, { x: -0.48512, z: 0.18883 },
        { x: -0.48876, z: 0.16416 }, { x: -0.49166, z: 0.14029 }, { x: -0.49400, z: 0.11725 }, { x: -0.49592, z: 0.09480 },
        { x: -0.49749, z: 0.07253 }, { x: -0.49864, z: 0.04988 }, { x: -0.49934, z: 0.02626 }, { x: -0.49969, z: 0.00118 },
        { x: -0.49987, z: -0.02541 }, { x: -0.49994, z: -0.05293 }, { x: -0.49989, z: -0.08037 }, { x: -0.49969, z: -0.10682 },
        { x: -0.49931, z: -0.13207 }, { x: -0.49862, z: -0.15655 }, { x: -0.49726, z: -0.18081 }, { x: -0.49441, z: -0.20497 },
        { x: -0.48874, z: -0.22841 }, { x: -0.47877, z: -0.24976 }, { x: -0.46364, z: -0.26740 }, { x: -0.44366, z: -0.28045 },
        { x: -0.42015, z: -0.28927 }, { x: -0.39467, z: -0.29513 }, { x: -0.36844, z: -0.29934 }, { x: -0.34220, z: -0.30267 },
        { x: -0.31636, z: -0.30533 }, { x: -0.29119, z: -0.30743 }, { x: -0.26697, z: -0.30912 }, { x: -0.24390, z: -0.31057 },
        { x: -0.22196, z: -0.31190 }, { x: -0.20107, z: -0.31325 }, { x: -0.18130, z: -0.31475 }, { x: -0.16257, z: -0.31634 },
        { x: -0.14416, z: -0.31791 }, { x: -0.12512, z: -0.31946 }, { x: -0.10504, z: -0.32099 }, { x: -0.08408, z: -0.32235 },
        { x: -0.06240, z: -0.32324 }, { x: -0.04011, z: -0.32347 }, { x: -0.01762, z: -0.32320 }, { x: 0.00438, z: -0.32280 },
        { x: 0.02529, z: -0.32264 }, { x: 0.04485, z: -0.32279 }, { x: 0.06339, z: -0.32309 }, { x: 0.08182, z: -0.32316 },
        { x: 0.10130, z: -0.32268 }, { x: 0.12251, z: -0.32156 }, { x: 0.14537, z: -0.32000 }, { x: 0.16942, z: -0.31826 },
        { x: 0.19445, z: -0.31640 }, { x: 0.22049, z: -0.31439 }, { x: 0.24748, z: -0.31224 }, { x: 0.27497, z: -0.30981 },
        { x: 0.30250, z: -0.30690 }, { x: 0.32997, z: -0.30346 }, { x: 0.35758, z: -0.29953 }, { x: 0.38521, z: -0.29469 },
        { x: 0.41199, z: -0.28766 }, { x: 0.43640, z: -0.27678 }, { x: 0.45689, z: -0.26096 }, { x: 0.47264, z: -0.24029 },
        { x: 0.48378, z: -0.21595 }, { x: 0.49083, z: -0.18958 }, { x: 0.49432, z: -0.16260 }, { x: 0.49481, z: -0.13595 },
        { x: 0.49304, z: -0.10994 }, { x: 0.48971, z: -0.08429 }, { x: 0.48517, z: -0.05851 }, { x: 0.47956, z: -0.03221 },
    ];
}


// ─── PNG-Extracted Shape: lenses02.png (v4 Restored) ───
export function generateRealShape2(/* numPoints = 120 */) {
    return [
        { x: 0.49467, z: 0.00246 }, { x: 0.49287, z: 0.02813 }, { x: 0.48996, z: 0.05358 }, { x: 0.48599, z: 0.07889 },
        { x: 0.48076, z: 0.10427 }, { x: 0.47411, z: 0.12975 }, { x: 0.46594, z: 0.15508 }, { x: 0.45592, z: 0.17983 },
        { x: 0.44340, z: 0.20333 }, { x: 0.42769, z: 0.22464 }, { x: 0.40870, z: 0.24283 }, { x: 0.38700, z: 0.25758 },
        { x: 0.36347, z: 0.26933 }, { x: 0.33891, z: 0.27881 }, { x: 0.31395, z: 0.28656 }, { x: 0.28915, z: 0.29285 },
        { x: 0.26510, z: 0.29788 }, { x: 0.24216, z: 0.30187 }, { x: 0.22022, z: 0.30503 }, { x: 0.19882, z: 0.30757 },
        { x: 0.17763, z: 0.30971 }, { x: 0.15677, z: 0.31170 }, { x: 0.13654, z: 0.31367 }, { x: 0.11700, z: 0.31557 },
        { x: 0.09805, z: 0.31732 }, { x: 0.07991, z: 0.31902 }, { x: 0.06303, z: 0.32075 }, { x: 0.04721, z: 0.32234 },
        { x: 0.03105, z: 0.32351 }, { x: 0.01284, z: 0.32405 }, { x: -0.00790, z: 0.32395 }, { x: -0.03006, z: 0.32340 },
        { x: -0.05226, z: 0.32274 }, { x: -0.07392, z: 0.32224 }, { x: -0.09507, z: 0.32179 }, { x: -0.11572, z: 0.32104 },
        { x: -0.13595, z: 0.31998 }, { x: -0.15609, z: 0.31888 }, { x: -0.17658, z: 0.31793 }, { x: -0.19781, z: 0.31698 },
        { x: -0.22004, z: 0.31587 }, { x: -0.24336, z: 0.31440 }, { x: -0.26753, z: 0.31230 }, { x: -0.29215, z: 0.30932 },
        { x: -0.31703, z: 0.30551 }, { x: -0.34212, z: 0.30090 }, { x: -0.36706, z: 0.29506 }, { x: -0.39106, z: 0.28701 },
        { x: -0.41322, z: 0.27574 }, { x: -0.43275, z: 0.26074 }, { x: -0.44909, z: 0.24220 }, { x: -0.46200, z: 0.22071 },
        { x: -0.47189, z: 0.19695 }, { x: -0.47955, z: 0.17166 }, { x: -0.48559, z: 0.14564 }, { x: -0.49024, z: 0.11960 },
        { x: -0.49367, z: 0.09387 }, { x: -0.49601, z: 0.06823 }, { x: -0.49736, z: 0.04219 }, { x: -0.49779, z: 0.01535 },
        { x: -0.49746, z: -0.01222 }, { x: -0.49646, z: -0.04011 }, { x: -0.49461, z: -0.06781 }, { x: -0.49157, z: -0.09503 },
        { x: -0.48711, z: -0.12173 }, { x: -0.48103, z: -0.14793 }, { x: -0.47292, z: -0.17335 }, { x: -0.46197, z: -0.19735 },
        { x: -0.44736, z: -0.21905 }, { x: -0.42887, z: -0.23766 }, { x: -0.40717, z: -0.25276 }, { x: -0.38355, z: -0.26454 },
        { x: -0.35911, z: -0.27366 }, { x: -0.33442, z: -0.28098 }, { x: -0.30973, z: -0.28717 }, { x: -0.28545, z: -0.29255 },
        { x: -0.26188, z: -0.29709 }, { x: -0.23896, z: -0.30076 }, { x: -0.21660, z: -0.30377 }, { x: -0.19496, z: -0.30643 },
        { x: -0.17437, z: -0.30892 }, { x: -0.15496, z: -0.31124 }, { x: -0.13652, z: -0.31324 }, { x: -0.11873, z: -0.31485 },
        { x: -0.10140, z: -0.31624 }, { x: -0.08457, z: -0.31782 }, { x: -0.06825, z: -0.31968 }, { x: -0.05203, z: -0.32145 },
        { x: -0.03494, z: -0.32254 }, { x: -0.01626, z: -0.32265 }, { x: 0.00365, z: -0.32205 }, { x: 0.02364, z: -0.32142 },
        { x: 0.04280, z: -0.32116 }, { x: 0.06103, z: -0.32096 }, { x: 0.07899, z: -0.32029 }, { x: 0.09755, z: -0.31911 },
        { x: 0.11725, z: -0.31780 }, { x: 0.13800, z: -0.31664 }, { x: 0.15941, z: -0.31545 }, { x: 0.18118, z: -0.31389 },
        { x: 0.20326, z: -0.31164 }, { x: 0.22558, z: -0.30852 }, { x: 0.24810, z: -0.30458 }, { x: 0.27092, z: -0.29993 },
        { x: 0.29425, z: -0.29465 }, { x: 0.31816, z: -0.28874 }, { x: 0.34250, z: -0.28208 }, { x: 0.36688, z: -0.27428 },
        { x: 0.39056, z: -0.26469 }, { x: 0.41268, z: -0.25258 }, { x: 0.43255, z: -0.23741 }, { x: 0.44977, z: -0.21904 },
        { x: 0.46397, z: -0.19785 }, { x: 0.47480, z: -0.17452 }, { x: 0.48223, z: -0.14983 }, { x: 0.48690, z: -0.12449 },
        { x: 0.48995, z: -0.09906 }, { x: 0.49233, z: -0.07382 }, { x: 0.49420, z: -0.04861 }, { x: 0.49512, z: -0.02320 },
    ];
}

// ─── PNG-Extracted Shape: lenses03 (v4 Restored) ───
export function generateRealShape3(/* numPoints = 120 */) {
    return [
        { x: 0.46884, z: -0.01656 }, { x: 0.46290, z: 0.00653 }, { x: 0.45621, z: 0.03022 }, { x: 0.44905, z: 0.05424 },
        { x: 0.44171, z: 0.07804 }, { x: 0.43429, z: 0.10121 }, { x: 0.42659, z: 0.12387 }, { x: 0.41815, z: 0.14645 },
        { x: 0.40839, z: 0.16937 }, { x: 0.39673, z: 0.19263 }, { x: 0.38269, z: 0.21554 }, { x: 0.36600, z: 0.23683 },
        { x: 0.34669, z: 0.25532 }, { x: 0.32516, z: 0.27048 }, { x: 0.30210, z: 0.28240 }, { x: 0.27820, z: 0.29144 },
        { x: 0.25398, z: 0.29802 }, { x: 0.22986, z: 0.30272 }, { x: 0.20618, z: 0.30621 }, { x: 0.18313, z: 0.30894 },
        { x: 0.16071, z: 0.31098 }, { x: 0.13902, z: 0.31238 }, { x: 0.11819, z: 0.31350 }, { x: 0.09802, z: 0.31480 },
        { x: 0.07802, z: 0.31634 }, { x: 0.05788, z: 0.31790 }, { x: 0.03753, z: 0.31937 }, { x: 0.01659, z: 0.32077 },
        { x: -0.00570, z: 0.32210 }, { x: -0.02965, z: 0.32323 }, { x: -0.05471, z: 0.32397 }, { x: -0.07990, z: 0.32415 },
        { x: -0.10438, z: 0.32367 }, { x: -0.12770, z: 0.32258 }, { x: -0.14999, z: 0.32116 }, { x: -0.17185, z: 0.31976 },
        { x: -0.19394, z: 0.31844 }, { x: -0.21657, z: 0.31699 }, { x: -0.23987, z: 0.31511 }, { x: -0.26391, z: 0.31264 },
        { x: -0.28882, z: 0.30943 }, { x: -0.31453, z: 0.30531 }, { x: -0.34069, z: 0.29998 }, { x: -0.36666, z: 0.29290 },
        { x: -0.39154, z: 0.28322 }, { x: -0.41423, z: 0.27002 }, { x: -0.43367, z: 0.25266 }, { x: -0.44915, z: 0.23135 },
        { x: -0.46063, z: 0.20713 }, { x: -0.46872, z: 0.18148 }, { x: -0.47438, z: 0.15556 }, { x: -0.47845, z: 0.12993 },
        { x: -0.48155, z: 0.10471 }, { x: -0.48413, z: 0.07980 }, { x: -0.48649, z: 0.05489 }, { x: -0.48877, z: 0.02957 },
        { x: -0.49094, z: -0.00369 }, { x: -0.49283, z: -0.02240 }, { x: -0.49439, z: -0.04802 }, { x: -0.49579, z: -0.07289 },
        { x: -0.49707, z: -0.09739 }, { x: -0.49796, z: -0.12227 }, { x: -0.49796, z: -0.14800 }, { x: -0.49629, z: -0.17436 },
        { x: -0.49153, z: -0.20040 }, { x: -0.48208, z: -0.22446 }, { x: -0.46711, z: -0.24481 }, { x: -0.44713, z: -0.26056 },
        { x: -0.42364, z: -0.27212 }, { x: -0.39825, z: -0.28070 }, { x: -0.37213, z: -0.28739 }, { x: -0.34593, z: -0.29278 },
        { x: -0.31997, z: -0.29716 }, { x: -0.29445, z: -0.30094 }, { x: -0.26956, z: -0.30456 }, { x: -0.24539, z: -0.30800 },
        { x: -0.22204, z: -0.31081 }, { x: -0.19969, z: -0.31276 }, { x: -0.17854, z: -0.31421 }, { x: -0.15856, z: -0.31554 },
        { x: -0.13950, z: -0.31673 }, { x: -0.12121, z: -0.31766 }, { x: -0.10420, z: -0.31849 }, { x: -0.08910, z: -0.31955 },
        { x: -0.07580, z: -0.32087 }, { x: -0.06302, z: -0.32215 }, { x: -0.04903, z: -0.32313 }, { x: -0.03269, z: -0.32372 },
        { x: -0.01427, z: -0.32383 }, { x: 0.00464, z: -0.32341 }, { x: 0.02232, z: -0.32259 }, { x: 0.03827, z: -0.32186 },
        { x: 0.05311, z: -0.32165 }, { x: 0.06786, z: -0.32191 }, { x: 0.08355, z: -0.32220 }, { x: 0.10088, z: -0.32202 },
        { x: 0.11987, z: -0.32112 }, { x: 0.13993, z: -0.31959 }, { x: 0.16062, z: -0.31784 }, { x: 0.18202, z: -0.31620 },
        { x: 0.20447, z: -0.31471 }, { x: 0.22821, z: -0.31312 }, { x: 0.25327, z: -0.31115 }, { x: 0.27947, z: -0.30855 },
        { x: 0.30646, z: -0.30528 }, { x: 0.33364, z: -0.30128 }, { x: 0.36027, z: -0.29638 }, { x: 0.38591, z: -0.29030 },
        { x: 0.41050, z: -0.28265 }, { x: 0.43389, z: -0.27277 }, { x: 0.45514, z: -0.25973 }, { x: 0.47265, z: -0.24275 },
        { x: 0.48493, z: -0.22178 }, { x: 0.49160, z: -0.19750 }, { x: 0.49353, z: -0.17096 }, { x: 0.49218, z: -0.14327 },
        { x: 0.48882, z: -0.11548 }, { x: 0.48431, z: -0.08859 }, { x: 0.47930, z: -0.06328 }, { x: 0.47417, z: -0.03952 },
    ];
}

// ─── PNG-Extracted Shape: lenses04 (v4 Restored) ───
export function generateRealShape4(/* numPoints = 120 */) {
    return [
        { x: 0.47107, z: -0.01634 }, { x: 0.46188, z: 0.00816 }, { x: 0.45213, z: 0.03212 }, { x: 0.44218, z: 0.05511 },
        { x: 0.43202, z: 0.07689 }, { x: 0.42156, z: 0.09737 }, { x: 0.41084, z: 0.11682 }, { x: 0.39981, z: 0.13574 },
        { x: 0.38819, z: 0.15446 }, { x: 0.37581, z: 0.17280 }, { x: 0.36281, z: 0.19043 }, { x: 0.34921, z: 0.20755 },
        { x: 0.33449, z: 0.22468 }, { x: 0.31800, z: 0.24192 }, { x: 0.29951, z: 0.25852 }, { x: 0.27936, z: 0.27322 },
        { x: 0.25801, z: 0.28506 }, { x: 0.23576, z: 0.29388 }, { x: 0.21282, z: 0.30021 }, { x: 0.18943, z: 0.30488 },
        { x: 0.16586, z: 0.30854 }, { x: 0.14233, z: 0.31163 }, { x: 0.11908, z: 0.31439 }, { x: 0.09643, z: 0.31700 },
        { x: 0.07461, z: 0.31947 }, { x: 0.05332, z: 0.32159 }, { x: 0.03171, z: 0.32311 }, { x: 0.00910, z: 0.32398 },
        { x: -0.01435, z: 0.32436 }, { x: -0.03768, z: 0.32441 }, { x: -0.06011, z: 0.32409 }, { x: -0.08164, z: 0.32323 },
        { x: -0.10277, z: 0.32168 }, { x: -0.12384, z: 0.31949 }, { x: -0.14476, z: 0.31685 }, { x: -0.16532, z: 0.31400 },
        { x: -0.18549, z: 0.31112 }, { x: -0.20540, z: 0.30813 }, { x: -0.22525, z: 0.30481 }, { x: -0.24527, z: 0.30104 },
        { x: -0.26578, z: 0.29688 }, { x: -0.28717, z: 0.29230 }, { x: -0.30955, z: 0.28706 }, { x: -0.33235, z: 0.28069 },
        { x: -0.35436, z: 0.27264 }, { x: -0.37453, z: 0.26242 }, { x: -0.39264, z: 0.24963 }, { x: -0.40899, z: 0.23401 },
        { x: -0.42348, z: 0.21556 }, { x: -0.43571, z: 0.19482 }, { x: -0.44569, z: 0.17278 }, { x: -0.45403, z: 0.15037 },
        { x: -0.46127, z: 0.12800 }, { x: -0.46758, z: 0.10575 }, { x: -0.47304, z: 0.08362 }, { x: -0.47796, z: 0.06150 },
        { x: -0.48263, z: 0.03901 }, { x: -0.48701, z: 0.01583 }, { x: -0.49078, z: -0.00798 }, { x: -0.49371, z: -0.03209 },
        { x: -0.49583, z: -0.05618 }, { x: -0.49728, z: -0.08001 }, { x: -0.49812, z: -0.10329 }, { x: -0.49825, z: -0.12577 },
        { x: -0.49727, z: -0.14753 }, { x: -0.49467, z: -0.16897 }, { x: -0.48981, z: -0.19029 }, { x: -0.48175, z: -0.21096 },
        { x: -0.46956, z: -0.22982 }, { x: -0.45301, z: -0.24580 }, { x: -0.43288, z: -0.25858 }, { x: -0.41061, z: -0.26853 },
        { x: -0.38765, z: -0.27644 }, { x: -0.36490, z: -0.28309 }, { x: -0.34246, z: -0.28900 }, { x: -0.31984, z: -0.29423 },
        { x: -0.29683, z: -0.29866 }, { x: -0.27393, z: -0.30231 }, { x: -0.25191, z: -0.30554 }, { x: -0.23099, z: -0.30861 },
        { x: -0.21039, z: -0.31146 }, { x: -0.18907, z: -0.31390 }, { x: -0.16681, z: -0.31596 }, { x: -0.14455, z: -0.31784 },
        { x: -0.12351, z: -0.31960 }, { x: -0.10413, z: -0.32109 }, { x: -0.08583, z: -0.32218 }, { x: -0.06741, z: -0.32293 },
        { x: -0.04770, z: -0.32350 }, { x: -0.02627, z: -0.32394 }, { x: -0.00409, z: -0.32416 }, { x: 0.01708, z: -0.32407 },
        { x: 0.03644, z: -0.32363 }, { x: 0.05487, z: -0.32279 }, { x: 0.07369, z: -0.32154 }, { x: 0.09333, z: -0.32000 },
        { x: 0.11353, z: -0.31831 }, { x: 0.13400, z: -0.31641 }, { x: 0.15463, z: -0.31409 }, { x: 0.17537, z: -0.31113 },
        { x: 0.19644, z: -0.30752 }, { x: 0.21840, z: -0.30341 }, { x: 0.24156, z: -0.29886 }, { x: 0.26562, z: -0.29376 },
        { x: 0.28997, z: -0.28797 }, { x: 0.31422, z: -0.28144 }, { x: 0.33822, z: -0.27415 }, { x: 0.36186, z: -0.26614 },
        { x: 0.38499, z: -0.25736 }, { x: 0.40753, z: -0.24759 }, { x: 0.42936, z: -0.23628 }, { x: 0.44992, z: -0.22278 },
        { x: 0.46792, z: -0.20644 }, { x: 0.48175, z: -0.18687 }, { x: 0.49033, z: -0.16430 }, { x: 0.49382, z: -0.13974 },
        { x: 0.49339, z: -0.11459 }, { x: 0.49039, z: -0.08976 }, { x: 0.48557, z: -0.06533 }, { x: 0.47911, z: -0.04092 },
    ];
}

// ─── PNG-Extracted Shape: lenses05 (v4 Restored) ───
export function generateRealShape5(/* numPoints = 120 */) {
    return [
        { x: 0.49171, z: -0.02357 }, { x: 0.48731, z: 0.00121 }, { x: 0.48156, z: 0.02464 }, { x: 0.47464, z: 0.04687 },
        { x: 0.46692, z: 0.06773 }, { x: 0.45901, z: 0.08694 }, { x: 0.45139, z: 0.10487 }, { x: 0.44396, z: 0.12275 },
        { x: 0.43596, z: 0.14174 }, { x: 0.42646, z: 0.16216 }, { x: 0.41494, z: 0.18325 }, { x: 0.40126, z: 0.20384 },
        { x: 0.38555, z: 0.22289 }, { x: 0.36811, z: 0.23982 }, { x: 0.34935, z: 0.25448 }, { x: 0.32949, z: 0.26702 },
        { x: 0.30849, z: 0.27748 }, { x: 0.28656, z: 0.28584 }, { x: 0.26429, z: 0.29229 }, { x: 0.24208, z: 0.29721 },
        { x: 0.21991, z: 0.30095 }, { x: 0.19785, z: 0.30386 }, { x: 0.17647, z: 0.30648 }, { x: 0.15640, z: 0.30923 },
        { x: 0.13766, z: 0.31211 }, { x: 0.11950, z: 0.31484 }, { x: 0.10080, z: 0.31725 }, { x: 0.08067, z: 0.31935 },
        { x: 0.05894, z: 0.32113 }, { x: 0.03602, z: 0.32253 }, { x: 0.01258, z: 0.32347 }, { x: -0.01060, z: 0.32391 },
        { x: -0.03278, z: 0.32375 }, { x: -0.05363, z: 0.32298 }, { x: -0.07345, z: 0.32176 }, { x: -0.09311, z: 0.32030 },
        { x: -0.11349, z: 0.31878 }, { x: -0.13494, z: 0.31724 }, { x: -0.15716, z: 0.31561 }, { x: -0.17960, z: 0.31370 },
        { x: -0.20201, z: 0.31137 }, { x: -0.22446, z: 0.30855 }, { x: -0.24712, z: 0.30499 }, { x: -0.27004, z: 0.30016 },
        { x: -0.29316, z: 0.29360 }, { x: -0.31636, z: 0.28505 }, { x: -0.33929, z: 0.27417 }, { x: -0.36125, z: 0.26055 },
        { x: -0.38141, z: 0.24409 }, { x: -0.39917, z: 0.22541 }, { x: -0.41441, z: 0.20547 }, { x: -0.42738, z: 0.18493 },
        { x: -0.43836, z: 0.16410 }, { x: -0.44775, z: 0.14322 }, { x: -0.45626, z: 0.12230 }, { x: -0.46456, z: 0.10080 },
        { x: -0.47275, z: 0.07788 }, { x: -0.48039, z: 0.05311 }, { x: -0.48704, z: 0.02687 }, { x: -0.49240, z: 0.00003 },
        { x: -0.49621, z: -0.02644 }, { x: -0.49838, z: -0.05193 }, { x: -0.49918, z: -0.07635 }, { x: -0.49900, z: -0.10013 },
        { x: -0.49776, z: -0.12367 }, { x: -0.49468, z: -0.14704 }, { x: -0.48877, z: -0.17005 }, { x: -0.47935, z: -0.19237 },
        { x: -0.46625, z: -0.21336 }, { x: -0.44967, z: -0.23227 }, { x: -0.43005, z: -0.24873 }, { x: -0.40803, z: -0.26283 },
        { x: -0.38435, z: -0.27481 }, { x: -0.35967, z: -0.28485 }, { x: -0.33449, z: -0.29300 }, { x: -0.30929, z: -0.29929 },
        { x: -0.28453, z: -0.30382 }, { x: -0.26066, z: -0.30701 }, { x: -0.23813, z: -0.30952 }, { x: -0.21725, z: -0.31184 },
        { x: -0.19799, z: -0.31397 }, { x: -0.18001, z: -0.31572 }, { x: -0.16290, z: -0.31708 }, { x: -0.14648, z: -0.31830 },
        { x: -0.13064, z: -0.31952 }, { x: -0.11503, z: -0.32060 }, { x: -0.09906, z: -0.32137 }, { x: -0.08189, z: -0.32198 },
        { x: -0.06252, z: -0.32270 }, { x: -0.04021, z: -0.32349 }, { x: -0.01520, z: -0.32407 }, { x: 0.01117, z: -0.32416 },
        { x: 0.03701, z: -0.32359 }, { x: 0.06079, z: -0.32236 }, { x: 0.08205, z: -0.32077 }, { x: 0.10159, z: -0.31923 },
        { x: 0.12079, z: -0.31780 }, { x: 0.14070, z: -0.31618 }, { x: 0.16148, z: -0.31407 }, { x: 0.18261, z: -0.31150 },
        { x: 0.20349, z: -0.30866 }, { x: 0.22407, z: -0.30561 }, { x: 0.24499, z: -0.30212 }, { x: 0.26696, z: -0.29791 },
        { x: 0.29014, z: -0.29287 }, { x: 0.31415, z: -0.28693 }, { x: 0.33835, z: -0.27989 }, { x: 0.36209, z: -0.27151 },
        { x: 0.38477, z: -0.26182 }, { x: 0.40609, z: -0.25097 }, { x: 0.42593, z: -0.23872 }, { x: 0.44402, z: -0.22448 },
        { x: 0.45972, z: -0.20796 }, { x: 0.47248, z: -0.18952 }, { x: 0.48226, z: -0.16973 }, { x: 0.48929, z: -0.14870 },
        { x: 0.49378, z: -0.12613 }, { x: 0.49594, z: -0.10183 }, { x: 0.49613, z: -0.07605 }, { x: 0.49466, z: -0.04959 },
    ];
}

// ─── PNG-Extracted Shape: lenses06 (v4 Restored) ───
export function generateRealShape6(/* numPoints = 120 */) {
    return [
        { x: 0.48404, z: -0.02297 }, { x: 0.47782, z: 0.00246 }, { x: 0.47096, z: 0.02629 }, { x: 0.46347, z: 0.04830 },
        { x: 0.45524, z: 0.06872 }, { x: 0.44629, z: 0.08822 }, { x: 0.43670, z: 0.10765 }, { x: 0.42632, z: 0.12751 },
        { x: 0.41463, z: 0.14780 }, { x: 0.40093, z: 0.16804 }, { x: 0.38483, z: 0.18761 }, { x: 0.36647, z: 0.20588 },
        { x: 0.34640, z: 0.22260 }, { x: 0.32527, z: 0.23784 }, { x: 0.30352, z: 0.25171 }, { x: 0.28135, z: 0.26416 },
        { x: 0.25890, z: 0.27508 }, { x: 0.23633, z: 0.28444 }, { x: 0.21378, z: 0.29228 }, { x: 0.19131, z: 0.29868 },
        { x: 0.16892, z: 0.30381 }, { x: 0.14671, z: 0.30787 }, { x: 0.12497, z: 0.31109 }, { x: 0.10395, z: 0.31368 },
        { x: 0.08358, z: 0.31591 }, { x: 0.06340, z: 0.31805 }, { x: 0.04259, z: 0.32023 }, { x: 0.02043, z: 0.32220 },
        { x: -0.00310, z: 0.32359 }, { x: -0.02710, z: 0.32424 }, { x: -0.05044, z: 0.32433 }, { x: -0.07254, z: 0.32406 },
        { x: -0.09351, z: 0.32344 }, { x: -0.11357, z: 0.32224 }, { x: -0.13295, z: 0.32034 }, { x: -0.15201, z: 0.31799 },
        { x: -0.17141, z: 0.31556 }, { x: -0.19186, z: 0.31323 }, { x: -0.21394, z: 0.31082 }, { x: -0.23789, z: 0.30795 },
        { x: -0.26336, z: 0.30419 }, { x: -0.28948, z: 0.29910 }, { x: -0.31531, z: 0.29220 }, { x: -0.34035, z: 0.28309 },
        { x: -0.36446, z: 0.27148 }, { x: -0.38735, z: 0.25711 }, { x: -0.40837, z: 0.23984 }, { x: -0.42681, z: 0.21986 },
        { x: -0.44221, z: 0.19785 }, { x: -0.45459, z: 0.17465 }, { x: -0.46447, z: 0.15094 }, { x: -0.47253, z: 0.12690 },
        { x: -0.47914, z: 0.10237 }, { x: -0.48443, z: 0.07735 }, { x: -0.48867, z: 0.05219 }, { x: -0.49220, z: 0.02714 },
        { x: -0.49504, z: 0.00205 }, { x: -0.49679, z: -0.02331 }, { x: -0.49714, z: -0.04884 }, { x: -0.49622, z: -0.07415 },
        { x: -0.49440, z: -0.09897 }, { x: -0.49165, z: -0.12321 }, { x: -0.48730, z: -0.14687 }, { x: -0.48028, z: -0.16997 },
        { x: -0.46968, z: -0.19232 }, { x: -0.45525, z: -0.21331 }, { x: -0.43746, z: -0.23204 }, { x: -0.41717, z: -0.24780 },
        { x: -0.39519, z: -0.26051 }, { x: -0.37203, z: -0.27060 }, { x: -0.34790, z: -0.27871 }, { x: -0.32292, z: -0.28537 },
        { x: -0.29749, z: -0.29100 }, { x: -0.27242, z: -0.29588 }, { x: -0.24861, z: -0.30021 }, { x: -0.22649, z: -0.30401 },
        { x: -0.20576, z: -0.30714 }, { x: -0.18593, z: -0.30950 }, { x: -0.16690, z: -0.31133 }, { x: -0.14884, z: -0.31308 },
        { x: -0.13191, z: -0.31504 }, { x: -0.11600, z: -0.31713 }, { x: -0.10102, z: -0.31903 }, { x: -0.08698, z: -0.32055 },
        { x: -0.07367, z: -0.32160 }, { x: -0.06017, z: -0.32218 }, { x: -0.04524, z: -0.32236 }, { x: -0.02840, z: -0.32224 },
        { x: -0.01052, z: -0.32191 }, { x: 0.00685, z: -0.32153 }, { x: 0.02258, z: -0.32134 }, { x: 0.03662, z: -0.32149 },
        { x: 0.04985, z: -0.32190 }, { x: 0.06340, z: -0.32232 }, { x: 0.07799, z: -0.32244 }, { x: 0.09370, z: -0.32201 },
        { x: 0.11029, z: -0.32103 }, { x: 0.12783, z: -0.31968 }, { x: 0.14662, z: -0.31823 }, { x: 0.16680, z: -0.31685 },
        { x: 0.18815, z: -0.31557 }, { x: 0.21036, z: -0.31411 }, { x: 0.23332, z: -0.31197 }, { x: 0.25718, z: -0.30881 },
        { x: 0.28208, z: -0.30472 }, { x: 0.30782, z: -0.29999 }, { x: 0.33361, z: -0.29470 }, { x: 0.35855, z: -0.28863 },
        { x: 0.38225, z: -0.28131 }, { x: 0.40482, z: -0.27205 }, { x: 0.42636, z: -0.26010 }, { x: 0.44643, z: -0.24483 },
        { x: 0.46410, z: -0.22605 }, { x: 0.47837, z: -0.20414 }, { x: 0.48859, z: -0.17993 }, { x: 0.49467, z: -0.15451 },
        { x: 0.49709, z: -0.12865 }, { x: 0.49654, z: -0.10258 }, { x: 0.49380, z: -0.07615 }, { x: 0.48947, z: -0.04943 },
    ];
}

// ─── PNG-Extracted Shape: lenses07 (v4 Restored) ───
export function generateRealShape7(/* numPoints = 120 */) {
    return [
        { x: 0.48788, z: -0.00762 }, { x: 0.48379, z: 0.01830 }, { x: 0.47881, z: 0.04356 }, { x: 0.47301, z: 0.06802 },
        { x: 0.46636, z: 0.09194 }, { x: 0.45861, z: 0.11574 }, { x: 0.44917, z: 0.13948 }, { x: 0.43730, z: 0.16259 },
        { x: 0.42250, z: 0.18399 }, { x: 0.40491, z: 0.20260 }, { x: 0.38537, z: 0.21801 }, { x: 0.36485, z: 0.23076 },
        { x: 0.34374, z: 0.24177 }, { x: 0.32197, z: 0.25152 }, { x: 0.29984, z: 0.25989 }, { x: 0.27819, z: 0.26691 },
        { x: 0.25765, z: 0.27314 }, { x: 0.23801, z: 0.27918 }, { x: 0.21859, z: 0.28501 }, { x: 0.19896, z: 0.29025 },
        { x: 0.17916, z: 0.29472 }, { x: 0.15959, z: 0.29859 }, { x: 0.14076, z: 0.30219 }, { x: 0.12287, z: 0.30584 },
        { x: 0.10541, z: 0.30948 }, { x: 0.08742, z: 0.31280 }, { x: 0.06834, z: 0.31566 }, { x: 0.04828, z: 0.31827 },
        { x: 0.02753, z: 0.32077 }, { x: 0.00611, z: 0.32293 }, { x: -0.01588, z: 0.32437 }, { x: -0.03786, z: 0.32496 },
        { x: -0.05910, z: 0.32489 }, { x: -0.07946, z: 0.32452 }, { x: -0.09951, z: 0.32411 }, { x: -0.11994, z: 0.32361 },
        { x: -0.14099, z: 0.32277 }, { x: -0.16247, z: 0.32131 }, { x: -0.18398, z: 0.31902 }, { x: -0.20535, z: 0.31585 },
        { x: -0.22696, z: 0.31186 }, { x: -0.24959, z: 0.30707 }, { x: -0.27374, z: 0.30129 }, { x: -0.29918, z: 0.29420 },
        { x: -0.32521, z: 0.28572 }, { x: -0.35122, z: 0.27600 }, { x: -0.37677, z: 0.26510 }, { x: -0.40132, z: 0.25264 },
        { x: -0.42409, z: 0.23798 }, { x: -0.44413, z: 0.22070 }, { x: -0.46057, z: 0.20081 }, { x: -0.47295, z: 0.17874 },
        { x: -0.48150, z: 0.15499 }, { x: -0.48711, z: 0.13000 }, { x: -0.49085, z: 0.10418 }, { x: -0.49361, z: 0.07804 },
        { x: -0.49578, z: 0.05200 }, { x: -0.49729, z: 0.02602 }, { x: -0.49795, z: -0.00037 }, { x: -0.49780, z: -0.02741 },
        { x: -0.49693, z: -0.05481 }, { x: -0.49512, z: -0.08195 }, { x: -0.49171, z: -0.10823 }, { x: -0.48591, z: -0.13336 },
        { x: -0.47710, z: -0.15722 }, { x: -0.46488, z: -0.17956 }, { x: -0.44905, z: -0.19979 }, { x: -0.42986, z: -0.21732 },
        { x: -0.40833, z: -0.23201 }, { x: -0.38591, z: -0.24419 }, { x: -0.36381, z: -0.25432 }, { x: -0.34257, z: -0.26279 },
        { x: -0.32209, z: -0.27005 }, { x: -0.30177, z: -0.27650 }, { x: -0.28096, z: -0.28233 }, { x: -0.25950, z: -0.28764 },
        { x: -0.23778, z: -0.29247 }, { x: -0.21632, z: -0.29696 }, { x: -0.19552, z: -0.30113 }, { x: -0.17567, z: -0.30489 },
        { x: -0.15694, z: -0.30808 }, { x: -0.13941, z: -0.31068 }, { x: -0.12311, z: -0.31272 }, { x: -0.10800, z: -0.31429 },
        { x: -0.09364, z: -0.31557 }, { x: -0.07896, z: -0.31690 }, { x: -0.06278, z: -0.31861 }, { x: -0.04439, z: -0.32067 },
        { x: -0.02405, z: -0.32257 }, { x: -0.00314, z: -0.32369 }, { x: 0.01635, z: -0.32389 }, { x: 0.03302, z: -0.32343 },
        { x: 0.04707, z: -0.32262 }, { x: 0.05993, z: -0.32172 }, { x: 0.07311, z: -0.32089 }, { x: 0.08757, z: -0.32005 },
        { x: 0.10381, z: -0.31904 }, { x: 0.12181, z: -0.31793 }, { x: 0.14110, z: -0.31672 }, { x: 0.16104, z: -0.31510 },
        { x: 0.18121, z: -0.31267 }, { x: 0.20152, z: -0.30941 }, { x: 0.22224, z: -0.30552 }, { x: 0.24391, z: -0.30109 },
        { x: 0.26718, z: -0.29612 }, { x: 0.29218, z: -0.29058 }, { x: 0.31839, z: -0.28433 }, { x: 0.34500, z: -0.27704 },
        { x: 0.37138, z: -0.26835 }, { x: 0.39710, z: -0.25800 }, { x: 0.42165, z: -0.24565 }, { x: 0.44409, z: -0.23065 },
        { x: 0.46324, z: -0.21240 }, { x: 0.47806, z: -0.19079 }, { x: 0.48810, z: -0.16642 }, { x: 0.49366, z: -0.14029 },
        { x: 0.49563, z: -0.11344 }, { x: 0.49524, z: -0.08661 }, { x: 0.49354, z: -0.06010 }, { x: 0.49109, z: -0.03381 },
    ];
}

// ─── PNG-Extracted Shape: lenses08 (v4 Restored) ───
export function generateRealShape8(/* numPoints = 120 */) {
    return [
        { x: 0.47960, z: -0.01730 }, { x: 0.47160, z: 0.00748 }, { x: 0.46254, z: 0.03063 }, { x: 0.45282, z: 0.05187 },
        { x: 0.44261, z: 0.07138 }, { x: 0.43181, z: 0.08976 }, { x: 0.42014, z: 0.10769 }, { x: 0.40736, z: 0.12553 },
        { x: 0.39330, z: 0.14322 }, { x: 0.37790, z: 0.16038 }, { x: 0.36120, z: 0.17672 }, { x: 0.34339, z: 0.19209 },
        { x: 0.32491, z: 0.20651 }, { x: 0.30610, z: 0.22020 }, { x: 0.28696, z: 0.23343 }, { x: 0.26731, z: 0.24615 },
        { x: 0.24703, z: 0.25799 }, { x: 0.22629, z: 0.26860 }, { x: 0.20549, z: 0.27788 }, { x: 0.18517, z: 0.28597 },
        { x: 0.16557, z: 0.29300 }, { x: 0.14645, z: 0.29899 }, { x: 0.12729, z: 0.30386 }, { x: 0.10769, z: 0.30765 },
        { x: 0.08766, z: 0.31074 }, { x: 0.06738, z: 0.31362 }, { x: 0.04679, z: 0.31654 }, { x: 0.02561, z: 0.31935 },
        { x: 0.00371, z: 0.32163 }, { x: -0.01851, z: 0.32297 }, { x: -0.04049, z: 0.32322 }, { x: -0.06199, z: 0.32253 },
        { x: -0.08316, z: 0.32108 }, { x: -0.10416, z: 0.31884 }, { x: -0.12488, z: 0.31569 }, { x: -0.14519, z: 0.31177 },
        { x: -0.16521, z: 0.30752 }, { x: -0.18519, z: 0.30320 }, { x: -0.20539, z: 0.29867 }, { x: -0.22615, z: 0.29345 },
        { x: -0.24779, z: 0.28692 }, { x: -0.27025, z: 0.27873 }, { x: -0.29320, z: 0.26905 }, { x: -0.31633, z: 0.25836 },
        { x: -0.33923, z: 0.24689 }, { x: -0.36125, z: 0.23453 }, { x: -0.38176, z: 0.22115 }, { x: -0.40053, z: 0.20660 },
        { x: -0.41772, z: 0.19063 }, { x: -0.43350, z: 0.17294 }, { x: -0.44779, z: 0.15356 }, { x: -0.46045, z: 0.13287 },
        { x: -0.47145, z: 0.11135 }, { x: -0.48060, z: 0.08933 }, { x: -0.48754, z: 0.06698 }, { x: -0.49209, z: 0.04448 },
        { x: -0.49456, z: 0.02209 }, { x: -0.49542, z: 0.00002 }, { x: -0.49485, z: -0.02179 }, { x: -0.49256, z: -0.04343 },
        { x: -0.48804, z: -0.06485 }, { x: -0.48119, z: -0.08596 }, { x: -0.47240, z: -0.10685 }, { x: -0.46215, z: -0.12755 },
        { x: -0.45054, z: -0.14778 }, { x: -0.43741, z: -0.16706 }, { x: -0.42281, z: -0.18498 }, { x: -0.40707, z: -0.20133 },
        { x: -0.39047, z: -0.21598 }, { x: -0.37310, z: -0.22890 }, { x: -0.35490, z: -0.24026 }, { x: -0.33584, z: -0.25041 },
        { x: -0.31600, z: -0.25958 }, { x: -0.29556, z: -0.26778 }, { x: -0.27484, z: -0.27491 }, { x: -0.25421, z: -0.28098 },
        { x: -0.23403, z: -0.28616 }, { x: -0.21442, z: -0.29075 }, { x: -0.19512, z: -0.29513 }, { x: -0.17577, z: -0.29960 },
        { x: -0.15638, z: -0.30416 }, { x: -0.13724, z: -0.30837 }, { x: -0.11871, z: -0.31159 }, { x: -0.10113, z: -0.31354 },
        { x: -0.08462, z: -0.31465 }, { x: -0.06869, z: -0.31573 }, { x: -0.05213, z: -0.31719 }, { x: -0.03392, z: -0.31883 },
        { x: -0.01431, z: -0.32026 }, { x: 0.00527, z: -0.32128 }, { x: 0.02331, z: -0.32189 }, { x: 0.03933, z: -0.32217 },
        { x: 0.05409, z: -0.32232 }, { x: 0.06877, z: -0.32239 }, { x: 0.08417, z: -0.32218 }, { x: 0.10047, z: -0.32153 },
        { x: 0.11760, z: -0.32046 }, { x: 0.13547, z: -0.31911 }, { x: 0.15396, z: -0.31748 }, { x: 0.17295, z: -0.31541 },
        { x: 0.19244, z: -0.31271 }, { x: 0.21257, z: -0.30928 }, { x: 0.23352, z: -0.30520 }, { x: 0.25541, z: -0.30064 },
        { x: 0.27835, z: -0.29577 }, { x: 0.30242, z: -0.29063 }, { x: 0.32749, z: -0.28496 }, { x: 0.35315, z: -0.27829 },
        { x: 0.37873, z: -0.27020 }, { x: 0.40355, z: -0.26038 }, { x: 0.42684, z: -0.24846 }, { x: 0.44777, z: -0.23377 },
        { x: 0.46551, z: -0.21588 }, { x: 0.47939, z: -0.19498 }, { x: 0.48900, z: -0.17186 }, { x: 0.49433, z: -0.14734 },
        { x: 0.49587, z: -0.12191 }, { x: 0.49455, z: -0.09587 }, { x: 0.49119, z: -0.06950 }, { x: 0.48618, z: -0.04315 },
    ];
}

// ─── PNG-Extracted Shape: lenses09 (v4 Restored) ───
export function generateRealShape9(/* numPoints = 120 */) {
    return [
        { x: 0.48079, z: -0.01975 }, { x: 0.47301, z: 0.00539 }, { x: 0.46470, z: 0.03040 }, { x: 0.45588, z: 0.05444 },
        { x: 0.44663, z: 0.07712 }, { x: 0.43722, z: 0.09888 }, { x: 0.42787, z: 0.12054 }, { x: 0.41836, z: 0.14254 },
        { x: 0.40817, z: 0.16486 }, { x: 0.39687, z: 0.18731 }, { x: 0.38436, z: 0.20975 }, { x: 0.37076, z: 0.23193 },
        { x: 0.35607, z: 0.25343 }, { x: 0.34004, z: 0.27365 }, { x: 0.32231, z: 0.29196 }, { x: 0.30277, z: 0.30785 },
        { x: 0.28172, z: 0.32103 }, { x: 0.25964, z: 0.33142 }, { x: 0.23691, z: 0.33916 }, { x: 0.21371, z: 0.34472 },
        { x: 0.19034, z: 0.34875 }, { x: 0.16735, z: 0.35181 }, { x: 0.14528, z: 0.35420 }, { x: 0.12430, z: 0.35618 },
        { x: 0.10419, z: 0.35799 }, { x: 0.08440, z: 0.35976 }, { x: 0.06400, z: 0.36141 }, { x: 0.04197, z: 0.36275 },
        { x: 0.01780, z: 0.36364 }, { x: -0.00798, z: 0.36408 }, { x: -0.03407, z: 0.36413 }, { x: -0.05913, z: 0.36384 },
        { x: -0.08240, z: 0.36311 }, { x: -0.10397, z: 0.36194 }, { x: -0.12470, z: 0.36044 }, { x: -0.14560, z: 0.35866 },
        { x: -0.16711, z: 0.35633 }, { x: -0.18903, z: 0.35317 }, { x: -0.21112, z: 0.34905 }, { x: -0.23344, z: 0.34367 },
        { x: -0.25601, z: 0.33628 }, { x: -0.27831, z: 0.32596 }, { x: -0.29941, z: 0.31216 }, { x: -0.31851, z: 0.29497 },
        { x: -0.33548, z: 0.27510 }, { x: -0.35077, z: 0.25356 }, { x: -0.36483, z: 0.23136 }, { x: -0.37767, z: 0.20930 },
        { x: -0.38905, z: 0.18789 }, { x: -0.39905, z: 0.16720 }, { x: -0.40817, z: 0.14692 }, { x: -0.41679, z: 0.12679 },
        { x: -0.42493, z: 0.10689 }, { x: -0.43242, z: 0.08752 }, { x: -0.43910, z: 0.06873 }, { x: -0.44507, z: 0.05030 },
        { x: -0.45081, z: 0.03182 }, { x: -0.45694, z: 0.01267 }, { x: -0.46370, z: -0.00765 }, { x: -0.47062, z: -0.02905 },
        { x: -0.47704, z: -0.05089 }, { x: -0.48261, z: -0.07284 }, { x: -0.48738, z: -0.09525 }, { x: -0.49147, z: -0.11872 },
        { x: -0.49479, z: -0.14352 }, { x: -0.49700, z: -0.16945 }, { x: -0.49738, z: -0.19603 }, { x: -0.49500, z: -0.22257 },
        { x: -0.48892, z: -0.24815 }, { x: -0.47855, z: -0.27171 }, { x: -0.46386, z: -0.29237 }, { x: -0.44544, z: -0.30980 },
        { x: -0.42410, z: -0.32413 }, { x: -0.40054, z: -0.33556 }, { x: -0.37529, z: -0.34417 }, { x: -0.34889, z: -0.35022 },
        { x: -0.32200, z: -0.35429 }, { x: -0.29536, z: -0.35719 }, { x: -0.26961, z: -0.35950 }, { x: -0.24510, z: -0.36134 },
        { x: -0.22176, z: -0.36249 }, { x: -0.19938, z: -0.36281 }, { x: -0.17791, z: -0.36254 }, { x: -0.15749, z: -0.36209 },
        { x: -0.13816, z: -0.36168 }, { x: -0.11973, z: -0.36128 }, { x: -0.10183, z: -0.36081 }, { x: -0.08377, z: -0.36018 },
        { x: -0.06452, z: -0.35933 }, { x: -0.04331, z: -0.35814 }, { x: -0.02045, z: -0.35653 }, { x: 0.00275, z: -0.35452 },
        { x: 0.02486, z: -0.35217 }, { x: 0.04541, z: -0.34952 }, { x: 0.06492, z: -0.34648 }, { x: 0.08429, z: -0.34301 },
        { x: 0.10401, z: -0.33936 }, { x: 0.12411, z: -0.33584 }, { x: 0.14439, z: -0.33238 }, { x: 0.16469, z: -0.32858 },
        { x: 0.18505, z: -0.32430 }, { x: 0.20583, z: -0.31972 }, { x: 0.22750, z: -0.31493 }, { x: 0.25039, z: -0.30968 },
        { x: 0.27437, z: -0.30361 }, { x: 0.29898, z: -0.29650 }, { x: 0.32377, z: -0.28835 }, { x: 0.34843, z: -0.27928 },
        { x: 0.37271, z: -0.26927 }, { x: 0.39635, z: -0.25800 }, { x: 0.41894, z: -0.24489 }, { x: 0.43984, z: -0.22945 },
        { x: 0.45828, z: -0.21151 }, { x: 0.47356, z: -0.19124 }, { x: 0.48518, z: -0.16899 }, { x: 0.49279, z: -0.14507 },
        { x: 0.49637, z: -0.11995 }, { x: 0.49626, z: -0.09442 }, { x: 0.49313, z: -0.06925 }, { x: 0.48771, z: -0.04453 },
    ];
}

// ─── PNG-Extracted Shape: lenses10 (v4 Restored) ───
export function generateRealShape10(/* numPoints = 120 */) {
    return [
        { x: 0.49412, z: -0.02248 }, { x: 0.49002, z: 0.00292 }, { x: 0.48438, z: 0.02797 }, { x: 0.47702, z: 0.05235 },
        { x: 0.46798, z: 0.07613 }, { x: 0.45767, z: 0.09950 }, { x: 0.44654, z: 0.12230 }, { x: 0.43473, z: 0.14411 },
        { x: 0.42208, z: 0.16472 }, { x: 0.40830, z: 0.18452 }, { x: 0.39318, z: 0.20413 }, { x: 0.37661, z: 0.22378 },
        { x: 0.35862, z: 0.24301 }, { x: 0.33948, z: 0.26117 }, { x: 0.31956, z: 0.27786 }, { x: 0.29918, z: 0.29297 },
        { x: 0.27840, z: 0.30658 }, { x: 0.25719, z: 0.31889 }, { x: 0.23556, z: 0.33013 }, { x: 0.21353, z: 0.34039 },
        { x: 0.19117, z: 0.34955 }, { x: 0.16877, z: 0.35740 }, { x: 0.14675, z: 0.36375 }, { x: 0.12442, z: 0.36843 },
        { x: 0.10486, z: 0.37138 }, { x: 0.08518, z: 0.37275 }, { x: 0.06660, z: 0.37304 }, { x: 0.04902, z: 0.37288 },
        { x: 0.03152, z: 0.37273 }, { x: 0.01260, z: 0.37260 }, { x: -0.00874, z: 0.37194 }, { x: -0.03228, z: 0.37003 },
        { x: -0.05687, z: 0.36645 }, { x: -0.08124, z: 0.36133 }, { x: -0.10439, z: 0.35519 }, { x: -0.12573, z: 0.34857 },
        { x: -0.14525, z: 0.34172 }, { x: -0.16343, z: 0.33453 }, { x: -0.18056, z: 0.32686 }, { x: -0.19656, z: 0.31879 },
        { x: -0.21139, z: 0.31040 }, { x: -0.22548, z: 0.30167 }, { x: -0.23964, z: 0.29238 }, { x: -0.25470, z: 0.28209 },
        { x: -0.27126, z: 0.27015 }, { x: -0.28940, z: 0.25610 }, { x: -0.30856, z: 0.23998 }, { x: -0.32770, z: 0.22230 },
        { x: -0.34566, z: 0.20384 }, { x: -0.36167, z: 0.18526 }, { x: -0.37567, z: 0.16679 }, { x: -0.38823, z: 0.14830 },
        { x: -0.40013, z: 0.12960 }, { x: -0.41192, z: 0.11069 }, { x: -0.42376, z: 0.09157 }, { x: -0.43535, z: 0.07205 },
        { x: -0.44611, z: 0.05185 }, { x: -0.45561, z: 0.03074 }, { x: -0.46391, z: 0.00867 }, { x: -0.47134, z: -0.01432 },
        { x: -0.47818, z: -0.03816 }, { x: -0.48440, z: -0.06270 }, { x: -0.48979, z: -0.08782 }, { x: -0.49408, z: -0.11332 },
        { x: -0.49702, z: -0.13893 }, { x: -0.49839, z: -0.16432 }, { x: -0.49779, z: -0.18930 }, { x: -0.49444, z: -0.21368 },
        { x: -0.48727, z: -0.23693 }, { x: -0.47547, z: -0.25810 }, { x: -0.45911, z: -0.27626 }, { x: -0.43919, z: -0.29113 },
        { x: -0.41712, z: -0.30330 }, { x: -0.39417, z: -0.31379 }, { x: -0.37109, z: -0.32344 }, { x: -0.34812, z: -0.33252 },
        { x: -0.32527, z: -0.34091 }, { x: -0.30255, z: -0.34839 }, { x: -0.28001, z: -0.35472 }, { x: -0.25767, z: -0.35972 },
        { x: -0.23580, z: -0.36348 }, { x: -0.21481, z: -0.36656 }, { x: -0.19481, z: -0.36952 }, { x: -0.17543, z: -0.37244 },
        { x: -0.15620, z: -0.37503 }, { x: -0.13701, z: -0.37699 }, { x: -0.11805, z: -0.37817 }, { x: -0.09947, z: -0.37860 },
        { x: -0.08106, z: -0.37856 }, { x: -0.06230, z: -0.37852 }, { x: -0.04255, z: -0.37869 }, { x: -0.02154, z: -0.37867 },
        { x: 0.00041, z: -0.37786 }, { x: 0.02287, z: -0.37614 }, { x: 0.04553, z: -0.37384 }, { x: 0.06807, z: -0.37111 },
        { x: 0.09003, z: -0.36771 }, { x: 0.11134, z: -0.36350 }, { x: 0.13230, z: -0.35876 }, { x: 0.15311, z: -0.35382 },
        { x: 0.17362, z: -0.34858 }, { x: 0.19384, z: -0.34264 }, { x: 0.21443, z: -0.33580 }, { x: 0.23622, z: -0.32809 },
        { x: 0.25941, z: -0.31958 }, { x: 0.28342, z: -0.31020 }, { x: 0.30740, z: -0.29987 }, { x: 0.33086, z: -0.28850 },
        { x: 0.35367, z: -0.27599 }, { x: 0.37591, z: -0.26216 }, { x: 0.39753, z: -0.24676 }, { x: 0.41815, z: -0.22957 },
        { x: 0.43710, z: -0.21063 }, { x: 0.45377, z: -0.19026 }, { x: 0.46786, z: -0.16879 }, { x: 0.47933, z: -0.14628 },
        { x: 0.48811, z: -0.12265 }, { x: 0.49394, z: -0.09806 }, { x: 0.49665, z: -0.07302 }, { x: 0.49651, z: -0.04783 },
    ];
}

// ─── PNG-Extracted Shape: lenses11 (v4 Restored) ───
export function generateRealShape11(/* numPoints = 120 */) {
    return [
        { x: 0.49816, z: -0.00961 }, { x: 0.49614, z: 0.01744 }, { x: 0.49279, z: 0.04273 }, { x: 0.48824, z: 0.06606 },
        { x: 0.48254, z: 0.08815 }, { x: 0.47587, z: 0.11001 }, { x: 0.46862, z: 0.13217 }, { x: 0.46096, z: 0.15464 },
        { x: 0.45248, z: 0.17744 }, { x: 0.44258, z: 0.20077 }, { x: 0.43104, z: 0.22466 }, { x: 0.41795, z: 0.24876 },
        { x: 0.40348, z: 0.27260 }, { x: 0.38774, z: 0.29586 }, { x: 0.37083, z: 0.31849 }, { x: 0.35283, z: 0.34041 },
        { x: 0.33369, z: 0.36132 }, { x: 0.31338, z: 0.38077 }, { x: 0.29208, z: 0.39869 }, { x: 0.27017, z: 0.41538 },
        { x: 0.24792, z: 0.43099 }, { x: 0.22528, z: 0.44520 }, { x: 0.20208, z: 0.45755 }, { x: 0.17835, z: 0.46788 },
        { x: 0.15431, z: 0.47649 }, { x: 0.13013, z: 0.48381 }, { x: 0.10574, z: 0.48999 }, { x: 0.08080, z: 0.49472 },
        { x: 0.05487, z: 0.49769 }, { x: 0.02785, z: 0.49897 }, { x: 0.00034, z: 0.49887 }, { x: -0.02657, z: 0.49763 },
        { x: -0.05226, z: 0.49530 }, { x: -0.07708, z: 0.49170 }, { x: -0.10203, z: 0.48659 }, { x: -0.12783, z: 0.47998 },
        { x: -0.15435, z: 0.47204 }, { x: -0.18089, z: 0.46272 }, { x: -0.20675, z: 0.45169 }, { x: -0.23167, z: 0.43883 },
        { x: -0.25576, z: 0.42449 }, { x: -0.27917, z: 0.40897 }, { x: -0.30185, z: 0.39211 }, { x: -0.32352, z: 0.37360 },
        { x: -0.34390, z: 0.35358 }, { x: -0.36282, z: 0.33260 }, { x: -0.38021, z: 0.31112 }, { x: -0.39599, z: 0.28932 },
        { x: -0.41018, z: 0.26718 }, { x: -0.42296, z: 0.24471 }, { x: -0.43473, z: 0.22194 }, { x: -0.44585, z: 0.19884 },
        { x: -0.45629, z: 0.17546 }, { x: -0.46557, z: 0.15198 }, { x: -0.47308, z: 0.12872 }, { x: -0.47869, z: 0.10590 },
        { x: -0.48294, z: 0.08344 }, { x: -0.48671, z: 0.06084 }, { x: -0.49052, z: 0.03728 }, { x: -0.49411, z: 0.01205 },
        { x: -0.49673, z: -0.01494 }, { x: -0.49774, z: -0.04302 }, { x: -0.49683, z: -0.07110 }, { x: -0.49402, z: -0.09835 },
        { x: -0.48937, z: -0.12462 }, { x: -0.48289, z: -0.15035 }, { x: -0.47462, z: -0.17605 }, { x: -0.46471, z: -0.20193 },
        { x: -0.45340, z: -0.22785 }, { x: -0.44083, z: -0.25333 }, { x: -0.42702, z: -0.27783 }, { x: -0.41200, z: -0.30114 },
        { x: -0.39569, z: -0.32336 }, { x: -0.37792, z: -0.34447 }, { x: -0.35864, z: -0.36435 }, { x: -0.33807, z: -0.38284 },
        { x: -0.31658, z: -0.39982 }, { x: -0.29448, z: -0.41513 }, { x: -0.27199, z: -0.42872 }, { x: -0.24928, z: -0.44079 },
        { x: -0.22637, z: -0.45160 }, { x: -0.20315, z: -0.46126 }, { x: -0.17970, z: -0.46957 }, { x: -0.15628, z: -0.47627 },
        { x: -0.13304, z: -0.48159 }, { x: -0.10982, z: -0.48622 }, { x: -0.08643, z: -0.49063 }, { x: -0.06272, z: -0.49453 },
        { x: -0.03837, z: -0.49728 }, { x: -0.01298, z: -0.49847 }, { x: 0.01343, z: -0.49804 }, { x: 0.04019, z: -0.49622 },
        { x: 0.06637, z: -0.49343 }, { x: 0.09126, z: -0.48996 }, { x: 0.11463, z: -0.48581 }, { x: 0.13658, z: -0.48080 },
        { x: 0.15754, z: -0.47482 }, { x: 0.17822, z: -0.46769 }, { x: 0.19951, z: -0.45912 }, { x: 0.22198, z: -0.44907 },
        { x: 0.24523, z: -0.43777 }, { x: 0.26822, z: -0.42531 }, { x: 0.29037, z: -0.41156 }, { x: 0.31192, z: -0.39639 },
        { x: 0.33324, z: -0.37991 }, { x: 0.35414, z: -0.36223 }, { x: 0.37408, z: -0.34353 }, { x: 0.39261, z: -0.32420 },
        { x: 0.40950, z: -0.30456 }, { x: 0.42469, z: -0.28419 }, { x: 0.43833, z: -0.26227 }, { x: 0.45068, z: -0.23835 },
        { x: 0.46180, z: -0.21289 }, { x: 0.47149, z: -0.18698 }, { x: 0.47957, z: -0.16182 }, { x: 0.48611, z: -0.13789 },
        { x: 0.49130, z: -0.11453 }, { x: 0.49519, z: -0.09043 }, { x: 0.49768, z: -0.06469 }, { x: 0.49869, z: -0.03742 },
    ];
}

// ─── PNG-Extracted Shape: lenses12 (v4 Restored) ───
export function generateRealShape12(/* numPoints = 120 */) {
    return [
        { x: 0.46660, z: -0.02120 }, { x: 0.45665, z: 0.00240 }, { x: 0.44590, z: 0.02469 }, { x: 0.43451, z: 0.04537 },
        { x: 0.42245, z: 0.06462 }, { x: 0.40970, z: 0.08277 }, { x: 0.39634, z: 0.10002 }, { x: 0.38265, z: 0.11650 },
        { x: 0.36892, z: 0.13227 }, { x: 0.35526, z: 0.14719 }, { x: 0.34144, z: 0.16118 }, { x: 0.32689, z: 0.17446 },
        { x: 0.31081, z: 0.18745 }, { x: 0.29264, z: 0.20034 }, { x: 0.27248, z: 0.21299 }, { x: 0.25105, z: 0.22524 },
        { x: 0.22930, z: 0.23693 }, { x: 0.20806, z: 0.24775 }, { x: 0.18807, z: 0.25733 }, { x: 0.16970, z: 0.26556 },
        { x: 0.15269, z: 0.27266 }, { x: 0.13629, z: 0.27892 }, { x: 0.11974, z: 0.28448 }, { x: 0.10248, z: 0.28944 },
        { x: 0.08440, z: 0.29404 }, { x: 0.06575, z: 0.29860 }, { x: 0.04675, z: 0.30323 }, { x: 0.02712, z: 0.30777 },
        { x: 0.00639, z: 0.31193 }, { x: -0.01536, z: 0.31554 }, { x: -0.03712, z: 0.31838 }, { x: -0.05771, z: 0.32030 },
        { x: -0.07682, z: 0.32134 }, { x: -0.09517, z: 0.32179 }, { x: -0.11359, z: 0.32197 }, { x: -0.13243, z: 0.32197 },
        { x: -0.15163, z: 0.32170 }, { x: -0.17101, z: 0.32098 }, { x: -0.19040, z: 0.31957 }, { x: -0.20975, z: 0.31712 },
        { x: -0.22936, z: 0.31327 }, { x: -0.24977, z: 0.30790 }, { x: -0.27137, z: 0.30109 }, { x: -0.29401, z: 0.29293 },
        { x: -0.31698, z: 0.28320 }, { x: -0.33943, z: 0.27165 }, { x: -0.36101, z: 0.25829 }, { x: -0.38172, z: 0.24333 },
        { x: -0.40150, z: 0.22678 }, { x: -0.41995, z: 0.20850 }, { x: -0.43662, z: 0.18849 }, { x: -0.45131, z: 0.16707 },
        { x: -0.46397, z: 0.14479 }, { x: -0.47452, z: 0.12231 }, { x: -0.48289, z: 0.10013 }, { x: -0.48916, z: 0.07828 },
        { x: -0.49362, z: 0.05623 }, { x: -0.49656, z: 0.03339 }, { x: -0.49812, z: 0.00959 }, { x: -0.49835, z: -0.01481 },
        { x: -0.49728, z: -0.03911 }, { x: -0.49501, z: -0.06270 }, { x: -0.49142, z: -0.08537 }, { x: -0.48609, z: -0.10747 },
        { x: -0.47850, z: -0.12956 }, { x: -0.46828, z: -0.15179 }, { x: -0.45537, z: -0.17364 }, { x: -0.44011, z: -0.19424 },
        { x: -0.42319, z: -0.21282 }, { x: -0.40510, z: -0.22897 }, { x: -0.38578, z: -0.24267 }, { x: -0.36488, z: -0.25427 },
        { x: -0.34253, z: -0.26436 }, { x: -0.31943, z: -0.27344 }, { x: -0.29635, z: -0.28154 }, { x: -0.27369, z: -0.28844 },
        { x: -0.25156, z: -0.29399 }, { x: -0.23008, z: -0.29827 }, { x: -0.20961, z: -0.30144 }, { x: -0.19049, z: -0.30375 },
        { x: -0.17280, z: -0.30558 }, { x: -0.15642, z: -0.30730 }, { x: -0.14118, z: -0.30905 }, { x: -0.12674, z: -0.31072 },
        { x: -0.11249, z: -0.31218 }, { x: -0.09774, z: -0.31352 }, { x: -0.08198, z: -0.31485 }, { x: -0.06477, z: -0.31609 },
        { x: -0.04578, z: -0.31715 }, { x: -0.02504, z: -0.31818 }, { x: -0.00317, z: -0.31941 }, { x: 0.01882, z: -0.32072 },
        { x: 0.04006, z: -0.32173 }, { x: 0.06033, z: -0.32218 }, { x: 0.08017, z: -0.32205 }, { x: 0.10017, z: -0.32138 },
        { x: 0.12030, z: -0.32034 }, { x: 0.14017, z: -0.31923 }, { x: 0.15980, z: -0.31830 }, { x: 0.17965, z: -0.31748 },
        { x: 0.20017, z: -0.31640 }, { x: 0.22159, z: -0.31482 }, { x: 0.24409, z: -0.31266 }, { x: 0.26789, z: -0.30992 },
        { x: 0.29296, z: -0.30647 }, { x: 0.31890, z: -0.30206 }, { x: 0.34513, z: -0.29645 }, { x: 0.37110, z: -0.28939 },
        { x: 0.39629, z: -0.28057 }, { x: 0.42007, z: -0.26956 }, { x: 0.44173, z: -0.25585 }, { x: 0.46046, z: -0.23902 },
        { x: 0.47546, z: -0.21893 }, { x: 0.48610, z: -0.19594 }, { x: 0.49219, z: -0.17094 }, { x: 0.49409, z: -0.14506 },
        { x: 0.49264, z: -0.11930 }, { x: 0.48872, z: -0.09419 }, { x: 0.48290, z: -0.06969 }, { x: 0.47545, z: -0.04539 },
    ];
}

// ─── PNG-Extracted Shape: lenses13 (v4 Restored) ───
export function generateRealShape13(/* numPoints = 120 */) {
    return [
        { x: 0.49026, z: -0.02174 }, { x: 0.48577, z: -0.00085 }, { x: 0.47980, z: 0.02004 }, { x: 0.47243, z: 0.04124 },
        { x: 0.46374, z: 0.06265 }, { x: 0.45368, z: 0.08389 }, { x: 0.44233, z: 0.10438 }, { x: 0.42991, z: 0.12376 },
        { x: 0.41648, z: 0.14227 }, { x: 0.40166, z: 0.16037 }, { x: 0.38509, z: 0.17807 }, { x: 0.36704, z: 0.19487 },
        { x: 0.34837, z: 0.21028 }, { x: 0.32972, z: 0.22423 }, { x: 0.31095, z: 0.23693 }, { x: 0.29148, z: 0.24866 },
        { x: 0.27121, z: 0.25953 }, { x: 0.25078, z: 0.26944 }, { x: 0.23074, z: 0.27824 }, { x: 0.21098, z: 0.28580 },
        { x: 0.19101, z: 0.29208 }, { x: 0.17066, z: 0.29729 }, { x: 0.15014, z: 0.30190 }, { x: 0.12970, z: 0.30635 },
        { x: 0.10952, z: 0.31066 }, { x: 0.08974, z: 0.31451 }, { x: 0.07033, z: 0.31757 }, { x: 0.05080, z: 0.31979 },
        { x: 0.03045, z: 0.32132 }, { x: 0.00914, z: 0.32214 }, { x: -0.01225, z: 0.32209 }, { x: -0.03252, z: 0.32127 },
        { x: -0.05135, z: 0.31994 }, { x: -0.06945, z: 0.31813 }, { x: -0.08763, z: 0.31551 }, { x: -0.10614, z: 0.31196 },
        { x: -0.12482, z: 0.30779 }, { x: -0.14356, z: 0.30340 }, { x: -0.16220, z: 0.29887 }, { x: -0.18050, z: 0.29394 },
        { x: -0.19847, z: 0.28816 }, { x: -0.21655, z: 0.28120 }, { x: -0.23524, z: 0.27291 }, { x: -0.25468, z: 0.26336 },
        { x: -0.27463, z: 0.25268 }, { x: -0.29465, z: 0.24105 }, { x: -0.31421, z: 0.22870 }, { x: -0.33289, z: 0.21578 },
        { x: -0.35058, z: 0.20222 }, { x: -0.36727, z: 0.18789 }, { x: -0.38262, z: 0.17282 }, { x: -0.39636, z: 0.15718 },
        { x: -0.40888, z: 0.14106 }, { x: -0.42097, z: 0.12426 }, { x: -0.43310, z: 0.10637 }, { x: -0.44508, z: 0.08707 },
        { x: -0.45643, z: 0.06634 }, { x: -0.46675, z: 0.04446 }, { x: -0.47585, z: 0.02174 }, { x: -0.48360, z: -0.00159 },
        { x: -0.48978, z: -0.02534 }, { x: -0.49425, z: -0.04928 }, { x: -0.49679, z: -0.07329 }, { x: -0.49705, z: -0.09727 },
        { x: -0.49449, z: -0.12081 }, { x: -0.48867, z: -0.14332 }, { x: -0.47940, z: -0.16442 }, { x: -0.46670, z: -0.18391 },
        { x: -0.45095, z: -0.20156 }, { x: -0.43292, z: -0.21710 }, { x: -0.41340, z: -0.23055 }, { x: -0.39270, z: -0.24219 },
        { x: -0.37081, z: -0.25244 }, { x: -0.34793, z: -0.26168 }, { x: -0.32459, z: -0.27022 }, { x: -0.30120, z: -0.27813 },
        { x: -0.27782, z: -0.28516 }, { x: -0.25449, z: -0.29092 }, { x: -0.23173, z: -0.29541 }, { x: -0.21018, z: -0.29915 },
        { x: -0.18997, z: -0.30265 }, { x: -0.17085, z: -0.30600 }, { x: -0.15270, z: -0.30900 }, { x: -0.13572, z: -0.31159 },
        { x: -0.11985, z: -0.31379 }, { x: -0.10444, z: -0.31553 }, { x: -0.08865, z: -0.31678 }, { x: -0.07189, z: -0.31777 },
        { x: -0.05382, z: -0.31890 }, { x: -0.03414, z: -0.32031 }, { x: -0.01291, z: -0.32150 }, { x: 0.00915, z: -0.32184 },
        { x: 0.03098, z: -0.32120 }, { x: 0.05186, z: -0.32011 }, { x: 0.07181, z: -0.31908 }, { x: 0.09147, z: -0.31809 },
        { x: 0.11155, z: -0.31670 }, { x: 0.13242, z: -0.31452 }, { x: 0.15391, z: -0.31145 }, { x: 0.17553, z: -0.30778 },
        { x: 0.19676, z: -0.30397 }, { x: 0.21741, z: -0.30014 }, { x: 0.23772, z: -0.29596 }, { x: 0.25813, z: -0.29096 },
        { x: 0.27894, z: -0.28491 }, { x: 0.30026, z: -0.27784 }, { x: 0.32212, z: -0.26979 }, { x: 0.34441, z: -0.26060 },
        { x: 0.36674, z: -0.25007 }, { x: 0.38859, z: -0.23815 }, { x: 0.40952, z: -0.22495 }, { x: 0.42916, z: -0.21055 },
        { x: 0.44710, z: -0.19480 }, { x: 0.46283, z: -0.17742 }, { x: 0.47586, z: -0.15812 }, { x: 0.48573, z: -0.13680 },
        { x: 0.49209, z: -0.11376 }, { x: 0.49501, z: -0.08981 }, { x: 0.49514, z: -0.06605 }, { x: 0.49339, z: -0.04330 },
    ];
}

// ─── PNG-Extracted Shape: lenses14 (v4 Restored) ───
export function generateRealShape14(/* numPoints = 120 */) {
    return [
        { x: 0.48780, z: -0.01300 }, { x: 0.48090, z: 0.01076 }, { x: 0.47255, z: 0.03287 }, { x: 0.46329, z: 0.05338 },
        { x: 0.45328, z: 0.07272 }, { x: 0.44244, z: 0.09117 }, { x: 0.43104, z: 0.10861 }, { x: 0.41966, z: 0.12484 },
        { x: 0.40848, z: 0.13984 }, { x: 0.39683, z: 0.15389 }, { x: 0.38385, z: 0.16759 }, { x: 0.36922, z: 0.18150 },
        { x: 0.35330, z: 0.19567 }, { x: 0.33676, z: 0.20947 }, { x: 0.32026, z: 0.22215 }, { x: 0.30389, z: 0.23353 },
        { x: 0.28712, z: 0.24401 }, { x: 0.26939, z: 0.25414 }, { x: 0.25063, z: 0.26403 }, { x: 0.23134, z: 0.27333 },
        { x: 0.21221, z: 0.28152 }, { x: 0.19357, z: 0.28829 }, { x: 0.17513, z: 0.29377 }, { x: 0.15621, z: 0.29846 },
        { x: 0.13641, z: 0.30289 }, { x: 0.11604, z: 0.30739 }, { x: 0.09582, z: 0.31196 }, { x: 0.07633, z: 0.31629 },
        { x: 0.05753, z: 0.31983 }, { x: 0.03864, z: 0.32205 }, { x: 0.01886, z: 0.32271 }, { x: -0.00161, z: 0.32194 },
        { x: -0.02173, z: 0.32012 }, { x: -0.04063, z: 0.31783 }, { x: -0.05828, z: 0.31547 }, { x: -0.07524, z: 0.31307 },
        { x: -0.09238, z: 0.31038 }, { x: -0.11049, z: 0.30705 }, { x: -0.12982, z: 0.30273 }, { x: -0.14975, z: 0.29731 },
        { x: -0.16937, z: 0.29118 }, { x: -0.18827, z: 0.28474 }, { x: -0.20676, z: 0.27773 }, { x: -0.22545, z: 0.26940 },
        { x: -0.24473, z: 0.25927 }, { x: -0.26449, z: 0.24756 }, { x: -0.28423, z: 0.23493 }, { x: -0.30330, z: 0.22185 },
        { x: -0.32124, z: 0.20836 }, { x: -0.33804, z: 0.19432 }, { x: -0.35403, z: 0.17980 }, { x: -0.36944, z: 0.16507 },
        { x: -0.38437, z: 0.15020 }, { x: -0.39885, z: 0.13480 }, { x: -0.41297, z: 0.11839 }, { x: -0.42674, z: 0.10063 },
        { x: -0.44004, z: 0.08139 }, { x: -0.45274, z: 0.06070 }, { x: -0.46470, z: 0.03870 }, { x: -0.47556, z: 0.01559 },
        { x: -0.48464, z: -0.00835 }, { x: -0.49113, z: -0.03266 }, { x: -0.49426, z: -0.05669 }, { x: -0.49348, z: -0.07987 },
        { x: -0.48861, z: -0.10186 }, { x: -0.47987, z: -0.12249 }, { x: -0.46779, z: -0.14151 }, { x: -0.45293, z: -0.15878 },
        { x: -0.43584, z: -0.17442 }, { x: -0.41735, z: -0.18869 }, { x: -0.39840, z: -0.20186 }, { x: -0.37951, z: -0.21419 },
        { x: -0.36056, z: -0.22577 }, { x: -0.34122, z: -0.23639 }, { x: -0.32139, z: -0.24589 }, { x: -0.30131, z: -0.25455 },
        { x: -0.28131, z: -0.26279 }, { x: -0.26155, z: -0.27072 }, { x: -0.24198, z: -0.27808 }, { x: -0.22261, z: -0.28458 },
        { x: -0.20341, z: -0.29016 }, { x: -0.18430, z: -0.29494 }, { x: -0.16533, z: -0.29925 }, { x: -0.14671, z: -0.30353 },
        { x: -0.12840, z: -0.30791 }, { x: -0.11000, z: -0.31200 }, { x: -0.09104, z: -0.31531 }, { x: -0.07128, z: -0.31774 },
        { x: -0.05055, z: -0.31959 }, { x: -0.02865, z: -0.32112 }, { x: -0.00565, z: -0.32220 }, { x: 0.01767, z: -0.32246 },
        { x: 0.04003, z: -0.32180 }, { x: 0.06064, z: -0.32045 }, { x: 0.07986, z: -0.31869 }, { x: 0.09886, z: -0.31664 },
        { x: 0.11854, z: -0.31431 }, { x: 0.13897, z: -0.31157 }, { x: 0.15956, z: -0.30817 }, { x: 0.17969, z: -0.30392 },
        { x: 0.19908, z: -0.29886 }, { x: 0.21792, z: -0.29310 }, { x: 0.23670, z: -0.28675 }, { x: 0.25607, z: -0.27986 },
        { x: 0.27648, z: -0.27252 }, { x: 0.29768, z: -0.26481 }, { x: 0.31879, z: -0.25670 }, { x: 0.33902, z: -0.24802 },
        { x: 0.35848, z: -0.23850 }, { x: 0.37788, z: -0.22776 }, { x: 0.39760, z: -0.21542 }, { x: 0.41736, z: -0.20130 },
        { x: 0.43647, z: -0.18556 }, { x: 0.45404, z: -0.16861 }, { x: 0.46912, z: -0.15075 }, { x: 0.48095, z: -0.13170 },
        { x: 0.48916, z: -0.11081 }, { x: 0.49368, z: -0.08781 }, { x: 0.49472, z: -0.06318 }, { x: 0.49260, z: -0.03792 },
    ];
}

// ─── PNG-Extracted Shape: lenses15 (v4 Restored) ───
export function generateRealShape15(/* numPoints = 120 */) {
    return [
        { x: 0.49817, z: 0.01265 }, { x: 0.49663, z: 0.04026 }, { x: 0.49385, z: 0.06545 }, { x: 0.48958, z: 0.08807 },
        { x: 0.48355, z: 0.10908 }, { x: 0.47566, z: 0.12958 }, { x: 0.46580, z: 0.15016 }, { x: 0.45374, z: 0.17102 },
        { x: 0.43971, z: 0.19210 }, { x: 0.42474, z: 0.21308 }, { x: 0.41003, z: 0.23367 }, { x: 0.39578, z: 0.25404 },
        { x: 0.38111, z: 0.27470 }, { x: 0.36509, z: 0.29590 }, { x: 0.34762, z: 0.31749 }, { x: 0.32925, z: 0.33918 },
        { x: 0.31069, z: 0.36060 }, { x: 0.29242, z: 0.38124 }, { x: 0.27451, z: 0.40043 }, { x: 0.25676, z: 0.41779 },
        { x: 0.23879, z: 0.43339 }, { x: 0.22020, z: 0.44743 }, { x: 0.20051, z: 0.45973 }, { x: 0.17949, z: 0.46969 },
        { x: 0.15737, z: 0.47684 }, { x: 0.13461, z: 0.48127 }, { x: 0.11137, z: 0.48360 }, { x: 0.08744, z: 0.48462 },
        { x: 0.06267, z: 0.48491 }, { x: 0.03734, z: 0.48483 }, { x: 0.01204, z: 0.48455 }, { x: -0.01279, z: 0.48409 },
        { x: -0.03716, z: 0.48342 }, { x: -0.06130, z: 0.48255 }, { x: -0.08509, z: 0.48144 }, { x: -0.10817, z: 0.47971 },
        { x: -0.13024, z: 0.47676 }, { x: -0.15137, z: 0.47221 }, { x: -0.17210, z: 0.46603 }, { x: -0.19317, z: 0.45814 },
        { x: -0.21487, z: 0.44808 }, { x: -0.23674, z: 0.43539 }, { x: -0.25813, z: 0.42012 }, { x: -0.27884, z: 0.40264 },
        { x: -0.29899, z: 0.38325 }, { x: -0.31870, z: 0.36229 }, { x: -0.33826, z: 0.34037 }, { x: -0.35799, z: 0.31819 },
        { x: -0.37766, z: 0.29620 }, { x: -0.39642, z: 0.27462 }, { x: -0.41365, z: 0.25362 }, { x: -0.42962, z: 0.23330 },
        { x: -0.44504, z: 0.21340 }, { x: -0.45997, z: 0.19318 }, { x: -0.47336, z: 0.17166 }, { x: -0.48383, z: 0.14819 },
        { x: -0.49069, z: 0.12288 }, { x: -0.49444, z: 0.09661 }, { x: -0.49635, z: 0.07027 }, { x: -0.49745, z: 0.04417 },
        { x: -0.49815, z: 0.01815 }, { x: -0.49855, z: -0.00800 }, { x: -0.49868, z: -0.03437 }, { x: -0.49852, z: -0.06089 },
        { x: -0.49785, z: -0.08739 }, { x: -0.49624, z: -0.11356 }, { x: -0.49320, z: -0.13909 }, { x: -0.48823, z: -0.16384 },
        { x: -0.48074, z: -0.18773 }, { x: -0.47014, z: -0.21073 }, { x: -0.45610, z: -0.23296 }, { x: -0.43889, z: -0.25465 },
        { x: -0.41943, z: -0.27594 }, { x: -0.39890, z: -0.29664 }, { x: -0.37812, z: -0.31645 }, { x: -0.35725, z: -0.33539 },
        { x: -0.33612, z: -0.35390 }, { x: -0.31466, z: -0.37248 }, { x: -0.29305, z: -0.39128 }, { x: -0.27151, z: -0.41000 },
        { x: -0.25015, z: -0.42800 }, { x: -0.22872, z: -0.44436 }, { x: -0.20656, z: -0.45822 }, { x: -0.18302, z: -0.46902 },
        { x: -0.15806, z: -0.47667 }, { x: -0.13230, z: -0.48153 }, { x: -0.10641, z: -0.48417 }, { x: -0.08068, z: -0.48519 },
        { x: -0.05519, z: -0.48518 }, { x: -0.02999, z: -0.48479 }, { x: -0.00502, z: -0.48450 }, { x: 0.01998, z: -0.48425 },
        { x: 0.04511, z: -0.48367 }, { x: 0.07019, z: -0.48255 }, { x: 0.09499, z: -0.48092 }, { x: 0.11954, z: -0.47863 },
        { x: 0.14394, z: -0.47527 }, { x: 0.16815, z: -0.47039 }, { x: 0.19188, z: -0.46334 }, { x: 0.21478, z: -0.45329 },
        { x: 0.23669, z: -0.43975 }, { x: 0.25782, z: -0.42298 }, { x: 0.27868, z: -0.40396 }, { x: 0.29976, z: -0.38390 },
        { x: 0.32112, z: -0.36369 }, { x: 0.34240, z: -0.34349 }, { x: 0.36318, z: -0.32289 }, { x: 0.38335, z: -0.30162 },
        { x: 0.40309, z: -0.27980 }, { x: 0.42234, z: -0.25764 }, { x: 0.44064, z: -0.23534 }, { x: 0.45736, z: -0.21316 },
        { x: 0.47185, z: -0.19121 }, { x: 0.48335, z: -0.16927 }, { x: 0.49118, z: -0.14679 }, { x: 0.49538, z: -0.12322 },
        { x: 0.49707, z: -0.09831 }, { x: 0.49776, z: -0.07209 }, { x: 0.49832, z: -0.04462 }, { x: 0.49863, z: -0.01612 },
    ];
}

// ─── PNG-Extracted Shape: lenses16 (v4 Restored) ───
export function generateRealShape16(/* numPoints = 120 */) {
    return [
        { x: 0.47209, z: -0.01805 }, { x: 0.46774, z: 0.00719 }, { x: 0.46324, z: 0.03093 }, { x: 0.45817, z: 0.05333 },
        { x: 0.45255, z: 0.07498 }, { x: 0.44682, z: 0.09661 }, { x: 0.44129, z: 0.11877 }, { x: 0.43552, z: 0.14157 },
        { x: 0.42836, z: 0.16457 }, { x: 0.41843, z: 0.18682 }, { x: 0.40474, z: 0.20707 }, { x: 0.38714, z: 0.22445 },
        { x: 0.36633, z: 0.23892 }, { x: 0.34338, z: 0.25108 }, { x: 0.31928, z: 0.26148 }, { x: 0.29489, z: 0.27041 },
        { x: 0.27094, z: 0.27804 }, { x: 0.24774, z: 0.28456 }, { x: 0.22518, z: 0.29013 }, { x: 0.20318, z: 0.29501 },
        { x: 0.18204, z: 0.29943 }, { x: 0.16214, z: 0.30351 }, { x: 0.14343, z: 0.30728 }, { x: 0.12556, z: 0.31071 },
        { x: 0.10821, z: 0.31380 }, { x: 0.09115, z: 0.31652 }, { x: 0.07408, z: 0.31886 }, { x: 0.05647, z: 0.32087 },
        { x: 0.03743, z: 0.32251 }, { x: 0.01620, z: 0.32358 }, { x: -0.00693, z: 0.32397 }, { x: -0.03046, z: 0.32366 },
        { x: -0.05282, z: 0.32266 }, { x: -0.07350, z: 0.32087 }, { x: -0.09307, z: 0.31819 }, { x: -0.11248, z: 0.31484 },
        { x: -0.13256, z: 0.31129 }, { x: -0.15365, z: 0.30786 }, { x: -0.17557, z: 0.30453 }, { x: -0.19786, z: 0.30094 },
        { x: -0.22020, z: 0.29668 }, { x: -0.24245, z: 0.29154 }, { x: -0.26459, z: 0.28549 }, { x: -0.28668, z: 0.27849 },
        { x: -0.30900, z: 0.27032 }, { x: -0.33171, z: 0.26052 }, { x: -0.35424, z: 0.24852 }, { x: -0.37530, z: 0.23394 },
        { x: -0.39340, z: 0.21701 }, { x: -0.40783, z: 0.19850 }, { x: -0.41906, z: 0.17924 }, { x: -0.42826, z: 0.15956 },
        { x: -0.43654, z: 0.13935 }, { x: -0.44450, z: 0.11855 }, { x: -0.45219, z: 0.09749 }, { x: -0.45932, z: 0.07653 },
        { x: -0.46556, z: 0.05549 }, { x: -0.47095, z: 0.03377 }, { x: -0.47591, z: 0.01094 }, { x: -0.48075, z: -0.01290 },
        { x: -0.48531, z: -0.03738 }, { x: -0.48930, z: -0.06220 }, { x: -0.49260, z: -0.08717 }, { x: -0.49501, z: -0.11221 },
        { x: -0.49597, z: -0.13743 }, { x: -0.49462, z: -0.16296 }, { x: -0.48988, z: -0.18832 }, { x: -0.48074, z: -0.21219 },
        { x: -0.46670, z: -0.23296 }, { x: -0.44819, z: -0.24961 }, { x: -0.42653, z: -0.26220 }, { x: -0.40327, z: -0.27169 },
        { x: -0.37962, z: -0.27919 }, { x: -0.35610, z: -0.28548 }, { x: -0.33274, z: -0.29095 }, { x: -0.30945, z: -0.29569 },
        { x: -0.28632, z: -0.29968 }, { x: -0.26375, z: -0.30294 }, { x: -0.24213, z: -0.30571 }, { x: -0.22145, z: -0.30830 },
        { x: -0.20142, z: -0.31080 }, { x: -0.18190, z: -0.31313 }, { x: -0.16309, z: -0.31521 }, { x: -0.14516, z: -0.31695 },
        { x: -0.12797, z: -0.31821 }, { x: -0.11093, z: -0.31904 }, { x: -0.09297, z: -0.31968 }, { x: -0.07291, z: -0.32046 },
        { x: -0.05033, z: -0.32147 }, { x: -0.02600, z: -0.32238 }, { x: -0.00139, z: -0.32257 }, { x: 0.02213, z: -0.32180 },
        { x: 0.04381, z: -0.32044 }, { x: 0.06359, z: -0.31916 }, { x: 0.08214, z: -0.31828 }, { x: 0.10037, z: -0.31757 },
        { x: 0.11889, z: -0.31667 }, { x: 0.13786, z: -0.31549 }, { x: 0.15724, z: -0.31401 }, { x: 0.17703, z: -0.31209 },
        { x: 0.19744, z: -0.30959 }, { x: 0.21887, z: -0.30653 }, { x: 0.24171, z: -0.30298 }, { x: 0.26601, z: -0.29890 },
        { x: 0.29127, z: -0.29428 }, { x: 0.31665, z: -0.28914 }, { x: 0.34148, z: -0.28351 }, { x: 0.36568, z: -0.27737 },
        { x: 0.38957, z: -0.27056 }, { x: 0.41319, z: -0.26268 }, { x: 0.43595, z: -0.25306 }, { x: 0.45663, z: -0.24068 },
        { x: 0.47368, z: -0.22445 }, { x: 0.48565, z: -0.20395 }, { x: 0.49191, z: -0.17991 }, { x: 0.49308, z: -0.15370 },
        { x: 0.49068, z: -0.12654 }, { x: 0.48640, z: -0.09912 }, { x: 0.48150, z: -0.07169 }, { x: 0.47664, z: -0.04453 },
    ];
}


/**
 * Map of shape keys to generator functions.
 */
export const SHAPE_GENERATORS = {
    rectangle: generateRectangle,
    square: generateSquare,
    wayfarer: generateWayfarer,
    aviator: generateAviator,
    pilot: generatePilot,
    clubmaster: generateClubmaster,
    catEye: generateCatEye,
    navigator: generateNavigator,
    catEyeNarrow: generateCatEyeNarrow,
    round: generateRound,
    oval: generateOval,
    pantos: generatePantos,
    geometric: generateGeometric,
    butterfly: generateButterfly,
    hexagonal: generateHexagonal,
    octagonal: generateOctagonal,
    realShape1: generateRealShape1,
    realShape1Raw: generateRealShape1Raw,
    realShape1Sharp: generateRealShape1Sharp,
    realShape2: generateRealShape2,
    realShape3: generateRealShape3,
    realShape4: generateRealShape4,
    realShape5: generateRealShape5,
    realShape6: generateRealShape6,
    realShape7: generateRealShape7,
    realShape8: generateRealShape8,
    realShape9: generateRealShape9,
    realShape10: generateRealShape10,
    realShape11: generateRealShape11,
    realShape12: generateRealShape12,
    realShape13: generateRealShape13,
    realShape14: generateRealShape14,
    realShape15: generateRealShape15,
    realShape16: generateRealShape16
}
