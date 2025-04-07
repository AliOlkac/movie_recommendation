from flask import Blueprint, jsonify, request
import pandas as pd
import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from api.user_preferences import load_user_ratings, load_user_favorites

# Blueprint tanımla
recommendations_bp = Blueprint('recommendations', __name__)

# Veri dosyalarının yolları
MOVIES_PATH = os.path.join('data', 'movies.csv')
RATINGS_PATH = os.path.join('data', 'ratings.csv')

# Veri yükleme fonksiyonları
def load_movies():
    """Film verilerini CSV dosyasından yükler."""
    try:
        return pd.read_csv(MOVIES_PATH)
    except Exception as e:
        print(f"Hata: {e}")
        return pd.DataFrame()

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

# API Endpoint'leri
@recommendations_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    """Kullanıcıya özel film önerileri döndürür - en az 5 değerlendirmesi olmalıdır."""
    # Parametreleri al
    limit = int(request.args.get('limit', 10))
    
    # Kullanıcının değerlendirmelerini yükle
    user_ratings = load_user_ratings(user_id)
    
    # En az 5 değerlendirme yapılmış mı kontrol et
    if len(user_ratings) < 5:
        return jsonify({
            'error': 'Öneriler için en az 5 film değerlendirmesi gereklidir',
            'ratings_count': len(user_ratings),
            'required_count': 5
        }), 400
    
    # Verileri yükle
    movies_df = load_movies()
    ratings_df = load_ratings(sample_size=100000)  # Büyük veri seti için örnekleme
    
    if movies_df.empty or ratings_df.empty:
        return jsonify({'error': 'Veri yüklenemedi'}), 500
    
    # Kullanıcı favorilerini yükle
    favorites = load_user_favorites(user_id)
    
    # Kullanıcının değerlendirdiği ve favorilediği filmleri hariç tut
    rated_movie_ids = [r['movie_id'] for r in user_ratings]
    excluded_movie_ids = rated_movie_ids + favorites
    
    # Kullanıcı-film matrisini oluştur
    user_movie_matrix = ratings_df.pivot_table(index='userId', columns='movieId', values='rating')
    
    # Kullanıcı benzerliklerini hesaplamak için "kullanıcı vektörü" oluştur
    # Bu, kullanıcının değerlendirmelerini matrise ekler
    temp_user_id = -1  # Geçici bir kullanıcı ID'si
    temp_ratings = []
    
    # Önce vektör için boş bir dizi oluştur
    user_vector = pd.Series(index=user_movie_matrix.columns, dtype=float)
    user_vector[:] = np.nan  # Tüm değerleri NaN ile doldur
    
    # Kullanıcının değerlendirmelerini vektöre ekle
    for rating in user_ratings:
        movie_id = rating['movie_id']
        if movie_id in user_movie_matrix.columns:
            user_vector[movie_id] = rating['rating']
    
    # Kullanıcı benzerlikleri
    # NaN değerler dışında ortak değerlendirme yaptığı kullanıcılar için benzerlik hesapla
    similarities = []
    
    for idx, row in user_movie_matrix.iterrows():
        # İki kullanıcının ortak değerlendirdiği filmler
        mask = (~user_vector.isna()) & (~row.isna())
        common_ratings = mask.sum()
        
        if common_ratings >= 5:  # En az 5 ortak değerlendirme varsa
            user_common = user_vector[mask].values
            other_common = row[mask].values
            
            # Kosinüs benzerliği (aralarındaki açıyı ölçer)
            similarity = cosine_similarity([user_common], [other_common])[0][0]
            similarities.append((idx, similarity, common_ratings))
    
    # Benzerlikleri sırala
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    # En benzer kullanıcıların değerlendirmelerini ağırlıklandırarak film puanlarını tahmin et
    movie_scores = {}
    
    # Tahmin hesaplama için en benzer 50 kullanıcıyı kullan (veya daha az varsa tümünü)
    top_similar_users = similarities[:min(50, len(similarities))]
    
    for movie_id in user_movie_matrix.columns:
        if movie_id in excluded_movie_ids:
            continue  # Değerlendirilen ve favorilenen filmleri atla
            
        weighted_sum = 0
        similarity_sum = 0
        
        for similar_user_id, similarity, _ in top_similar_users:
            rating = user_movie_matrix.loc[similar_user_id, movie_id]
            
            if not pd.isna(rating):  # Kullanıcı bu filmi değerlendirmişse
                weighted_sum += similarity * rating
                similarity_sum += similarity
        
        if similarity_sum > 0:
            predicted_rating = weighted_sum / similarity_sum
            movie_scores[movie_id] = predicted_rating
    
    # En yüksek puanlı filmleri seç
    top_movies = sorted(movie_scores.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    # Film detaylarını ekle
    recommendations = []
    
    for movie_id, predicted_rating in top_movies:
        movie_data = movies_df[movies_df['movieId'] == movie_id]
        
        if not movie_data.empty:
            movie = movie_data.iloc[0]
            recommendations.append({
                'id': int(movie_id),
                'title': movie['title'],
                'genres': movie['genres'].split('|') if isinstance(movie['genres'], str) else [],
                'predicted_rating': round(float(predicted_rating), 2)
            })
    
    return jsonify({
        'user_id': user_id,
        'recommendations': recommendations,
        'rated_count': len(rated_movie_ids)
    })

@recommendations_bp.route('/item/<int:movie_id>', methods=['GET'])
def get_similar_movies(movie_id):
    """Belirli bir filme benzer filmleri döndürür."""
    # Parametreleri al
    limit = int(request.args.get('limit', 10))
    
    # Verileri yükle
    movies_df = load_movies()
    ratings_df = load_ratings(sample_size=100000)  # Büyük veri seti için örnekleme
    
    if movies_df.empty or ratings_df.empty:
        return jsonify({'error': 'Veri yüklenemedi'}), 500
    
    # İlgili film var mı kontrol et
    if not movie_id in movies_df['movieId'].values:
        return jsonify({'error': 'Film bulunamadı'}), 404
    
    # İlgili filmin türlerini al
    target_movie = movies_df[movies_df['movieId'] == movie_id].iloc[0]
    target_genres = target_movie['genres'].split('|') if isinstance(target_movie['genres'], str) else []
    
    # Film-film benzerliği için kullanıcı-film matrisini oluştur
    movie_user_matrix = ratings_df.pivot_table(index='movieId', columns='userId', values='rating')
    
    # Hedef film matrixte var mı?
    if movie_id not in movie_user_matrix.index:
        # Matriste yoksa tür benzerliğine göre öneri yap
        return get_genre_based_recommendations(movie_id, movies_df, ratings_df, limit)
    
    # Hedef filmin kullanıcı vektörünü al
    target_ratings = movie_user_matrix.loc[movie_id]
    
    # Diğer filmlerin benzerliğini hesapla
    similarities = []
    
    for other_id in movie_user_matrix.index:
        if other_id == movie_id:
            continue  # Kendisini atla
            
        other_ratings = movie_user_matrix.loc[other_id]
        
        # İki filmi de değerlendiren kullanıcıları bul
        mask = (~target_ratings.isna()) & (~other_ratings.isna())
        common_users = mask.sum()
        
        if common_users >= 10:  # En az 10 ortak değerlendirme varsa
            target_common = target_ratings[mask].values
            other_common = other_ratings[mask].values
            
            # Kosinüs benzerliği
            similarity = cosine_similarity([target_common], [other_common])[0][0]
            similarities.append((other_id, similarity, common_users))
    
    # Benzerlikleri sırala
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    # En benzer filmleri seç
    top_similar = similarities[:limit]
    
    # Hiç benzer film bulunamazsa tür benzerliğine göre öneri yap
    if not top_similar:
        return get_genre_based_recommendations(movie_id, movies_df, ratings_df, limit)
    
    # Film detaylarını ekle
    similar_movies = []
    
    for sim_movie_id, similarity_score, common_ratings in top_similar:
        movie_data = movies_df[movies_df['movieId'] == sim_movie_id]
        
        if not movie_data.empty:
            movie = movie_data.iloc[0]
            movie_genres = movie['genres'].split('|') if isinstance(movie['genres'], str) else []
            
            # Ortak türleri bul
            common_genres = set(movie_genres) & set(target_genres)
            
            similar_movies.append({
                'id': int(sim_movie_id),
                'title': movie['title'],
                'genres': movie_genres,
                'common_genres': list(common_genres),
                'similarity': round(float(similarity_score), 2),
                'common_ratings': int(common_ratings)
            })
    
    return jsonify({
        'movie_id': movie_id,
        'title': target_movie['title'],
        'genres': target_genres,
        'similar_movies': similar_movies
    })

def get_genre_based_recommendations(movie_id, movies_df, ratings_df, limit):
    """Tür benzerliğine göre film önerileri yapar."""
    # İlgili filmin türlerini al
    target_movie = movies_df[movies_df['movieId'] == movie_id].iloc[0]
    target_genres = target_movie['genres'].split('|') if isinstance(target_movie['genres'], str) else []
    
    # Benzer türlerdeki diğer filmleri bul
    similar_movies = []
    
    for _, movie in movies_df.iterrows():
        if movie['movieId'] != movie_id:
            movie_genres = movie['genres'].split('|') if isinstance(movie['genres'], str) else []
            common_genres = set(movie_genres) & set(target_genres)
            
            if common_genres:
                # Ortak tür sayısını benzerlik olarak kullan
                similarity = len(common_genres) / max(len(movie_genres), len(target_genres))
                
                # Film puanını hesapla (tüm kullanıcıların ortalama puanı)
                movie_ratings = ratings_df[ratings_df['movieId'] == movie['movieId']]
                avg_rating = movie_ratings['rating'].mean() if not movie_ratings.empty else 0
                
                similar_movies.append({
                    'id': int(movie['movieId']),
                    'title': movie['title'],
                    'genres': movie_genres,
                    'common_genres': list(common_genres),
                    'similarity': round(similarity, 2),
                    'avg_rating': float(avg_rating) if not pd.isna(avg_rating) else 0
                })
    
    # Benzerliğe göre sırala ve sınırla
    similar_movies.sort(key=lambda x: (x['similarity'], x['avg_rating']), reverse=True)
    similar_movies = similar_movies[:limit]
    
    return jsonify({
        'movie_id': movie_id,
        'title': target_movie['title'],
        'genres': target_genres,
        'similar_movies': similar_movies,
        'recommendation_type': 'genre_based'
    }) 