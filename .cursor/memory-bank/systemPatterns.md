# Sistem Mimarisi ve Desenleri

## Genel Mimari: İstemci-Sunucu Modeli
Proje, klasik bir istemci-sunucu mimarisine dayanır:

```mermaid
graph TD
    A[Kullanıcı Tarayıcısı (Frontend - Next.js)] --> B(Backend API - Flask);
    B --> C{Öneri Modeli (Python)};
    B --> D[Veri Kaynakları (MovieLens CSV)];
    A --> E(TMDB API);
```

1.  **Frontend (Next.js):** Kullanıcı arayüzünü sunar, kullanıcı etkileşimlerini alır ve Backend API ile iletişim kurar. Ayrıca film detayları için doğrudan TMDB API'sine istek gönderir.
2.  **Backend (Flask API):** Frontend'den gelen istekleri işler, öneri modelini kullanarak hesaplamalar yapar, MovieLens verilerine erişir ve sonuçları Frontend'e JSON formatında döndürür.
3.  **Öneri Modeli (Python):** Backend'in bir parçası olarak çalışır. Collaborative filtering algoritmalarını (SVD, benzerlik hesaplamaları vb.) içerir.
4.  **Veri Kaynakları (MovieLens):** Film, değerlendirme ve bağlantı bilgilerini içeren CSV dosyaları.
5.  **TMDB API:** Film afişleri, özetleri gibi ek meta verileri sağlayan harici bir servis.

## Backend Desenleri (Flask)
-   **RESTful API:** Kaynak bazlı URL'ler (örn: `/api/movies`, `/api/users/{id}/recommendations`) ve standart HTTP metodları (GET, POST) kullanılır.
-   **Model-View-Controller (MVC) Benzeri Yapı:**
    -   **Model:** Veri işleme (`preprocess.py`) ve öneri mantığı (`collaborative_filter.py`).
    -   **Controller:** API endpoint'leri (`app.py`), istekleri alır, modeli çağırır ve yanıtları oluşturur.
    -   **View:** Yok (API olduğu için doğrudan JSON yanıtı döndürülür).
-   **Veri Erişimi:** Şimdilik doğrudan Pandas ile CSV dosyalarından okuma. İleride bir veritabanı (SQLite/PostgreSQL) ve ORM (SQLAlchemy) entegre edilebilir.

## Frontend Desenleri (Next.js)
-   **Component-Based Architecture:** Arayüz, tekrar kullanılabilir bileşenlere (Components) ayrılır (örn: `FilmCard`, `RatingStars`, `SearchBar`).
-   **Page-Based Routing:** `pages` klasöründeki dosya yapısı otomatik olarak URL rotalarını belirler.
-   **Server-Side Rendering (SSR) / Static Site Generation (SSG):** Next.js'in yetenekleri, ilk sayfa yükleme performansını optimize etmek için kullanılabilir (bazı sayfalar statik olarak oluşturulabilir).
-   **API İstemcisi:** Backend API'sine ve TMDB API'sine istek yapmak için merkezi bir modül (`lib/api.js` veya benzeri).
-   **State Management:** Basit durumlar için React'in kendi `useState`, `useContext` hook'ları; daha karmaşık API veri yönetimi için `SWR` veya `React Query` gibi kütüphaneler değerlendirilebilir.

## Collaborative Filtering Yaklaşımı
-   **Veri:** `ratings.csv` ana veri kaynağıdır.
-   **Yöntemler:**
    1.  **Model Tabanlı (SVD):** `surprise` kütüphanesi kullanılarak kullanıcı-film matrisindeki gizli faktörleri bulma. Ölçeklenebilirlik ve daha iyi genelleme potansiyeli.
    2.  **Bellek Tabanlı (Benzerlik):**
        -   *Kullanıcı-Kullanıcı:* Benzer değerlendirme geçmişine sahip kullanıcıları bulma (örn: kosinüs benzerliği ile).
        -   *Film-Film:* Benzer kullanıcılar tarafından benzer şekilde değerlendirilen filmleri bulma.
-   **Hibrit Yaklaşım:** Başlangıçta bir yöntemle başlanıp (örn: SVD), daha sonra diğer yöntemler veya içerik bilgisi (türler, etiketler) ile zenginleştirilebilir.
-   **Cold Start:** Yeni kullanıcılar için popüler filmleri veya genel tür tercihlerine göre öneriler sunma stratejisi geliştirilecek.

## Veri Akışı (Öneri Örneği)
1.  Frontend, `/api/recommendations/{user_id}` endpoint'ine GET isteği gönderir.
2.  Flask (`app.py`), isteği alır ve `user_id`'yi çıkarır.
3.  `app.py`, `collaborative_filter.py` içindeki `get_recommendations(user_id)` fonksiyonunu çağırır.
4.  `get_recommendations`, eğitilmiş modeli (örn: SVD) veya benzerlik matrislerini kullanarak önerilecek `movieId` listesini hesaplar.
5.  Hesaplanan `movieId` listesi `app.py`'ye döner.
6.  `app.py`, bu listeyi JSON formatında Frontend'e yanıt olarak gönderir.
7.  Frontend, gelen `movieId` listesini alır.
8.  Frontend, her `movieId` için `movies.csv`'den alınan temel bilgileri (başlık, tür) ve `links.csv`'den alınan `tmdbId`'yi kullanarak TMDB API'sinden afiş/özet gibi ek bilgileri çeker.
9.  Frontend, tüm bilgileri birleştirerek kullanıcıya öneri listesini gösterir. 