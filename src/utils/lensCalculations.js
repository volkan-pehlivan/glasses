/**
 * HOYA thickness formula
 * Calculates center and edge thickness based on prescription, refractive index, and diameter.
 * 
 * @param {number} prescription - Lens power in diopters (negative for myopia, positive for hyperopia)
 * @param {number} index - Refractive index (1.50, 1.60, 1.67, 1.74)
 * @param {number} diameter - Lens diameter in mm
 * @returns {{ center: number, edge: number }} Thickness values in mm
 */
// ─── HOYA Chart Data (Reference Values) ───────────────────────
const HOYA_CHART = {
    1.50: [
        { p: 4.0, ct: 4.5, et: 0.8 },
        { p: 2.0, ct: 2.7, et: 0.8 }, // Interpolation point
        { p: 0.0, ct: 2.0, et: 2.0 }, // Assumed Plano base
        { p: -2.0, ct: 2.0, et: 4.9 },
        { p: -4.0, ct: 2.0, et: 8.0 },
        { p: -6.0, ct: 2.0, et: 11.1 },
        { p: -8.0, ct: 2.0, et: 12.2 }
    ],
    1.60: [
        { p: 4.0, ct: 3.7, et: 0.8 },
        { p: 2.0, ct: 2.3, et: 0.8 },
        { p: 0.0, ct: 1.5, et: 1.5 }, // Assumed
        { p: -2.0, ct: 1.0, et: 2.7 },
        { p: -4.0, ct: 1.0, et: 4.4 },
        { p: -6.0, ct: 1.0, et: 6.3 },
        { p: -8.0, ct: 1.0, et: 8.3 }
    ],
    1.67: [
        { p: 4.0, ct: 3.2, et: 0.8 },
        { p: 2.0, ct: 2.0, et: 0.8 },
        { p: 0.0, ct: 1.2, et: 1.2 }, // Assumed
        { p: -2.0, ct: 1.0, et: 2.5 }, // Derived from trend
        { p: -4.0, ct: 1.0, et: 4.0 },
        { p: -6.0, ct: 1.0, et: 5.7 },
        { p: -8.0, ct: 1.0, et: 7.5 }
    ],
    1.74: [
        { p: 4.0, ct: 3.0, et: 0.8 },
        { p: 2.0, ct: 1.9, et: 0.8 },
        { p: 0.0, ct: 1.0, et: 1.0 }, // Assumed
        { p: -2.0, ct: 1.0, et: 2.3 },
        { p: -4.0, ct: 1.0, et: 3.8 },
        { p: -6.0, ct: 1.0, et: 5.4 },
        { p: -8.0, ct: 1.0, et: 6.5 }
    ]
}

/**
 * Linear Interpolation helper
 */
function lerp(start, end, t) {
    return start * (1 - t) + end * t
}

/**
 * Calculates thickness using HOYA chart interpolation with diameter correction.
 * 
 * @param {number} prescription - Lens power (D)
 * @param {number} index - Refractive index
 * @param {number} diameter - Lens diameter (mm)
 * @returns {{ center: number, edge: number }}
 */
export function calculateThickness(prescription, index, diameter) {
    // 1. Find closest index in chart
    const indices = [1.50, 1.60, 1.67, 1.74]
    const closestIndex = indices.reduce((prev, curr) =>
        Math.abs(curr - index) < Math.abs(prev - index) ? curr : prev
    )

    // 2. Get data points for this index
    const dataPoints = HOYA_CHART[closestIndex]

    // 3. Find surrounding points for interpolation
    // Sort descending (High Plus -> High Minus) e.g., +4, +2, -2, -4
    const sortedData = [...dataPoints].sort((a, b) => b.p - a.p)

    let upper = sortedData[0]
    let lower = sortedData[sortedData.length - 1]

    for (let i = 0; i < sortedData.length - 1; i++) {
        if (prescription <= sortedData[i].p && prescription >= sortedData[i + 1].p) {
            upper = sortedData[i]
            lower = sortedData[i + 1]
            break
        }
    }

    // 4. Interpolate Base Values (CT and ET from chart)
    let baseCT, baseET

    if (prescription > upper.p) {
        // Extrapolate above max (use max point)
        baseCT = upper.ct
        baseET = upper.et
    } else if (prescription < lower.p) {
        // Extrapolate below min (use min point or formula trend)
        baseCT = lower.ct
        baseET = lower.et
    } else {
        // Interpolate between upper and lower
        const range = upper.p - lower.p
        const t = (upper.p - prescription) / range // 0.0 at upper, 1.0 at lower

        baseCT = lerp(upper.ct, lower.ct, t)
        baseET = lerp(upper.et, lower.et, t)
    }

    // 5. Apply Diameter Correction
    // Chart reference diameters: 60mm for (+) Plus, 65mm for (-) Minus
    let refDiameter = (prescription > 0) ? 60 : 65

    // Correction factor: Thickness roughly proportional to square of diameter
    // But for simplicity and safety, linear scaling for small changes
    const scale = diameter / refDiameter
    const thicknessFactor = (scale * scale) // Area-based scaling approx

    if (prescription < 0) {
        // Minus Lens: Edge thickness scales with diameter
        // CT is constant (min limit), ET scales
        // Formula: ET = CT + Sagitta_at_Diameter
        // Sagitta scales with D^2
        // So (ET - CT) is the sagitta part
        const sagitta = baseET - baseCT
        const newSagitta = sagitta * thicknessFactor
        return {
            center: baseCT,
            edge: baseCT + newSagitta
        }
    } else {
        // Plus Lens: Center thickness scales with diameter
        // ET is constant (min limit), CT scales
        // Formula: CT = ET + Sagitta_at_Diameter
        const sagitta = baseCT - baseET
        const newSagitta = sagitta * thicknessFactor
        return {
            center: baseET + newSagitta,
            edge: baseET
        }
    }
}
