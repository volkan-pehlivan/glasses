/**
 * HOYA thickness formula
 * Calculates center and edge thickness based on prescription, refractive index, and diameter.
 * 
 * @param {number} prescription - Lens power in diopters (negative for myopia, positive for hyperopia)
 * @param {number} index - Refractive index (1.50, 1.60, 1.67, 1.74)
 * @param {number} diameter - Lens diameter in mm
 * @returns {{ center: number, edge: number }} Thickness values in mm
 */
export function calculateThickness(prescription, index, diameter) {
    const D = diameter
    const P = Math.abs(prescription)
    const n = index

    // HOYA formula with prescription-dependent divisor
    let divisor
    if (n <= 1.53) {
        divisor = 5700
        if (P >= 8) divisor += 900
    } else if (n <= 1.63) {
        divisor = 8000
        if (P >= 6) divisor -= 300
    } else if (n <= 1.70) {
        divisor = 8200
        if (P >= 6) divisor -= 300
    } else {
        divisor = 8300
        if (P >= 6) divisor -= 300
    }

    // HOYA uses index-dependent minimum center thickness
    const minCenterThickness = (n <= 1.53) ? 2.0 : 1.0

    const addition = (D * D * P) / (divisor * (n - 1))

    if (prescription < 0) {
        return {
            center: minCenterThickness,
            edge: minCenterThickness + addition
        }
    } else if (prescription > 0) {
        return {
            center: minCenterThickness + addition,
            edge: minCenterThickness
        }
    }

    return {
        center: minCenterThickness,
        edge: minCenterThickness
    }
}
