from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import os
import json
import time
from pathlib import Path

# Blueprint tanımla
user_preferences_bp = Blueprint('user_preferences', __name__)

# Veri dosyalarının yolları
USER_DATA_DIR = Path(os.path.join('data', 'user_data'))
MOVIES_PATH = os.path.join('data', 'movies.csv')

# Kullanıcı veri klasörünü oluştur
USER_DATA_DIR.mkdir(exist_ok=True, parents=True)

# Veri yükleme/kaydetme fonksiyonları
def load_user_ratings(user_id):
    """Bir kullanıcının film değerlendirmelerini yükler."""
    ratings_path = USER_DATA_DIR / f"user_{user_id}_ratings.json"
    
    if ratings_path.exists():
        try:
            with open(ratings_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Kullanıcı değerlendirmeleri yüklenirken hata: {e}")
    
    # Dosya yoksa boş liste döndür
    return []

def save_user_ratings(user_id, ratings):
    """Bir kullanıcının film değerlendirmelerini kaydeder."""
    ratings_path = USER_DATA_DIR / f"user_{user_id}_ratings.json"
    
    try:
        with open(ratings_path, 'w', encoding='utf-8') as f:
            json.dump(ratings, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Kullanıcı değerlendirmeleri kaydedilirken hata: {e}")
        return False

def load_user_favorites(user_id):
    """Bir kullanıcının favori filmlerini yükler."""
    favorites_path = USER_DATA_DIR / f"user_{user_id}_favorites.json"
    
    if favorites_path.exists():
        try:
            with open(favorites_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Kullanıcı favorileri yüklenirken hata: {e}")
    
    # Dosya yoksa boş liste döndür
    return []

def save_user_favorites(user_id, favorites):
    """Bir kullanıcının favori filmlerini kaydeder."""
    favorites_path = USER_DATA_DIR / f"user_{user_id}_favorites.json"
    
    try:
        with open(favorites_path, 'w', encoding='utf-8') as f:
            json.dump(favorites, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Kullanıcı favorileri kaydedilirken hata: {e}")
        return False

def load_movies():
    """Film verilerini CSV dosyasından yükler."""
    try:
        return pd.read_csv(MOVIES_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

# API Endpoint'leri
@user_preferences_bp.route('/ratings/<int:user_id>', methods=['GET'])
def get_user_ratings(user_id):
    """Kullanıcının film değerlendirmelerini döndürür."""
    ratings = load_user_ratings(user_id)
    movies_df = load_movies()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    # Film detaylarını ekle
    ratings_with_details = []
    
    for rating in ratings:
        movie_id = rating['movie_id']
        movie_data = movies_df[movies_df['movieId'] == movie_id]
        
        if not movie_data.empty:
            movie = movie_data.iloc[0]
            rating_with_details = {
                'movie_id': movie_id,
                'title': movie['title'],
                'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else [],
                'rating': rating['rating'],
                'timestamp': rating['timestamp']
            }
            ratings_with_details.append(rating_with_details)
    
    return jsonify({
        'user_id': user_id,
        'ratings_count': len(ratings_with_details),
        'ratings': ratings_with_details
    })

@user_preferences_bp.route('/ratings/add', methods=['POST'])
def add_rating():
    """Kullanıcı için yeni bir film değerlendirmesi ekler."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Veri gönderilmedi'}), 400
    
    # Gerekli alanları kontrol et
    required_fields = ['user_id', 'movie_id', 'rating']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"'{field}' alanı eksik"}), 400
    
    user_id = int(data['user_id'])
    movie_id = int(data['movie_id'])
    rating = float(data['rating'])
    
    # Puanın geçerli aralıkta olduğunu kontrol et (0.5-5.0)
    if rating < 0.5 or rating > 5.0:
        return jsonify({'error': 'Değerlendirme 0.5 ile 5.0 arasında olmalıdır'}), 400
    
    # Film ID'si var mı kontrol et
    movies_df = load_movies()
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    if not movie_id in movies_df['movieId'].values:
        return jsonify({'error': 'Geçersiz film ID'}), 400
    
    # Mevcut değerlendirmeleri yükle
    ratings = load_user_ratings(user_id)
    
    # Bu film için zaten değerlendirme var mı kontrol et
    existing_rating_index = None
    for i, r in enumerate(ratings):
        if r['movie_id'] == movie_id:
            existing_rating_index = i
            break
    
    current_time = int(time.time())
    
    if existing_rating_index is not None:
        # Mevcut değerlendirmeyi güncelle
        ratings[existing_rating_index] = {
            'movie_id': movie_id,
            'rating': rating,
            'timestamp': current_time
        }
    else:
        # Yeni değerlendirme ekle
        ratings.append({
            'movie_id': movie_id,
            'rating': rating,
            'timestamp': current_time
        })
    
    # Değerlendirmeleri kaydet
    if save_user_ratings(user_id, ratings):
        return jsonify({
            'success': True,
            'message': 'Değerlendirme başarıyla kaydedildi',
            'data': {
                'user_id': user_id,
                'movie_id': movie_id,
                'title': movies_df[movies_df['movieId'] == movie_id].iloc[0]['title'],
                'rating': rating,
                'timestamp': current_time
            }
        })
    else:
        return jsonify({'error': 'Değerlendirme kaydedilirken bir hata oluştu'}), 500

@user_preferences_bp.route('/ratings/delete', methods=['POST'])
def delete_rating():
    """Kullanıcının bir film değerlendirmesini siler."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Veri gönderilmedi'}), 400
    
    # Gerekli alanları kontrol et
    required_fields = ['user_id', 'movie_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"'{field}' alanı eksik"}), 400
    
    user_id = int(data['user_id'])
    movie_id = int(data['movie_id'])
    
    # Mevcut değerlendirmeleri yükle
    ratings = load_user_ratings(user_id)
    
    # Değerlendirmeyi bul ve sil
    found = False
    new_ratings = []
    
    for rating in ratings:
        if rating['movie_id'] != movie_id:
            new_ratings.append(rating)
        else:
            found = True
    
    if not found:
        return jsonify({'error': 'Bu film için değerlendirme bulunamadı'}), 404
    
    # Değerlendirmeleri kaydet
    if save_user_ratings(user_id, new_ratings):
        return jsonify({
            'success': True,
            'message': 'Değerlendirme başarıyla silindi',
            'data': {
                'user_id': user_id,
                'movie_id': movie_id
            }
        })
    else:
        return jsonify({'error': 'Değerlendirme silinirken bir hata oluştu'}), 500

@user_preferences_bp.route('/favorites/<int:user_id>', methods=['GET'])
def get_user_favorites(user_id):
    """Kullanıcının favori filmlerini döndürür."""
    favorites = load_user_favorites(user_id)
    movies_df = load_movies()
    
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    # Film detaylarını ekle
    favorites_with_details = []
    
    for movie_id in favorites:
        movie_data = movies_df[movies_df['movieId'] == movie_id]
        
        if not movie_data.empty:
            movie = movie_data.iloc[0]
            favorite_with_details = {
                'movie_id': movie_id,
                'title': movie['title'],
                'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else []
            }
            favorites_with_details.append(favorite_with_details)
    
    return jsonify({
        'user_id': user_id,
        'favorites_count': len(favorites_with_details),
        'favorites': favorites_with_details
    })

@user_preferences_bp.route('/favorites/add', methods=['POST'])
def add_favorite():
    """Kullanıcının favori filmler listesine bir film ekler."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Veri gönderilmedi'}), 400
    
    # Gerekli alanları kontrol et
    required_fields = ['user_id', 'movie_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"'{field}' alanı eksik"}), 400
    
    user_id = int(data['user_id'])
    movie_id = int(data['movie_id'])
    
    # Film ID'si var mı kontrol et
    movies_df = load_movies()
    if movies_df.empty:
        return jsonify({'error': 'Film verileri yüklenemedi'}), 500
    
    if not movie_id in movies_df['movieId'].values:
        return jsonify({'error': 'Geçersiz film ID'}), 400
    
    # Mevcut favorileri yükle
    favorites = load_user_favorites(user_id)
    
    # Film zaten favorilerde mi kontrol et
    if movie_id in favorites:
        return jsonify({
            'success': True,
            'message': 'Film zaten favorilerde',
            'data': {
                'user_id': user_id,
                'movie_id': movie_id
            }
        })
    
    # Favorilere ekle
    favorites.append(movie_id)
    
    # Favorileri kaydet
    if save_user_favorites(user_id, favorites):
        return jsonify({
            'success': True,
            'message': 'Film favorilere eklendi',
            'data': {
                'user_id': user_id,
                'movie_id': movie_id,
                'title': movies_df[movies_df['movieId'] == movie_id].iloc[0]['title']
            }
        })
    else:
        return jsonify({'error': 'Favori kaydedilirken bir hata oluştu'}), 500

@user_preferences_bp.route('/favorites/remove', methods=['POST'])
def remove_favorite():
    """Kullanıcının favori filmler listesinden bir filmi çıkarır."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Veri gönderilmedi'}), 400
    
    # Gerekli alanları kontrol et
    required_fields = ['user_id', 'movie_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"'{field}' alanı eksik"}), 400
    
    user_id = int(data['user_id'])
    movie_id = int(data['movie_id'])
    
    # Mevcut favorileri yükle
    favorites = load_user_favorites(user_id)
    
    # Film favorilerde mi kontrol et
    if movie_id not in favorites:
        return jsonify({'error': 'Film favorilerde bulunamadı'}), 404
    
    # Favorilerden çıkar
    favorites.remove(movie_id)
    
    # Favorileri kaydet
    if save_user_favorites(user_id, favorites):
        return jsonify({
            'success': True,
            'message': 'Film favorilerden çıkarıldı',
            'data': {
                'user_id': user_id,
                'movie_id': movie_id
            }
        })
    else:
        return jsonify({'error': 'Favori silinirken bir hata oluştu'}), 500 