# Film Öneri Sistemi

Bu proje, MovieLens veri setini kullanarak kişiselleştirilmiş film önerileri sunan bir web uygulamasıdır. Kullanıcılar, filmlere puan verebilir, favorilere ekleyebilir ve kendilerine özel film önerileri alabilirler.

## Özellikler

- Film arama ve filtreleme
- Filmlere puan verme (1-5 yıldız)
- Favori filmleri kaydetme
- Kişiselleştirilmiş film önerileri alma
- Benzer film önerileri görme

## Kurulum

### Gereksinimler

- Python 3.8+
- Node.js 14+
- npm 6+

### Backend Kurulumu

1. MovieLens veri setini indirin:
   - [MovieLens 25M Dataset](https://grouplens.org/datasets/movielens/25m/) adresine gidin
   - `ml-25m.zip` dosyasını indirin
   - Zip dosyasının içindeki CSV dosyalarını (`movies.csv`, `ratings.csv`, `links.csv`, vb.) `backend/data/` klasörüne kopyalayın

2. Python bağımlılıklarını yükleyin:
```bash
cd backend
pip install -r requirements.txt
```

3. Backend sunucusunu başlatın:
```bash
python app.py
```

### Frontend Kurulumu

1. Node.js bağımlılıklarını yükleyin:
```bash
cd frontend
npm install
```

2. Frontend uygulamasını başlatın:
```bash
npm run dev
```

## Kullanım

1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Ana sayfada film listesini görüntüleyin, filmleri arayın
3. Film detaylarına gitmek için film kartına tıklayın
4. Filmlere puan vermek için yıldızlara tıklayın (1-5 arası)
5. Filmleri favorilerinize eklemek için kalp simgesine tıklayın
6. En az 5 filme puan verdikten sonra ana sayfada "Öneriler hazır" mesajını göreceksiniz
7. Bu mesaja tıklayarak kişiselleştirilmiş film önerilerinizi görüntüleyin

## Teknik Detaylar

### Backend

- Flask web çerçevesi
- Python ile işbirlikçi filtreleme algoritmaları
- RESTful API

### Frontend

- Next.js
- React
- Axios (HTTP istekleri için)
- Modern UI/UX tasarımı

## Veri Seti

Bu projede [MovieLens 25M Dataset](https://grouplens.org/datasets/movielens/25m/) kullanılmaktadır. GitHub sınırlamaları nedeniyle, veri seti repo içerisinde bulunmamaktadır ve yukarıdaki talimatlara göre manuel olarak indirilmelidir.

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir dal oluşturun (`git checkout -b feature/awesome-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Harika özellik ekle'`)
4. Dalınıza push yapın (`git push origin feature/awesome-feature`)
5. Bir Pull Request oluşturun

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın. 