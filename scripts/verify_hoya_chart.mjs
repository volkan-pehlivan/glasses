import { calculateThickness } from '../src/utils/lensCalculations.js';

// ─── Ground Truth Data (From Image) ─────────────────────────────
// Note: Image text says "(-) values are for 65mm, (+) values are for 60mm"
const CHART_DATA = [
    // 1.50 Index
    { idx: 1.50, p: 4.0, d: 60, expCT: 4.5, expET: 0.8 },
    { idx: 1.50, p: 2.0, d: 60, expCT: 2.7, expET: 0.8 },
    { idx: 1.50, p: -2.0, d: 65, expCT: 2.0, expET: 4.9 },
    { idx: 1.50, p: -4.0, d: 65, expCT: 2.0, expET: 8.0 },

    // 1.60 Index
    { idx: 1.60, p: 4.0, d: 60, expCT: 3.7, expET: 0.8 },
    { idx: 1.60, p: -2.0, d: 65, expCT: 1.0, expET: 2.7 },
    { idx: 1.60, p: -4.0, d: 65, expCT: 1.0, expET: 4.4 },
    { idx: 1.60, p: -6.0, d: 65, expCT: 1.0, expET: 6.3 },

    // 1.67 Index
    { idx: 1.67, p: 4.0, d: 60, expCT: 3.2, expET: 0.8 },
    { idx: 1.67, p: -4.0, d: 65, expCT: 1.0, expET: 4.0 },
    { idx: 1.67, p: -6.0, d: 65, expCT: 1.0, expET: 5.7 },

    // 1.74 Index
    { idx: 1.74, p: 4.0, d: 60, expCT: 3.0, expET: 0.8 },
    { idx: 1.74, p: -4.0, d: 65, expCT: 1.0, expET: 3.8 },
    { idx: 1.74, p: -8.0, d: 65, expCT: 1.0, expET: 6.5 },
];

console.log("\n🧪 VERIFYING HOYA CHART VALUES\n");
console.log("| Index | Power | Dia | Field | Chart | Calc | Diff | Status |");
console.log("|---|---|---|---|---|---|---|---|");

CHART_DATA.forEach(row => {
    const res = calculateThickness(row.p, row.idx, row.d);

    // Check Center Thickness (CT)
    const ctDiff = (res.center - row.expCT).toFixed(1);
    const ctStatus = Math.abs(ctDiff) <= 0.2 ? "✅" : "⚠️";

    // Check Edge Thickness (ET)
    const etDiff = (res.edge - row.expET).toFixed(1);
    const etStatus = Math.abs(etDiff) <= 0.2 ? "✅" : "⚠️";

    // For Minus lenses, CT is constant min. Focus on ET.
    // For Plus lenses, ET is constant min. Focus on CT.
    if (row.p < 0) {
        console.log(`| ${row.idx.toFixed(2)} | ${row.p} | ${row.d} | **ET** | ${row.expET} | ${res.edge.toFixed(1)} | ${etDiff} | ${etStatus} |`);
        // console.log(`|       |      |    | CT     | ${row.expCT} | ${res.center.toFixed(1)} | ${ctDiff} | ${ctStatus} |`);
    } else {
        console.log(`| ${row.idx.toFixed(2)} | +${row.p} | ${row.d} | **CT** | ${row.expCT} | ${res.center.toFixed(1)} | ${ctDiff} | ${ctStatus} |`);
    }
});
