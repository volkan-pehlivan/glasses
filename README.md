# 🔍 Gözlük Camı Kalınlık Simülatörü

Gözlük camının kesildikten sonraki kalınlığını birebir (1:1 ölçek) olarak görselleştiren web uygulaması.

## Özellikler

- ✅ **3D Görselleştirme**: Three.js ile interaktif 3D görünüm
- ✅ **Birebir Ölçek**: 1:1 ölçek ile gerçek kalınlık gösterimi
- ✅ **Yandan ve Üstten Görünüm**: İki farklı görünüm modu
- ✅ **Gerçek Zamanlı Hesaplama**: Parametreler değiştikçe anında hesaplama
- ✅ **Müşteri Dostu Arayüz**: Kolay kullanım ve anlaşılır kontroller

## Parametreler

- **Lens Çapı**: 50-85 mm arası
- **Dioptri (Prescription)**: -10 ile +10 arası (miyop/hipermetrop)
- **Refraktif İndeks**: 1.50, 1.60, 1.67, 1.74 seçenekleri
- **Base Curve**: 2-8 dioptri arası
- **Min. Kenar Kalınlığı**: 0.5-5 mm arası

## Kurulum

```bash
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

## Kullanım

1. Sol panelden parametreleri ayarlayın
2. Gözlük camının kalınlığını 3D görünümde inceleyin
3. Yandan görünüm ile kalınlık detaylarını görün
4. Üstten görünüm ile lens şeklini görün
5. Hesaplanan kalınlık değerlerini kontrol edin

## Üretim Notu

Bu uygulama kesildikten sonraki cam kalınlığını gösterir. Üretim öncesi müşteriye gösterim için kullanılabilir.
