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
        """
        print("Kullanıcı-Film verisi ve matrisi işleniyor...")
        df['user_code'] = df['userId'].astype('category').cat.codes
        df['movie_code'] = df['movieId'].astype('category').cat.codes

        user_map_cat = dict(enumerate(df['userId'].astype('category').cat.categories))
        movie_map_cat = dict(enumerate(df['movieId'].astype('category').cat.categories))
        self.user_map = {v: k for k, v in user_map_cat.items()}
        self.movie_map = {v: k for k, v in movie_map_cat.items()}

        sparse_matrix = csr_matrix((df['rating'], (df['user_code'], df['movie_code'])), shape=(len(self.user_map), len(self.movie_map)))
        print(f"Kullanıcı-Film matrisi oluşturuldu. Boyut: {sparse_matrix.shape}")
        
        self.movie_titles = df.set_index('movieId')['title'].drop_duplicates().to_dict()
        
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
        """
        user_movie_matrix = self._create_user_movie_data(df)
        print(f"{self.n_components} bileşenli TruncatedSVD modeli eğitiliyor...")
        # SVD modelini eğit ve kullanıcı vektörlerini dönüştür
        self.user_vectors = self.model.fit_transform(user_movie_matrix)
        # Film vektörlerini al (model.components_ zaten transpoze edilmiş haldedir)
        self.item_vectors = self.model.components_.T
        print("Model eğitimi ve vektör dönüşümü tamamlandı.")
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
        ratings_dict: {movieId: rating} formatında.
        k_neighbors: Benzerlik için dikkate alınacak komşu sayısı.
        rating_threshold: Komşuların bir filmi önermesi için vermesi gereken min puan.
        """
        if self.item_vectors is None or self.user_vectors is None or not self.movie_map or not self.user_map or not self.user_rated_movies_with_ratings or self.global_average_rating is None:
            print("Hata: Model vektörleri veya haritalamalar yüklenmemiş veya global ortalama yüklenmemiş.")
            return []

        print(f"Kullanıcı tabanlı öneriler hesaplanıyor (k={k_neighbors}, threshold={rating_threshold}): {ratings_dict}")

        # 1. Geçerli movieId'leri ve normalize edilmiş puanları al
        valid_ratings_normalized = []
        rated_movie_ids = set()
        for movie_id, rating in ratings_dict.items():
            try:
                movie_id = int(movie_id) # Gelen ID string olabilir, int'e çevir
                if movie_id in self.movie_map:
                    item_index = self.movie_map[movie_id]
                    # Puanı global ortalamaya göre normalize et
                    normalized_rating = float(rating) - self.global_average_rating
                    valid_ratings_normalized.append((item_index, normalized_rating))
                    rated_movie_ids.add(movie_id)
                # else: Modelde olmayan filmleri sessizce atla
            except (ValueError, TypeError):
                print(f"Uyarı: Geçersiz film ID'si veya puan formatı: {movie_id} -> {rating}. Atlanıyor.")
                continue # Geçersiz veriyle devam etme

        if not valid_ratings_normalized:
            print("Hata: Yeni kullanıcının puanladığı ve modelde bulunan geçerli film bulunamadı.")
            return []

        # 2. Geçici kullanıcı vektörünü oluştur (normalize puanlarla ağırlıklı ortalama)
        temp_user_vector = np.zeros(self.n_components)
        total_absolute_weight = 0 # Ağırlıkların mutlak değeri toplamı (normalize etmek için)
        for item_index, norm_rating in valid_ratings_normalized:
            # Ağırlık olarak normalize puanın mutlak değerini kullanabiliriz
            # Böylece hem yüksek hem de düşük puanlar vektör yönünü etkiler
            weight = abs(norm_rating)
            temp_user_vector += norm_rating * self.item_vectors[item_index, :] # Vektörü normalize puana göre ölçekle ve topla
            total_absolute_weight += weight

        # Vektörü normalize et (uzunluğunu 1 yap) - kosinüs benzerliği için önemlidir.
        if total_absolute_weight > 0:
            norm = np.linalg.norm(temp_user_vector)
            if norm > 0:
                temp_user_vector /= norm # Vektörü birim vektöre dönüştür
            else:
                # Bu durum, normalize puanların ağırlıklı toplamının sıfır vektörü vermesiyle oluşabilir (nadir)
                print("Uyarı: Geçici kullanıcı vektörü sıfır normuna sahip. Benzerlik hesaplanamaz.")
                return []
        else:
            # Bu durum, tüm normalize puanların 0 olmasıyla oluşabilir (tüm puanlar global ortalamaya eşitse)
            print("Uyarı: Geçici kullanıcı vektörü için ağırlık toplamı sıfır. Benzerlik hesaplanamaz.")
            return []

        # 3. Benzer Kullanıcıları Bulma (Kosinüs Benzerliği)
        # temp_user_vector'ü (1, n_components) şekline getir
        temp_user_vector_reshaped = temp_user_vector.reshape(1, -1)
        
        # Geçici vektör ile tüm mevcut kullanıcı vektörleri arasındaki kosinüs benzerliğini hesapla
        # Sonuç: (1, n_users) boyutlu bir matris
        similarities = cosine_similarity(temp_user_vector_reshaped, self.user_vectors)
        
        # Benzerlik skorlarını (kullanıcı_index, benzerlik) çiftleri olarak al
        user_similarity_scores = list(enumerate(similarities[0]))
        
        # Benzerliğe göre büyükten küçüğe sırala
        user_similarity_scores.sort(key=lambda x: x[1], reverse=True)
        
        # En benzer K komşuyu seç (ilk K tanesi)
        top_k_neighbors = user_similarity_scores[:k_neighbors]
        
        print(f"En benzer {len(top_k_neighbors)} komşu bulundu (max {k_neighbors}).")

        # 4. Komşuların Puanlarına Göre Film Skorlarını Hesaplama
        recommended_movie_scores = defaultdict(float) # {movieId: toplam_benzerlik_skoru}
        recommendation_counts = defaultdict(int)    # {movieId: öneren_komşu_sayısı}
        
        print("\n--- Komşu Analizi (neighbor_idx, similarity, rated_count_above_threshold) ---") # Debug
        for neighbor_idx, neighbor_similarity in top_k_neighbors:
            if neighbor_similarity <= 0: 
                continue
            
            neighbor_user_id = self.user_map_inv.get(neighbor_idx) # index -> userId
            if neighbor_user_id is None:
                continue
            
            neighbor_ratings = self.user_rated_movies_with_ratings.get(neighbor_user_id, {})
            
            rated_count_above_threshold = 0 # Debug
            for movie_id, rating in neighbor_ratings.items():
                if movie_id in rated_movie_ids:
                    continue
                
                if rating < rating_threshold:
                    continue
                
                # --- SKORLAMA DEĞİŞİKLİĞİ --- 
                # Filme ait skora komşunun sadece BENZERLİK skorunu ekle.
                # Komşunun filme verdiği puanı (normalize edilmiş) kullanmıyoruz.
                recommended_movie_scores[movie_id] += neighbor_similarity 
                recommendation_counts[movie_id] += 1
                rated_count_above_threshold += 1 # Debug
            
            # Debug: Her komşu için bilgi yazdır
            # if rated_count_above_threshold > 0:
            #     print(f"  Komşu Idx: {neighbor_idx}, Benzerlik: {neighbor_similarity:.4f}, Önerdiği Film Sayısı (>{rating_threshold}): {rated_count_above_threshold}")

        if not recommended_movie_scores:
             print("Filtreleme sonrası komşulardan önerilebilecek yeni film bulunamadı.")
             return []

        # 5. Skorları Hesapla ve Sırala (Artık sadece toplama ve sıralama)
        final_recommendations = []
        # print("\n--- Ham Öneri Skorları (movieId: {total_similarity_score}, count) ---") 
        for movie_id, total_similarity_score in recommended_movie_scores.items():
            # Final listeye movieId, toplam benzerlik skoru ve sayacı ekle
            final_recommendations.append({
                'movieId': movie_id,
                'score': total_similarity_score, # Doğrudan toplam benzerlik skorunu kullan
                'count': recommendation_counts[movie_id]
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
        recs_df['title'] = recs_df['movieId'].map(self.movie_titles)
        recs_df = recs_df.dropna(subset=['title'])

        print(f"\nYeni kullanıcı için bulunan öneriler (Toplam Benzerlik Skoruna Göre):") # Başlığı güncelle
        print(recs_df[['movieId', 'title', 'score', 'count']])
        
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
        # Kaydetmeden önce tüm gerekli bileşenlerin var olduğundan emin ol
        if self.user_vectors is None or self.item_vectors is None or \
           self.user_map is None or self.movie_map is None or \
           self.user_rated_movies_with_ratings is None or self.global_average_rating is None:
            print("Hata: Model tam olarak eğitilmemiş veya bazı bileşenler eksik. Kaydedilemiyor.")
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
            'svd_model_components': self.model.components_,
            'movie_map_inv': self.movie_map_inv,
            'user_map_inv': self.user_map_inv,
            'movie_titles': self.movie_titles
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
            # joblib.load ile verileri dosyadan oku
            model_data = joblib.load(filepath)
            
            # Yüklenen veride gerekli tüm anahtarların olup olmadığını kontrol et
            required_keys = [
                'user_vectors', 'item_vectors', 'user_map', 'movie_map', 'movie_map_inv', # movie_map_inv eksikti, onu da ekleyelim
                'user_map_inv', 'movie_titles', 'user_rated_movies_with_ratings', # movie_titles eklendi
                'global_average_rating', 'n_components'
            ]
            if not all(key in model_data for key in required_keys):
                missing_keys = [key for key in required_keys if key not in model_data]
                print(f"Hata: Model dosyası eksik anahtarlar içeriyor: {missing_keys}. Yüklenemiyor.")
                return None

            # Yüklenen n_components değeriyle yeni bir sınıf örneği (instance) oluştur
            instance = cls(n_components=model_data['n_components'])
            
            # Yüklenen verileri oluşturulan nesnenin ilgili alanlarına ata
            instance.user_vectors = model_data['user_vectors']
            instance.item_vectors = model_data['item_vectors']
            instance.user_map = model_data['user_map']
            instance.movie_map = model_data['movie_map']
            instance.movie_map_inv = model_data.get('movie_map_inv') # .get() ile eksik olma ihtimaline karşı None döner
            instance.user_map_inv = model_data.get('user_map_inv')   # .get() ile eksik olma ihtimaline karşı None döner
            instance.movie_titles = model_data['movie_titles'] # movie_titles yüklendi
            instance.user_rated_movies_with_ratings = model_data['user_rated_movies_with_ratings']
            instance.global_average_rating = model_data['global_average_rating']
            
            # Eksik olabilecek ters map'leri yeniden oluşturalım (güvenlik için)
            if instance.movie_map and not instance.movie_map_inv:
                 instance.movie_map_inv = {v: k for k, v in instance.movie_map.items()}
            if instance.user_map and not instance.user_map_inv:
                 instance.user_map_inv = {v: k for k, v in instance.user_map.items()}
                 
            # movie_map_inv hala None ise hata verelim, çünkü predict için gerekli
            if not instance.movie_map_inv:
                 print("Hata: movie_map_inv yüklenemedi veya oluşturulamadı.")
                 return None
            
            print(f"Model verileri başarıyla yüklendi ({instance.n_components} bileşenli).")
            return instance
            
        except FileNotFoundError:
            print(f"Hata: Model dosyası bulunamadı: {filepath}")
            return None
        except Exception as e:
            print(f"Model yüklenirken genel bir hata oluştu: {e}")
            return None

# Bu dosya doğrudan çalıştırıldığında test amaçlı model eğitimi/yükleme ve tahmin yap
if __name__ == '__main__':
    # --- Ayarlar ---
    MODEL_FILENAME = "cf_svd_model_data_k20_v2.joblib" # Versiyon ekleyelim
    MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), MODEL_FILENAME)
    FORCE_RETRAIN = False # Tekrar eğitmemek için False yapıldı
    N_COMPONENTS = 20
    TEST_USER_ID = 1

    # --- Path ve Import Ayarları ---
    print("Test modülü çalıştırılıyor...")
    import sys
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..')) # models -> backend -> project_root
    if project_root not in sys.path:
        sys.path.append(project_root)
    from backend.utils.preprocess import load_and_prepare_data

    # --- Model Yükleme veya Eğitme ---
    cf_model = None
    if not FORCE_RETRAIN and os.path.exists(MODEL_PATH):
        print("-" * 30)
        print(f"Kaydedilmiş model verileri yükleniyor: {MODEL_PATH}")
        cf_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
        if cf_model:
            print("Model başarıyla yüklendi.")
        else:
            print("Model yüklenemedi, yeniden eğitim denenecek.")
        print("-" * 30)

    if cf_model is None:
        print("-" * 30)
        print("Model verisi bulunamadı veya yeniden eğitim zorlandı. Model eğitiliyor...")
        data_directory = os.path.join(project_root, 'backend', 'data')
        print(f"Veri seti yükleniyor ve hazırlanıyor: {data_directory}")
        data_df = load_and_prepare_data(data_path=data_directory)
        if data_df is not None:
            print(f"Veri başarıyla yüklendi. Boyut: {data_df.shape}")
            cf_model = CollaborativeFilteringModel(n_components=N_COMPONENTS, random_state=42)
            cf_model.fit(data_df) # fit metodu vektörleri, haritaları ve ortalamayı hesaplar
            cf_model.save_model(MODEL_PATH)
        else:
            print("Hata: Veri yüklenemedi, model eğitilemiyor.")
        print("-" * 30)

    # --- Tahmin Testleri ---
    if cf_model:
        print("-" * 30)
        print(f"--- Mevcut Kullanıcı ({TEST_USER_ID}) İçin Tahmin Testi ---")
        if TEST_USER_ID in cf_model.user_map:
            # Mevcut kullanıcı için önerileri al
            recommendations_existing = cf_model.predict(TEST_USER_ID, n_recommendations=10)
            # print(recommendations_existing) # Çıktı zaten predict içinde yapılıyor
        else:
            print(f"Test kullanıcısı {TEST_USER_ID} modelde bulunamadı.")
        print("-" * 30)

        print("-" * 30)
        print("--- Yeni Kullanıcı İçin Tahmin Testi ---")
        # Yeni kullanıcı için önerileri al
        TEST_NEW_USER_RATINGS = {
            1: 5,  # Toy Story (1995)
            3: 4,  # Grumpier Old Men (1995)
            6: 5,  # Heat (1995)
            47: 1, # Seven (a.k.a. Se7en) (1995)
            50: 5, # Usual Suspects, The (1995)
            70: 3, # From Dusk Till Dawn (1996)
            101: 4, # Bottle Rocket (1996)
            # Modelde olmayan bir film ekleyelim (test için)
            999999: 5
        }
        recommendations_new = cf_model.predict_for_new_user(TEST_NEW_USER_RATINGS, \
                                                          n_recommendations=10, \
                                                          k_neighbors=50, \
                                                          rating_threshold=3.5)
        # print(recommendations_new) # Çıktı zaten predict_for_new_user içinde yapılıyor
        print("-" * 30)
    else:
        print("Model yüklenemedi veya eğitilemedi, tahmin yapılamıyor.") 