# Aktif Çalışma Bağlamı

## Mevcut Durum (07/04/2024)
- Proje başlatıldı ve temel gereksinimler tanımlandı.
- Teknoloji yığını seçildi (Flask, Next.js, MovieLens, TMDB).
- Sistem mimarisi ve temel iş akışı üzerinde anlaşıldı.
- MovieLens `ml-latest` veri seti `backend/data` klasörüne eklendi.
- Memory Bank dosyaları oluşturuldu ve ilk bilgiler girildi.

## Güncel Çalışma Odağı
Şu anki ana odak, projenin temel iskeletini kurmak ve veri işlemeye başlamaktır:
1.  **Proje Yapısını Oluşturma:** `backend` ve `frontend` klasör yapılarının tam olarak oluşturulması.
2.  **Backend Kurulumu:**
    -   Gerekli Python kütüphanelerinin (`requirements.txt`) kurulumu.
    -   Temel Flask uygulamasının (`app.py`) oluşturulması ve çalıştırılması.
    -   CORS yapılandırmasının eklenmesi.
3.  **Veri Yükleme ve İlk İnceleme:**
    -   Pandas kullanarak `movies.csv`, `ratings.csv` ve `links.csv` dosyalarının yüklenmesi.
    -   Veri yapılarının ve içeriklerinin temel düzeyde incelenmesi.
    -   `links.csv` dosyasındaki `tmdbId`'nin varlığının kontrol edilmesi.
4.  **Frontend Kurulumu:**
    -   `create-next-app` ile temel Next.js (TypeScript, Tailwind CSS ile) projesinin oluşturulması.
    -   Gerekli Node.js bağımlılıklarının (`package.json`) kurulumu.
    -   Temel projenin çalıştırılması.

## Aktif Kararlar ve Değerlendirmeler
-   **Veri Seti:** `ml-latest` kullanılacak. Büyük boyutu nedeniyle geliştirme sırasında `ratings.csv`'nin daha küçük bir örneği ile çalışılması düşünülebilir.
-   **Öneri Modeli:** Başlangıç için `Surprise` kütüphanesi ile **SVD** algoritması denenmesi planlanıyor.
-   **TMDB Entegrasyonu:** Frontend tarafında yapılacak. `links.csv` dosyasındaki `movieId` ile `tmdbId` eşleşmesi kullanılacak.
-   **API Tasarımı:** `systemPatterns.md` dosyasında belirtilen RESTful endpoint yapısı takip edilecek.

## Sonraki Adımlar (Yakın Vade)
1.  `backend` klasöründe `requirements.txt` oluşturup bağımlılıkları kurmak.
2.  `backend/app.py` içinde basit bir "Merhaba Dünya" endpoint'i oluşturup test etmek.
3.  `backend` içinde `model/preprocess.py` dosyası oluşturup Pandas ile veri yükleme fonksiyonlarını yazmak.
4.  `frontend` klasörünü oluşturup `npx create-next-app@latest frontend --ts --tailwind --eslint` komutu ile Next.js projesini başlatmak.
5.  Frontend projesini çalıştırıp temel sayfanın geldiğini görmek.
6.  Frontend'de basit bir API çağrısı yaparak Backend'deki "Merhaba Dünya" endpoint'ine ulaşıp ulaşamadığını test etmek.

## Karar Verilmesi Gereken Konular
-   Geliştirme sırasında `ratings.csv`'nin ne kadarlık bir bölümüyle çalışılacak?
-   Model eğitimi ne zaman ve nasıl tetiklenecek (ilk aşamada manuel mi olacak)?
-   Kullanıcı ID'leri nasıl yönetilecek (rastgele mi atanacak, basit bir form mu olacak)? 