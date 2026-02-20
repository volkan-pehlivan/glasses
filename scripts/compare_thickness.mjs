// Comparison Script: Old Generic vs New HOYA
// Logic extracted from commit eaa0dc87c6a5897b832279a67f2e15b881ca7387 (Old)
// and current src/utils/lensCalculations.js (New)

// ---------------------------------------------------------
// 1. OLD LOGIC (Generic Geometric / Surface Power)
// ---------------------------------------------------------
function calculateOld(params) {
    const { diameter, prescription, index, baseCurve = 4.0, edgeThickness = 1.0 } = params;

    // Physics-based calculation
    const radius = diameter / 2;
    const n = index;
    const frontSurfacePower = baseCurve;
    const R1 = ((n - 1) / frontSurfacePower) * 1000;
    const backSurfacePower = prescription - frontSurfacePower;

    let R2;
    if (Math.abs(backSurfacePower) < 0.001) R2 = 10000;
    else R2 = Math.abs(((n - 1) / backSurfacePower) * 1000);

    // Sagitta
    let frontSag = (radius >= R1) ? (radius * radius) / (2 * R1) : R1 - Math.sqrt(R1 * R1 - radius * radius);
    let backSag = (radius >= R2) ? (radius * radius) / (2 * R2) : R2 - Math.sqrt(R2 * R2 - radius * radius);

    let center, edge;

    if (prescription < 0) { // Myopia
        center = Math.max(1.0, edgeThickness);
        edge = center + frontSag + backSag; // Approximation of edge for comparison
    } else { // Hyperopia / Plano
        edge = Math.max(1.0, edgeThickness);
        center = edge + frontSag + backSag;
    }

    return { center, edge };
}

// ---------------------------------------------------------
// 2. NEW LOGIC (HOYA Approximate Formula)
// ---------------------------------------------------------
function calculateNew(params) {
    const { diameter, prescription, index } = params;
    const D = diameter;
    const P = Math.abs(prescription);
    const n = index;

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

    const minCenterThickness = (n <= 1.53) ? 2.0 : 1.0;
    const addition = (D * D * P) / (divisor * (n - 1));

    if (prescription < 0) {
        return {
            center: minCenterThickness,
            edge: minCenterThickness + addition
        };
    } else {
        return {
            center: minCenterThickness + addition,
            edge: minCenterThickness
        };
    }
}

// ---------------------------------------------------------
// COMPARISON RUNNER
// ---------------------------------------------------------
const testCases = [
    { label: "Myopia Low (-2.00)", p: -2.0, idx: 1.60, dia: 65 },
    { label: "Myopia High (-6.00)", p: -6.0, idx: 1.67, dia: 65 },
    { label: "Hyperopia Low (+2.00)", p: 2.0, idx: 1.60, dia: 65 },
    { label: "Hyperopia High (+5.00)", p: 5.0, idx: 1.67, dia: 65 }
];

console.log(`\nCOMPARING THICKNESS (Old Geometric vs New HOYA)\n`);
console.log(`| Case | Method | Center (mm) | Edge (mm) |`);
console.log(`|---|---|---|---|`);

testCases.forEach(t => {
    const oldRes = calculateOld({ prescription: t.p, index: t.idx, diameter: t.dia, baseCurve: 5.0, edgeThickness: 1.1 });
    const newRes = calculateNew({ prescription: t.p, index: t.idx, diameter: t.dia });

    console.log(`| **${t.label}** | Old (Geo) | ${oldRes.center.toFixed(2)} | ${oldRes.edge.toFixed(2)} |`);
    console.log(`| | New (HOYA) | ${newRes.center.toFixed(2)} | ${newRes.edge.toFixed(2)} |`);
    console.log(`| | *Diff* | *${(newRes.center - oldRes.center).toFixed(2)}* | *${(newRes.edge - oldRes.edge).toFixed(2)}* |`);
});
