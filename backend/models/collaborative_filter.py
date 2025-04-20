# Gerekli kütüphaneler
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix # Seyrek matrisler için
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity # Kosinüs benzerliği için import
import joblib # Modeli kaydetmek/yüklemek için
import os
import sys # Test bloğunda path için
from collections import defaultdict # Komşu filmlerini saymak için

# Öneri modeli için bir sınıf oluşturmak daha düzenli olabilir
class CollaborativeFilteringModel:
    def __init__(self, n_components=50, random_state=42):
        """
        Model yapılandırması.

        Args:
            n_components (int): SVD'de kullanılacak bileşen (gizli faktör) sayısı.
                                Bu değer modelin karmaşıklığını ve performansını etkiler.
            random_state (int): Tekrarlanabilirlik için rastgelelik durumu.
        """
        self.n_components = n_components
        self.random_state = random_state
        self.model = TruncatedSVD(n_components=self.n_components, random_state=self.random_state)
        self.user_map = None # userId -> matris satır indexi
        self.movie_map = None # movieId -> matris sütun indexi
        self.movie_titles = None # movieId -> film başlığı eşleşmesi için
        self.user_vectors = None # Kullanıcı latent vektörleri
        self.item_vectors = None # Film latent vektörleri
        self.user_rated_movies_with_ratings = None # Kullanıcıların oyladığı filmler ve verdikleri puanlar {user_id: {movie_id: rating}}
        self.global_average_rating = None # Tüm veri setindeki ortalama puan
        self.movie_map_inv = None # index -> movieId
        self.user_map_inv = None # index -> userId

    def _create_user_movie_data(self, df):
        """
        DataFrame'i işler, matrisi oluşturur ve gerekli haritalamaları yapar.
        Ayrıca ters haritalamaları ve film başlıklarını da burada oluşturur.
        """
        print("Kullanıcı-Film verisi ve matrisi işleniyor...")
        df['user_code'] = df['userId'].astype('category').cat.codes
        df['movie_code'] = df['movieId'].astype('category').cat.codes

        # Haritalamaları oluştur
        user_map_cat = dict(enumerate(df['userId'].astype('category').cat.categories))
        movie_map_cat = dict(enumerate(df['movieId'].astype('category').cat.categories))
        self.user_map = {v: k for k, v in user_map_cat.items()}
        self.movie_map = {v: k for k, v in movie_map_cat.items()}
        
        # Ters haritalamaları oluştur ve ata
        self.user_map_inv = {v: k for k, v in self.user_map.items()} # Direkt user_map'ten ters çevir
        self.movie_map_inv = {v: k for k, v in self.movie_map.items()} # Direkt movie_map'ten ters çevir
        print("Ters haritalamalar (user_map_inv, movie_map_inv) oluşturuldu.")

        sparse_matrix = csr_matrix((df['rating'], (df['user_code'], df['movie_code'])), shape=(len(self.user_map), len(self.movie_map)))
        print(f"Kullanıcı-Film matrisi oluşturuldu. Boyut: {sparse_matrix.shape}")
        
        # Film başlıklarını oluştur ve ata
        self.movie_titles = df.set_index('movieId')['title'].drop_duplicates().to_dict()
        print(f"Film başlıkları (movie_titles) oluşturuldu. Toplam {len(self.movie_titles)} başlık.")
        
        # Global ortalama puanı hesaplama
        self.global_average_rating = df['rating'].mean()
        print(f"Global ortalama puan: {self.global_average_rating:.2f}")

        # Kullanıcıların oyladığı filmleri ve puanları saklayan sözlük
        print("Kullanıcıların oyladığı filmler ve puanlar haritası oluşturuluyor...")
        grouped = df.groupby('userId')[['movieId', 'rating']].apply(lambda x: dict(zip(x['movieId'], x['rating']))).to_dict()
        self.user_rated_movies_with_ratings = grouped
        print(f"{len(self.user_rated_movies_with_ratings)} kullanıcı için oylama geçmişi (puanlarla) oluşturuldu.")

        return sparse_matrix

    def fit(self, df):
        """
        Modeli eğitir ve gerekli vektörleri/haritaları saklar.
        _create_user_movie_data çağrıldığı için haritalar burada oluşur.
        """
        user_movie_matrix = self._create_user_movie_data(df)
        print(f"{self.n_components} bileşenli TruncatedSVD modeli eğitiliyor...")
        self.user_vectors = self.model.fit_transform(user_movie_matrix)
        self.item_vectors = self.model.components_.T
        print("Model eğitimi ve vektör dönüşümü tamamlandı.")
        # _create_user_movie_data içinde zaten user_map_inv, movie_map_inv ve movie_titles atandı.
        del user_movie_matrix

    def predict(self, user_id, n_recommendations=10):
        """
        Latent vektörleri kullanarak belirli bir kullanıcı için film önerileri üretir.
        """
        if user_id not in self.user_map:
            print(f"Hata: Kullanıcı ID {user_id} modelde bulunamadı.")
            return []
        if self.user_vectors is None or self.item_vectors is None:
            print("Hata: Model vektörleri (user/item) yüklenmemiş veya eğitilmemiş.")
            return []

        print(f"{user_id} için öneriler hesaplanıyor (vektörler kullanılarak)...")
        user_index = self.user_map[user_id]
        user_vector = self.user_vectors[user_index, :] # İlgili kullanıcının latent vektörü

        # Kullanıcı vektörü ile tüm film vektörlerinin nokta çarpımını hesapla
        scores = user_vector.dot(self.item_vectors.T)

        # Skorları movieId ile eşleştir (movie_map'in tersi lazım)
        # movie_map: movieId -> index ; movie_map_inv: index -> movieId
        movie_map_inv = {v: k for k, v in self.movie_map.items()}
        movie_indices = np.arange(len(scores))
        movie_ids = [movie_map_inv[i] for i in movie_indices] # Tüm film ID'leri

        # DataFrame oluştur
        score_df = pd.DataFrame({'movieId': movie_ids, 'score': scores})

        # Kullanıcının zaten oy verdiği filmleri filtrele
        rated_movies_dict = self.user_rated_movies_with_ratings.get(user_id, {})
        rated_movies_set = set(rated_movies_dict.keys())
        recommendations = score_df[~score_df['movieId'].isin(rated_movies_set)]

        # En yüksek skora sahip N filmi al
        recommendations = recommendations.nlargest(n_recommendations, 'score')

        # Film başlıklarını ekle
        recommendations['title'] = recommendations['movieId'].map(self.movie_titles)

        print(f"{user_id} için öneriler:")
        print(recommendations[['movieId', 'title', 'score']])

        # Sadece film ID listesi döndürelim (API için daha uygun olabilir)
        # return recommendations['movieId'].tolist()
        # Veya daha fazla bilgi: (movieId, title, score) tuple listesi
        return list(recommendations.itertuples(index=False, name=None))

    def predict_for_new_user(self, ratings_dict, n_recommendations=10, k_neighbors=50, rating_threshold=3.5):
        """
        Yeni bir kullanıcının puanlarına göre, benzer kullanıcıları bularak öneri üretir.
        Öneri skoru, komşuların filme verdiği puanların benzerlik ağırlıklı ortalamasıdır.
        ratings_dict: {movieId: rating} formatında.
        k_neighbors: Benzerlik için dikkate alınacak komşu sayısı.
        rating_threshold: Komşuların bir filmi önermesi için vermesi gereken min puan.
        """
        if self.item_vectors is None or self.user_vectors is None or not self.movie_map or not self.user_map or not self.user_rated_movies_with_ratings or self.global_average_rating is None:
            print("Hata: Model vektörleri veya haritalamalar yüklenmemiş veya global ortalama yüklenmemiş.")
            return []
        if not self.user_map_inv:
             print("Hata: user_map_inv modelde bulunamadı.")
             return []

        print(f"Kullanıcı tabanlı öneriler hesaplanıyor (k={k_neighbors}, threshold={rating_threshold}): {ratings_dict}")

        # 1. Geçerli movieId'leri ve normalize edilmiş puanları al
        valid_ratings_normalized = []
        rated_movie_ids = set()
        for movie_id, rating in ratings_dict.items():
            try:
                movie_id = int(movie_id)
                if movie_id in self.movie_map:
                    item_index = self.movie_map[movie_id]
                    normalized_rating = float(rating) - self.global_average_rating
                    valid_ratings_normalized.append((item_index, normalized_rating))
                    rated_movie_ids.add(movie_id)
            except (ValueError, TypeError):
                print(f"Uyarı: Geçersiz film ID'si veya puan formatı: {movie_id} -> {rating}. Atlanıyor.")
                continue

        if not valid_ratings_normalized:
            print("Hata: Yeni kullanıcının puanladığı ve modelde bulunan geçerli film bulunamadı.")
            return []

        # 2. Geçici kullanıcı vektörünü oluştur
        temp_user_vector = np.zeros(self.n_components)
        total_absolute_weight = 0
        for item_index, norm_rating in valid_ratings_normalized:
            weight = abs(norm_rating)
            temp_user_vector += norm_rating * self.item_vectors[item_index, :]
            total_absolute_weight += weight

        if total_absolute_weight > 0:
            norm = np.linalg.norm(temp_user_vector)
            if norm > 0:
                temp_user_vector /= norm
            else:
                print("Uyarı: Geçici kullanıcı vektörü sıfır normuna sahip. Benzerlik hesaplanamaz.")
                return []
        else:
            print("Uyarı: Geçici kullanıcı vektörü için ağırlık toplamı sıfır. Benzerlik hesaplanamaz.")
            return []

        # 3. Benzer Kullanıcıları Bulma
        temp_user_vector_reshaped = temp_user_vector.reshape(1, -1)
        similarities = cosine_similarity(temp_user_vector_reshaped, self.user_vectors)
        user_similarity_scores = list(enumerate(similarities[0]))
        user_similarity_scores.sort(key=lambda x: x[1], reverse=True)
        top_k_neighbors = user_similarity_scores[:k_neighbors]
        print(f"En benzer {len(top_k_neighbors)} komşu bulundu (max {k_neighbors}).")

        # 4. Komşuların Puanlarına Göre Film Skorlarını Hesaplama (ESKİ YÖNTEM: Benzerlik Toplamı)
        recommended_movie_scores = defaultdict(float) # {movieId: toplam_benzerlik_skoru}
        recommendation_counts = defaultdict(int)    # {movieId: öneren_komşu_sayısı}

        print("\n--- Komşu Analizi (neighbor_idx, similarity) ---")
        for neighbor_idx, neighbor_similarity in top_k_neighbors:
            if neighbor_similarity <= 0:
                continue

            neighbor_user_id = self.user_map_inv.get(neighbor_idx)
            if neighbor_user_id is None:
                continue

            neighbor_ratings = self.user_rated_movies_with_ratings.get(neighbor_user_id, {})

            for movie_id, rating in neighbor_ratings.items():
                if movie_id in rated_movie_ids:
                    continue

                # Eşik değere göre filtreleme (Opsiyonel ama performansı artırabilir)
                if rating < rating_threshold:
                    continue

                # Filme ait skora komşunun sadece BENZERLİK skorunu ekle.
                recommended_movie_scores[movie_id] += neighbor_similarity
                recommendation_counts[movie_id] += 1

        if not recommended_movie_scores:
             print("Filtreleme sonrası komşulardan önerilebilecek yeni film bulunamadı.")
             return []

        # 5. Skorları Hesapla ve Sırala (Artık sadece toplama ve sıralama)
        final_recommendations = []
        for movie_id, total_similarity_score in recommended_movie_scores.items():
            final_recommendations.append({
                'movieId': movie_id,
                'score': total_similarity_score, # Doğrudan toplam benzerlik skorunu kullan
                'count': recommendation_counts[movie_id] # İsteğe bağlı: Kaç komşunun önerdiğini tut
            })

        if not final_recommendations:
             print("Öneriye dönüştürülecek film bulunamadı (beklenmedik durum).")
             return []

        # Toplam benzerlik skoruna göre büyükten küçüğe sırala
        final_recommendations.sort(key=lambda x: x['score'], reverse=True)

        # En iyi N tanesini al
        top_recommendations_data = final_recommendations[:n_recommendations]

        # 6. Sonuçları Formatla
        recs_df = pd.DataFrame(top_recommendations_data)
        if self.movie_titles:
             recs_df['title'] = recs_df['movieId'].map(self.movie_titles)
             recs_df = recs_df.dropna(subset=['title'])
        else:
             print("Uyarı: movie_titles yüklenmemiş, başlıklar eklenemiyor.")
             recs_df['title'] = 'Title Unavailable'

        print(f"\nYeni kullanıcı için bulunan öneriler (Toplam Benzerlik Skoruna Göre):")
        print(recs_df[['movieId', 'title', 'score', 'count']]) # count'u da ekleyelim

        # (movieId, title, score) tuple listesi döndür (skor artık toplam benzerlik)
        return list(recs_df[['movieId', 'title', 'score']].itertuples(index=False, name=None))

    def get_all_item_ids(self):
        """Modelin bildiği tüm geçerli item (movie) ID'lerini döndürür."""
        if not self.movie_map:
            return []
        return list(self.movie_map.keys())

    def save_model(self, filepath='cf_model.joblib'):
        """
        Eğitilmiş modeli, vektörleri ve haritaları dosyaya kaydeder.
        """
        # Kontrol edilecek alanlara user_map_inv, movie_map_inv ve movie_titles eklendi
        if self.user_vectors is None or self.item_vectors is None or \
           self.user_map is None or self.movie_map is None or \
           self.user_map_inv is None or self.movie_map_inv is None or \
           self.movie_titles is None or \
           self.user_rated_movies_with_ratings is None or self.global_average_rating is None:
            print("Hata: Model tam olarak eğitilmemiş veya bazı bileşenler eksik. Kaydedilemiyor.")
            # Hangi alanın eksik olduğunu bulmaya yardımcı log ekleyelim:
            missing = []
            if self.user_vectors is None: missing.append('user_vectors')
            if self.item_vectors is None: missing.append('item_vectors')
            if self.user_map is None: missing.append('user_map')
            if self.movie_map is None: missing.append('movie_map')
            if self.user_map_inv is None: missing.append('user_map_inv')
            if self.movie_map_inv is None: missing.append('movie_map_inv')
            if self.movie_titles is None: missing.append('movie_titles')
            if self.user_rated_movies_with_ratings is None: missing.append('user_rated_movies_with_ratings')
            if self.global_average_rating is None: missing.append('global_average_rating')
            print(f"Eksik alanlar: {missing}")
            return

        print(f"Model verileri şuraya kaydediliyor: {filepath}")
        model_data = {
            'user_vectors': self.user_vectors,
            'item_vectors': self.item_vectors,
            'user_map': self.user_map,
            'movie_map': self.movie_map,
            'user_rated_movies_with_ratings': self.user_rated_movies_with_ratings,
            'global_average_rating': self.global_average_rating,
            'n_components': self.n_components,
            'svd_model_components': self.model.components_, # Bu SVD modelinin kendisini değil, componentlerini saklar
            'movie_map_inv': self.movie_map_inv, # Artık _create_user_movie_data'da atanıyor
            'user_map_inv': self.user_map_inv,   # Artık _create_user_movie_data'da atanıyor
            'movie_titles': self.movie_titles     # Artık _create_user_movie_data'da atanıyor
        }
        try:
            joblib.dump(model_data, filepath, compress=3)
            print(f"Model verileri başarıyla kaydedildi: {filepath}")
        except Exception as e:
            print(f"Model verileri kaydedilirken hata oluştu: {e}")

    @classmethod
    def load_model(cls, filepath='cf_model.joblib'):
        """
        Kaydedilmiş model verilerini yükler ve bir model nesnesi döndürür.
        """
        print(f"Model verileri şuradan yükleniyor: {filepath}")
        try:
            model_data = joblib.load(filepath)

            # Kontrol edilecek anahtarlar save_model ile tutarlı olmalı
            required_keys = [
                'user_vectors', 'item_vectors', 'user_map', 'movie_map',
                'movie_map_inv', 'user_map_inv', 'movie_titles',
                'user_rated_movies_with_ratings', 'global_average_rating', 'n_components',
                'svd_model_components' # Kaydedildiği için kontrol listesine ekleyelim
            ]
            if not all(key in model_data for key in required_keys):
                missing_keys = [key for key in required_keys if key not in model_data]
                print(f"Hata: Model dosyası eksik anahtarlar içeriyor: {missing_keys}. Yüklenemiyor.")
                return None

            instance = cls(n_components=model_data['n_components'])

            instance.user_vectors = model_data['user_vectors']
            instance.item_vectors = model_data['item_vectors']
            instance.user_map = model_data['user_map']
            instance.movie_map = model_data['movie_map']
            instance.movie_map_inv = model_data.get('movie_map_inv')
            instance.user_map_inv = model_data.get('user_map_inv')
            instance.movie_titles = model_data['movie_titles']
            instance.user_rated_movies_with_ratings = model_data['user_rated_movies_with_ratings']
            instance.global_average_rating = model_data['global_average_rating']

            # Eksik map'leri yeniden oluştur (defansif kodlama)
            if instance.movie_map and not instance.movie_map_inv:
                 instance.movie_map_inv = {v: k for k, v in instance.movie_map.items()}
            if instance.user_map and not instance.user_map_inv:
                 instance.user_map_inv = {v: k for k, v in instance.user_map.items()}

            if not instance.movie_map_inv or not instance.user_map_inv:
                 print("Hata: Ters haritalamalar (inv_map) yüklenemedi veya oluşturulamadı.")
                 return None

            print(f"Model verileri başarıyla yüklendi ({instance.n_components} bileşenli).")
            return instance

        except FileNotFoundError:
            print(f"Hata: Model dosyası bulunamadı: {filepath}")
            return None
        except Exception as e:
            print(f"Model yüklenirken genel bir hata oluştu: {e}")
            return None

