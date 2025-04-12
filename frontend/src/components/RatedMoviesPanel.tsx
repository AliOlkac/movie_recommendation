"use client";

import React from 'react';
import Image from 'next/image';
import { Movie } from '@/lib/api'; // Film tipi için
import { FaTimes, FaStar } from 'react-icons/fa'; // İkonlar

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; // Daha küçük resimler için w200

interface UserRatings {
  [tmdbId: number]: number;
}

interface RatedMoviesPanelProps {
  isOpen: boolean; // Panel açık mı?
  onClose: () => void; // Paneli kapatma fonksiyonu
  ratings: UserRatings; // Kullanıcının verdiği puanlar {tmdbId: rating}
  movies: Movie[]; // Ana film listesi (detayları bulmak için)
}

const RatedMoviesPanel: React.FC<RatedMoviesPanelProps> = ({ 
  isOpen, 
  onClose, 
  ratings, 
  movies 
}) => {
  if (!isOpen) {
    return null; // Panel kapalıysa render etme
  }

  // Puanlanmış filmlerin listesini oluştur
  const ratedMovies = Object.entries(ratings) // ratings objesini [tmdbId, rating] çiftlerine dönüştür
    .map(([tmdbIdStr, rating]) => {
      const tmdbId = parseInt(tmdbIdStr, 10); // String ID'yi sayıya çevir
      // Ana film listesinden bu tmdbId'ye sahip filmi bul
      const movie = movies.find(m => m.tmdbId === tmdbId); 
      // Eğer film bulunduysa ve puanı varsa, listeye ekle
      return movie ? { ...movie, rating } : null;
    })
    .filter(movie => movie !== null) as (Movie & { rating: number })[]; // null olanları filtrele ve tipi düzelt

  // Puanlanmış filmleri puana göre tersten sırala (isteğe bağlı)
  ratedMovies.sort((a, b) => b.rating - a.rating); 

  return (
    <div 
      // Sağ panel stili
      className={`fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} p-4 overflow-y-auto`}
    >
      {/* Panel Başlığı ve Kapatma Butonu */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-yellow-500">Rated Movies</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close Panel"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Puanlanmış Filmler Listesi */}
      {ratedMovies.length > 0 ? (
        <ul className="space-y-4">
          {ratedMovies.map((movie) => (
            <li key={movie.tmdbId} className="flex items-start space-x-3 bg-gray-800 p-2 rounded-md">
              {/* Küçük Afiş */}
              <div className="flex-shrink-0 w-16 h-24 relative">
                <Image
                  src={movie.posterUrl ? `${TMDB_IMAGE_BASE_URL}${movie.posterUrl}` : '/images/default-poster.png'}
                  alt={`${movie.title} poster`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded"
                />
              </div>
              {/* Film Bilgisi ve Puan */}
              <div className="flex-grow min-w-0"> {/* min-w-0 taşmayı önler */}
                <h3 className="text-sm font-medium text-white truncate" title={movie.title}>
                  {movie.title}
                </h3>
                <p className="text-xs text-gray-400 truncate" title={movie.genres.split('|').join(', ')}>
                  {movie.genres.split('|').join(', ')}
                </p>
                <div className="flex items-center mt-1 text-yellow-500">
                  <FaStar size={14} className="mr-1"/> 
                  <span className="text-sm font-bold">{movie.rating}</span>
                  <span className="text-xs text-gray-500 ml-1">/ 5</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 mt-10">You haven't rated any movies yet.</p>
      )}

      {/* TODO: "Recommend Movies" butonu (en az 5 puan varsa aktif) */}
       {ratedMovies.length >= 5 && (
           <button 
             // onClick={handleRecommend} // Öneri fonksiyonu eklenecek
             className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded transition-colors duration-300"
           >
             Get Recommendations!
           </button>
       )}
    </div>
  );
};

export default RatedMoviesPanel; 