# Teknoloji Bağlamı

## Geliştirme Ortamı

### Backend (Python/Flask)
- **Programlama Dili:** Python 3.8+
- **Web Framework:** Flask 2.0+
- **API Tasarımı:** RESTful API, Flask-RESTful
- **Veritabanı:** SQLite (geliştirme), PostgreSQL (üretim)
- **ORM:** SQLAlchemy
- **Veri Manipülasyonu:** Pandas, NumPy
- **Makine Öğrenmesi:** Scikit-learn, Surprise kütüphanesi
- **API Dokümantasyonu:** Swagger/OpenAPI
- **Test:** PyTest

### Frontend (Next.js)
- **Framework:** Next.js 13+
- **Programlama Dili:** TypeScript
- **UI Kütüphanesi:** React
- **Stil:** Tailwind CSS
- **Durum Yönetimi:** React Query, Context API
- **HTTP İstemcisi:** Axios
- **Test:** Jest, React Testing Library

## Veri Kaynakları
- **Film Veri Seti:** MovieLens (başlangıç için "Latest Small" - 100K değerlendirme)
- **Film Görselleri:** TMDB API (isteğe bağlı entegrasyon)

## Dağıtım ve Altyapı
- **Backend Hosting:** Heroku veya Vercel
- **Frontend Hosting:** Vercel
- **Konteynerizasyon:** Docker
- **CI/CD:** GitHub Actions

## Geliştirme Araçları
- **Versiyon Kontrolü:** Git, GitHub
- **Kod Düzenleyici:** VS Code, Cursor
- **Paket Yöneticileri:** pip, npm/yarn
- **API Test:** Postman veya Insomnia
- **Proje Yönetimi:** GitHub Projects

## Teknik Kısıtlamalar
- Başlangıçta basit bir model ile ilerleyeceğiz (SVD veya KNN tabalı)
- Gerçek zamanlı öneriler yerine önceden hesaplanmış öneriler kullanılacak
- Veri seti boyutu sınırlı tutulacak (geliştirme aşamasında)
- Kullanıcı kimlik doğrulama sistemi ilk aşamada basit tutulacak

## Bağımlılıklar
### Backend Bağımlılıkları
```
flask==2.0.1
flask-cors==3.0.10
flask-restful==0.3.9
pandas==1.3.3
numpy==1.21.2
scikit-learn==1.0
surprise==0.1
sqlalchemy==1.4.23
```

### Frontend Bağımlılıkları
```
"next": "^13.0.0",
"react": "^18.2.0",
"react-dom": "^18.2.0",
"axios": "^0.27.2",
"tailwindcss": "^3.0.0",
"typescript": "^4.8.0"
``` 