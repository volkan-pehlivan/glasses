# 📋 User Data Collection & Calculation Guide

## Complete Guide: From User Input to Lens Thickness

This document explains exactly what data to collect from users, why you need it, and how to use it in calculations.

---

## 🎯 Essential Data (Minimum Required)

### 1. **Prescription Power (Reçete Gücü)** 
**Turkish:** "Gözlük Numarası" or "Dioptri"

**What to ask:**
```
"Reçete gücünüz nedir?" 
Range: -10.00 to +10.00 D
Step: 0.25 D
```

**Why you need it:**
- Primary factor determining lens thickness
- Negative = Myopic (nearsighted) - thick edges
- Positive = Hyperopic (farsighted) - thick center

**How to use:**
```javascript
const prescription = -3.00  // User input

// In calculation:
const thicknessAddition = (diameter² × |prescription|) / (2000 × (index - 1))
```

**Real example:**
- Patient: "Gözlük numaram -3.00"
- You use: `prescription = -3.00`

---

### 2. **Lens Diameter (Cam Çapı)**
**Turkish:** "Cam Çapı" or "Lens Genişliği"

**What to ask:**
```
"Çerçeve genişliği kaç mm?"
Range: 50-85 mm
Default: 70 mm (most common)
```

**Why you need it:**
- Larger diameter = thicker lens
- Determined by frame size
- Affects edge/center thickness significantly

**How to use:**
```javascript
const diameter = 70  // User input in mm

// In calculation:
const thicknessAddition = (diameter² × |prescription|) / (2000 × (index - 1))
```

**How to help user find it:**
```
"Çerçevenizin iç genişliğini ölçün"
"Standart çerçeveler: 50-55mm (küçük), 60-65mm (orta), 70-75mm (büyük)"
```

**Real example:**
- Patient brings frame: 65mm wide
- You use: `diameter = 65`

---

### 3. **Refractive Index (Kırılma İndeksi)**
**Turkish:** "Cam Malzemesi" or "İndeks"

**What to ask:**
```
"Hangi cam malzemesini tercih edersiniz?"

Options:
□ 1.50 - Standart Plastik (CR-39)
□ 1.56 - Orta İndeks
□ 1.60 - Yüksek İndeks
□ 1.67 - Çok İnce
□ 1.74 - Ultra İnce
□ 1.59 - Polikarbonat (Darbe Dayanıklı)
```

**Why you need it:**
- Higher index = thinner lens
- Material choice affects thickness significantly
- Price increases with index

**How to use:**
```javascript
const index = 1.60  // User selection

// In calculation:
const thicknessAddition = (diameter² × |prescription|) / (2000 × (index - 1))
```

**Recommendation logic:**
```javascript
function recommendIndex(prescription) {
  const absPower = Math.abs(prescription)
  
  if (absPower <= 2.0) return 1.50  // Standart yeterli
  if (absPower <= 4.0) return 1.60  // Orta indeks önerilir
  if (absPower <= 6.0) return 1.67  // Yüksek indeks önerilir
  return 1.74  // Ultra ince gerekli
}
```

**Real example:**
- Patient: -6.00D prescription
- You recommend: 1.67 index
- Thickness reduction: ~30% vs 1.50

---

### 4. **Minimum Edge/Center Thickness (Minimum Kalınlık)**
**Turkish:** "Minimum Kalınlık"

**What to ask:**
```
"Minimum cam kalınlığı (güvenlik için):"
Range: 1.0-3.0 mm
Default: 1.5 mm (industry standard)
```

**Why you need it:**
- Safety requirement
- Prevents lens breakage
- Industry standard: 1.0-2.0mm

**How to use:**
```javascript
const minThickness = 1.5  // mm

// For minus lens:
centerThickness = minThickness
edgeThickness = centerThickness + thicknessAddition

// For plus lens:
edgeThickness = minThickness
centerThickness = edgeThickness + thicknessAddition
```

**Recommendations:**
```javascript
function recommendMinThickness(index, frameType) {
  if (index >= 1.67) return 1.0  // High index can be thinner
  if (frameType === 'rimless') return 2.0  // Rimless needs thicker
  return 1.5  // Standard
}
```

---

## 🎨 Optional Data (Enhanced Accuracy)

### 5. **Base Curve (Taban Eğrisi)**
**Turkish:** "Taban Eğrisi" or "Ön Yüzey Eğriliği"

