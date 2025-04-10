# Gerekli kütüphaneleri import et
from flask import Flask, jsonify, abort, request
from flask_cors import CORS
import os
import sys
import pandas as pd
import requests # TMDB API için eklendi
import time # API rate limiting için eklenebilir

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

# --- Model Yükleme ---
MODEL_FILENAME = "cf_svd_model_data_k20.joblib"
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", MODEL_FILENAME)

recommendation_model = None

if CollaborativeFilteringModel:
    print(f"Model yükleniyor: {MODEL_PATH}")
    recommendation_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
    if recommendation_model is None:
        print("UYARI: Model yüklenemedi! Öneri endpoint'i çalışmayacak.")
else:
     print("UYARI: Model sınıfı yüklenemedi! Öneri endpoint'i çalışmayacak.")

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
TMDB_API_KEY = "f9fbcbba4387e66ad99b2b4ca1e41e34" # Sağlanan API anahtarı
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
# Basit bir cache mekanizması (daha iyisi için Flask-Caching gibi kütüphaneler kullanılabilir)
tmdb_poster_cache = {}

def get_tmdb_poster_path(tmdb_id):
    if tmdb_id in tmdb_poster_cache:
        # print(f"Cache hit for tmdbId: {tmdb_id}") # Debug
        return tmdb_poster_cache[tmdb_id]
    
    # print(f"Cache miss for tmdbId: {tmdb_id}, fetching from TMDB...") # Debug
    tmdb_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}?api_key={TMDB_API_KEY}&language=tr-TR"
    poster_path = None
    try:
        tmdb_response = requests.get(tmdb_url, timeout=2)
        tmdb_response.raise_for_status()
        tmdb_data = tmdb_response.json()
        poster_path = tmdb_data.get('poster_path')
        tmdb_poster_cache[tmdb_id] = poster_path # Cache'e ekle
        # time.sleep(0.05) # Gerekirse rate limit için bekleme
    except requests.exceptions.RequestException as tmdb_err:
        print(f"UYARI: TMDB API isteği başarısız (get_tmdb_poster_path, tmdbId: {tmdb_id}): {tmdb_err}")
        tmdb_poster_cache[tmdb_id] = None # Başarısız olsa da cache'e ekle (tekrar denememek için)
    except Exception as e:
        print(f"UYARI: TMDB verisi işlenirken hata (get_tmdb_poster_path, tmdbId: {tmdb_id}): {e}")
        tmdb_poster_cache[tmdb_id] = None
    return poster_path
# ----------------------------------------------------------------

# --- Film Listesi Endpoint'i (TMDB Entegrasyonu ile) ---
@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    Film listesini (TMDB poster path'leri ile) sayfalama ile döndürür.
    """
    if movies_df is None or movie_id_to_tmdb_id is None:
        abort(503, description="Film veya link verisi şu anda kullanılamıyor.")

    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        if page < 1: page = 1
        if limit < 1: limit = 1
        if limit > 50: limit = 50 

        start_index = (page - 1) * limit
        end_index = start_index + limit
        total_movies = len(movies_df)
        paginated_movies_df = movies_df.iloc[start_index:end_index]

        movies_list = []
        for index, row in paginated_movies_df.iterrows():
            movie_data = row.to_dict()
            tmdb_id = movie_id_to_tmdb_id.get(movie_data['movieId'])
            poster_url = None
            if tmdb_id:
                poster_path = get_tmdb_poster_path(tmdb_id) # Yardımcı fonksiyonu kullan
                if poster_path:
                    poster_url = f"{TMDB_POSTER_BASE_URL}{poster_path}"
            movie_data['posterUrl'] = poster_url
            movies_list.append(movie_data)

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
            # TMDB'den detayları ve poster path'i alalım
            tmdb_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}?api_key={TMDB_API_KEY}&language=tr-TR"
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
                 print(f"UYARI: TMDB API isteği başarısız (detay, tmdbId: {tmdb_id}): {tmdb_err}")
            except Exception as e:
                 print(f"UYARI: TMDB verisi işlenirken hata (detay, tmdbId: {tmdb_id}): {e}")

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

# Uygulamanın doğrudan çalıştırıldığında (import edilmediğinde) başlamasını sağla
if __name__ == '__main__':
    # debug=True modu, kodda değişiklik yaptığınızda sunucunun otomatik yeniden başlamasını sağlar
    # ve olası hataları tarayıcıda gösterir. Production ortamında False olmalıdır.
    app.run(debug=True, host='0.0.0.0', port=5000)
