import Link from 'next/link'
import { useState } from 'react'
import { FaStar, FaRegStar, FaInfo, FaHeart, FaRegHeart } from 'react-icons/fa'

export default function MovieCard({ movie, onRate, onFavorite, userRating = 0, isFavorite = false }) {
  // Film başlığından yıl bilgisini çıkarma
  const [title, year] = useState(() => {
    const match = movie.title.match(/(.*)\s\((\d{4})\)/)
    if (match) {
      return [match[1], match[2]]
    }
    return [movie.title, '']
  })

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
  
  // Favoriye ekleme/çıkarma
  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(movie.id)
    }
  }

  return (
    <div className="card">
      <h3>{title}</h3>
      {year && <p className="year">{year}</p>}
      
      <div className="genres">
        {movie.genres.map((genre, index) => (
          <span key={index} className="genre">
            {genre}
            {index < movie.genres.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
      
      {movie.predicted_rating && (
        <div className="predicted-rating">
          <p>Tahmini Puanınız:</p>
          <div className="star-rating">
            {renderStars(Math.round(movie.predicted_rating))}
            <span className="rating-value">{movie.predicted_rating}</span>
          </div>
        </div>
      )}
      
      {userRating > 0 && (
        <div className="user-rating">
          <p>Sizin Puanınız:</p>
          <div className="star-rating">
            {renderStars(userRating)}
            <span className="rating-value">{userRating}</span>
          </div>
        </div>
      )}
      
      <div className="card-actions">
        <Link href={`/movie/${movie.id}`} className="btn btn-info" title="Detaylar">
          <FaInfo /> Detaylar
        </Link>
        
        {onFavorite && (
          <button 
            onClick={handleFavorite}
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      
      <style jsx>{`
        .year {
          color: var(--gray-color);
          margin-bottom: 0.5rem;
        }
        
        .genres {
          margin: 0.5rem 0;
          color: var(--gray-color);
        }
        
        .genre {
          font-size: 0.9rem;
        }
        
        .predicted-rating,
        .user-rating {
          margin: 0.8rem 0;
        }
        
        .predicted-rating p,
        .user-rating p {
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }
        
        .star-rating {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        
        .star {
          color: var(--gray-color);
        }
        
        .star.filled {
          color: var(--gold);
        }
        
        .rating-value {
          margin-left: 0.5rem;
          color: var(--gold);
          font-weight: bold;
        }
        
        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .btn-info {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
} 