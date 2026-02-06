/**
 * 🔬 Optik Lens Kalınlık Hesaplamaları
 * 
 * Bu modül, gözlük camı kalınlığını hesaplamak için optik formüller içerir.
 * İki yöntem sunulur:
 * 1. Yaklaşık formül (hızlı, endüstri standardı)
 * 2. Tam formül (daha doğru, her iki yüzey için sagitta hesabı)
 */

/**
 * Yaklaşık Kalınlık Hesaplama (Endüstri Standardı)
 * 
 * Formül: Max Thickness = Min Thickness + (D² × |P|) / (2000 × (n-1))
 * 
 * Bu formül, lens üreticileri tarafından yaygın olarak kullanılır ve
 * müşteri görselleştirmesi için yeterli doğrulukta sonuçlar verir.
 * 
 * @param {Object} params - Lens parametreleri
 * @param {number} params.diameter - Lens çapı (mm)
 * @param {number} params.prescription - Reçete gücü (dioptri, D)
 * @param {number} params.index - Kırılma indeksi (örn: 1.5, 1.6, 1.67, 1.74)
 * @param {number} params.edgeThickness - Minimum kenar kalınlığı (mm)
 * @returns {Object} Kalınlık değerleri (center, edge, maxEdge, min)
 */
export function calculateLensThicknessApprox(params) {
  const { diameter, prescription, index, edgeThickness } = params
  const D = diameter  // mm
  const P = Math.abs(prescription)  // Dioptri (mutlak değer)
  const n = index
  
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
  
  const thicknessAddition = (D * D * P) / (divisor * (n - 1))
  
  let centerThickness, edgeThickness_calc
  
  if (prescription < 0) {
    // MİYOP LENS (Negatif): Merkez ince, kenarlar kalın
    // Edge Thickness = Center Thickness + Addition
    centerThickness = Math.max(1.0, edgeThickness)  // Minimum merkez kalınlığı
    edgeThickness_calc = centerThickness + thicknessAddition
  } else if (prescription > 0) {
    // HİPERMETROP LENS (Pozitif): Merkez kalın, kenarlar ince
    // Center Thickness = Edge Thickness + Addition
    edgeThickness_calc = Math.max(1.0, edgeThickness)  // Minimum kenar kalınlığı
    centerThickness = edgeThickness_calc + thicknessAddition
  } else {
    // PLANO LENS (Sıfır): Düz lens
    centerThickness = edgeThickness
    edgeThickness_calc = edgeThickness
  }
  
  return {
    center: centerThickness,
    edge: edgeThickness_calc,
    maxEdge: Math.max(centerThickness, edgeThickness_calc),
    min: Math.min(centerThickness, edgeThickness_calc)
  }
}

/**
 * Tam Kalınlık Hesaplama (Yüzey Sagitta Yöntemi)
 * 
 * Bu yöntem, her iki lens yüzeyi için ayrı ayrı sagitta (yüzey derinliği) hesaplar
 * ve toplamlarını kullanarak kalınlığı belirler.
 * 
 * Formüller:
 * - Yüzey gücü → Yarıçap: R = (n-1) / F × 1000
 * - Sagitta (tam): sag = R - √(R² - r²)
 * - Sagitta (yaklaşık): sag ≈ r² / (2R)
 * 
 * @param {Object} params - Lens parametreleri
 * @param {number} params.diameter - Lens çapı (mm)
 * @param {number} params.prescription - Reçete gücü (dioptri, D)
 * @param {number} params.index - Kırılma indeksi
 * @param {number} params.baseCurve - Ön yüzey eğriliği (dioptri)
 * @param {number} params.edgeThickness - Minimum kenar kalınlığı (mm)
 * @param {boolean} useApproxSagitta - Yaklaşık sagitta formülü kullan (varsayılan: false)
 * @returns {Object} Kalınlık değerleri ve yüzey bilgileri
 */
