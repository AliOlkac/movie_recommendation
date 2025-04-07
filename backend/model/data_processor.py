import pandas as pd
import numpy as np
import os
from surprise import Dataset, Reader

def load_data(movies_path, ratings_path, links_path=None, sample_size=None):
    """
    MovieLens veri setlerini yükler ve işler.
    
    Args:
        movies_path: movies.csv dosyasının yolu
        ratings_path: ratings.csv dosyasının yolu
        links_path: links.csv dosyasının yolu (isteğe bağlı)
        sample_size: Değerlendirme sayısı (büyük veri setleri için örnekleme)
    
    Returns:
        Tuple(movies_df, ratings_df, links_df): Yüklenen veri çerçeveleri
    """
    # Filmleri yükle
    try:
        movies_df = pd.read_csv(movies_path)
        print(f"{len(movies_df)} film yüklendi.")
    except Exception as e:
        print(f"Filmler yüklenirken hata oluştu: {e}")
        movies_df = pd.DataFrame()
    
    # Değerlendirmeleri yükle
    try:
        if sample_size:
            ratings_df = pd.read_csv(ratings_path, nrows=sample_size)
            print(f"{len(ratings_df)} değerlendirme (örneklenmiş) yüklendi.")
        else:
            ratings_df = pd.read_csv(ratings_path)
            print(f"{len(ratings_df)} değerlendirme yüklendi.")
    except Exception as e:
        print(f"Değerlendirmeler yüklenirken hata oluştu: {e}")
        ratings_df = pd.DataFrame()
    
    # Bağlantıları yükle (isteğe bağlı)
    links_df = pd.DataFrame()
    if links_path:
        try:
            links_df = pd.read_csv(links_path)
            print(f"{len(links_df)} bağlantı yüklendi.")
        except Exception as e:
            print(f"Bağlantılar yüklenirken hata oluştu: {e}")
    
    return movies_df, ratings_df, links_df

def prepare_surprise_data(ratings_df):
    """
    Surprise kütüphanesi için değerlendirme verilerini hazırlar.
    
    Args:
        ratings_df: Değerlendirmeleri içeren DataFrame
    
    Returns:
        Surprise Dataset
    """
    reader = Reader(rating_scale=(0.5, 5.0))
    
    # DataFrame'den Surprise veri setine dönüştür
    data = Dataset.load_from_df(
        ratings_df[['userId', 'movieId', 'rating']], 
        reader
    )
    
    return data

def get_top_n_recommendations(predictions, n=10):
    """
    Kullanıcılar için en iyi N önerileri getir.
    
    Args:
        predictions: Surprise algoritmasının tahmin listesi
        n: Her kullanıcı için öneri sayısı
    
    Returns:
        Dictionary: {user_id: [(movie_id, rating), ...]}
    """
    # Tahminleri kullanıcılara göre grupla
    user_predictions = {}
    
    for uid, iid, _, est, _ in predictions:
        if uid not in user_predictions:
            user_predictions[uid] = []
        
        user_predictions[uid].append((iid, est))
    
    # Her kullanıcı için tahminleri sırala ve en iyi N'yi al
    top_n = {}
    for uid, user_ratings in user_predictions.items():
        user_ratings.sort(key=lambda x: x[1], reverse=True)
        top_n[uid] = user_ratings[:n]
    
    return top_n

def create_movie_movie_similarity_matrix(ratings_df, movies_df, method='pearson'):
    """
    Film-film benzerlik matrisini oluşturur.
    
    Args:
        ratings_df: Değerlendirmeleri içeren DataFrame
        movies_df: Filmleri içeren DataFrame
        method: Benzerlik hesaplama yöntemi ('pearson' veya 'cosine')
    
    Returns:
        DataFrame: Film-film benzerlik matrisi
    """
    # Pivot tablosu oluştur (kullanıcı-film matrisi)
    pivot_table = ratings_df.pivot_table(index='userId', columns='movieId', values='rating')
    
    # Film-film benzerlik matrisi için tüm filmlerin listesini al
    all_movie_ids = movies_df['movieId'].unique()
    
    # Benzerlik matrisini oluştur
    similarity_matrix = pd.DataFrame(index=all_movie_ids, columns=all_movie_ids)
    
    # Film sayısı çok olduğunda bu hesaplama uzun sürebilir,
    # bu yüzden sadece pivot tabloda olan filmler için hesapla
    pivot_movie_ids = pivot_table.columns
    
    for i, movie1 in enumerate(pivot_movie_ids):
        # İlerleme bilgisi
        if i % 100 == 0:
            print(f"İşlenen film: {i}/{len(pivot_movie_ids)}")
            
        # Kendisiyle benzerliği 1.0 olarak ayarla
        similarity_matrix.loc[movie1, movie1] = 1.0
        
        # Diğer filmlerle benzerliği hesapla
        for movie2 in pivot_movie_ids[i+1:]:
            # Her iki filmi de değerlendiren kullanıcıları al
            mask = (~pd.isna(pivot_table[movie1])) & (~pd.isna(pivot_table[movie2]))
            common_users = mask.sum()
            
            # Yeterli ortak kullanıcı varsa benzerliği hesapla
            if common_users >= 5:
                if method == 'pearson':
                    # Pearson korelasyonu
                    correlation = pivot_table[movie1][mask].corr(pivot_table[movie2][mask], method='pearson')
                elif method == 'cosine':
                    # Kosinüs benzerliği
                    vec1 = pivot_table[movie1][mask].values
                    vec2 = pivot_table[movie2][mask].values
                    correlation = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
                else:
                    correlation = 0
                
                # NaN kontrolü
                if not np.isnan(correlation):
                    similarity_matrix.loc[movie1, movie2] = correlation
                    similarity_matrix.loc[movie2, movie1] = correlation
    
    return similarity_matrix 