**What to ask:**
```
"Taban eğrisi (varsa):"
Range: 2.0-8.0 D
Default: 4.0-6.0 D (typical)
```

**Why you need it:**
- For exact two-surface calculation
- Affects front surface curvature
- Professional lens design parameter

**How to use:**
```javascript
const baseCurve = 4.0  // Diopters

// Calculate front surface radius:
const R1 = ((index - 1) / baseCurve) × 1000  // mm

// Calculate back surface power:
const backPower = prescription - baseCurve

// Calculate back surface radius:
const R2 = ((index - 1) / backPower) × 1000  // mm

// Calculate sagitta for each:
const frontSag = R1 - Math.sqrt(R1² - radius²)
const backSag = R2 - Math.sqrt(R2² - radius²)

// Total thickness:
const totalSag = frontSag + backSag
```

**When to ask:**
- Professional mode
- When user has existing lens specs
- For maximum accuracy

**Default values if not provided:**
```javascript
function estimateBaseCurve(prescription) {
  if (prescription >= 0) {
    // Plus lens: higher base curve
    return 6.0 + (prescription / 2)
  } else {
    // Minus lens: lower base curve
    return 4.0
  }
}
```

---

### 6. **Frame Type (Çerçeve Tipi)**
**Turkish:** "Çerçeve Türü"

**What to ask:**
```
"Çerçeve tipi:"
□ Tam Çerçeve (Full Rim)
□ Yarım Çerçeve (Semi-Rimless)
□ Çerçevesiz (Rimless)
```

**Why you need it:**
- Affects minimum thickness requirements
- Rimless needs thicker lenses (safety)
- Affects recommendations

**How to use:**
```javascript
const frameType = 'full-rim'

function adjustMinThickness(baseMin, frameType, index) {
  if (frameType === 'rimless') {
    return Math.max(baseMin, 2.0)  // Minimum 2mm for rimless
  }
  if (frameType === 'semi-rimless') {
    return Math.max(baseMin, 1.8)
  }
  return baseMin
}
```

---

### 7. **Pupillary Distance (PD) (Göz Bebeği Mesafesi)**
**Turkish:** "Göz Bebeği Mesafesi (PD)"

**What to ask:**
```
"Göz bebeği mesafeniz (PD):"
Range: 54-74 mm
Average: 63 mm
```

**Why you need it:**
- For decentration calculation
- Affects thickness at edges
- Important for large frames

**How to use:**
```javascript
const pd = 63  // mm
const frameWidth = 70  // mm

// Calculate decentration:
const decentration = (frameWidth - pd) / 2

// Adjust thickness calculation:
const effectiveRadius = radius + decentration
```

**When to ask:**
- Large frames (>70mm)
- High prescriptions (>±4D)
- Professional fitting

---

### 8. **Cylinder & Axis (Astigmatism) (Silindir & Eksen)**
**Turkish:** "Astigmat Değeri"

**What to ask:**
```
"Astigmat var mı?"
Cylinder: -4.00 to +4.00 D
Axis: 0-180°
```

**Why you need it:**
- Affects thickness in different meridians
- Creates oval lens shape
- More complex calculation

**How to use:**
```javascript
const sphere = -3.00
const cylinder = -1.00
const axis = 90

// Calculate spherical equivalent for thickness estimate:
const sphericalEquivalent = sphere + (cylinder / 2)

// Use SE for approximate thickness:
const thickness = calculateThickness({
  prescription: sphericalEquivalent,
  diameter,
  index
})
```

**Advanced (exact):**
```javascript
// Calculate thickness at different meridians:
const thickness0 = calculateAtMeridian(sphere, 0)
const thickness90 = calculateAtMeridian(sphere + cylinder, 90)
const thicknessAtAxis = calculateAtMeridian(sphere + cylinder, axis)
```

---

## 📊 Complete Data Collection Form

### Basic Mode (Müşteri Modu)

