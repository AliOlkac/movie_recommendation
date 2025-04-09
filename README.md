# Film Öneri Sistemi Projesi

Bu proje, kullanıcılara kişiselleştirilmiş film önerileri sunmayı amaçlayan bir web uygulamasıdır. Backend Flask ile, Frontend ise Next.js ile geliştirilmektedir. Öneri modeli için MovieLens veri seti ve İşbirlikçi Filtreleme (Collaborative Filtering) tekniği (TruncatedSVD tabanlı) kullanılmaktadır.

## 🚀 Mevcut Özellikler (v0.1)

*   **Backend:**
    *   Flask tabanlı temel API sunucusu.
    *   MovieLens (`ml-latest`) verisini işleme ve yükleme yeteneği.
    *   `scikit-learn` kullanarak TruncatedSVD tabanlı İşbirlikçi Filtreleme modelini eğitme.
    *   Eğitilmiş modeli (`.joblib` dosyası olarak) diske kaydetme ve yükleme.
    *   Belirli bir kullanıcı ID'si için film önerileri döndüren temel bir API endpoint'i (`/api/recommendations/<user_id>`).
*   **Frontend:**
    *   Next.js (TypeScript, Tailwind CSS ile) projesi başlatıldı ve temel yapı kuruldu.

## 🛠️ Teknoloji Yığını

*   **Backend:** Python, Flask, Pandas, Scikit-learn, NumPy, Joblib
*   **Frontend:** Node.js, Next.js, React, TypeScript, Tailwind CSS
*   **Veri Seti:** [MovieLens ml-latest](https://grouplens.org/datasets/movielens/latest/) (Tam veri seti)
*   **Veri Tabanı:** (Henüz belirlenmedi/kullanılmıyor)
*   **API İletişimi:** RESTful API (JSON)

## 📁 Proje Yapısı

```
.
├── backend/                # Flask Backend Uygulaması
│   ├── data/               # MovieLens veri setinin bulunması gereken yer (Git'e dahil değil)
│   ├── models/             # Öneri modeli kodları ve kaydedilmiş model (.joblib - Git'e dahil değil)
│   │   ├── collaborative_filter.py
│   │   └── cf_svd_model_data_k20.joblib  (Oluşturulacak/Eğitilecek)
│   ├── utils/              # Yardımcı fonksiyonlar (örn: veri işleme)
│   │   └── preprocess.py
│   ├── venv/               # Python sanal ortamı (Git'e dahil değil)
│   ├── app.py              # Ana Flask uygulaması
│   └── requirements.txt    # Python bağımlılıkları
├── frontend/               # Next.js Frontend Uygulaması
│   ├── src/                # Kaynak kodlar
│   ├── public/             # Statik dosyalar
│   ├── node_modules/       # Node.js bağımlılıkları (Git'e dahil değil)
│   ├── package.json        # Node.js bağımlılıkları ve scriptler
│   ├── next.config.js
│   └── tsconfig.json
├── .cursor/                # Cursor AI ayarları ve Memory Bank
├── .git/
├── .gitignore              # Git tarafından takip edilmeyecek dosyalar
└── README.md               # Bu dosya
```

## ⚙️ Kurulum ve Çalıştırma

### 1. Depoyu Klonlama

```bash
git clone <repository_url>
cd movie_reccomandation 
```

### 2. Backend Kurulumu

*   **Veri Setini İndirme:**
    *   [MovieLens Latest Datasets](https://grouplens.org/datasets/movielens/latest/) sayfasından **ml-latest.zip** dosyasını indirin.
    *   Zip dosyasını açın ve içindeki `ml-latest` klasörünün içeriğini (özellikle `movies.csv` ve `ratings.csv`) projenizdeki `backend/data/` klasörüne kopyalayın.
    *   **Not:** `ratings.csv` dosyası çok büyük olduğu için (`~900MB`) `.gitignore` dosyası ile Git'e dahil edilmemiştir. Bu dosyayı manuel olarak eklemeniz gerekmektedir.

*   **Bağımlılıkları Kurma:**
    ```powershell
    # backend dizinine gidin
    cd backend

    # Sanal ortam oluşturun
    python -m venv venv

    # Sanal ortamı aktive edin (Windows PowerShell)
    .\venv\Scripts\activate 
    # (Diğer kabuklar için: source venv/bin/activate)

    # Bağımlılıkları kurun
    pip install -r requirements.txt
    ```

*   **Modeli Eğitme (İlk Kurulumda Gerekli):**
    *   Kaydedilmiş model (`.joblib`) Git'e dahil edilmediği için, ilk kurulumda modeli eğitmeniz gerekecektir.
    *   Backend sanal ortamı aktifken aşağıdaki komutu çalıştırın:
        ```powershell
        python models/collaborative_filter.py 
        ```
    *   Bu işlem, verinin büyüklüğüne bağlı olarak **uzun sürebilir**. İşlem tamamlandığında `backend/models/cf_svd_model_data_k20.joblib` dosyası oluşturulacaktır.

### 3. Frontend Kurulumu

```powershell
# frontend dizinine gidin
cd ..\frontend 
# veya proje kökünden: cd frontend

# Bağımlılıkları kurun
npm install
```

### 4. Uygulamayı Çalıştırma

*   **Backend Sunucusunu Başlatma:**
    *   Yeni bir terminal açın.
    *   `backend` dizinine gidin.
    *   Sanal ortamı aktive edin: `.\venv\Scripts\activate`
    *   Flask sunucusunu başlatın: `python app.py`
    *   Sunucu varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

*   **Frontend Geliştirme Sunucusunu Başlatma:**
    *   Yeni bir terminal açın.
    *   `frontend` dizinine gidin.
    *   Geliştirme sunucusunu başlatın: `npm run dev`
    *   Frontend uygulaması varsayılan olarak `http://localhost:3000` adresinde açılacaktır.

## 📡 API Endpointleri (Mevcut)

*   **`GET /api/recommendations/<user_id>`**: Belirtilen `user_id` için kişiselleştirilmiş film önerileri listesi döndürür.
    *   Örnek: `http://localhost:5000/api/recommendations/1`
    *   Başarılı Yanıt (Örnek):
        ```json
        [
          {"movieId": 1198, "title": "Raiders of the Lost Ark (Indiana Jones and the Raiders of the Lost Ark) (1981)", "score": 2.926},
          {"movieId": 1270, "title": "Back to the Future (1985)", "score": 1.813},
          ...
        ]
        ```
    *   Hata Yanıtları: `404 Not Found` (Kullanıcı bulunamazsa), `503 Service Unavailable` (Model yüklenememişse), `500 Internal Server Error` (Genel hata).

## 📝 Mevcut Durum

Proje şu anda backend tarafında temel işlevselliğe sahiptir. Veri işleme, model eğitimi/yükleme ve temel bir öneri API endpoint'i çalışmaktadır. Frontend tarafı ise Next.js ile başlatılmış durumdadır.

## 🎯 Sonraki Adımlar

*   Backend API'sini genişletmek (tüm filmleri listeleme, film detayları vb.).
*   Frontend arayüzünü geliştirmek (film listeleme, film detay sayfası, öneri gösterimi).
*   Frontend ile Backend API'sini entegre etmek.
*   TMDB API'sini kullanarak film afişleri ve ek bilgiler almak.
*   Modeli iyileştirmek ve değerlendirmek.
*   Kullanıcı değerlendirme mekanizması eklemek.
*   (Detaylı adımlar için `.cursor/memory-bank/progress.md` dosyasına bakılabilir.) 