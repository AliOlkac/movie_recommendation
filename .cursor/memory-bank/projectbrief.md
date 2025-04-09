# Film Öneri Sistemi - Proje Özeti

## Proje Amacı
Kullanıcılara kişiselleştirilmiş film önerileri sunan, makine öğrenimi (collaborative filtering) temelli bir web uygulaması geliştirmek. Bu uygulama, MovieLens veri setini ve TMDB API'sini kullanarak zengin bir kullanıcı deneyimi sunmayı hedefler.

## Temel Hedefler
1.  **Model Geliştirme:** MovieLens veri setini kullanarak etkili bir collaborative filtering modeli (örn: SVD, kullanıcı/film benzerliği) geliştirmek.
2.  **API Oluşturma:** Flask kullanarak, film verileri ve önerileri sunan bir RESTful API oluşturmak.
3.  **Frontend Geliştirme:** Next.js kullanarak modern, duyarlı ve kullanıcı dostu bir web arayüzü oluşturmak.
4.  **TMDB Entegrasyonu:** Film afişleri, özetleri ve diğer detaylar için TMDB API'sini entegre etmek.
5.  **Kişiselleştirme:** Kullanıcıların değerlendirmelerine dayalı olarak kişiselleştirilmiş film önerileri sunmak.
6.  **Keşif:** Kullanıcıların yeni filmler keşfetmesini sağlamak (benzer filmler, popüler filmler vb.).

## Kapsam
-   **Backend:** Python, Flask, Pandas, Surprise/Scikit-learn
-   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
-   **Veri Kaynağı:** MovieLens (ml-latest) veri seti
-   **Ek Veri Kaynağı:** TMDB API
-   **Öneri Modeli:** Collaborative Filtering (bellek tabanlı ve/veya model tabanlı)
-   **Temel Özellikler:** Film listeleme, arama, detay görüntüleme, değerlendirme, kişisel öneriler, benzer film önerileri.

## Dışında Kalan Konular (İlk Aşama)
-   Kapsamlı kullanıcı kimlik doğrulama ve yetkilendirme sistemi (basit bir kullanıcı ID sistemi olabilir)
-   Sosyal özellikler (arkadaş listesi, paylaşım vb.)
-   Gelişmiş içerik tabanlı filtreleme (tag genome kullanımı)
-   Mobil uygulama

## Başarı Kriterleri
-   Doğru ve çeşitli film önerileri sunabilme.
-   Hızlı ve duyarlı bir kullanıcı arayüzü.
-   Modelin makul bir sürede öneri üretebilmesi.
-   TMDB entegrasyonunun sorunsuz çalışması.
-   Sistemin temel fonksiyonlarının kararlı çalışması. 