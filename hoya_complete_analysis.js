// Complete HOYA data analysis with all prescriptions and indices

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

console.log('=== COMPLETE HOYA DATA ANALYSIS ===\n');

// Calculate the correct divisor for each data point
hoyaData.forEach(data => {
  const { prescription, index, diameter, CT, ET } = data;
  const P = Math.abs(prescription);
  const n = index;
  const D = diameter;
  
  const actualAddition = ET - CT;
  const correctDivisor = (D * D * P) / (actualAddition * (n - 1));
  
  console.log(`${prescription}D, ${index} index: Addition=${actualAddition.toFixed(2)}mm, Divisor=${correctDivisor.toFixed(0)}`);
});

// Group by index to find patterns
console.log('\n=== DIVISOR ANALYSIS BY INDEX ===\n');

const indices = [1.50, 1.60, 1.67, 1.74];

indices.forEach(idx => {
  const dataForIndex = hoyaData.filter(d => d.index === idx);
  const divisors = dataForIndex.map(d => {
    const P = Math.abs(d.prescription);
    const n = d.index;
    const D = d.diameter;
    const actualAddition = d.ET - d.CT;
    return (D * D * P) / (actualAddition * (n - 1));
  });
  
  const avgDivisor = divisors.reduce((a, b) => a + b, 0) / divisors.length;
  const minDivisor = Math.min(...divisors);
  const maxDivisor = Math.max(...divisors);
  
  console.log(`Index ${idx}:`);
  console.log(`  Average divisor: ${avgDivisor.toFixed(0)}`);
  console.log(`  Range: ${minDivisor.toFixed(0)} - ${maxDivisor.toFixed(0)}`);
  console.log(`  Divisors: ${divisors.map(d => d.toFixed(0)).join(', ')}`);
  console.log('');
});

// Test with optimized divisors
console.log('\n=== TESTING OPTIMIZED DIVISORS ===\n');

function calculateWithDivisor(prescription, index, diameter, CT, divisor) {
  const D = diameter;
  const P = Math.abs(prescription);
  const n = index;
  const addition = (D * D * P) / (divisor * (n - 1));
  const calculatedET = CT + addition;
  return calculatedET;
}

// Try different divisor strategies
const strategies = [
  { name: 'Fixed per index', divisors: { 1.50: 5750, 1.60: 8200, 1.67: 8400, 1.74: 8800 } },
  { name: 'Optimized avg', divisors: { 1.50: 5700, 1.60: 7900, 1.67: 8200, 1.74: 8600 } },
  { name: 'Linear interpolation', divisors: { 1.50: 5700, 1.60: 7800, 1.67: 8300, 1.74: 8700 } },
];

strategies.forEach(strategy => {
  console.log(`\n*** ${strategy.name} ***`);
  let totalError = 0;
  let maxError = 0;
  let errorCount = 0;
  
  hoyaData.forEach(data => {
    const { prescription, index, diameter, CT, ET } = data;
    const divisor = strategy.divisors[index];
    const calculatedET = calculateWithDivisor(prescription, index, diameter, CT, divisor);
    const error = Math.abs(calculatedET - ET);
    
    totalError += error;
    maxError = Math.max(maxError, error);
    errorCount++;
    
    if (error > 0.2) {
      console.log(`  ${prescription}D, ${index}: HOYA=${ET}mm, Calc=${calculatedET.toFixed(2)}mm, Error=${error.toFixed(2)}mm`);
    }
  });
  
  console.log(`  Average Error: ${(totalError / errorCount).toFixed(3)}mm`);
  console.log(`  Maximum Error: ${maxError.toFixed(3)}mm`);
});

// Try to find a formula that relates divisor to index
console.log('\n\n=== FINDING DIVISOR FORMULA ===\n');

// Calculate average divisor for each index
const avgDivisors = {};
indices.forEach(idx => {
  const dataForIndex = hoyaData.filter(d => d.index === idx);
  const divisors = dataForIndex.map(d => {
    const P = Math.abs(d.prescription);
    const n = d.index;
    const D = d.diameter;
    const actualAddition = d.ET - d.CT;
    return (D * D * P) / (actualAddition * (n - 1));
  });
  avgDivisors[idx] = divisors.reduce((a, b) => a + b, 0) / divisors.length;
});

console.log('Average divisors by index:');
Object.entries(avgDivisors).forEach(([idx, div]) => {
  console.log(`  ${idx}: ${div.toFixed(0)}`);
});

// Try linear relationship: divisor = a * index + b
const x = indices;
const y = indices.map(idx => avgDivisors[idx]);

const n = x.length;
const sumX = x.reduce((a, b) => a + b, 0);
const sumY = y.reduce((a, b) => a + b, 0);
const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
const intercept = (sumY - slope * sumX) / n;

console.log(`\nLinear formula: divisor = ${slope.toFixed(0)} * index + ${intercept.toFixed(0)}`);
console.log('Predicted divisors:');
indices.forEach(idx => {
  const predicted = slope * idx + intercept;
  console.log(`  ${idx}: ${predicted.toFixed(0)} (actual avg: ${avgDivisors[idx].toFixed(0)})`);
});
