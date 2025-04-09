# Gerekli kütüphaneleri import et
from flask import Flask, jsonify, abort # abort: Hata durumları için
from flask_cors import CORS
import os
import sys

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
# ---------------------


# Flask uygulamasını başlat
app = Flask(__name__)

# Frontend'den gelen isteklere izin vermek için CORS'u yapılandır
# origins="*" tüm kaynaklardan gelen isteklere izin verir,
# geliştirme aşamasında kullanışlıdır ancak production'da kısıtlanmalıdır.
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ana route (örneğin http://127.0.0.1:5000/)
@app.route('/')
def index():
    """ Sunucunun çalıştığını belirten basit bir mesaj döndürür. """
    return jsonify({"message": "Backend sunucusu çalışıyor! Model yüklendi mi: " + ("Evet" if recommendation_model else "Hayır")})

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

        result = [{"movieId": r[0], "title": r[1], "score": r[2]} for r in recommendations]
        
        return jsonify(result)

    except Exception as e:
        print(f"Öneri alınırken hata oluştu: {e}")
        abort(500, description="Öneriler alınırken bir sunucu hatası oluştu.")
# -------------------------

# Uygulamanın doğrudan çalıştırıldığında (import edilmediğinde) başlamasını sağla
if __name__ == '__main__':
    # debug=True modu, kodda değişiklik yaptığınızda sunucunun otomatik yeniden başlamasını sağlar
    # ve olası hataları tarayıcıda gösterir. Production ortamında False olmalıdır.
    app.run(debug=True, host='0.0.0.0', port=5000)