export function calculateLensThicknessExact(params, useApproxSagitta = false) {
  const { diameter, prescription, index, baseCurve, edgeThickness } = params
  const radius = diameter / 2  // Yarı çap (mm)
  const n = index
  
  // Adım 1: Ön yüzey yarıçapını hesapla
  // Base curve = ön yüzey gücü (dioptri)
  const frontSurfacePower = baseCurve  // F1 (D)
  const R1 = ((n - 1) / frontSurfacePower) * 1000  // mm
  
  // Adım 2: Arka yüzey gücünü hesapla
  // İnce lens yaklaşımı: P = F1 + F2
  // F2 = P - F1
  const backSurfacePower = prescription - frontSurfacePower  // F2 (D)
  
  // Arka yüzey yarıçapı
  // Dikkat: Negatif güç için de mutlak değer kullanıyoruz (yarıçap her zaman pozitif)
  let R2
  if (Math.abs(backSurfacePower) < 0.001) {
    // Çok küçük güç - düz yüzey olarak kabul et
    R2 = 10000  // Çok büyük yarıçap (neredeyse düz)
  } else {
    R2 = Math.abs(((n - 1) / backSurfacePower) * 1000)  // mm
  }
  
  // Adım 3: Her yüzey için sagitta hesapla
  let frontSag, backSag
  
  if (useApproxSagitta) {
    // Yaklaşık formül: sag ≈ r² / (2R)
    frontSag = (radius * radius) / (2 * R1)
    backSag = (radius * radius) / (2 * R2)
  } else {
    // Tam formül: sag = R - √(R² - r²)
    // Dikkat: r > R ise sagitta hesaplanamaz (fiziksel olarak imkansız)
    if (radius >= R1) {
      // Yarıçap çok büyük, yaklaşık formül kullan
      frontSag = (radius * radius) / (2 * R1)
    } else {
      frontSag = R1 - Math.sqrt(R1 * R1 - radius * radius)
    }
    
    if (radius >= R2) {
      backSag = (radius * radius) / (2 * R2)
    } else {
      backSag = R2 - Math.sqrt(R2 * R2 - radius * radius)
    }
  }
  
  // Adım 4: Kalınlık hesapla
  let centerThickness, edgeThickness_calc
  
  if (prescription < 0) {
    // MİYOP LENS: İnce merkez, kalın kenarlar
    // Center Thickness = minimum (güvenlik için)
    // Edge Thickness = Center + Front Sag + Back Sag
    centerThickness = Math.max(1.0, edgeThickness)
    edgeThickness_calc = centerThickness + frontSag + backSag
  } else if (prescription > 0) {
    // HİPERMETROP LENS: Kalın merkez, ince kenarlar
    // Edge Thickness = minimum (güvenlik için)
    // Center Thickness = Edge + Front Sag + Back Sag
    edgeThickness_calc = Math.max(1.0, edgeThickness)
    centerThickness = edgeThickness_calc + frontSag + backSag
  } else {
    // PLANO LENS: Sadece ön yüzey eğriliği var
    centerThickness = edgeThickness + frontSag
    edgeThickness_calc = centerThickness
  }
  
  return {
    center: centerThickness,
    edge: edgeThickness_calc,
    maxEdge: Math.max(centerThickness, edgeThickness_calc),
    min: Math.min(centerThickness, edgeThickness_calc),
    // Ek bilgiler (debug için)
    surfaceInfo: {
      frontSurfacePower,
      backSurfacePower,
      frontRadius: R1,
      backRadius: R2,
      frontSag,
      backSag
    }
  }
}

/**
 * Varsayılan kalınlık hesaplama fonksiyonu
 * 
 * Base curve varsa tam formül, yoksa yaklaşık formül kullanır.
 * 
 * @param {Object} params - Lens parametreleri
 * @returns {Object} Kalınlık değerleri
 */
export function calculateLensThickness(params) {
  // Base curve varsa tam formül kullan
  if (params.baseCurve && params.baseCurve > 0) {
    return calculateLensThicknessExact(params)
  } else {
    // Base curve yoksa yaklaşık formül kullan
    return calculateLensThicknessApprox(params)
  }
}

