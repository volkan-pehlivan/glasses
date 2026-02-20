/**
 * Lens Shape Extractor (Node.js) - v4 (Restored "Good" Version)
 * 
 * Config matches the pre-Python state exactly:
 * - 720 Angular Steps (High precision)
 * - 5 Smoothing Iterations (Iterative Gaussian)
 * - 180 Rotation support
 *
 * Usage: node scripts/trace_lens.mjs public/lenses01.png [rotation_degrees]
 */

import { createReadStream, writeFileSync } from 'fs';
import { PNG } from 'pngjs';
import { basename, dirname, join } from 'path';

// ── Configuration ──────────────────────────────────────────
const THRESHOLD = 240;       // Ensure detailed capture
const TARGET_POINTS = 120;   // Number of output points
const ANGULAR_STEPS = 720;   // High resolution
const SMOOTH_ITERATIONS = 5; // 5 Iterations (Smooth)

// ── Main ───────────────────────────────────────────────────
const inputPath = process.argv[2] || 'public/lenses01.png';
const rotationArg = parseFloat(process.argv[3]) || 0;

const baseName = basename(inputPath, '.png');
const outDir = dirname(inputPath);

console.log(`\n${'='.repeat(50)}`);
console.log(`Lens Shape Extractor (Node.js) v4 (Restored)`);
console.log(`${'='.repeat(50)}`);
console.log(`Input: ${inputPath}`);
console.log(`Rotation: ${rotationArg}°`);

const png = await readPNG(inputPath);
const { width, height, data } = png;

// 1. Find dark pixels
const darkPixels = findDarkPixels(data, width, height, THRESHOLD);

// 2. Centroid
const centroid = computeCentroid(darkPixels);

// 3. Angular sweep (High Res)
const rawContour = angularSweep(darkPixels, centroid, ANGULAR_STEPS);
console.log(`Angular contour: ${rawContour.length} points`);

// 4. Simplify (Douglas-Peucker) - minimal
// We use a small epsilon to keep shape, but smoothing will handle the rest.
const simplified = douglasPeucker(rawContour, 0.8);

// 5. Normalize
let { points: normalized, widthRatio } = normalizePoints(simplified);

// 6. Rotate
if (rotationArg !== 0) {
    normalized = rotatePoints(normalized, rotationArg * Math.PI / 180);
}

// 7. Resample to TARGET_POINTS
let finalPoints = resamplePoints(normalized, TARGET_POINTS);

// 8. Apply Smoothing (The key "v4" feature)
if (SMOOTH_ITERATIONS > 0) {
    finalPoints = smoothPoints(finalPoints, SMOOTH_ITERATIONS);
    console.log(`Applied ${SMOOTH_ITERATIONS} smoothing passes`);
}

// 9. Output
const jsonPath = join(outDir, `${baseName}_shape.json`);
const svgPath = join(outDir, `${baseName}_traced.svg`);

saveJSON(finalPoints, widthRatio, jsonPath);
saveSVG(finalPoints, svgPath);
printJSSnippet(finalPoints, widthRatio, baseName, rotationArg);

console.log(`\nDone.`);

// ── Helpers ────────────────────────────────────────────────

function readPNG(path) {
    return new Promise((resolve, reject) => {
        const stream = createReadStream(path);
        stream.pipe(new PNG())
            .on('parsed', function () { resolve(this); })
            .on('error', reject);
    });
}

function findDarkPixels(data, w, h, thresh) {
    const pixels = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            // Original logic did NOT have alpha check, but it works better usually without it for simple PNGs 
            // unless image has alpha. lenses01.png likely has alpha. 
            // I will keep the alpha check just in case, it shouldn't hurt "good" logic.
            // Wait, if "good" logic had it or not? 
            // The "good" logic trace_lens.mjs I saw in code item had:
            // "const gray = ..." directly.
            // I will revert to NO alpha check to be EXACTLY like v4.
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            if (gray < thresh) pixels.push({ x, y });
        }
    }
    return pixels;
}

function computeCentroid(pixels) {
    let sx = 0, sy = 0;
    for (const p of pixels) { sx += p.x; sy += p.y; }
    return { x: sx / pixels.length, y: sy / pixels.length };
}

function angularSweep(pixels, centroid, steps) {
    const pixelData = pixels.map(p => {
        const dx = p.x - centroid.x;
        const dy = p.y - centroid.y;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        return { x: p.x, y: p.y, angle, dist: dx * dx + dy * dy };
    });

    const contour = [];
    const step = (2 * Math.PI) / steps;

    for (let i = 0; i < steps; i++) {
        const minA = i * step;
        const maxA = (i + 1) * step;

        // Find outermost pixel in this angular sector
        let best = null;
        let maxDist = -1;

        for (const p of pixelData) {
            if (p.angle >= minA && p.angle < maxA) {
                if (p.dist > maxDist) {
                    maxDist = p.dist;
                    best = p;
                }
            }
        }
        if (best) contour.push({ x: best.x, y: best.y });
    }
    return contour;
}

