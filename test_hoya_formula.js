// Test HOYA formula with index AND prescription-dependent divisor

function calculateThickness(prescription, index, diameter, minCenterThickness = 1.5) {
  const D = diameter;
  const P = Math.abs(prescription);
  const n = index;
  
  // HOYA formula with index AND prescription-dependent divisor
  // (reverse-engineered from complete HOYA dataset)
  let divisor;
  
  if (n <= 1.53) {
    // 1.50 index
    divisor = 5700;
    if (P >= 8) divisor += 900; // Adjust for very high prescriptions
  } else if (n <= 1.63) {
    // 1.60 index
    divisor = 8000;
    if (P >= 6) divisor -= 300; // Adjust for high prescriptions
  } else if (n <= 1.70) {
    // 1.67 index
    divisor = 8200;
    if (P >= 6) divisor -= 300;
  } else {
    // 1.74+ index
    divisor = 8300;
    if (P >= 6) divisor -= 300;
  }
  
  const addition = (D * D * P) / (divisor * (n - 1));
  
  let centerT, edgeT;
  
  if (prescription < 0) {
    // Minus lens: thin center, thick edges
    centerT = minCenterThickness;
    edgeT = centerT + addition;
  } else if (prescription > 0) {
    // Plus lens: thick center, thin edges
    edgeT = minCenterThickness;
    centerT = edgeT + addition;
  } else {
    centerT = minCenterThickness;
    edgeT = minCenterThickness;
  }
  
  return { center: centerT, edge: edgeT, addition, divisor };
}

console.log('=== COMPLETE HOYA DATA COMPARISON ===\n');

const hoyaTests = [
  // -2D prescriptions
  { prescription: -2.0, index: 1.50, diameter: 65, hoyaCT: 2.0, hoyaET: 4.9 },
  { prescription: -2.0, index: 1.60, diameter: 65, hoyaCT: 1.0, hoyaET: 2.7 },
  { prescription: -2.0, index: 1.67, diameter: 65, hoyaCT: 1.0, hoyaET: 2.5 },
  { prescription: -2.0, index: 1.74, diameter: 65, hoyaCT: 1.0, hoyaET: 2.3 },
  
  // -4D prescriptions
  { prescription: -4.0, index: 1.50, diameter: 65, hoyaCT: 2.0, hoyaET: 8.0 },
  { prescription: -4.0, index: 1.60, diameter: 65, hoyaCT: 1.0, hoyaET: 4.4 },
  { prescription: -4.0, index: 1.67, diameter: 65, hoyaCT: 1.0, hoyaET: 4.0 },
  { prescription: -4.0, index: 1.74, diameter: 65, hoyaCT: 1.0, hoyaET: 3.8 },
  
  // -6D prescriptions
  { prescription: -6.0, index: 1.50, diameter: 65, hoyaCT: 2.0, hoyaET: 11.1 },
  { prescription: -6.0, index: 1.60, diameter: 65, hoyaCT: 1.0, hoyaET: 6.3 },
  { prescription: -6.0, index: 1.67, diameter: 65, hoyaCT: 1.0, hoyaET: 5.7 },
  { prescription: -6.0, index: 1.74, diameter: 65, hoyaCT: 1.0, hoyaET: 5.4 },
  
  // -8D prescriptions
  { prescription: -8.0, index: 1.50, diameter: 65, hoyaCT: 2.0, hoyaET: 12.2 },
  { prescription: -8.0, index: 1.60, diameter: 65, hoyaCT: 1.0, hoyaET: 8.3 },
  { prescription: -8.0, index: 1.67, diameter: 65, hoyaCT: 1.0, hoyaET: 7.5 },
  { prescription: -8.0, index: 1.74, diameter: 65, hoyaCT: 1.0, hoyaET: 6.5 },
];

let totalError = 0;
let maxError = 0;
let errorCount = 0;

hoyaTests.forEach(test => {
  const { prescription, index, diameter, hoyaCT, hoyaET } = test;
  const result = calculateThickness(prescription, index, diameter, hoyaCT);
  
  const error = Math.abs(result.edge - hoyaET);
  totalError += error;
  maxError = Math.max(maxError, error);
  errorCount++;
  
  console.log(`${prescription}D, ${index} index, ${diameter}mm (divisor: ${result.divisor}):`);
  console.log(`  HOYA: CT=${hoyaCT}mm, ET=${hoyaET}mm`);
  console.log(`  Ours: CT=${result.center.toFixed(2)}mm, ET=${result.edge.toFixed(2)}mm`);
  console.log(`  Error: ${error.toFixed(3)}mm`);
  console.log('');
});

console.log('\n=== SUMMARY ===');
console.log(`Average Error: ${(totalError / errorCount).toFixed(3)}mm`);
console.log(`Maximum Error: ${maxError.toFixed(3)}mm`);
console.log(`Total Tests: ${errorCount}`);
