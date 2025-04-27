
---

# NextFilms: Personalized Movie Recommendation System

[![Screenshot](ana_ekran.png)](ana_ekran.png)

This project is a modern web application that provides users with personalized movie recommendations based on the movies they watch and rate. It is developed using the MovieLens dataset and the TMDB API.

## 🚀 Key Features

*   **Discover Movies:** Browse a large movie catalog and discover popular films.
*   **Smart Search:** Instantly search for movies by title and see results quickly.
*   **Movie Details:** Access detailed information including summaries, genres, cast, and more in a modal window, thanks to TMDB API integration.
*   **Rating:** Rate movies from 1 to 5 stars. Your ratings feed the recommendation algorithm and are stored locally.
*   **Favorites:** Add movies you like to your favorites list for easy access.
*   **Personalized Recommendations:** Get custom movie recommendations from the backend service, which uses a Collaborative Filtering (with SVD) model based on the movies you've rated.
*   **Modern Interface:** A user-friendly interface built with React, Next.js, Tailwind CSS, and Framer Motion, enhanced with Glassmorphism effects and smooth animations.
*   **Mobile-Friendly Design:** Provides a seamless experience across different screen sizes (PC, tablet, mobile).

## 🛠️ Technologies Used

*   **Backend:**
    *   **Python:** Main programming language.
    *   **Flask:** Web framework.
    *   **Pandas:** Data manipulation and analysis.
    *   **Scikit-learn:** Machine learning (for the SVD model).
    *   **Joblib:** Saving and loading the trained model to disk.
    *   **Gunicorn:** WSGI HTTP server for production environment.
*   **Frontend:**
    *   **Next.js:** React framework (SSR, Routing, etc.).
    *   **React:** User interface library.
    *   **TypeScript:** Safer code development with static typing.
    *   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
    *   **Framer Motion:** Smooth animations and transitions.
    *   **Axios:** For HTTP requests.
*   **Data Sources:**
    *   **MovieLens ml-latest:** Movie rating dataset.
    *   **The Movie Database (TMDB) API:** Movie metadata (summary, poster, genre, etc.).
*   **Deployment:**
    *   **Render:** Cloud hosting for backend and frontend applications.
    *   **AWS S3:** Storage for the trained model file.
*   **Other Tools:**
    *   **Git & GitHub:** Version control and code repository.
    *   **VS Code & Cursor:** Code editor and AI-assisted development.

## ⚙️ Setup and Running

Follow these steps to run the project on your local machine:

### Prerequisites

