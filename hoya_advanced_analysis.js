// Advanced analysis - check if divisor depends on prescription strength

const hoyaData = [
  // -2.00D
  { prescription: -2.0, index: 1.50, diameter: 65, CT: 2.0, ET: 4.9 },
  { prescription: -2.0, index: 1.60, diameter: 65, CT: 1.0, ET: 2.7 },
  { prescription: -2.0, index: 1.67, diameter: 65, CT: 1.0, ET: 2.5 },
  { prescription: -2.0, index: 1.74, diameter: 65, CT: 1.0, ET: 2.3 },
  
  // -4.00D
  { prescription: -4.0, index: 1.50, diameter: 65, CT: 2.0, ET: 8.0 },
  { prescription: -4.0, index: 1.60, diameter: 65, CT: 1.0, ET: 4.4 },
  { prescription: -4.0, index: 1.67, diameter: 65, CT: 1.0, ET: 4.0 },
  { prescription: -4.0, index: 1.74, diameter: 65, CT: 1.0, ET: 3.8 },
  
  // -6.00D
  { prescription: -6.0, index: 1.50, diameter: 65, CT: 2.0, ET: 11.1 },
  { prescription: -6.0, index: 1.60, diameter: 65, CT: 1.0, ET: 6.3 },
  { prescription: -6.0, index: 1.67, diameter: 65, CT: 1.0, ET: 5.7 },
  { prescription: -6.0, index: 1.74, diameter: 65, CT: 1.0, ET: 5.4 },
  
  // -8.00D
  { prescription: -8.0, index: 1.50, diameter: 65, CT: 2.0, ET: 12.2 },
  { prescription: -8.0, index: 1.60, diameter: 65, CT: 1.0, ET: 8.3 },
  { prescription: -8.0, index: 1.67, diameter: 65, CT: 1.0, ET: 7.5 },
  { prescription: -8.0, index: 1.74, diameter: 65, CT: 1.0, ET: 6.5 },
];

// Calculate divisor for each point
const dataWithDivisors = hoyaData.map(d => {
  const P = Math.abs(d.prescription);
  const n = d.index;
  const D = d.diameter;
  const actualAddition = d.ET - d.CT;
  const divisor = (D * D * P) / (actualAddition * (n - 1));
  return { ...d, divisor, addition: actualAddition };
});

console.log('=== DIVISOR vs PRESCRIPTION ANALYSIS ===\n');

// Group by prescription to see pattern
const prescriptions = [-2, -4, -6, -8];

prescriptions.forEach(rx => {
  console.log(`Prescription ${rx}D:`);
  const dataForRx = dataWithDivisors.filter(d => d.prescription === rx);
  dataForRx.forEach(d => {
    console.log(`  Index ${d.index}: divisor=${d.divisor.toFixed(0)}`);
  });
  console.log('');
});

// Try prescription-dependent formula
console.log('\n=== TESTING PRESCRIPTION-DEPENDENT DIVISOR ===\n');

function getDivisor(index, prescription) {
  const P = Math.abs(prescription);
  
  // Base divisor by index
  let baseDivisor;
  if (index <= 1.53) baseDivisor = 5700;
  else if (index <= 1.63) baseDivisor = 8000;
  else if (index <= 1.70) baseDivisor = 8200;
  else baseDivisor = 8300;
  
  // Adjust for high prescriptions (especially for 1.50 index)
  if (index <= 1.53 && P >= 8) {
    baseDivisor += 900; // Increase divisor for -8D with 1.50 index
  } else if (index > 1.53 && P >= 6) {
    baseDivisor -= 300; // Decrease divisor for high prescriptions with higher indices
  }
  
  return baseDivisor;
}

function calculateET(prescription, index, diameter, CT) {
  const D = diameter;
  const P = Math.abs(prescription);
  const n = index;
  const divisor = getDivisor(index, prescription);
  const addition = (D * D * P) / (divisor * (n - 1));
  return CT + addition;
}

let totalError = 0;
let maxError = 0;

hoyaData.forEach(d => {
  const calcET = calculateET(d.prescription, d.index, d.diameter, d.CT);
  const error = Math.abs(calcET - d.ET);
  totalError += error;
  maxError = Math.max(maxError, error);
  
  console.log(`${d.prescription}D, ${d.index}: HOYA=${d.ET}mm, Calc=${calcET.toFixed(2)}mm, Error=${error.toFixed(2)}mm`);
});

console.log(`\nAverage Error: ${(totalError / hoyaData.length).toFixed(3)}mm`);
console.log(`Maximum Error: ${maxError.toFixed(3)}mm`);

// Try a simpler approach: use median divisor for each index
console.log('\n\n=== USING MEDIAN DIVISORS ===\n');

const indices = [1.50, 1.60, 1.67, 1.74];
const medianDivisors = {};

indices.forEach(idx => {
  const divisors = dataWithDivisors
    .filter(d => d.index === idx)
    .map(d => d.divisor)
    .sort((a, b) => a - b);
  
  const mid = Math.floor(divisors.length / 2);
  medianDivisors[idx] = divisors.length % 2 === 0
    ? (divisors[mid - 1] + divisors[mid]) / 2
    : divisors[mid];
  
  console.log(`Index ${idx}: median divisor = ${medianDivisors[idx].toFixed(0)}`);
});

function calculateETMedian(prescription, index, diameter, CT) {
  const D = diameter;
  const P = Math.abs(prescription);
  const n = index;
  const divisor = medianDivisors[index];
  const addition = (D * D * P) / (divisor * (n - 1));
  return CT + addition;
}

console.log('\nResults with median divisors:');
totalError = 0;
maxError = 0;

hoyaData.forEach(d => {
  const calcET = calculateETMedian(d.prescription, d.index, d.diameter, d.CT);
  const error = Math.abs(calcET - d.ET);
  totalError += error;
  maxError = Math.max(maxError, error);
  
  if (error > 0.3) {
    console.log(`${d.prescription}D, ${d.index}: HOYA=${d.ET}mm, Calc=${calcET.toFixed(2)}mm, Error=${error.toFixed(2)}mm`);
  }
});

console.log(`\nAverage Error: ${(totalError / hoyaData.length).toFixed(3)}mm`);
console.log(`Maximum Error: ${maxError.toFixed(3)}mm`);

console.log('\n*** RECOMMENDED DIVISORS ***');
console.log('1.50 index: 5730');
console.log('1.60 index: 8000');
console.log('1.67 index: 8230');
console.log('1.74 index: 8070');
