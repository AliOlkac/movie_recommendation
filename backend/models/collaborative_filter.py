# Gerekli kütüphaneler
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix # Seyrek matrisler için
from sklearn.decomposition import TruncatedSVD
import joblib # Modeli kaydetmek/yüklemek için
import os
import sys # Test bloğunda path için

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
        self.user_rated_movies = None # Kullanıcıların oyladığı filmler {user_id: {movie_id, ...}}

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
        
        # Kullanıcıların oyladığı filmleri map olarak oluşturalım
        print("Kullanıcıların oyladığı filmler haritası oluşturuluyor...")
        # Gruplama işlemi büyük veri setinde zaman alabilir
        self.user_rated_movies = df.groupby('userId')['movieId'].agg(set).to_dict()
        print("Oylanan filmler haritası oluşturuldu.")

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
        rated_movies_set = self.user_rated_movies.get(user_id, set())
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

    def save_model(self, filepath='cf_model.joblib'):
        """
        Eğitilmiş modeli, vektörleri ve haritaları dosyaya kaydeder.
        """
        # Model yerine sadece vektörleri kaydedelim (model nesnesi bazen sorun çıkarabilir)
        if self.user_vectors is None or self.item_vectors is None or \
           self.user_map is None or self.movie_map is None or \
           self.movie_titles is None or self.user_rated_movies is None:
            print("Hata: Model veya gerekli bileşenler eğitilmemiş/oluşturulmamış.")
            return

        print(f"Model verileri şuraya kaydediliyor: {filepath}")
        model_data = {
            # 'model': self.model, # Sadece SVD nesnesini değil, bileşenleri kaydedelim
            'user_vectors': self.user_vectors,
            'item_vectors': self.item_vectors, # Aslında self.model.components_.T
            'user_map': self.user_map,
            'movie_map': self.movie_map,
            'movie_titles': self.movie_titles,
            'user_rated_movies': self.user_rated_movies,
            'n_components': self.n_components, # Bilgi amaçlı
            # 'random_state': self.random_state, # Buna gerek yok
            # 'user_movie_matrix_shape': self.user_movie_matrix_shape # Gerek yok
        }
        try:
            joblib.dump(model_data, filepath)
            print("Model verileri başarıyla kaydedildi.")
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
            required_keys = ['user_vectors', 'item_vectors', 'user_map', 'movie_map', \
                             'movie_titles', 'user_rated_movies', 'n_components']
            if not all(key in model_data for key in required_keys):
                print("Hata: Model dosyası eksik veya bozuk.")
                return None

            # Yeni bir model nesnesi oluştur (n_components bilgisiyle)
            instance = cls(n_components=model_data['n_components'])
            
            # Yüklenen verileri nesneye ata
            # instance.model = model_data['model'] # Modeli değil, vektörleri yükledik
            instance.user_vectors = model_data['user_vectors']
            instance.item_vectors = model_data['item_vectors']
            instance.user_map = model_data['user_map']
            instance.movie_map = model_data['movie_map']
            instance.movie_titles = model_data['movie_titles']
            instance.user_rated_movies = model_data['user_rated_movies']
            
            print("Model verileri başarıyla yüklendi.")
            return instance
        except FileNotFoundError:
            print(f"Hata: Model dosyası bulunamadı: {filepath}")
            return None
        except Exception as e:
            print(f"Model yüklenirken hata oluştu: {e}")
            return None

# Bu dosya doğrudan çalıştırıldığında test amaçlı model eğitimi/yükleme ve tahmin yap
if __name__ == '__main__':
    # --- Ayarlar ---
    MODEL_FILENAME = "cf_svd_model_data_k20.joblib" # Dosya adını değiştirelim
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
        print("Kaydedilmiş model verileri yükleniyor...")
        cf_model = CollaborativeFilteringModel.load_model(MODEL_PATH)
        print("-" * 30)

    if cf_model is None:
        print("-" * 30)
        print("Model verisi bulunamadı veya yeniden eğitim zorlandı. Model eğitiliyor...")
        data_directory = os.path.join(project_root, 'backend', 'data')
        print(f"Veri yükleniyor: {data_directory}")
        data_df = load_and_prepare_data(data_path=data_directory)
        if data_df is not None:
            data_subset = data_df
            print(f"Tüm veri kullanılıyor: {data_subset.shape}")
            cf_model = CollaborativeFilteringModel(n_components=N_COMPONENTS, random_state=42)
            cf_model.fit(data_subset) # fit artık vektörleri ve haritaları saklıyor
            cf_model.save_model(MODEL_PATH)
        else:
            print("Veri yüklenemedi, model eğitilemiyor.")
        print("-" * 30)

    # --- Tahmin Yapma ---
    if cf_model:
        print("-" * 30)
        print("Model ile tahmin yapılıyor...")
        if TEST_USER_ID in cf_model.user_map:
            recommendations = cf_model.predict(TEST_USER_ID, n_recommendations=10)
            # print(recommendations) # Çıktı zaten predict içinde yapılıyor
        else:
            print(f"\nTest kullanıcısı {TEST_USER_ID} modelde bulunamadı.")
        print("-" * 30)
    else:
        print("Model yüklenemedi veya eğitilemedi, tahmin yapılamıyor.") 