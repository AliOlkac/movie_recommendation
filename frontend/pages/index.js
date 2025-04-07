import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '@/components/Layout'
import MovieCard from '@/components/MovieCard'
import Pagination from '@/components/Pagination'
import Cookies from 'js-cookie'
import { FaSpinner } from 'react-icons/fa'
import Link from 'next/link'

export default function Home() {
  // Kullanıcı ID'si
  const [userId, setUserId] = useState(1) // Varsayılan kullanıcı ID
  
  // Durum yönetimi
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  
  // Kullanıcı verileri
  const [userRatings, setUserRatings] = useState({})
  const [favorites, setFavorites] = useState([])
  const [hasEnoughRatings, setHasEnoughRatings] = useState(false)
  
  // Filmleri yükleme fonksiyonu
  const fetchMovies = async (page = 1, searchQuery = '') => {
    setLoading(true)
    setError(null)
    
    try {
      let url = `/api/movies/?page=${page}&per_page=12`
      
      if (searchQuery) {
        url = `/api/movies/search?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=12`
      }
      
      const response = await axios.get(url)
      setMovies(response.data.movies)
      setTotalPages(response.data.total_pages)
      setCurrentPage(page)
    } catch (err) {
      console.error('Filmler yüklenirken hata oluştu:', err)
      setError('Filmler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }
  
  // Sayfa değiştiğinde çalışacak fonksiyon
  const handlePageChange = (page) => {
    fetchMovies(page, search)
  }
  
  // Arama fonksiyonu
  const handleSearch = (e) => {
    e.preventDefault()
    fetchMovies(1, search)
  }
  
  // Kullanıcı değerlendirmelerini yükleme
  const fetchUserRatings = async () => {
    try {
      const response = await axios.get(`/api/user_preferences/ratings/${userId}`)
      
      // Değerlendirmeleri işle
      const ratingsMap = {}
      response.data.ratings.forEach(rating => {
        ratingsMap[rating.movie_id] = rating.rating
      })
      
      setUserRatings(ratingsMap)
      
      // Yeterli değerlendirme var mı kontrol et
      setHasEnoughRatings(response.data.ratings_count >= 5)
      
    } catch (err) {
      console.error('Kullanıcı değerlendirmeleri yüklenirken hata oluştu:', err)
    }
  }
  
  // Kullanıcı favorilerini yükleme
  const fetchUserFavorites = async () => {
    try {
      const response = await axios.get(`/api/user_preferences/favorites/${userId}`)
      const favoriteIds = response.data.favorites.map(fav => fav.movie_id)
      setFavorites(favoriteIds)
    } catch (err) {
      console.error('Kullanıcı favorileri yüklenirken hata oluştu:', err)
    }
  }
  
  // Favorilere ekle/çıkar
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
  
  // İlk yükleme
  useEffect(() => {
    // Kullanıcı ID'sini cookie'den al (varsa)
    const savedUserId = Cookies.get('userId')
    if (savedUserId) {
      setUserId(parseInt(savedUserId))
    } else {
      // Varsayılan kullanıcı ID'sini kaydet
      Cookies.set('userId', userId)
    }
    
    fetchMovies()
  }, [])
  
  // Kullanıcı verileri
  useEffect(() => {
    if (userId) {
      fetchUserRatings()
      fetchUserFavorites()
    }
  }, [userId])
  
  return (
    <Layout title="Film Öneri Sistemi - Ana Sayfa">
      <h1 className="title">Film Keşfet</h1>
      
      {/* Arama formu */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Film adı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="search-btn">Ara</button>
      </form>
      
      {/* Hata mesajı */}
      {error && <div className="error">{error}</div>}
      
      {/* Öneri ya da Liste görünümü */}
      {hasEnoughRatings ? (
        <div className="recommendations-link">
          <Link href="/recommendations" className="btn btn-gold">
            Sizin için film önerilerimiz hazır! Görmek için tıklayın
          </Link>
        </div>
      ) : (
        <div className="rating-info">
          <p>Kişiselleştirilmiş film önerileri almak için en az 5 filme puan vermelisiniz. 
            Şu an <strong>{Object.keys(userRatings).length}</strong> film puanladınız.</p>
        </div>
      )}
      
      {/* Yükleniyor animasyonu */}
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Filmler yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* Film listesi */}
          <div className="movie-grid">
            {movies.length > 0 ? (
              movies.map(movie => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  userRating={userRatings[movie.id] || 0}
                  isFavorite={favorites.includes(movie.id)}
                  onFavorite={toggleFavorite}
                />
              ))
            ) : (
              <p>Film bulunamadı.</p>
            )}
          </div>
          
          {/* Sayfalama */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      <style jsx>{`
        .error {
          color: var(--primary-color);
          margin-bottom: 1rem;
          padding: 0.5rem;
          border: 1px solid var(--primary-color);
          border-radius: 4px;
        }
        
        .recommendations-link {
          margin: 1.5rem 0;
          text-align: center;
        }
        
        .rating-info {
          background-color: rgba(34, 31, 31, 0.7);
          padding: 1rem;
          border-radius: 6px;
          margin: 1.5rem 0;
          border-left: 3px solid var(--gold);
        }
      `}</style>
    </Layout>
  )
} 