# Gerekli kütüphaneyi import et
import pandas as pd
import os # İşletim sistemiyle ilgili işlemler (dosya yolu gibi) için

def load_and_prepare_data(data_path='../data'):
    """
    MovieLens veri setini yükler ve temel birleştirme işlemini yapar.

    Args:
        data_path (str): Veri dosyalarının bulunduğu klasörün yolu 
                         (preprocess.py'nin bulunduğu yere göreceli).

    Returns:
        pandas.DataFrame: Birleştirilmiş ve temel olarak işlenmiş film ve rating verisi.
                          Hata durumunda None döner.
    """
    # Dosya yollarını oluştur
    # os.path.join platformdan bağımsız (Windows/Linux/Mac) doğru yolu oluşturur.
    movies_file = os.path.join(data_path, 'movies.csv')
    ratings_file = os.path.join(data_path, 'ratings.csv')

    print(f"'{movies_file}' ve '{ratings_file}' dosyaları yükleniyor...")

    try:
        # CSV dosyalarını pandas DataFrame olarak oku
        movies_df = pd.read_csv(movies_file)
        ratings_df = pd.read_csv(ratings_file)

        print("Dosyalar başarıyla yüklendi.")
        print(f"Movies DataFrame boyutu: {movies_df.shape}")
        print(f"Ratings DataFrame boyutu: {ratings_df.shape}")

        # Gereksiz 'timestamp' sütununu ratings verisinden çıkaralım
        # axis=1 sütun bazında işlem yapılacağını belirtir.
        # inplace=True değişikliği orijinal DataFrame üzerinde yapar.
        if 'timestamp' in ratings_df.columns:
            ratings_df.drop('timestamp', axis=1, inplace=True)
            print("'timestamp' sütunu kaldırıldı.")

        # movies ve ratings DataFrame'lerini 'movieId' üzerinden birleştir (merge)
        # how='inner' sadece her iki tabloda da movieId'si eşleşen kayıtları tutar.
        df = pd.merge(ratings_df, movies_df, on='movieId', how='inner')
        
        print(f"Birleştirilmiş DataFrame boyutu: {df.shape}")
        print("Veri yükleme ve birleştirme tamamlandı.")

        return df

    except FileNotFoundError:
        print(f"Hata: Veri dosyaları '{data_path}' konumunda bulunamadı.")
        return None
    except Exception as e:
        print(f"Veri yüklenirken bir hata oluştu: {e}")
        return None

# Bu dosya doğrudan çalıştırıldığında test amaçlı veri yükleme işlemini yap
if __name__ == '__main__':
    # preprocess.py, utils klasöründe olduğu için data klasörüne '../data' ile erişiriz.
    prepared_data = load_and_prepare_data(data_path='../data') 

    if prepared_data is not None:
        # İlk 5 satırı göstererek yüklemenin başarılı olduğunu kontrol et
        print("\nBirleştirilmiş verinin ilk 5 satırı:")
        print(prepared_data.head())
        
        # Bellek kullanımını göster (büyük veri setleri için faydalı)
        print("\nBellek Kullanımı:")
        prepared_data.info(memory_usage='deep') 