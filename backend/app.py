# Gerekli kütüphaneleri import et
from flask import Flask, jsonify, abort, request
from flask_cors import CORS
import os
import sys
import pandas as pd
import requests # Hem TMDB hem model indirme için
import time # API rate limiting için eklenebilir
from dotenv import load_dotenv # .env dosyasını yüklemek için
# import boto3 # Artık gerekli değil
# from botocore.exceptions import NoCredentialsError, ClientError # Artık gerekli değil

# Ortam değişkenlerini .env dosyasından yükle
load_dotenv()

# Model sınıfımızı import etmek için path ayarlaması
try:
    from models.collaborative_filter import CollaborativeFilteringModel
except ModuleNotFoundError:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..'))
    if project_root not in sys.path:
        sys.path.append(project_root)
    try:
         from backend.models.collaborative_filter import CollaborativeFilteringModel
    except ModuleNotFoundError:
         print("HATA: CollaborativeFilteringModel import edilemedi!")
         CollaborativeFilteringModel = None

# --- Model Yükleme (URL'den İndirme ile) ---
MODEL_FILENAME = "cf_svd_model_data_k20_v2.joblib"
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODELS_DIR, MODEL_FILENAME)

# İndirme için Model URL'si - BUNU KENDİ ÇALIŞAN URL'N İLE DEĞİŞTİR!
MODEL_DOWNLOAD_URL = "https://aliqo-movie-rec-model.s3.eu-north-1.amazonaws.com/cf_svd_model_data_k20_v2.joblib"

