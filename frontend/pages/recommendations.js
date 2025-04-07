import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Layout from '@/components/Layout'
import Cookies from 'js-cookie'
import { FaStar, FaRegStar, FaChevronRight, FaChevronLeft, FaHeart, FaRegHeart, FaInfo } from 'react-icons/fa'
import Link from 'next/link'

export default function Recommendations() {
  const router = useRouter()
  
  // Kullanıcı ID'si
  const [userId, setUserId] = useState(null)
  
  // Durum yönetimi
  const [recommendations, setRecommendations] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favorites, setFavorites] = useState([])
  
  // Kullanıcı önerilerini yükleme
  const fetchRecommendations = async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`/api/recommendations/user/${id}?limit=10`)
      setRecommendations(response.data.recommendations)
    } catch (err) {
      console.error('Öneriler yüklenirken hata oluştu:', err)
      if (err.response && err.response.status === 400) {
        // 5 değerlendirme yapılmamış
        setError('Öneri alabilmek için en az 5 filme puan vermeniz gerekmektedir.')
      } else {
        setError('Öneriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Kullanıcı favorilerini yükleme
  const fetchUserFavorites = async (id) => {
    try {
      const response = await axios.get(`/api/user_preferences/favorites/${id}`)
      const favoriteIds = response.data.favorites.map(fav => fav.movie_id)
      setFavorites(favoriteIds)
    } catch (err) {
      console.error('Kullanıcı favorileri yüklenirken hata oluştu:', err)
    }
  }
  
  // Bir sonraki öneri
  const nextRecommendation = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }
  
  // Bir önceki öneri
  const prevRecommendation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }
  
  // Favoriye ekleme/çıkarma
  const toggleFavorite = async (movieId) => {
    try {
      if (favorites.includes(movieId)) {
        // Favorilerden çıkar
        await axios.post('/api/user_preferences/favorites/remove', {
          user_id: userId,
          movie_id: movieId
        })
        
        setFavorites(favorites.filter(id => id !== movieId))
      } else {
        // Favorilere ekle
        await axios.post('/api/user_preferences/favorites/add', {
          user_id: userId,
          movie_id: movieId
        })
        
        setFavorites([...favorites, movieId])
      }
    } catch (err) {
      console.error('Favori işlemi sırasında hata oluştu:', err)
    }
  }
  
  // Film başlığından yıl bilgisini çıkarma
  const parseTitle = (title) => {
    const match = title?.match(/(.*)\s\((\d{4})\)/)
    if (match) {
      return { title: match[1], year: match[2] }
    }
    return { title, year: '' }
  }
  
  // Yıldızları gösterme fonksiyonu
  const renderStars = (rating) => {
    const stars = []
    const totalStars = 5
    const roundedRating = Math.round(rating)
    
    for (let i = 1; i <= totalStars; i++) {
      if (i <= roundedRating) {
        stars.push(<FaStar key={i} className="star filled" />)
      } else {
        stars.push(<FaRegStar key={i} className="star" />)
      }
    }
    
    return stars
  }
  
  // İlk yükleme
  useEffect(() => {
    // Kullanıcı ID'sini cookie'den al
    const savedUserId = Cookies.get('userId')
    if (savedUserId) {
      const id = parseInt(savedUserId)
      setUserId(id)
      fetchRecommendations(id)
      fetchUserFavorites(id)
    } else {
      // Kullanıcı ID'si yoksa ana sayfaya yönlendir
      router.push('/')
    }
  }, [])
  
  // Geçerli öneri
  const currentRecommendation = recommendations[currentIndex]
  
  // Geçerli öneri varsa başlık ve yıl bilgisini al
  const { title, year } = currentRecommendation 
    ? parseTitle(currentRecommendation.title) 
    : { title: '', year: '' }
  
  // Favoride mi?
  const isFavorite = currentRecommendation ? favorites.includes(currentRecommendation.id) : false
  
  return (
    <Layout title="Film Önerileri">
      <h1 className="title">Sizin İçin Öneriler</h1>
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Öneriler yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error">{error}</p>
          <Link href="/" className="btn">
            Ana Sayfaya Dön
          </Link>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="empty-container">
          <p>Şu anda size önerebileceğimiz film bulamadık.</p>
          <Link href="/" className="btn">
            Ana Sayfaya Dön
          </Link>
        </div>
      ) : (
        <div className="recommendations-container">
          <div className="recommendation-position">
            {currentIndex + 1} / {recommendations.length}
          </div>
          
          <div className="recommendation-card">
            <h3>{title}</h3>
            {year && <p className="year">{year}</p>}
            
            <div className="genres">
              {currentRecommendation.genres.map((genre, index) => (
                <span key={index} className="genre">
                  {genre}
                  {index < currentRecommendation.genres.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
            
            <div className="prediction-score">
              {renderStars(currentRecommendation.predicted_rating)}
              <span>{currentRecommendation.predicted_rating}</span>
              <p className="prediction-label">Tahmini Puanınız</p>
            </div>
            
            <div className="recommendation-actions">
              <button 
                onClick={() => toggleFavorite(currentRecommendation.id)}
                className={`favorite-btn large ${isFavorite ? 'active' : ''}`}
                title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
              >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
                {isFavorite ? ' Favorilerden Çıkar' : ' Favorilere Ekle'}
              </button>
              
              <Link href={`/movie/${currentRecommendation.id}`} className="btn btn-info">
                <FaInfo /> Film Detayları
              </Link>
            </div>
          </div>
          
          <div className="navigation-buttons">
            <button 
              onClick={prevRecommendation} 
              disabled={currentIndex === 0}
              className="nav-btn prev"
              title="Önceki Öneri"
            >
              <FaChevronLeft /> Önceki
            </button>
            
            <button 
              onClick={nextRecommendation} 
              disabled={currentIndex === recommendations.length - 1}
              className="nav-btn next"
              title="Sonraki Öneri"
            >
              Sonraki <FaChevronRight />
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .recommendations-container {
          padding: 2rem;
          background-color: var(--card-bg);
          border-radius: 10px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(233, 177, 67, 0.3);
          -webkit-backdrop-filter: blur(5px);
          backdrop-filter: blur(5px);
          max-width: 800px;
          margin: 0 auto;
        }
        
        .recommendation-position {
          text-align: center;
          font-size: 0.9rem;
          color: var(--gray-color);
          margin-bottom: 1rem;
        }
        
        .recommendation-card {
          text-align: center;
          padding: 2rem;
          background-color: rgba(14, 11, 22, 0.7);
          border-radius: 10px;
          border: 2px solid var(--gold);
          position: relative;
          margin-bottom: 2rem;
        }
        
        .recommendation-card h3 {
          font-size: 1.8rem;
          color: var(--gold);
          margin-bottom: 0.5rem;
        }
        
        .year {
          color: var(--gray-color);
          margin-bottom: 1rem;
        }
        
        .genres {
          margin: 1rem 0;
          color: var(--gray-color);
        }
        
        .genre {
          font-size: 0.9rem;
        }
        
        .prediction-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1.5rem 0;
        }
        
        .prediction-score .star {
          font-size: 1.5rem;
          margin: 0 0.2rem;
        }
        
        .prediction-score .filled {
          color: var(--gold);
        }
        
        .prediction-score span {
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--gold);
          margin: 0.5rem 0;
        }
        
        .prediction-label {
          font-size: 0.9rem;
          color: var(--gray-color);
        }
        
        .recommendation-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .favorite-btn.large {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid var(--gold);
          color: var(--gold);
          padding: 0.6rem 1.2rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .favorite-btn.large:hover {
          background-color: rgba(233, 177, 67, 0.2);
        }
        
        .favorite-btn.large.active {
          background-color: var(--gold);
          color: var(--secondary-color);
        }
        
        .btn-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
        }
        
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--secondary-color);
          color: var(--text-color);
          border: 1px solid var(--light-gray);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .nav-btn:hover:not(:disabled) {
          background-color: var(--light-gray);
        }
        
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-container, .empty-container {
          text-align: center;
          padding: 3rem;
          background-color: var(--card-bg);
          border-radius: 10px;
          margin: 2rem auto;
          max-width: 600px;
          border: 1px solid rgba(233, 177, 67, 0.3);
        }
        
        .error {
          color: var(--primary-color);
          margin-bottom: 1.5rem;
        }
      `}</style>
    </Layout>
  )
} 