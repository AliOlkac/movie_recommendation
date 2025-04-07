import os
from flask import Flask, jsonify
from flask_cors import CORS
from api.movies import movies_bp
from api.recommendations import recommendations_bp
from api.ratings import ratings_bp
from api.user_preferences import user_preferences_bp

def create_app():
    """Flask uygulamasını oluşturur ve yapılandırır."""
    app = Flask(__name__)
    
    # CORS desteği ekle
    CORS(app)
    
    # API Blueprint'lerini kaydet
    app.register_blueprint(movies_bp, url_prefix='/api/movies')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
    app.register_blueprint(user_preferences_bp, url_prefix='/api/user_preferences')
    
    # Ana sayfa rotası
    @app.route('/')
    def index():
        return jsonify({
            "status": "success",
            "message": "Film Öneri API'si çalışıyor",
            "endpoints": [
                "/api/movies",
                "/api/movies/{id}",
                "/api/movies/search",
                "/api/recommendations/user/<user_id>",
                "/api/recommendations/item/<movie_id>",
                "/api/ratings",
                "/api/user_preferences/ratings/<user_id>",
                "/api/user_preferences/favorites/<user_id>"
            ]
        })
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Geliştirme modu için debug modunda çalıştır
    app.run(debug=True, host='0.0.0.0', port=5000) 