```javascript
const basicForm = {
  prescription: {
    label: "Reçete Gücü (Dioptri)",
    type: "number",
    range: [-10, 10],
    step: 0.25,
    default: -3.0,
    required: true,
    help: "Gözlük reçetenizdeki SPH değeri"
  },
  
  diameter: {
    label: "Çerçeve Genişliği (mm)",
    type: "number",
    range: [50, 85],
    step: 1,
    default: 70,
    required: true,
    help: "Çerçevenizin iç genişliği"
  },
  
  index: {
    label: "Cam Malzemesi",
    type: "select",
    options: [
      { value: 1.50, label: "1.50 - Standart (En Ucuz)" },
      { value: 1.60, label: "1.60 - Orta İnce (Önerilen)" },
      { value: 1.67, label: "1.67 - Çok İnce" },
      { value: 1.74, label: "1.74 - Ultra İnce" }
    ],
    default: 1.60,
    required: true,
    help: "Yüksek indeks = daha ince cam"
  },
  
  minThickness: {
    label: "Minimum Kalınlık (mm)",
    type: "number",
    range: [1.0, 3.0],
    step: 0.1,
    default: 1.5,
    required: false,
    help: "Güvenlik için minimum kalınlık"
  }
}
```

### Professional Mode (Profesyonel Modu)

```javascript
const professionalForm = {
  ...basicForm,
  
  baseCurve: {
    label: "Taban Eğrisi (Base Curve)",
    type: "number",
    range: [2, 8],
    step: 0.25,
    default: 4.0,
    required: false,
    help: "Ön yüzey eğriliği (varsa)"
  },
  
  frameType: {
    label: "Çerçeve Tipi",
    type: "select",
    options: [
      { value: "full-rim", label: "Tam Çerçeve" },
      { value: "semi-rimless", label: "Yarım Çerçeve" },
      { value: "rimless", label: "Çerçevesiz" }
    ],
    default: "full-rim",
    required: false
  },
  
  pd: {
    label: "Göz Bebeği Mesafesi (PD)",
    type: "number",
    range: [54, 74],
    step: 1,
    default: 63,
    required: false,
    help: "İki göz bebeği arası mesafe"
  },
  
  cylinder: {
    label: "Silindir (Astigmat)",
    type: "number",
    range: [-4, 4],
    step: 0.25,
    default: 0,
    required: false,
    help: "Astigmat değeri (varsa)"
  },
  
  axis: {
    label: "Eksen",
    type: "number",
    range: [0, 180],
    step: 1,
    default: 90,
    required: false,
    help: "Astigmat ekseni (0-180°)"
  }
}
```

---

## 🔄 Complete Calculation Flow

### Step-by-Step Process

