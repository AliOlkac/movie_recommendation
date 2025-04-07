from flask import Blueprint, jsonify, request
import pandas as pd
import os

# Blueprint tanımla
movies_bp = Blueprint('movies', __name__)

# Veri dosyalarının yolları
MOVIES_PATH = os.path.join('data', 'movies.csv')
LINKS_PATH = os.path.join('data', 'links.csv')

# Veri yükleme fonksiyonları
def load_movies():
    """Film verilerini CSV dosyasından yükler."""
    try:
        return pd.read_csv(MOVIES_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

def load_links():
    """Film bağlantılarını CSV dosyasından yükler."""
    try:
        return pd.read_csv(LINKS_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

# API Endpoint'leri
@movies_bp.route('/', methods=['GET'])
def get_movies():
    """Tüm filmleri sayfalandırarak döndürür."""
    # Sayfalama parametreleri
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    # Verileri yükle
    movies_df = load_movies()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    # Toplam sayfa sayısını hesapla
    total_pages = (len(movies_df) + per_page - 1) // per_page
    
    # Sayfa numarası geçerli mi kontrol et
    if page < 1 or page > total_pages:
        return jsonify({'error': 'Geçersiz sayfa numarası'}), 400
    
    # Sayfayı seç
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    page_movies = movies_df.iloc[start_idx:end_idx]
    
    # Sonuçları hazırla
    movies_list = []
    
    for _, movie in page_movies.iterrows():
        movies_list.append({
            'id': int(movie['movieId']),
            'title': movie['title'],
            'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else []
        })
    
    return jsonify({
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
        'total_movies': len(movies_df),
        'movies': movies_list
    })

@movies_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    """Film ID'sine göre film detaylarını döndürür."""
    # Verileri yükle
    movies_df = load_movies()
    links_df = load_links()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    # Film bilgilerini bul
    movie_data = movies_df[movies_df['movieId'] == movie_id]
    
    if movie_data.empty:
        return jsonify({'error': 'Film bulunamadı'}), 404
    
    movie = movie_data.iloc[0]
    
    # Bağlantıları bul (IMDB, TMDB vb. ID'ler)
    links = {}
    
    if not links_df.empty:
        link_data = links_df[links_df['movieId'] == movie_id]
        
        if not link_data.empty:
            link = link_data.iloc[0]
            
            if 'imdbId' in link and not pd.isna(link['imdbId']):
                links['imdb'] = f"https://www.imdb.com/title/tt{int(link['imdbId']):07d}/"
            
            if 'tmdbId' in link and not pd.isna(link['tmdbId']):
                links['tmdb'] = f"https://www.themoviedb.org/movie/{int(link['tmdbId'])}"
    
    # Film detayları
    movie_details = {
        'id': int(movie['movieId']),
        'title': movie['title'],
        'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else [],
        'links': links
    }
    
    return jsonify(movie_details)

@movies_bp.route('/search', methods=['GET'])
def search_movies():
    """Film adı veya türüne göre arama yapar."""
    # Arama parametreleri
    query = request.args.get('query', '')
    genre = request.args.get('genre', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    if not query and not genre:
        return jsonify({'error': 'En az bir arama parametresi belirtilmelidir (query veya genre)'}), 400
    
    # Verileri yükle
    movies_df = load_movies()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    # Filtreleme
    filtered_df = movies_df.copy()
    
    if query:
        # Başlık araması (büyük/küçük harf duyarsız)
        filtered_df = filtered_df[filtered_df['title'].str.contains(query, case=False, na=False)]
    
    if genre:
        # Tür araması (büyük/küçük harf duyarsız)
        filtered_df = filtered_df[filtered_df['genres'].str.contains(genre, case=False, na=False)]
    
    # Toplam sayfa sayısını hesapla
    total_movies = len(filtered_df)
    total_pages = (total_movies + per_page - 1) // per_page
    
    # Sayfa numarası geçerli mi kontrol et
    if page < 1 or (page > total_pages and total_pages > 0):
        return jsonify({'error': 'Geçersiz sayfa numarası'}), 400
    
    # Sayfayı seç
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    page_movies = filtered_df.iloc[start_idx:end_idx]
    
    # Sonuçları hazırla
    movies_list = []
    
    for _, movie in page_movies.iterrows():
        movies_list.append({
            'id': int(movie['movieId']),
            'title': movie['title'],
            'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else []
        })
    
    return jsonify({
        'query': query,
        'genre': genre,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
        'total_movies': total_movies,
        'movies': movies_list
    }) 