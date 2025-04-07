# Sistem Mimarisi ve Teknik Kararlar

## Genel Mimari
Film Öneri Sistemi, bir mikroservis mimarisi yaklaşımı ile iki ana bileşenden oluşur:

```
┌───────────────────────┐     ┌───────────────────────┐
│                       │     │                       │
│   Frontend (Next.js)  │◄────┤   Backend (Flask)     │
│                       │     │                       │
└───────────────────────┘     └───────────────────────┘
          ▲                             ▲
          │                             │
          │                             │
          │                   ┌─────────┴───────────┐
          │                   │                     │
          └───────────────────┤    Veri Tabanı      │
                              │                     │
                              └─────────────────────┘
```

## Backend Mimarisi (Flask)
Backend sistemi RESTful API prensipleriyle tasarlanmıştır:

1. **Model Katmanı:**
   - Collaborative Filtering algoritmasını içerir
   - Veri önişleme fonksiyonları
   - Model eğitimi ve değerlendirmesi

2. **API Katmanı:**
   - Film önerileri için endpoint'ler
   - Film arama ve filtreleme
   - Kullanıcı değerlendirmeleri için endpoint'ler

3. **Veri Katmanı:**
   - MovieLens veri setini yönetir
   - Kullanıcı etkileşimlerini saklar

## Frontend Mimarisi (Next.js)
Frontend, komponent tabanlı bir mimari kullanır:

1. **Sayfa Bileşenleri:**
   - Ana sayfa
   - Film detay sayfası
   - Öneri sayfası
   - Arama sonuçları

2. **Ortak Bileşenler:**
   - Film kartları
   - Değerlendirme yıldızları
   - Navigasyon çubuğu
   - Film listeleri

3. **API İstemcisi:**
   - Backend API'ye istek yapma
   - Veri almak için hook'lar

## Collaborative Filtering Yaklaşımı
İki ana yöntem değerlendirilecek:

1. **Bellek Tabanlı CF:**
   - Kullanıcı-kullanıcı benzerliği
   - Film-film benzerliği
   - Kosinüs benzerliği veya Pearson korelasyonu

2. **Model Tabanlı CF:**
   - Matris faktörizasyonu
   - Singular Value Decomposition (SVD)
   - Neural Collaborative Filtering

## Veri Akışı
1. Kullanıcı frontend'den bir istek yapar
2. Next.js istemcisi Flask API'ye istek gönderir
3. API, ilgili modele göre önerileri hesaplar
4. Sonuçlar frontend'e döndürülür ve kullanıcıya sunulur

## Ölçeklenebilirlik Yaklaşımı
- RESTful API tasarımı sayesinde frontend ve backend bağımsız olarak ölçeklendirilebilir
- Model hesaplamaları önbelleğe alınabilir
- Büyük veri kümeleri için batch processing uygulanabilir 