```javascript
// 1. Collect user data
const userData = {
  prescription: -3.00,    // From user
  diameter: 70,           // From user
  index: 1.60,           // From user
  minThickness: 1.5,     // From user or default
  baseCurve: null,       // Optional
  frameType: 'full-rim', // Optional
  pd: 63,                // Optional
  cylinder: 0,           // Optional
  axis: 90               // Optional
}

// 2. Validate data
function validateData(data) {
  const errors = []
  
  if (Math.abs(data.prescription) > 10) {
    errors.push("Reçete değeri çok yüksek")
  }
  
  if (data.diameter < 50 || data.diameter > 85) {
    errors.push("Çerçeve genişliği geçersiz")
  }
  
  if (data.index < 1.5 || data.index > 1.9) {
    errors.push("İndeks değeri geçersiz")
  }
  
  return errors
}

// 3. Generate recommendations
function generateRecommendations(data) {
  const recommendations = []
  const absPower = Math.abs(data.prescription)
  
  // Index recommendation
  if (absPower > 4 && data.index < 1.67) {
    recommendations.push({
      type: 'warning',
      message: `Yüksek reçete için 1.67 indeks önerilir`,
      benefit: 'Cam kalınlığı %30 azalır'
    })
  }
  
  // Diameter recommendation
  if (data.diameter > 70 && absPower > 3) {
    recommendations.push({
      type: 'info',
      message: 'Büyük çerçeve + yüksek reçete = kalın cam',
      benefit: 'Daha küçük çerçeve seçebilirsiniz'
    })
  }
  
  // Frame type recommendation
  if (data.frameType === 'rimless' && absPower > 4) {
    recommendations.push({
      type: 'warning',
      message: 'Çerçevesiz için yüksek reçete uygun değil',
      benefit: 'Tam çerçeve önerilir'
    })
  }
  
  return recommendations
}

// 4. Calculate thickness
function calculateThickness(data) {
  const { prescription, diameter, index, minThickness, baseCurve } = data
  
  // Choose calculation method
  if (baseCurve && baseCurve > 0) {
    // Use exact two-surface method
    return calculateExact(data)
  } else {
    // Use industry standard approximation
    return calculateApprox(data)
  }
}

// 5. Calculate approximate (fast)
function calculateApprox(data) {
  const { prescription, diameter, index, minThickness } = data
  const D = diameter
  const P = Math.abs(prescription)
  const n = index
  
  // Industry formula
  const addition = (D * D * P) / (2000 * (n - 1))
  
  let centerThickness, edgeThickness
  
  if (prescription < 0) {
    // Minus lens
    centerThickness = minThickness
    edgeThickness = centerThickness + addition
  } else if (prescription > 0) {
    // Plus lens
    edgeThickness = minThickness
    centerThickness = edgeThickness + addition
  } else {
    // Plano
    centerThickness = minThickness
    edgeThickness = minThickness
  }
  
  return {
    center: centerThickness,
    edge: edgeThickness,
    max: Math.max(centerThickness, edgeThickness),
    min: Math.min(centerThickness, edgeThickness),
    method: 'approximate'
  }
}

// 6. Calculate exact (accurate)
function calculateExact(data) {
  const { prescription, diameter, index, minThickness, baseCurve } = data
  const radius = diameter / 2
  const n = index
  
  // Front surface
  const frontPower = baseCurve
  const R1 = ((n - 1) / frontPower) * 1000
  
  // Back surface
  const backPower = prescription - baseCurve
  const R2 = Math.abs(((n - 1) / backPower) * 1000)
  
  // Sagitta for each surface
  let frontSag, backSag
  
  if (radius < R1) {
    frontSag = R1 - Math.sqrt(R1 * R1 - radius * radius)
  } else {
    frontSag = (radius * radius) / (2 * R1)
  }
  
  if (radius < R2) {
    backSag = R2 - Math.sqrt(R2 * R2 - radius * radius)
  } else {
    backSag = (radius * radius) / (2 * R2)
  }
  
  // Total thickness
  let centerThickness, edgeThickness
  
  if (prescription < 0) {
    centerThickness = minThickness
    edgeThickness = centerThickness + frontSag + backSag
  } else if (prescription > 0) {
    edgeThickness = minThickness
    centerThickness = edgeThickness + frontSag + backSag
  } else {
    centerThickness = minThickness + frontSag
    edgeThickness = centerThickness
  }
  
  return {
    center: centerThickness,
    edge: edgeThickness,
    max: Math.max(centerThickness, edgeThickness),
    min: Math.min(centerThickness, edgeThickness),
    method: 'exact',
    surfaceInfo: {
      frontPower,
      backPower,
      frontRadius: R1,
      backRadius: R2,
      frontSag,
      backSag
    }
  }
}

// 7. Format results for display
function formatResults(thickness, data) {
  return {
    thickness,
    recommendations: generateRecommendations(data),
    comparison: generateComparison(thickness, data),
    visualization: generate3DData(thickness, data)
  }
}

// 8. Generate comparison data
function generateComparison(thickness, data) {
  // Compare with different indices
  const comparisons = []
  const indices = [1.50, 1.60, 1.67, 1.74]
  
  indices.forEach(idx => {
    if (idx !== data.index) {
      const altThickness = calculateApprox({
        ...data,
        index: idx
      })
      
      const difference = thickness.max - altThickness.max
      const percentDiff = (difference / thickness.max) * 100
      
      comparisons.push({
        index: idx,
        thickness: altThickness.max,
        difference: difference,
        percentDiff: percentDiff,
        recommendation: percentDiff > 20 ? 'Önerilen' : 'Opsiyonel'
      })
    }
  })
  
  return comparisons
}
```

---

## 🎨 UI/UX Implementation

### Input Form Component

