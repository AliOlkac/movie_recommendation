# Teknoloji Bağlamı

## Kullanılacak Teknolojiler

### Backend (Python)
-   **Dil:** Python 3.9+
-   **Web Framework:** Flask (~2.x)
-   **Veri İşleme:** Pandas (~1.x)
-   **Makine Öğrenmesi (CF):**
    -   Surprise (~1.x) - SVD ve diğer CF algoritmaları için.
    -   Scikit-learn (~1.x) - Gerekirse benzerlik hesaplamaları veya ek modelleme için.
-   **API Yardımcıları:** Flask-RESTful (isteğe bağlı), Flask-CORS (gerekli)
-   **Veritabanı (İleride):** SQLite (geliştirme), PostgreSQL (üretim)
-   **ORM (İleride):** SQLAlchemy

### Frontend (JavaScript/TypeScript)
-   **Framework:** Next.js (13+)
-   **UI Kütüphanesi:** React (18+)
-   **Dil:** TypeScript
-   **Stil:** Tailwind CSS (~3.x)
-   **API İstemcisi:** Axios veya yerleşik `fetch`
-   **State Management:** React Context API, `useState`, `useEffect`. (İhtiyaç olursa SWR veya React Query)

### Harici Servisler
-   **TMDB API:** Film meta verileri (afiş, özet, oyuncu vb.) için.

### Veri Kaynağı
-   **MovieLens:** `ml-latest` veri seti (içerdiği dosyalar: `ratings.csv`, `movies.csv`, `links.csv`, `tags.csv`, `genome-scores.csv`, `genome-tags.csv`)

## Geliştirme Ortamı ve Araçlar
-   **Versiyon Kontrolü:** Git, GitHub/GitLab/Bitbucket
-   **Paket Yöneticileri:**
    -   Python: `pip` ve `requirements.txt` (veya `pipenv`/`poetry`)
    -   Node.js: `npm` veya `yarn` ve `package.json`
-   **Kod Editörü:** VS Code, Cursor
-   **İşletim Sistemi:** Windows (PowerShell/CMD), Linux, macOS
-   **API Test Aracı:** Postman, Insomnia veya VS Code eklentileri
-   **Tarayıcı:** Modern web tarayıcıları (Chrome, Firefox, Edge)

## Gerekli Kurulumlar
-   Python 3.9 veya üstü
-   Node.js (LTS versiyonu önerilir) ve npm/yarn
-   Git

## Teknik Kısıtlamalar ve Varsayımlar
-   **Veri Boyutu:** `ml-latest` veri seti oldukça büyük (`ratings.csv` ~900MB). Veri işleme ve model eğitimi zaman alabilir. Geliştirme sırasında daha küçük bir alt küme ile çalışmak gerekebilir.
-   **Model Eğitimi:** Modelin periyodik olarak yeniden eğitilmesi gerekecek (şu an için manuel tetikleme).
-   **Gerçek Zamanlılık:** Öneriler tamamen gerçek zamanlı olmayabilir; bazı hesaplamalar önceden yapılıp saklanabilir.
-   **TMDB API Limitleri:** TMDB API'sinin kullanım limitleri vardır, geliştirme sırasında dikkatli olunmalıdır.
-   **Kimlik Doğrulama:** Başlangıçta basit bir kullanıcı ID sistemi varsayılacaktır (örn: URL üzerinden veya basit bir girişle).

## Temel Bağımlılıklar (Örnek `requirements.txt`)
```txt
flask
flask-cors
pandas
numpy
scikit-learn
surprise
```

## Temel Bağımlılıklar (Örnek `package.json` - `dependencies`)
```json
{
  "next": "^13.x.x",
  "react": "^18.x.x",
  "react-dom": "^18.x.x",
  "axios": "^1.x.x",
  "tailwindcss": "^3.x.x",
  "typescript": "^5.x.x"
}
```
*(Not: Versiyon numaraları tahminidir ve kurulum sırasında güncel versiyonlar kullanılacaktır.)* 