*   Python 3.8 or higher
*   Node.js 16 or higher
*   npm or yarn
*   [TMDB API Key](https://www.themoviedb.org/settings/api)

### Backend Setup

1.  **Clone the Project:**
    ```bash
    git clone <repository_url>
    cd <repository_name>/backend
    ```
2.  **Create and Activate Virtual Environment:**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create `.env` File:**
    Create a file named `.env` in the `backend` folder and add your TMDB API key:
    ```env
    TMDB_API_KEY=YOUR_TMDB_API_KEY
    ```
5.  **Model File:**
    *   The trained model (`.joblib` file) is normally downloaded from S3. For local execution, you might need to place a trained model file in the `backend/models/` folder and adjust the `MODEL_DOWNLOAD_URL` and `MODEL_FILENAME` variables in `app.py` accordingly (or temporarily disable the download logic).
6.  **Run the Application:**
    ```bash
    flask run
    ```
    The backend will run by default at `http://127.0.0.1:5000`.

### Frontend Setup

1.  **Navigate to Frontend Folder:**
    ```bash
    cd ../frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Create `.env.local` File:**
    Create a file named `.env.local` in the `frontend` folder and add the backend API address and your TMDB API key:
    ```env
    NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
    NEXT_PUBLIC_TMDB_API_KEY=YOUR_TMDB_API_KEY
    ```
4.  **Run the Application:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The frontend will run by default at `http://localhost:3000`.

## ☁️ Deployment and Challenges Faced

This application was attempted to be deployed on the **Render** platform. However, the **512 MB RAM limit** on Render's free tier caused **"Out of Memory"** errors during the loading of the Collaborative Filtering (SVD) model and associated data structures (like Pandas DataFrames).

The following steps were taken to overcome this challenge:

1.  **Model Size Reduction:** The complexity of the SVD model was reduced by decreasing the `n_components` parameter from `100` to `10`. This significantly reduced the model's disk size and memory footprint, but was not sufficient on its own.
2.  **Memory Mapping (`mmap_mode`):** In the backend code, the `mmap_mode='r'` parameter was used with the `joblib.load` function when loading the model. This technique maps the file content on disk to virtual memory instead of copying the entire large NumPy arrays into RAM, allowing the system to load only the needed parts into memory on demand. This change **critically reduced** memory usage, enabling the application to run within Render's limits.

This experience highlights a common challenge and potential solution strategies when deploying large machine learning models in resource-constrained environments.

## 🖼️ Screenshot

![Application Main Screen](ana_ekran.png)

## 🔮 Future Enhancements

*   Integration of more advanced recommendation algorithms (e.g., content-based filtering, hybrid approaches).
*   User profiles and authentication.
*   Periodic automatic retraining of the model.
*   More comprehensive testing (unit, integration, end-to-end).
*   Performance optimizations (API response times, database usage).

------------------------------------------------------------------

# NextFilms: Kişiselleştirilmiş Film Öneri Sistemi

[![Ekran Görüntüsü](ana_ekran.png)](ana_ekran.png)

Bu proje, kullanıcılara izledikleri ve puanladıkları filmlere göre kişiselleştirilmiş film önerileri sunan modern bir web uygulamasıdır. MovieLens veri seti ve TMDB API kullanılarak geliştirilmiştir.

## 🚀 Öne Çıkan Özellikler

*   **Film Keşfet:** Geniş bir film kataloğunu listeleyin ve popüler filmleri keşfedin.
*   **Akıllı Arama:** Film adına göre anlık arama yapın ve sonuçları hızla görün.
*   **Film Detayları:** TMDB API entegrasyonu sayesinde filmlerin özetini, türünü, oyuncu kadrosunu ve daha fazlasını içeren detaylı bilgilere modal pencerede erişin.
*   **Puanlama:** Filmleri 1-5 yıldız arası puanlayın. Puanlarınız öneri algoritmasını besler ve yerel depolamada saklanır.
*   **Favoriler:** Beğendiğiniz filmleri favori listenize ekleyin ve kolayca erişin.
*   **Kişiselleştirilmiş Öneriler:** Puanladığınız filmlere dayanarak, Collaborative Filtering (SVD ile) modelini kullanan backend servisinden size özel film önerileri alın.
*   **Modern Arayüz:** React, Next.js, Tailwind CSS ve Framer Motion ile oluşturulmuş, Glassmorphism efektleri ve akıcı animasyonlarla zenginleştirilmiş kullanıcı dostu bir arayüz.
*   **Mobil Uyumlu Tasarım:** Farklı ekran boyutlarında (PC, tablet, mobil) sorunsuz bir deneyim sunar.

## 🛠️ Kullanılan Teknolojiler

*   **Backend:**
    *   **Python:** Ana programlama dili.
    *   **Flask:** Web framework'ü.
    *   **Pandas:** Veri manipülasyonu ve analizi.
    *   **Scikit-learn:** Makine öğrenimi (SVD modeli için).
    *   **Joblib:** Eğitilmiş modelin diske kaydedilmesi ve yüklenmesi.
    *   **Gunicorn:** Üretim ortamı için WSGI HTTP sunucusu.
*   **Frontend:**
    *   **Next.js:** React framework'ü (SSR, Routing vb.).
    *   **React:** Kullanıcı arayüzü kütüphanesi.
    *   **TypeScript:** Statik tipleme ile daha güvenli kod geliştirme.
    *   **Tailwind CSS:** Hızlı UI geliştirme için yardımcı sınıf tabanlı CSS framework'ü.
    *   **Framer Motion:** Akıcı animasyonlar ve geçişler.
    *   **Axios:** HTTP istekleri için.
*   **Veri Kaynakları:**
    *   **MovieLens ml-latest:** Film derecelendirme veri seti.
    *   **The Movie Database (TMDB) API:** Film meta verileri (özet, afiş, tür vb.).
*   **Deployment:**
    *   **Render:** Backend ve Frontend uygulamalarının bulutta barındırılması.
    *   **AWS S3:** Eğitilmiş model dosyasının depolanması.
*   **Diğer Araçlar:**
    *   **Git & GitHub:** Versiyon kontrolü ve kod deposu.
    *   **VS Code & Cursor:** Kod editörü ve AI destekli geliştirme.

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları takip edin:

### Gereksinimler

*   Python 3.8 veya üzeri
*   Node.js 16 veya üzeri
*   npm veya yarn
*   [TMDB API Anahtarı](https://www.themoviedb.org/settings/api)

### Backend Kurulumu

1.  **Proje Klonlama:**
    ```bash
    git clone <repository_url>
    cd <repository_name>/backend
    ```
2.  **Sanal Ortam Oluşturma ve Aktifleştirme:**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  **Bağımlılıkları Yükleme:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **`.env` Dosyası Oluşturma:**
    `backend` klasöründe `.env` adında bir dosya oluşturun ve içine TMDB API anahtarınızı ekleyin:
    ```env
    TMDB_API_KEY=YOUR_TMDB_API_KEY
    ```
5.  **Model Dosyası:**
    *   Eğitilmiş model (`.joblib` dosyası) normalde S3'den indirilir. Yerel çalıştırma için, eğitilmiş bir model dosyasını `backend/models/` klasörüne yerleştirmeniz ve `app.py` içindeki `MODEL_DOWNLOAD_URL` ve `MODEL_FILENAME` değişkenlerini uygun şekilde ayarlamanız gerekebilir (veya indirme mantığını geçici olarak devre dışı bırakabilirsiniz).
6.  **Uygulamayı Çalıştırma:**
    ```bash
    flask run
    ```
    Backend varsayılan olarak `http://127.0.0.1:5000` adresinde çalışacaktır.

### Frontend Kurulumu

1.  **Frontend Klasörüne Geçme:**
    ```bash
    cd ../frontend
    ```
2.  **Bağımlılıkları Yükleme:**
    ```bash
    npm install
    # veya
    yarn install
    ```
3.  **`.env.local` Dosyası Oluşturma:**
    `frontend` klasöründe `.env.local` adında bir dosya oluşturun ve içine backend API adresini ve TMDB API anahtarınızı ekleyin:
    ```env
    NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
    NEXT_PUBLIC_TMDB_API_KEY=YOUR_TMDB_API_KEY
    ```
4.  **Uygulamayı Çalıştırma:**
    ```bash
    npm run dev
    # veya
    yarn dev
    ```
    Frontend varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

## ☁️ Deployment ve Karşılaşılan Zorluklar

Bu uygulama **Render** platformunda canlıya alınmaya çalışılmıştır. Ancak, Render'ın ücretsiz katmanındaki **512 MB RAM limiti**, Collaborative Filtering (SVD) modelinin ve ilgili veri yapılarının (Pandas DataFrames vb.) belleğe yüklenmesi sırasında **"Out of Memory" (Bellek Yetersiz)** hatalarına neden olmuştur.

Bu zorluğun üstesinden gelmek için aşağıdaki adımlar uygulanmıştır:

1.  **Model Küçültme:** SVD modelinin karmaşıklığı, `n_components` parametresi `100`'den `10`'a düşürülerek azaltıldı. Bu, modelin disk boyutunu ve bellekte kapladığı alanı önemli ölçüde azalttı, ancak tek başına yeterli olmadı.
2.  **Memory Mapping (`mmap_mode`):** Backend kodunda, `joblib.load` fonksiyonu ile model yüklenirken `mmap_mode='r'` parametresi kullanıldı. Bu teknik, modelin büyük NumPy dizilerinin tamamını RAM'e kopyalamak yerine, disk üzerindeki dosya içeriğini sanal belleğe eşleyerek, sadece ihtiyaç duyulan kısımların belleğe yüklenmesini sağlar. Bu değişiklik, bellek kullanımını **kritik ölçüde azaltarak** uygulamanın Render'ın limitleri dahilinde çalışmasını mümkün kılmıştır.

Bu deneyim, kaynak kısıtlı ortamlarda büyük makine öğrenimi modellerini dağıtırken karşılaşılan yaygın bir zorluğu ve olası çözüm stratejilerini göstermektedir.

## 🖼️ Ekran Görüntüsü

![Uygulama Ana Ekranı](ana_ekran.png)

## 🔮 Gelecek Geliştirmeler

*   Daha gelişmiş öneri algoritmaları entegrasyonu (örn: içerik tabanlı filtreleme, hibrit yaklaşımlar).
*   Kullanıcı profilleri ve kimlik doğrulama.
*   Modelin periyodik olarak otomatik yeniden eğitimi.
*   Daha kapsamlı testler (birim, entegrasyon, uçtan uca).
*   Performans optimizasyonları (API yanıt süreleri, veritabanı kullanımı).

---