```jsx
function LensCalculatorForm({ onCalculate }) {
  const [mode, setMode] = useState('basic') // 'basic' or 'professional'
  const [data, setData] = useState({
    prescription: -3.0,
    diameter: 70,
    index: 1.60,
    minThickness: 1.5
  })
  
  const handleSubmit = () => {
    const errors = validateData(data)
    if (errors.length > 0) {
      showErrors(errors)
      return
    }
    
    const result = calculateThickness(data)
    const formatted = formatResults(result, data)
    onCalculate(formatted)
  }
  
  return (
    <div className="calculator-form">
      <div className="mode-toggle">
        <button onClick={() => setMode('basic')}>
          Basit Mod
        </button>
        <button onClick={() => setMode('professional')}>
          Profesyonel Mod
        </button>
      </div>
      
      {/* Basic inputs */}
      <InputGroup
        label="Reçete Gücü"
        value={data.prescription}
        onChange={(v) => setData({...data, prescription: v})}
        min={-10}
        max={10}
        step={0.25}
        help="Gözlük reçetenizdeki SPH değeri"
      />
      
      <InputGroup
        label="Çerçeve Genişliği"
        value={data.diameter}
        onChange={(v) => setData({...data, diameter: v})}
        min={50}
        max={85}
        step={1}
        unit="mm"
      />
      
      <SelectGroup
        label="Cam Malzemesi"
        value={data.index}
        onChange={(v) => setData({...data, index: v})}
        options={[
          { value: 1.50, label: "1.50 - Standart" },
          { value: 1.60, label: "1.60 - Orta İnce" },
          { value: 1.67, label: "1.67 - Çok İnce" },
          { value: 1.74, label: "1.74 - Ultra İnce" }
        ]}
      />
      
      {/* Professional inputs */}
      {mode === 'professional' && (
        <>
          <InputGroup
            label="Taban Eğrisi"
            value={data.baseCurve}
            onChange={(v) => setData({...data, baseCurve: v})}
            optional
          />
          {/* More professional inputs... */}
        </>
      )}
      
      <button onClick={handleSubmit}>
        Hesapla
      </button>
    </div>
  )
}
```

### Results Display Component

```jsx
function ResultsDisplay({ results }) {
  const { thickness, recommendations, comparison } = results
  
  return (
    <div className="results">
      {/* Main thickness display */}
      <div className="thickness-display">
        <div className="thickness-item">
          <span className="label">Merkez Kalınlık:</span>
          <span className="value">{thickness.center.toFixed(2)} mm</span>
        </div>
        <div className="thickness-item">
          <span className="label">Kenar Kalınlık:</span>
          <span className="value">{thickness.edge.toFixed(2)} mm</span>
        </div>
        <div className="thickness-item highlight">
          <span className="label">Maksimum Kalınlık:</span>
          <span className="value">{thickness.max.toFixed(2)} mm</span>
        </div>
      </div>
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>💡 Öneriler</h3>
          {recommendations.map((rec, i) => (
            <div key={i} className={`recommendation ${rec.type}`}>
              <p>{rec.message}</p>
              <small>{rec.benefit}</small>
            </div>
          ))}
        </div>
      )}
      
      {/* Comparison */}
      <div className="comparison">
        <h3>📊 Malzeme Karşılaştırması</h3>
        <table>
          <thead>
            <tr>
              <th>İndeks</th>
              <th>Kalınlık</th>
              <th>Fark</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((comp, i) => (
              <tr key={i}>
                <td>{comp.index}</td>
                <td>{comp.thickness.toFixed(2)} mm</td>
                <td>{comp.difference.toFixed(2)} mm ({comp.percentDiff.toFixed(0)}%)</td>
                <td>{comp.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 📝 Summary: Data Collection Checklist

### ✅ Must Have (Minimum)
1. **Prescription** (-10 to +10 D)
2. **Diameter** (50-85 mm)
3. **Refractive Index** (1.50-1.74)
4. **Min Thickness** (1.0-3.0 mm)

### 🎯 Should Have (Better Accuracy)
5. **Base Curve** (2-8 D)
6. **Frame Type** (full/semi/rimless)

### 💎 Nice to Have (Professional)
7. **PD** (54-74 mm)
8. **Cylinder** (-4 to +4 D)
9. **Axis** (0-180°)

### 🔄 Calculation Methods

**Basic Mode:**
- Use industry standard formula
- Fast, simple, good enough
- Accuracy: ±5%

**Professional Mode:**
- Use exact two-surface method
- Requires base curve
- Accuracy: ±0.1%

---

## 🎓 Key Takeaways

1. **Start simple** - Collect only essential data first
2. **Provide defaults** - Most users don't know technical details
3. **Add recommendations** - Guide users to better choices
4. **Show comparisons** - Help users understand material benefits
5. **Validate input** - Catch errors early
6. **Explain results** - Make thickness meaningful to customers

Your app should make it easy for opticians to demonstrate lens thickness to customers without requiring deep technical knowledge!
