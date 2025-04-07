import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '@/components/Layout'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { FaStar, FaRegStar, FaTrash, FaInfoCircle } from 'react-icons/fa'

export default function Ratings() {
  // Kullanıcı ID
  const [userId, setUserId] = useState(1)
  
  // Puanlamalar
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Puanlamaları yükle
  const fetchRatings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`/api/user_preferences/ratings/${userId}`)
      setRatings(response.data.ratings)
    } catch (err) {
      console.error('Değerlendirmeler yüklenirken hata oluştu:', err)
      setError('Değerlendirmeler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }
  
  // Değerlendirme sil
  const deleteRating = async (movieId) => {
    try {
      await axios.post(`/api/user_preferences/ratings/delete`, {
        user_id: userId,
        movie_id: movieId
      })
      
      // Yeniden yükle
      fetchRatings()
    } catch (err) {
      console.error('Değerlendirme silinirken hata oluştu:', err)
      setError('Değerlendirme silinirken bir hata oluştu.')
    }
  }
  
  // Yıldızları gösterme fonksiyonu
  const renderStars = (rating) => {
    const stars = []
    const totalStars = 5
    
    for (let i = 1; i <= totalStars; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="star filled" />)
      } else {
        stars.push(<FaRegStar key={i} className="star" />)
      }
    }
    
    return stars
  }
  
  // Film başlığından yıl bilgisini çıkarma
  const parseTitle = (title) => {
    const match = title?.match(/(.*)\s\((\d{4})\)/)
    if (match) {
      return { title: match[1], year: match[2] }
    }
    return { title, year: '' }
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
  }, [])
  
  // Kullanıcı ID değişince değerlendirmeleri yükle
  useEffect(() => {
    if (userId) {
      fetchRatings()
    }
  }, [userId])
  
  return (
    <Layout title="Film Değerlendirmelerim">
      <h1 className="title">Film Değerlendirmelerim</h1>
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Değerlendirmeler yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="ratings-container">
          {ratings.length === 0 ? (
            <div className="empty-ratings">
              <p>Henüz film değerlendirmesi yapmadınız.</p>
              <Link href="/" className="btn">Filmleri Keşfedin</Link>
            </div>
          ) : (
            <>
              <div className="ratings-info">
                <p>Toplam <strong>{ratings.length}</strong> film değerlendirmesi yaptınız.</p>
                {ratings.length < 5 && (
                  <p className="ratings-warning">
                    <FaInfoCircle /> Kişiselleştirilmiş öneriler almak için en az 5 filme puan vermelisiniz.
                  </p>
                )}
              </div>
              
              <div className="ratings-list">
                {ratings.map(rating => {
                  const { title, year } = parseTitle(rating.title)
                  
                  return (
                    <div key={rating.movie_id} className="rating-item">
                      <div className="rating-score">
                        {rating.rating}
                      </div>
                      <div className="rating-info">
                        <h3 className="rating-title">{title} {year && <span className="rating-year">({year})</span>}</h3>
                        <div className="rating-genres">
                          {rating.genres.join(', ')}
                        </div>
                        <div className="rating-stars">
                          {renderStars(rating.rating)}
                        </div>
                      </div>
                      <div className="rating-actions">
                        <button
                          onClick={() => deleteRating(rating.movie_id)}
                          className="delete-btn"
                          title="Değerlendirmeyi Sil"
                        >
                          <FaTrash />
                        </button>
                        <Link
                          href={`/movie/${rating.movie_id}`}
                          className="view-btn"
                          title="Film Detaylarını Gör"
                        >
                          <FaInfoCircle />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
      
      <style jsx>{`
        .ratings-container {
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 2rem;
          margin-top: 2rem;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(233, 177, 67, 0.3);
          -webkit-backdrop-filter: blur(5px);
          backdrop-filter: blur(5px);
        }
        
        .empty-ratings {
          text-align: center;
          padding: 3rem 0;
        }
        
        .empty-ratings p {
          margin-bottom: 1.5rem;
          color: var(--gray-color);
        }
        
        .ratings-info {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--light-gray);
        }
        
        .ratings-warning {
          margin-top: 0.5rem;
          color: var(--primary-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .ratings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .rating-item {
          display: flex;
          align-items: center;
          background: rgba(14, 11, 22, 0.7);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(233, 177, 67, 0.2);
          transition: all 0.3s ease;
        }
        
        .rating-item:hover {
          border-color: rgba(233, 177, 67, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
        }
        
        .rating-score {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--gold);
          background: rgba(34, 31, 31, 0.8);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-right: 1rem;
          border: 1px solid var(--gold);
        }
        
        .rating-info {
          flex: 1;
        }
        
        .rating-title {
          font-size: 1.2rem;
          margin-bottom: 0.2rem;
        }
        
        .rating-year {
          color: var(--gray-color);
          font-weight: normal;
          font-size: 1rem;
        }
        
        .rating-genres {
          color: var(--gray-color);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .rating-stars {
          display: flex;
          gap: 0.2rem;
        }
        
        .star {
          color: var(--gray-color);
        }
        
        .star.filled {
          color: var(--gold);
        }
        
        .rating-actions {
          display: flex;
          gap: 0.8rem;
          margin-left: 1rem;
        }
        
        .delete-btn,
        .view-btn {
          background: none;
          border: none;
          color: var(--gray-color);
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          border-radius: 50%;
        }
        
        .delete-btn:hover {
          color: var(--primary-color);
          background: rgba(229, 9, 20, 0.1);
        }
        
        .view-btn:hover {
          color: var(--gold);
          background: rgba(233, 177, 67, 0.1);
        }
        
        .error-message {
          color: var(--primary-color);
          background-color: rgba(229, 9, 20, 0.1);
          padding: 1rem;
          border-radius: 6px;
          margin-top: 2rem;
          border: 1px solid rgba(229, 9, 20, 0.3);
        }
      `}</style>
    </Layout>
  )
} 