/**
 * Lens profili için kalınlık hesapla (3D görselleştirme için)
 * 
 * Lens yüzeyinin her noktasındaki kalınlığı hesaplar.
 * 
 * @param {Object} params - Lens parametreleri
 * @param {number} distanceFromCenter - Merkezden uzaklık (mm)
 * @returns {number} O noktadaki kalınlık (mm)
 */
export function calculateThicknessAtPoint(params, distanceFromCenter) {
  const { diameter, prescription, index, baseCurve, edgeThickness } = params
  const radius = diameter / 2
  const n = index
  
  // Normalize edilmiş mesafe (0 = merkez, 1 = kenar)
  const normalizedDistance = Math.min(1, distanceFromCenter / radius)
  
  // Yüzey yarıçaplarını hesapla
  const frontSurfacePower = baseCurve
  const R1 = ((n - 1) / frontSurfacePower) * 1000
  
  const backSurfacePower = prescription - frontSurfacePower
  const R2 = Math.abs(((n - 1) / backSurfacePower) * 1000)
  
  // Bu noktadaki lokal yarıçap
  const localRadius = distanceFromCenter
  
  // Her yüzey için lokal sagitta
  let frontLocalSag = 0
  let backLocalSag = 0
  
  if (localRadius < R1) {
    frontLocalSag = R1 - Math.sqrt(R1 * R1 - localRadius * localRadius)
  } else {
    frontLocalSag = (localRadius * localRadius) / (2 * R1)
  }
  
  if (localRadius < R2) {
    backLocalSag = R2 - Math.sqrt(R2 * R2 - localRadius * localRadius)
  } else {
    backLocalSag = (localRadius * localRadius) / (2 * R2)
  }
  
  // Kalınlık hesapla
  let thickness
  
  if (prescription < 0) {
    // Miyop: Merkezde ince, kenarlarda kalın
    const centerThickness = Math.max(1.0, edgeThickness)
    thickness = centerThickness + frontLocalSag + backLocalSag
  } else if (prescription > 0) {
    // Hipermetrop: Merkezde kalın, kenarlarda ince
    const edgeThickness_calc = Math.max(1.0, edgeThickness)
    thickness = edgeThickness_calc + frontLocalSag + backLocalSag
  } else {
    // Plano
    thickness = edgeThickness + frontLocalSag
  }
  
  return Math.max(edgeThickness, thickness)
}

/**
 * Test fonksiyonu - hesaplamaları doğrula
 */
export function testCalculations() {
  console.log('🧪 Lens Kalınlık Hesaplama Testleri\n')
  
  // Test 1: Miyop lens (-3.00D)
  const test1 = {
    diameter: 70,
    prescription: -3.0,
    index: 1.6,
    baseCurve: 4.0,
    edgeThickness: 1.5
  }
  
  console.log('Test 1: Miyop Lens (-3.00D, 70mm, n=1.6)')
  console.log('Yaklaşık:', calculateLensThicknessApprox(test1))
  console.log('Tam:', calculateLensThicknessExact(test1))
  console.log('')
  
  // Test 2: Hipermetrop lens (+3.00D)
  const test2 = {
    diameter: 70,
    prescription: 3.0,
    index: 1.6,
    baseCurve: 6.0,
    edgeThickness: 1.5
  }
  
  console.log('Test 2: Hipermetrop Lens (+3.00D, 70mm, n=1.6)')
  console.log('Yaklaşık:', calculateLensThicknessApprox(test2))
  console.log('Tam:', calculateLensThicknessExact(test2))
  console.log('')
  
  // Test 3: Plano lens (0.00D)
  const test3 = {
    diameter: 70,
    prescription: 0.0,
    index: 1.6,
    baseCurve: 4.0,
    edgeThickness: 1.5
  }
  
  console.log('Test 3: Plano Lens (0.00D, 70mm, n=1.6)')
  console.log('Yaklaşık:', calculateLensThicknessApprox(test3))
  console.log('Tam:', calculateLensThicknessExact(test3))
}
