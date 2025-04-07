from flask import Blueprint, jsonify, request
import pandas as pd
import os
import time

# Blueprint tanımla
ratings_bp = Blueprint('ratings', __name__)

# Veri dosyalarının yolları
RATINGS_PATH = os.path.join('data', 'ratings.csv')
MOVIES_PATH = os.path.join('data', 'movies.csv')

# Veri yükleme fonksiyonları
def load_ratings(sample_size=None):
    """Değerlendirme verilerini CSV dosyasından yükler.
    
    Args:
        sample_size: Yüklenecek örnek sayısı (büyük veri seti için)
    """
    try:
        if sample_size:
            # Büyük veri seti için örnekleme yapılır
            return pd.read_csv(RATINGS_PATH, nrows=sample_size)
        else:
            return pd.read_csv(RATINGS_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

def load_movies():
    """Film verilerini CSV dosyasından yükler."""
    try:
        return pd.read_csv(MOVIES_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

# API Endpoint'leri
@ratings_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_ratings(user_id):
    """Belirli bir kullanıcının film değerlendirmelerini döndürür."""
    # Parametreleri al
    limit = int(request.args.get('limit', 100))
    
    # Verileri yükle
    ratings_df = load_ratings(sample_size=1000000)  # İlk 1M değerlendirme
    movies_df = load_movies()
    
    if ratings_df.empty or movies_df.empty:
        return jsonify({'error': 'Veri yüklenemedi'}), 500
    
    # Kullanıcının değerlendirmelerini bul
    user_ratings = ratings_df[ratings_df['userId'] == user_id].sort_values('timestamp', ascending=False)
    
    if user_ratings.empty:
        return jsonify({
            'user_id': user_id,
            'count': 0,
            'ratings': []
        })
    
    # Sonuçları hazırla
    ratings_list = []
    
    for _, rating in user_ratings.head(limit).iterrows():
        movie_id = rating['movieId']
        movie_data = movies_df[movies_df['movieId'] == movie_id]
        
        if not movie_data.empty:
            movie = movie_data.iloc[0]
            
            ratings_list.append({
                'movie_id': int(movie_id),
                'title': movie['title'],
                'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else [],
                'rating': float(rating['rating']),
                'timestamp': int(rating['timestamp'])
            })
    
    return jsonify({
        'user_id': user_id,
        'count': len(ratings_list),
        'ratings': ratings_list
    })

@ratings_bp.route('/movie/<int:movie_id>', methods=['GET'])
def get_movie_ratings(movie_id):
    """Belirli bir filmin değerlendirmelerini döndürür."""
    # Parametreleri al
    limit = int(request.args.get('limit', 100))
    
    # Verileri yükle
    ratings_df = load_ratings(sample_size=1000000)  # İlk 1M değerlendirme
    movies_df = load_movies()
    
    if ratings_df.empty or movies_df.empty:
        return jsonify({'error': 'Veri yüklenemedi'}), 500
    
    # Film var mı kontrol et
    if not movie_id in movies_df['movieId'].values:
        return jsonify({'error': 'Film bulunamadı'}), 404
    
    # Film değerlendirmelerini bul
    movie_ratings = ratings_df[ratings_df['movieId'] == movie_id].sort_values('timestamp', ascending=False)
    
    if movie_ratings.empty:
        return jsonify({
            'movie_id': movie_id,
            'title': movies_df[movies_df['movieId'] == movie_id].iloc[0]['title'],
            'avg_rating': 0,
            'count': 0,
            'ratings': []
        })
    
    # Film puanı istatistikleri
    avg_rating = movie_ratings['rating'].mean()
    
    # Sonuçları hazırla
    ratings_list = []
    
    for _, rating in movie_ratings.head(limit).iterrows():
        ratings_list.append({
            'user_id': int(rating['userId']),
            'rating': float(rating['rating']),
            'timestamp': int(rating['timestamp'])
        })
    
    return jsonify({
        'movie_id': movie_id,
        'title': movies_df[movies_df['movieId'] == movie_id].iloc[0]['title'],
        'avg_rating': float(avg_rating),
        'count': len(movie_ratings),
        'ratings': ratings_list
    })

@ratings_bp.route('/submit', methods=['POST'])
def submit_rating():
    """Yeni bir değerlendirme ekler (Demo amaçlıdır, gerçek uygulama veritabanı kullanmalıdır)."""
    # İstek verilerini al
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Veri gönderilmedi'}), 400
    
    # Gerekli parametreleri kontrol et
    required_fields = ['user_id', 'movie_id', 'rating']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"'{field}' alanı eksik"}), 400
    
    # Değerleri al
    user_id = data['user_id']
    movie_id = data['movie_id']
    rating = data['rating']
    
    # Puan geçerli mi kontrol et
    if not isinstance(rating, (int, float)) or rating < 0.5 or rating > 5:
        return jsonify({'error': 'Geçersiz puan. 0.5-5.0 arasında bir değer olmalı'}), 400
    
    # Film ID'si geçerli mi kontrol et
    movies_df = load_movies()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    if not movie_id in movies_df['movieId'].values:
        return jsonify({'error': 'Geçersiz film ID'}), 400
    
    # Gerçek uygulamada, bu noktada veritabanına kayıt yapılır
    # Bu örnek uygulamada, sadece başarı mesajı döndürüyoruz
    
    return jsonify({
        'success': True,
        'message': 'Değerlendirme kaydedildi (Demo)',
        'data': {
            'user_id': user_id,
            'movie_id': movie_id,
            'title': movies_df[movies_df['movieId'] == movie_id].iloc[0]['title'],
            'rating': rating,
            'timestamp': int(time.time())
        }
    }) 