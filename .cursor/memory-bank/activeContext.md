# Aktif Çalışma Bağlamı

## Mevcut Durum
Projemiz başlangıç aşamasındadır. Şu an için:

1. Proje gereksinimlerini belirledik:
   - Backend: Python, Flask
   - Frontend: Next.js
   - Collaborative Filtering: MovieLens veri seti kullanılacak
   
2. Proje belgelerini oluşturduk (Memory Bank)

## Güncel Çalışma Odağı
Proje yapısının oluşturulması ve temel sistemi kurma aşamasındayız:

1. **Backend Kurulumu**
   - Flask API yapısı oluşturma
   - Veri setini indirme ve ön işleme
   - Basit bir collaborative filtering modeli geliştirme

2. **Frontend Kurulumu**
   - Next.js projesini başlatma
   - Temel sayfa yapısını oluşturma
   - API ile iletişim kurma

## Aktif Kararlar ve Değerlendirmeler
1. **Veri Seti Seçimi:** MovieLens "Latest Small" (100K değerlendirme) ile başlayacağız, daha sonra gerekirse daha büyük veri setlerine geçebiliriz.

2. **Model Seçimi:** İlk aşamada Singular Value Decomposition (SVD) veya k-Nearest Neighbors (KNN) tabanlı bir collaborative filtering yaklaşımı kullanacağız. Surprise kütüphanesi bu konuda bize yardımcı olacak.

3. **API Tasarımı:** RESTful prensiplere uygun, JSON veri formatında API endpoint'leri oluşturacağız:
   - `/api/movies`: Film listesi
   - `/api/movies/{id}`: Film detayları
   - `/api/recommendations/{user_id}`: Kullanıcıya özel öneriler
   - `/api/ratings`: Değerlendirme kaydetme

4. **Kullanıcı Arayüzü:** Responsive tasarım prensipleriyle çalışacak bir arayüz geliştireceğiz, Tailwind CSS kullanacağız.

## Sonraki Adımlar
1. Proje klasör yapısını oluştur
2. Backend çerçevesini kur
3. MovieLens veri setini indir ve hazırla
4. Collaborative filtering modelini oluştur
5. Frontend yapısını kur
6. Temel API entegrasyonunu gerçekleştir

## Karar Verilmesi Gereken Konular
1. Veritabanı yapısı (şema tasarımı)
2. Kullanıcı oturum yönetimi stratejisi
3. Model yeniden eğitim sıklığı
4. Deployment stratejisi 