def download_model_from_url(url, local_path):
    """Modeli verilen URL'den indirir."""
    # Modelin kaydedileceği klasörün var olduğundan emin ol
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    print(f"URL'den model indirme deneniyor: {url} -> {local_path}")
    try:
        response = requests.get(url, stream=True, timeout=300) # stream=True büyük dosyalar için, timeout artırıldı
        response.raise_for_status() # HTTP hatalarını kontrol et (4xx, 5xx)
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024 # 1 KB
        
        with open(local_path, 'wb') as f:
            downloaded_size = 0
            for data in response.iter_content(block_size):
                f.write(data)
                downloaded_size += len(data)
                # İsteğe bağlı: İndirme ilerlemesini göster
                # done = int(50 * downloaded_size / total_size)
                # sys.stdout.write(f"\r[{'=' * done}{' ' * (50-done)}] {downloaded_size/1024/1024:.2f} MB / {total_size/1024/1024:.2f} MB")
                # sys.stdout.flush()
        print("\nModel başarıyla URL'den indirildi.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"HATA: Model URL'sine bağlanırken veya indirirken hata oluştu: {e}")
        # İndirme başarısız olursa yarım kalan dosyayı silmek iyi olabilir
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass
        return False
    except Exception as e:
        print(f"HATA: Model indirme sırasında beklenmedik bir hata: {e}")
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass
        return False

# Uygulama başlangıcında modeli kontrol et ve gerekirse indir
recommendation_model = None # Başlangıçta None olarak ayarla

if not os.path.exists(MODEL_PATH):
    print(f"Model dosyası yerelde bulunamadı: {MODEL_PATH}")
    if not MODEL_DOWNLOAD_URL:
        print("UYARI: MODEL_DOWNLOAD_URL ayarlanmamış. Model indirilemiyor.")
    else:
        download_successful = download_model_from_url(MODEL_DOWNLOAD_URL, MODEL_PATH)
        if not download_successful:
            print("UYARI: Model URL'den indirilemedi. Öneri sistemi çalışmayabilir.")
        else:
            # İndirme başarılıysa modeli yükle
            if CollaborativeFilteringModel:
                print(f"İndirilen model yükleniyor: {MODEL_PATH}")
                recommendation_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
                if recommendation_model is None:
                    print("UYARI: İndirilen model yüklenemedi!")
            else:
                 print("UYARI: Model sınıfı yüklenemedi!")
else:
    # Model zaten yerelde varsa doğrudan yükle
    print(f"Model dosyası yerelde bulundu: {MODEL_PATH}")
    if CollaborativeFilteringModel:
        print(f"Mevcut model yükleniyor: {MODEL_PATH}")
        recommendation_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
        if recommendation_model is None:
            print("UYARI: Mevcut model yüklenemedi!")
    else:
         print("UYARI: Model sınıfı yüklenemedi!")

# --- Film Verisini Yükleme ---
MOVIES_FILENAME = "movies.csv"
MOVIES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", MOVIES_FILENAME)
LINKS_FILENAME = "links.csv" # links.csv eklendi
LINKS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", LINKS_FILENAME) # links.csv yolu

movies_df = None
links_df = None
movie_id_to_tmdb_id = None # Eşleşme sözlüğü

try:
    print(f"Film verisi yükleniyor: {MOVIES_PATH}")
    movies_df = pd.read_csv(MOVIES_PATH)
    print(f"Film verisi başarıyla yüklendi. Toplam {len(movies_df)} film.")

    print(f"Link verisi yükleniyor: {LINKS_PATH}")
    links_df = pd.read_csv(LINKS_PATH)
    links_df = links_df.dropna(subset=['tmdbId'])
    links_df['tmdbId'] = links_df['tmdbId'].astype(int)
    movie_id_to_tmdb_id = links_df.set_index('movieId')['tmdbId'].to_dict()
    print("Link verisi başarıyla yüklendi ve movieId->tmdbId haritası oluşturuldu.")

except FileNotFoundError as e:
    print(f"UYARI: Veri dosyası bulunamadı: {e}. İlgili endpoint'ler çalışmayacak.")
    if 'movies.csv' in str(e): movies_df = None
    if 'links.csv' in str(e): movie_id_to_tmdb_id = None
except Exception as e:
    print(f"UYARI: Veri yüklenirken hata oluştu: {e}. İlgili endpoint'ler çalışmayacak.")
    movies_df = None
    movie_id_to_tmdb_id = None
# --------------------------

# --- TMDB API Ayarları ---
# API anahtarını ortam değişkeninden oku
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# API anahtarı yoksa uyarı ver (veya programı durdur)
if not TMDB_API_KEY:
    print("UYARI: TMDB_API_KEY ortam değişkeni bulunamadı! .env dosyasını kontrol edin.")
    # İsteğe bağlı: Anahtar olmadan devam etmek istemiyorsanız burada çıkabilirsiniz
    # sys.exit("TMDB API Anahtarı gerekli.") 

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500" # Afişler için temel URL (w500 boyutu)
# -----------------------

# Flask uygulamasını başlat
app = Flask(__name__)

# Frontend'den gelen isteklere izin vermek için CORS'u yapılandır
# origins="*" tüm kaynaklardan gelen isteklere izin verir,
# geliştirme aşamasında kullanışlıdır ancak production'da kısıtlanmalıdır.
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ana route (Test amaçlı güncellendi)
@app.route('/')
def index():
    return jsonify({"message": "Backend sunucusu çalışıyor! Model yüklendi mi: "
                   + ("Evet" if recommendation_model else "Hayır")
                   + ", Film verisi yüklendi mi: " + ("Evet" if movies_df is not None else "Hayır")
                   + ", Link verisi yüklendi mi: " + ("Evet" if movie_id_to_tmdb_id is not None else "Hayır")
                   })

# --- Öneri Endpoint'i ---
@app.route('/api/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Belirli bir kullanıcı için film önerileri döndürür.
    """
    if recommendation_model is None:
        abort(503, description="Öneri modeli şu anda kullanılamıyor.")

    print(f"Kullanıcı ID {user_id} için öneri isteği alındı.")
    
    try:
        recommendations = recommendation_model.predict(user_id=user_id, n_recommendations=10)
        
        if not recommendations:
             if user_id not in recommendation_model.user_map:
                 abort(404, description=f"Kullanıcı ID {user_id} bulunamadı.")
             else:
                 return jsonify([])

        # Önerilere posterUrl ekleyelim
        result_with_posters = []
        for r in recommendations:
            movie_id = r[0]
            title = r[1]
            score = r[2]
            tmdb_id = movie_id_to_tmdb_id.get(movie_id)
            poster_url = None
            if tmdb_id:
                poster_path = get_tmdb_poster_path(tmdb_id) # Yardımcı fonksiyonu kullanalım
                if poster_path:
                    poster_url = f"{TMDB_POSTER_BASE_URL}{poster_path}"
            result_with_posters.append({"movieId": movie_id, "title": title, "score": score, "posterUrl": poster_url})
            
        return jsonify(result_with_posters)

    except Exception as e:
        print(f"Öneri alınırken hata oluştu: {e}")
        abort(500, description="Öneriler alınırken bir sunucu hatası oluştu.")
# -------------------------

# --- TMDB Poster Path Getirme Yardımcı Fonksiyonu (Cache ile) ---
tmdb_poster_cache = {}

def get_tmdb_poster_path(tmdb_id):
    if tmdb_id in tmdb_poster_cache:
        return tmdb_poster_cache[tmdb_id]
    
    # API Anahtarı kontrolü fonksiyon içinde de yapılmalı
    if not TMDB_API_KEY:
        print("UYARI: TMDB API Anahtarı ayarlanmamış. Poster yolu alınamıyor.")
        tmdb_poster_cache[tmdb_id] = None # Tekrar denememek için cache'e None ekle
        return None

    tmdb_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}?api_key={TMDB_API_KEY}&language=en-US"
    poster_path = None
    try:
        tmdb_response = requests.get(tmdb_url, timeout=2)
        tmdb_response.raise_for_status()
        tmdb_data = tmdb_response.json()
        poster_path = tmdb_data.get('poster_path')
        tmdb_poster_cache[tmdb_id] = poster_path # Cache'e ekle
        # time.sleep(0.05) # Gerekirse rate limit için bekleme
    except requests.exceptions.RequestException as tmdb_err:
        print(f"WARNING: TMDB API request failed (get_tmdb_poster_path, tmdbId: {tmdb_id}): {tmdb_err}")
        tmdb_poster_cache[tmdb_id] = None # Başarısız olsa da cache'e ekle (tekrar denememek için)
    except Exception as e:
        print(f"WARNING: Error processing TMDB data (get_tmdb_poster_path, tmdbId: {tmdb_id}): {e}")
        tmdb_poster_cache[tmdb_id] = None
    return poster_path
# ----------------------------------------------------------------

# --- TMDB ID to MovieID Mapping --- 
# Create the reverse mapping for easier lookup
tmdb_id_to_movie_id = {v: k for k, v in movie_id_to_tmdb_id.items()} if movie_id_to_tmdb_id else {}

# --- Film Listesi Endpoint'i (TMDB ve Arama Entegrasyonu ile) ---
@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    Film listesini (TMDB poster path'leri ile) sayfalama ve arama ile döndürür.
    Query Parametreleri:
        page (int): İstenen sayfa numarası (varsayılan: 1).
        limit (int): Sayfa başına film sayısı (varsayılan: 20, max: 50).
        search (str): Film başlıklarında aranacak terim (opsiyonel).
    """
    if movies_df is None or movie_id_to_tmdb_id is None:
        abort(503, description="Film veya link verisi şu anda kullanılamıyor.")

    try:
        # Query parametrelerini al
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search_term = request.args.get('search', None, type=str) # Arama terimini al

        # Limitleri kontrol et
        if page < 1: page = 1
        if limit < 1: limit = 1
        if limit > 50: limit = 50

        # Filtreleme için DataFrame'i kopyala (orijinali değiştirmeyelim)
        filtered_movies_df = movies_df.copy()

        # Arama terimi varsa filtrele
        if search_term:
            print(f"Arama yapılıyor: '{search_term}'")
            filtered_movies_df = filtered_movies_df[
                filtered_movies_df['title'].str.contains(search_term, case=False, na=False)
            ]
            print(f"Arama sonucu {len(filtered_movies_df)} film bulundu.")
            
        # Sayfalama için başlangıç/bitiş indexleri ve toplam sayıyı hesapla
        total_movies = len(filtered_movies_df) # Toplamı filtrelenmiş DataFrame üzerinden al
        start_index = (page - 1) * limit
        end_index = start_index + limit

        # Sayfalanmış veriyi al
        paginated_movies_df = filtered_movies_df.iloc[start_index:end_index]

        # TMDB verilerini ekle
        movies_list = []
        for index, row in paginated_movies_df.iterrows():
            movie_data = row.to_dict()
            tmdb_id = movie_id_to_tmdb_id.get(movie_data['movieId'])
            movie_data['tmdbId'] = tmdb_id
            poster_url = None
            if tmdb_id:
                poster_path = get_tmdb_poster_path(tmdb_id) # Yardımcı fonksiyonu kullan
                if poster_path:
                    poster_url = f"{TMDB_POSTER_BASE_URL}{poster_path}"
            movie_data['posterUrl'] = poster_url
            movies_list.append(movie_data)

        # Yanıtı oluştur
        response = {
            "page": page, "limit": limit, "total_movies": total_movies,
            "total_pages": (total_movies + limit - 1) // limit,
            "movies": movies_list
        }
        return jsonify(response)

    except Exception as e:
        print(f"Film listesi alınırken hata oluştu: {e}")
        abort(500, description="Film listesi alınırken bir sunucu hatası oluştu.")
# -----------------------------

# --- Film Detay Endpoint'i (TMDB Entegrasyonu ile) ---
@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    """
    Belirli bir movie_id için film detaylarını (TMDB poster path'i ile) döndürür.
    """
    if movies_df is None or movie_id_to_tmdb_id is None:
        abort(503, description="Film veya link verisi şu anda kullanılamıyor.")

    try:
        movie = movies_df[movies_df['movieId'] == movie_id]
        if movie.empty:
            abort(404, description=f"Film ID {movie_id} bulunamadı.")

        movie_details = movie.iloc[0].to_dict()
        tmdb_id = movie_id_to_tmdb_id.get(movie_details['movieId'])
        poster_url = None
        overview = None
        vote_average = None
        release_date = None

        if tmdb_id:
            # API Anahtarı kontrolü
            if not TMDB_API_KEY:
                print("UYARI: TMDB API Anahtarı ayarlanmamış. Detaylar alınamıyor.")
            else:
                # TMDB'den detayları ve poster path'i alalım
                tmdb_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}?api_key={TMDB_API_KEY}&language=en"
                try:
                    tmdb_response = requests.get(tmdb_url, timeout=2)
                    tmdb_response.raise_for_status()
                    tmdb_data = tmdb_response.json()
                    poster_path = tmdb_data.get('poster_path')
                    if poster_path:
                         poster_url = f"{TMDB_POSTER_BASE_URL}{poster_path}"
                    overview = tmdb_data.get('overview')
                    vote_average = tmdb_data.get('vote_average')
                    release_date = tmdb_data.get('release_date')
                except requests.exceptions.RequestException as tmdb_err:
                    print(f"WARNING: TMDB API request failed (details, tmdbId: {tmdb_id}): {tmdb_err}")
                except Exception as e:
                    print(f"WARNING: Error processing TMDB data (details, tmdbId: {tmdb_id}): {e}")

        # Yanıta ek bilgileri ekle
        movie_details['posterUrl'] = poster_url
        movie_details['overview'] = overview
        movie_details['vote_average'] = vote_average
        movie_details['release_date'] = release_date
        
        return jsonify(movie_details)

    except Exception as e:
        print(f"Film detayı alınırken hata oluştu (ID: {movie_id}): {e}")
        abort(500, description="Film detayı alınırken bir sunucu hatası oluştu.")
# ---------------------------

# --- Yeni Öneri Endpoint'i (Puanlara Göre) ---
@app.route('/api/recommendations', methods=['POST'])
def get_recommendations_from_ratings():
    """
    Kullanıcının sağladığı puanlara göre film önerileri döndürür.
    İstek gövdesinde {'tmdbId1': rating1, 'tmdbId2': rating2, ...} beklenir.
    """
    if recommendation_model is None or movies_df is None or not tmdb_id_to_movie_id:
        abort(503, description="Öneri sistemi veya veriler şu anda kullanılamıyor.")

    user_ratings_tmdb = request.get_json()

    if not user_ratings_tmdb or not isinstance(user_ratings_tmdb, dict):
        abort(400, description="Geçersiz istek formatı. {'tmdbId': rating} formatında JSON bekleniyor.")

    print(f"Yeni puanlara göre öneri isteği alındı (TMDB IDs): {user_ratings_tmdb}") # Logu güncelleyelim

    try:
        # 1. tmdbId'leri movieId'lere çevir ve geçerliliğini kontrol et
        user_ratings_internal = {}
        valid_ratings_count = 0
        # user_ratings_tmdb = {"tmdbId1": rating1, "tmdbId2": rating2, ...}
        for tmdb_id_str, rating in user_ratings_tmdb.items(): # Doğru değişkenleri kullan
            try:
                tmdb_id = int(tmdb_id_str)
                # Doğru rating değerini al
                current_rating = float(rating) 
                # Rating değerinin mantıklı bir aralıkta olduğunu kontrol edelim (örn: 0.5 - 5.0)
                if not (0.5 <= current_rating <= 5.0):
                    print(f"Uyarı: Geçersiz rating değeri ({current_rating}) tmdbId {tmdb_id} için atlanıyor.")
                    continue # Geçersiz puanı atla
                    
                movie_id = tmdb_id_to_movie_id.get(tmdb_id)
                # Modelin bu movieId'yi bilip bilmediğini movie_map ile kontrol et
                if movie_id and movie_id in recommendation_model.movie_map: 
                    # movie_id'ye karşılık doğru rating'i ata
                    user_ratings_internal[movie_id] = current_rating 
                    valid_ratings_count += 1
                else:
                    # Bu uyarıları loglamak isteyebiliriz ama cliente göndermeye gerek yok
                    # print(f"Uyarı: tmdbId {tmdb_id} için geçerli movieId bulunamadı veya modelde yok.")
                    pass 
            except ValueError:
                 # print(f"Uyarı: Geçersiz tmdbId ({tmdb_id_str}) veya rating ({rating}) formatı.")
                 pass
                 
        print(f"Modele gönderilecek dahili puanlar (Movie IDs): {user_ratings_internal}") # Kontrol için log ekleyelim

        if valid_ratings_count < 1: 
             abort(400, description="Öneri yapmak için yeterli sayıda geçerli film puanı sağlanmadı.")
             
        # --- Model Kullanımı (Yeni Metod ile) --- 
        # Yeni eklenen metodu kullanarak önerileri al
        recommendations = recommendation_model.predict_for_new_user(
            ratings_dict=user_ratings_internal, 
            n_recommendations=20 # İlk 20 öneriyi alalım
        )

        # Sonuçları formatla (movieId, title, score, posterUrl, tmdbId, genres)
        result_with_posters = []
        # recommendations artık (movieId, title, score) tuple listesi döndürüyor olmalı
        for movie_id, title, score in recommendations:
            # Film bilgilerini movies_df'ten al
            movie_info = movies_df[movies_df['movieId'] == movie_id].iloc[0] 
            tmdb_id = movie_id_to_tmdb_id.get(movie_id)
            poster_url = None
            if tmdb_id:
                poster_path = get_tmdb_poster_path(tmdb_id)
                if poster_path:
                    poster_url = f"{TMDB_POSTER_BASE_URL}{poster_path}"
            
            result_with_posters.append({
                "movieId": int(movie_id), 
                "tmdbId": int(tmdb_id) if tmdb_id else None,
                "title": title, 
                "genres": movie_info['genres'],
                "score": score, # Tahmini puan
                "posterUrl": poster_url
            })

        return jsonify(result_with_posters)

    except Exception as e:
        print(f"Puanlara göre öneri alınırken hata oluştu: {e}")
        import traceback
        traceback.print_exc() 
        abort(500, description="Öneriler alınırken bir sunucu hatası oluştu.")
# --------------------------

# Uygulamayı Gunicorn gibi bir WSGI sunucusu üzerinden çalıştırırken
# bu bloğun çalışmaması önemlidir.
if __name__ == '__main__':
    # Debug modunu açmak için debug=True ekleyin
    # Host'u 0.0.0.0 olarak ayarlamak, ağdaki diğer cihazlardan erişime izin verir.
    app.run(debug=True, host='0.0.0.0', port=5000)
