# Professional Lens Thickness Calculation Algorithm

## Complete Documentation and Implementation Guide

This document provides a comprehensive guide to calculating eyeglass lens thickness using professional optical engineering formulas, based on industry standards and optical physics principles.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Variables](#key-variables)
3. [The Complete Algorithm](#the-complete-algorithm)
4. [Step-by-Step Calculation](#step-by-step-calculation)
5. [Worked Example](#worked-example)
6. [Implementation Notes](#implementation-notes)
7. [References](#references)

---

## Overview

Lens thickness calculation is not a simple formula but a multi-variable engineering process involving:
- **Optical Physics**: Light refraction and material properties
- **Geometric Optics**: Surface curvatures and sagitta calculations
- **Frame Geometry**: Frame dimensions and decentration effects
- **Material Science**: Refractive index impact on thickness

The final thickness emerges from the interaction of two curved surfaces (front and back) separated by a specific distance.

---

## Key Variables

### Input Parameters

| Variable | Description | Example | Unit |
|----------|-------------|---------|------|
| **S** | Spherical power (prescription) | -3.00 | Diopters (D) |
| **C** | Cylindrical power (astigmatism) | -2.00 | Diopters (D) |
| **Ax** | Cylinder axis | 180 | Degrees (°) |
| **n** | Refractive index | 1.67 | Dimensionless |
| **D** | Frame diameter (or ED) | 60 | mm |
| **PD** | Pupillary distance | 32 | mm (monocular) |
| **A** | Frame A measurement (width) | 54 | mm |
| **DBL** | Distance between lenses | 16 | mm |
| **CT_min** | Minimum center thickness | 1.5 | mm |
| **ET_min** | Minimum edge thickness | 1.0 | mm |

### Calculated Parameters

| Variable | Description | Formula |
|----------|-------------|---------|
| **SE** | Spherical equivalent | S + C/2 |
| **BC** | Base curve (front surface power) | Vogel's Rule |
| **F₁** | Front surface power | = BC |
| **F₂** | Back surface power | F_target - F₁ |
| **r₁** | Front surface radius | 1000(n-1)/F₁ |
| **r₂** | Back surface radius | \|1000(n-1)/F₂\| |
| **s₁** | Front surface sagitta | r₁ - √(r₁² - h²) |
| **s₂** | Back surface sagitta | r₂ - √(r₂² - h²) |
| **h** | Calculation radius | ED/2 + Decentration |

---

## The Complete Algorithm

### Step 1: Input Parameter Definition

Collect all required data:
- Prescription: S, C, Ax
- Frame: A, B, DBL, ED
- User: PD (monocular)
- Material: n
- Constants: CT_min (for myopic) or ET_min (for hyperopic)

### Step 2: Frame Integration and Decentration

Calculate where the optical center falls within the frame:

```
FPD = A + DBL
Dec = FPD/2 - PD_mono
h = ED/2 + Dec
```

**Note:** `h` is the critical radius for sagitta calculation - it represents the furthest point from the optical center (typically temporal edge for myopic lenses).

### Step 3: Base Curve Selection (Vogel's Rule)

Calculate spherical equivalent:
```
SE = S + C/2
```

Apply Vogel's Rule for base curve:
```
For Myopic (S < 0):  BC = SE/2 + 6.00
For Hyperopic (S > 0): BC = SE + 6.00
```

Front surface power:
```
F₁ = BC  (typically positive)
```

### Step 4: Back Surface Power Calculation

For spherocylindrical lenses, calculate target power at the relevant meridian:

```
F_target(θ) = S + C · sin²(θ - Ax)
```

For simple spherical lenses (C = 0):
```
F_target = S
```

Back surface power:
```
F₂(θ) = F_target(θ) - F₁
```

**Note:** For thick lens formula (more accurate):
```
F_total = F₁ + F₂ - (t/n)·F₁·F₂
```
But for thickness estimation, the thin lens approximation is acceptable.

### Step 5: Radius and Sagitta Calculation

Convert optical powers to physical radii:

```
r₁ = 1000(n - 1) / F₁

r₂ = |1000(n - 1) / F₂(θ)|  (absolute value)
```

Calculate sagitta (exact formula):

```
s₁ = r₁ - √(r₁² - h²)

s₂ = r₂ - √(r₂² - h²)
```

**Sagitta Formula Derivation:**
From Pythagorean theorem on a spherical surface:
```
r² = (r - s)² + h²
r² = r² - 2rs + s² + h²
2rs - s² = h²
```
For small s (s² ≈ 0): `s ≈ h²/(2r)` (approximation)

Exact solution: `s = r - √(r² - h²)`

### Step 6: Final Thickness Combination

**For Myopic Lenses (S < 0):**
Center is thinnest, edge is thickest.
```
CT = CT_min  (fixed, e.g., 1.5mm)
ET = CT + s₂ - s₁
```

**For Hyperopic Lenses (S > 0):**
Edge is thinnest, center is thickest.
```
ET = ET_min  (fixed, e.g., 1.0mm)
CT = ET + s₁ - s₂
```

**Why this formula?**
When both surfaces curve in the same direction:
- Front surface curves by s₁ (reduces gap)
- Back surface curves by s₂ (increases gap)
- Net change = s₂ - s₁
- Total thickness = base thickness + net change

---

## Step-by-Step Calculation

### Example: Myopic Lens

**Given:**
- Prescription: -3.00 D (spherical, no cylinder)
- Index: 1.67
- Diameter: 60mm
- PD: 30mm (monocular)
- Frame: A=54, DBL=16, ED=58
- Min center thickness: 1.5mm

**Step 1: Inputs**
- S = -3.00, C = 0, Ax = 0
- n = 1.67
- A = 54, DBL = 16, ED = 58
- PD = 30
- CT_min = 1.5mm

**Step 2: Frame Integration**
```
FPD = 54 + 16 = 70mm
Dec = 70/2 - 30 = 35 - 30 = 5mm
h = 58/2 + 5 = 29 + 5 = 34mm
```

**Step 3: Base Curve**
```
SE = -3.00 + 0/2 = -3.00
BC = -3.00/2 + 6.00 = -1.5 + 6.00 = +4.50 D
F₁ = +4.50 D
```

**Step 4: Back Surface**
```
F_target = -3.00 D
F₂ = -3.00 - 4.50 = -7.50 D
```

**Step 5: Radii and Sagittas**
```
r₁ = 1000(1.67 - 1) / 4.50 = 670 / 4.50 = 148.89mm
r₂ = |1000(0.67) / -7.50| = 670 / 7.50 = 89.33mm

s₁ = 148.89 - √(148.89² - 34²)
   = 148.89 - √(22168 - 1156)
   = 148.89 - √21012
   = 148.89 - 144.96
   = 3.93mm

s₂ = 89.33 - √(89.33² - 34²)
   = 89.33 - √(7980 - 1156)
   = 89.33 - √6824
   = 89.33 - 82.61
   = 6.72mm
```

**Step 6: Final Thickness**
```
CT = 1.5mm (fixed)
ET = 1.5 + 6.72 - 3.93 = 4.29mm
```

**Result:** Edge thickness is 4.29mm

---

## Worked Example (From Expert Document)

**Given:**
- Prescription: OD -6.00 -2.00 x 180°
- Frame: 54-16, ED=58
- PD: 32mm (monocular)
- Index: 1.60
- Min CT: 1.5mm

**Calculation:**

**Step 2: Geometry**
```
FPD = 54 + 16 = 70mm
Dec = 70/2 - 32 = 3mm
h = 58/2 + 3 = 32mm
```

**Step 3: Power Analysis (180° meridian)**
```
F_total = -6.00 + (-2.00)·sin²(180-180) = -6.00 D
SE = -6.00 + (-2.00)/2 = -7.00 D
BC = -7.00/2 + 6.00 = 2.50 D
F₁ = +2.50 D
```

**Step 4: Back Surface**
```
F₂ = -6.00 - 2.50 = -8.50 D
```

**Step 5: Radii and Sagittas**
```
r₁ = 1000(1.60-1) / 2.50 = 600 / 2.50 = 240mm
r₂ = 1000(0.60) / 8.50 = 600 / 8.50 = 70.59mm

s₁ = 240 - √(240² - 32²) = 240 - 237.86 = 2.14mm
s₂ = 70.59 - √(70.59² - 32²) = 70.59 - 62.92 = 7.67mm
```

**Step 6: Final Result**
```
ET = 1.5 + 7.67 - 2.14 = 9.03mm
```

**Conclusion:** Edge thickness is 9.03mm - a thick lens requiring higher index material or smaller frame.

---

## Implementation Notes

### For 3D Visualization

When creating 3D lens geometry:

1. **Calculate thickness at center:**
   - For myopic: CT = CT_min (e.g., 1.5mm)
   - For hyperopic: CT = ET_min + s₁ - s₂

2. **For each point (x, z) on the lens grid:**
   ```javascript
   // Calculate distance from optical center
   const r = Math.sqrt(x² + z²)
   
   // Calculate sagittas at this radius
   const s1 = r1 - Math.sqrt(r1² - r²)
   const s2 = r2 - Math.sqrt(r2² - r²)
   
   // Position vertices
   const topY = -s1  // Front surface (curves down)
   const bottomY = -CT - s2  // Back surface (curves down more)
   
   // Thickness at this point
   const thickness = topY - bottomY = CT + s2 - s1
   ```

3. **Surface orientation:**
   - Both surfaces curve in the SAME direction (both downward in our coordinate system)
   - The sign of the optical power (F₁, F₂) indicates optical behavior, not geometric direction
   - Use negative signs for both sagittas to make both surfaces curve downward

### Common Pitfalls

1. **Don't use arbitrary multipliers** (like 1.2, 0.8) for radius of curvature - use Vogel's Rule
2. **Don't confuse optical power with geometric direction** - negative power doesn't mean the surface curves backward
3. **Use the correct radius (h)** - include decentration, not just diameter/2
4. **Use exact sagitta formula** for high prescriptions (> ±6.00 D)
5. **Remember the formula is ET = CT + s₂ - s₁** (not CT + s₁ + s₂)

### Approximation vs Exact

**Approximate sagitta formula** (for r >> y):
```
s ≈ y² · F / (2000(n - 1))
```

**When to use:**
- Quick estimates
- Low prescriptions (< ±4.00 D)
- Educational purposes

**Exact sagitta formula:**
```
s = r - √(r² - y²)
```

**When to use:**
- Professional calculations
- High prescriptions (> ±6.00 D)
- 3D visualization
- Production planning

---

## References

### Key Formulas Summary

| Formula | Description |
|---------|-------------|
| `SE = S + C/2` | Spherical equivalent |
| `BC = SE/2 + 6.00` | Vogel's Rule (myopic) |
| `BC = SE + 6.00` | Vogel's Rule (hyperopic) |
| `F₂ = F_target - F₁` | Back surface power |
| `r = 1000(n-1)/F` | Radius from power |
| `s = r - √(r² - h²)` | Exact sagitta |
| `ET = CT + s₂ - s₁` | Final thickness (myopic) |
| `CT = ET + s₁ - s₂` | Final thickness (hyperopic) |

### Source Document

This algorithm is based on the comprehensive research report:
**"Gözlük Camı Kalınlığı Hesaplamasında Matematiksel Modelleme ve Optik Mühendisliği Yaklaşımları"**

Key references from the document:
- OptiCampus.com - Continuing Education Courses
- Laramy-K Optical - Methods for Estimating Lens Thickness
- National Academy of Opticianry - Lens Powers
- Wikipedia - Sagitta (optics)
- Various optical training institutes and professional resources

### Additional Notes

- **Aspherical lenses** can reduce thickness by 10-15% compared to spherical calculations
- **Prism correction** adds additional thickness: `Δt = (d·P)/(100(n-1))`
- **Progressive lenses** may use prismatic thinning for balance
- **Frame trace data** provides more accurate ED calculations than boxing system

---

## Conclusion

The professional lens thickness calculation algorithm combines:
1. **Vogel's Rule** for base curve selection
2. **Optical power distribution** between front and back surfaces
3. **Exact sagitta calculations** from radius of curvature
4. **Geometric combination** of surface depths

This approach produces accurate, industry-standard thickness estimates that match professional optical software and laboratory calculations.

**Key Equation:**
```
ET = CT + s₂ - s₁
```

Where sagittas are calculated from properly determined radii of curvature based on optical power distribution, not arbitrary geometric assumptions.

---

*Document created: January 2025*
*Based on professional optical engineering standards and industry best practices*