# Test bloğu
if __name__ == '__main__':
    # --- Ayarlar ---
    MODEL_FILENAME = "cf_svd_model_data_k10_v1.joblib" # k10 modelini kullan
    MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), MODEL_FILENAME)
    FORCE_RETRAIN = False # Modeli tekrar EĞİTME, sadece yükle ve test et
    N_COMPONENTS = 10 # Modelin 10 bileşenle eğitildiğini belirtir
    TEST_USER_ID = 1

    # --- Path ve Import Ayarları ---
    print("Test modülü çalıştırılıyor...")
    import sys
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    if project_root not in sys.path:
        sys.path.append(project_root)
    from backend.utils.preprocess import load_and_prepare_data

    cf_model = None
    # Modeli yükle (FORCE_RETRAIN False olduğu için bu blok çalışacak)
    if not FORCE_RETRAIN and os.path.exists(MODEL_PATH):
        print("-" * 30)
        print(f"Kaydedilmiş model verileri yükleniyor: {MODEL_PATH}")
        cf_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
        if cf_model:
            print("Model başarıyla yüklendi.")
        else:
            print("Model yüklenemedi!")
            sys.exit(1) # Model yüklenemezse devam etme
        print("-" * 30)
    # Eğer model dosyası bulunamazsa hata verip çık (yeniden eğitme)
    elif not os.path.exists(MODEL_PATH):
        print(f"HATA: Model dosyası bulunamadı: {MODEL_PATH}. Önce modeli eğitin.")
        sys.exit(1)
        
    # --- Tahmin Testleri ---
    if cf_model:
        # Mevcut kullanıcı testi (opsiyonel, kalabilir)
        print("-" * 30)
        print(f"--- Mevcut Kullanıcı ({TEST_USER_ID}) İçin Tahmin Testi ---")
        if TEST_USER_ID in cf_model.user_map:
            recommendations_existing = cf_model.predict(TEST_USER_ID, n_recommendations=5)
        else:
            print(f"Test kullanıcısı {TEST_USER_ID} modelde bulunamadı.")
        print("-" * 30)

        # YENİ KULLANICI TESTİ (Çocuk Filmleri Senaryosu)
        print("-" * 30)
        print("--- Yeni Kullanıcı İçin Tahmin Testi (Çocuk Filmleri Senaryosu) ---")
        TEST_NEW_USER_RATINGS = {
            1: 5,      # Toy Story (1995)
            364: 5,    # Lion King, The (1994)
            6377: 5,   # Finding Nemo (2003)
            4306: 5,   # Shrek (2001)
            68954: 5,  # Up (2009)
            # Modelde olmayan ID testi (opsiyonel, kalabilir veya kaldırılabilir)
            # 999999: 5 
        }
        recommendations_new = cf_model.predict_for_new_user(TEST_NEW_USER_RATINGS, \
                                                          n_recommendations=15, # Biraz daha fazla öneri görelim
                                                          k_neighbors=50, \
                                                          rating_threshold=3.5)
        print("-" * 30)
    else:
        print("Model yüklenemedi, tahmin yapılamıyor.") 