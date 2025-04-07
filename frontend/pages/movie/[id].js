import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import Layout from '@/components/Layout'
import MovieCard from '@/components/MovieCard'
import Cookies from 'js-cookie'
import { FaStar, FaRegStar, FaHeart, FaRegHeart, FaArrowLeft } from 'react-icons/fa'

export default function MovieDetail() {
  const router = useRouter()
  const { id } = router.query
  
  // Kullanıcı ID'si
  const [userId, setUserId] = useState(null)
  
  // Durum yönetimi
  const [movie, setMovie] = useState(null)
  const [similarMovies, setSimilarMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Kullanıcı değerlendirmesi
  const [userRating, setUserRating] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  
  // Film detayları ve benzer filmleri yükleme
  useEffect(() => {
    // URL'den ID gelene kadar bekle
    if (!id) return
    
    const fetchMovieDetails = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Film detaylarını al
        const movieResponse = await axios.get(`/api/movies/${id}`)
        setMovie(movieResponse.data)
        
        // Benzer filmleri al
        const similarResponse = await axios.get(`/api/recommendations/item/${id}?limit=6`)
        setSimilarMovies(similarResponse.data.similar_movies || [])
      } catch (err) {
        console.error('Film detayları yüklenirken hata oluştu:', err)
        setError('Film detayları yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovieDetails()
  }, [id])
  
  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    // Kullanıcı ID'sini cookie'den al
    const savedUserId = Cookies.get('userId')
    if (savedUserId) {
      setUserId(parseInt(savedUserId))
    } else {
      // Varsayılan kullanıcı ID'sini kaydet
      Cookies.set('userId', 1)
      setUserId(1)
    }
  }, [])
  
  // Kullanıcı değerlendirme bilgilerini yükle
  useEffect(() => {
    if (!userId || !id) return
    
    const fetchUserPreferences = async () => {
      try {
        // Kullanıcı değerlendirmelerini al
        const ratingsResponse = await axios.get(`/api/user_preferences/ratings/${userId}`)
        
        // Bu filme ait değerlendirme var mı?
        const movieRating = ratingsResponse.data.ratings.find(r => r.movie_id === parseInt(id))
        if (movieRating) {
          setUserRating(movieRating.rating)
        }
        
        // Kullanıcı favorilerini al
        const favoritesResponse = await axios.get(`/api/user_preferences/favorites/${userId}`)
        const favoriteIds = favoritesResponse.data.favorites.map(f => f.movie_id)
        
        // Bu film favorilerde mi?
        setIsFavorite(favoriteIds.includes(parseInt(id)))
        
      } catch (err) {
        console.error('Kullanıcı bilgileri yüklenirken hata oluştu:', err)
      }
    }
    
    fetchUserPreferences()
  }, [userId, id])
  
  // Filmi puanla
  const rateMovie = async (rating) => {
    if (!userId || !id) return
    
    try {
      await axios.post('/api/user_preferences/ratings/add', {
        user_id: userId,
        movie_id: parseInt(id),
        rating: rating
      })
      
      setUserRating(rating)
      setRatingSuccess(true)
      
      // 3 saniye sonra başarı mesajını gizle
      setTimeout(() => {
        setRatingSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error('Film puanlanırken hata oluştu:', err)
    }
  }
  
  // Favorilere ekle/çıkar
  const toggleFavorite = async () => {
    if (!userId || !id) return
    
    try {
      if (isFavorite) {
        // Favorilerden çıkar
        await axios.post('/api/user_preferences/favorites/remove', {
          user_id: userId,
          movie_id: parseInt(id)
        })
        
        setIsFavorite(false)
      } else {
        // Favorilere ekle
        await axios.post('/api/user_preferences/favorites/add', {
          user_id: userId,
          movie_id: parseInt(id)
        })
        
        setIsFavorite(true)
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
  
  if (loading) {
    return (
      <Layout title="Yükleniyor...">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Film bilgileri yükleniyor...</p>
        </div>
      </Layout>
    )
  }
  
  if (error) {
    return (
      <Layout title="Hata">
        <div className="error-container">
          <h1>Bir hata oluştu</h1>
          <p>{error}</p>
          <Link href="/" className="btn">
            Ana Sayfaya Dön
          </Link>
        </div>
      </Layout>
    )
  }
  
  if (!movie) {
    return (
      <Layout title="Film Bulunamadı">
        <div className="error-container">
          <h1>Film Bulunamadı</h1>
          <p>İstediğiniz film mevcut değil veya kaldırılmış.</p>
          <Link href="/" className="btn">
            Ana Sayfaya Dön
          </Link>
        </div>
      </Layout>
    )
  }
  
  const { title, year } = parseTitle(movie.title)
  
  return (
    <Layout title={`${title} - Film Detayları`}>
      <div className="movie-detail">
        <div className="back-link">
          <Link href="/">
            <FaArrowLeft /> Ana Sayfaya Dön
          </Link>
        </div>
        
        <div className="movie-header">
          <h1 className="movie-title">{title}</h1>
          {year && <span className="movie-year">({year})</span>}
        </div>
        
        <div className="movie-genres">
          {movie.genres.map((genre, index) => (
            <span key={index} className="movie-genre">
              {genre}
              {index < movie.genres.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        
        {movie.links && Object.keys(movie.links).length > 0 && (
          <div className="movie-links">
            <h3>Bağlantılar:</h3>
            <div className="links-container">
              {movie.links.imdb && (
                <a href={movie.links.imdb} target="_blank" rel="noopener noreferrer" className="btn">
                  IMDB
                </a>
              )}
              {movie.links.tmdb && (
                <a href={movie.links.tmdb} target="_blank" rel="noopener noreferrer" className="btn">
                  TMDB
                </a>
              )}
            </div>
          </div>
        )}
        
        <div className="user-actions">
          <div className="rating-section">
            <h3>Filmi Puanla</h3>
            <div 
              className="rating-stars interactive"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => rateMovie(star)}
                >
                  {(hoverRating || userRating) >= star ? 
                    <FaStar className="star filled" /> : 
                    <FaRegStar className="star" />
                  }
                </span>
              ))}
              {userRating > 0 && !hoverRating && (
                <span className="current-rating">
                  {userRating.toFixed(1)}
                </span>
              )}
            </div>
            {ratingSuccess && (
              <div className="rating-success">
                Değerlendirmeniz kaydedildi!
              </div>
            )}
          </div>
          
          <div className="favorite-section">
            <button 
              onClick={toggleFavorite}
              className={`favorite-btn large ${isFavorite ? 'active' : ''}`}
            >
              {isFavorite ? (
                <>
                  <FaHeart /> Favorilerimde
                </>
              ) : (
                <>
                  <FaRegHeart /> Favorilere Ekle
                </>
              )}
            </button>
          </div>
        </div>
        
        {similarMovies.length > 0 && (
          <div className="similar-movies">
            <h2 className="section-title">Benzer Filmler</h2>
            <div className="movie-grid">
              {similarMovies.map(movie => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .movie-detail {
          padding: 1rem 0;
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(233, 177, 67, 0.3);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
        }
        
        .back-link {
          margin-bottom: 2rem;
        }
        
        .back-link a {
          color: var(--gray-color);
          transition: color 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .back-link a:hover {
          color: var(--gold);
        }
        
        .movie-header {
          display: flex;
          align-items: baseline;
          margin-bottom: 1rem;
        }
        
        .movie-title {
          font-size: 2.5rem;
          margin-right: 0.5rem;
          color: var(--gold);
        }
        
        .movie-year {
          font-size: 1.5rem;
          color: var(--gray-color);
        }
        
        .movie-genres {
          margin-bottom: 1.5rem;
          color: var(--gray-color);
          font-size: 1.1rem;
        }
        
        .movie-links {
          margin: 2rem 0;
        }
        
        .links-container {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .user-actions {
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: rgba(14, 11, 22, 0.7);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(233, 177, 67, 0.2);
        }
        
        .rating-section h3,
        .favorite-section h3 {
          margin-bottom: 0.8rem;
          color: var(--gold);
          font-size: 1.2rem;
        }
        
        .rating-stars.interactive {
          display: flex;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 1.8rem;
        }
        
        .rating-stars.interactive .star {
          color: var(--gray-color);
          transition: all 0.2s ease;
        }
        
        .rating-stars.interactive .star.filled {
          color: var(--gold);
        }
        
        .rating-stars.interactive span:hover {
          transform: scale(1.2);
        }
        
        .current-rating {
          margin-left: 1rem;
          color: var(--gold);
          font-weight: bold;
        }
        
        .rating-success {
          color: #4CAF50;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .favorite-btn.large {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid var(--gold);
          color: var(--gold);
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
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
        
        .section-title {
          margin: 2rem 0 1rem;
          border-bottom: 1px solid var(--light-gray);
          padding-bottom: 0.5rem;
          color: var(--gold);
        }
        
        .similar-movies {
          margin-top: 3rem;
        }
        
        .error-container {
          text-align: center;
          padding: 3rem 0;
        }
        
        .error-container h1 {
          margin-bottom: 1rem;
          color: var(--gold);
        }
        
        .error-container p {
          margin-bottom: 2rem;
          color: var(--gray-color);
        }
        
        @media (min-width: 768px) {
          .user-actions {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          
          .rating-section, .favorite-section {
            flex: 1;
          }
        }
      `}</style>
    </Layout>
  )
} 