function normalizePoints(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });

    const w = maxX - minX;
    const h = maxY - minY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = Math.max(w, h);

    const norm = points.map(p => ({
        x: (p.x - cx) / scale,
        // Y is Down in image.
        // LensModel rotates X+90, so Local Z -> World -Y (Down).
        // To get Top of Image (Small Y) to be Top of Lens (Up/High Y),
        // we need Small Y -> Negative Z -> Rotates to Positive Y.
        z: (p.y - cy) / scale
    }));

    return { points: norm, widthRatio: w / h };
}

function rotatePoints(points, rad) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return points.map(p => ({
        x: p.x * cos - p.z * sin,
        z: p.x * sin + p.z * cos
    }));
}

function resamplePoints(points, count) {
    const dists = [];
    let totalLen = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const d = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
        dists.push(d);
        totalLen += d;
    }

    const step = totalLen / count;
    const result = [];

    let currentDist = 0;
    let idx = 0;
    let p1 = points[0];
    let p2 = points[1];
    let segLen = dists[0];

    for (let i = 0; i < count; i++) {
        const target = i * step;
        while (currentDist + segLen < target) {
            currentDist += segLen;
            idx = (idx + 1) % points.length;
            p1 = points[idx];
            p2 = points[(idx + 1) % points.length];
            segLen = dists[idx];
        }
        const t = (target - currentDist) / segLen;
        result.push({
            x: p1.x + (p2.x - p1.x) * t,
            z: p1.z + (p2.z - p1.z) * t
        });
    }
    return result;
}

function douglasPeucker(points, tol) {
    if (points.length < 3) return points;
    let maxDist = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpDist(points[i], start, end);
        if (d > maxDist) { maxDist = d; index = i; }
    }
    if (maxDist > tol) {
        const left = douglasPeucker(points.slice(0, index + 1), tol);
        const right = douglasPeucker(points.slice(index), tol);
        return left.slice(0, -1).concat(right);
    }
    return [start, end];
}

function perpDist(p, l1, l2) {
    const l2_l1 = { x: l2.x - l1.x, y: l2.y - l1.y };
    const hyp = Math.sqrt(l2_l1.x ** 2 + l2_l1.y ** 2);
    if (hyp === 0) return Math.sqrt((p.x - l1.x) ** 2 + (p.y - l1.y) ** 2);
    return Math.abs(l2_l1.y * p.x - l2_l1.x * p.y + l2.x * l1.y - l2.y * l1.x) / hyp;
}

// ── Smoothing (Gaussian-ish) ──
function smoothPoints(points, iter) {
    let current = [...points];
    for (let k = 0; k < iter; k++) {
        const next = [];
        const L = current.length;
        for (let i = 0; i < L; i++) {
            const pBox = current[(i - 1 + L) % L];
            const pCur = current[i];
            const pFwd = current[(i + 1) % L];

            // Simple averaging [0.25, 0.5, 0.25]
            next.push({
                x: pBox.x * 0.25 + pCur.x * 0.5 + pFwd.x * 0.25,
                z: pBox.z * 0.25 + pCur.z * 0.5 + pFwd.z * 0.25
            });
        }
        current = next;
    }
    return current;
}

function saveJSON(points, ratio, path) {
    writeFileSync(path, JSON.stringify({ widthRatio: ratio, points }, null, 2));
}

function saveSVG(points, path) {
    // ... basic svg ...
    const size = 400; const m = 40; const s = size - 2 * m;
    const pathD = points.map((p, i) => {
        const sx = m + (p.x + 0.5) * s;
        const sy = m + (-p.z + 0.5) * s;
        return (i === 0 ? 'M' : 'L') + ` ${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' ') + ' Z';
    writeFileSync(path, `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#eee"/><path d="${pathD}" fill="#ccc" stroke="red" stroke-width="2"/></svg>`);
}

function printJSSnippet(points, ratio, name) {
    console.log(`\n// ─── PNG-Extracted Shape: ${name} (v4 Restored) ───`);
    console.log(`// Width Ratio: ${ratio.toFixed(4)}`);
    console.log(`export function generate${name.replace(/[^a-zA-Z0-9]/g, '')}(/* numPoints = ${points.length} */) {`);
    console.log(`    return [`);
    for (let i = 0; i < points.length; i += 4) {
        const line = points.slice(i, i + 4).map(p => `{x:${p.x.toFixed(5)},z:${p.z.toFixed(5)}}`).join(', ');
        console.log(`        ${line},`);
    }
    console.log(`    ];`);
    console.log(`}`);
}
