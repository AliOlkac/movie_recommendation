"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TmdbMovieDetails } from '@/lib/api'; // Gerekli tipleri import et
import RatingStars from './RatingStars';
import { FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';

// Sabitleri tanımla (MovieModal'dan taşındı)
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface MovieDetailViewProps {
  tmdbId: number | null; // Favori butonu için gerekli olabilir
  movieDetails: TmdbMovieDetails | null;
  isLoadingDetails: boolean;
  detailError: string | null;
  initialRating: number;
  isFavorite: boolean;
  currentRating: number;
  setCurrentRating: (rating: number) => void;
  handleRatingSubmit: () => void;
  onToggleFavorite: (tmdbId: number) => void;
  onClose: () => void; // Hata durumunda kapatma butonu için
}

const MovieDetailView: React.FC<MovieDetailViewProps> = ({
  tmdbId,
  movieDetails,
  isLoadingDetails,
  detailError,
  initialRating,
  isFavorite,
  currentRating,
  setCurrentRating,
  handleRatingSubmit,
  onToggleFavorite,
  onClose, // onClose prop'unu al
}) => {
  // Yükleme Durumu
  if (isLoadingDetails) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* Basit bir yükleme spinner'ı */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Hata Durumu
  if (detailError && !isLoadingDetails) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <p className="text-red-400 text-lg mb-4">{detailError}</p>
        <motion.button
          onClick={onClose} // Hata durumunda modalı kapat
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>
      </div>
    );
  }

  // Detayların Gösterilmesi
  if (!isLoadingDetails && !detailError && movieDetails) {
    return (
      // Detay görünümü JSX (MovieModal'dan taşındı)
      <div className="w-full flex flex-col md:flex-row">
        {/* Sol Taraf: Poster */}
        <div className='relative w-full md:w-1/3 flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex justify-center md:justify-start'>
          <div className='relative w-48 h-72 md:w-full md:h-auto md:aspect-[2/3] rounded-lg overflow-hidden shadow-lg border-2 border-blue-600/30'>
            {movieDetails.poster_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`}
                alt={`${movieDetails.title} poster`}
                fill
                sizes="(max-width: 768px) 192px, 100%"
                style={{ objectFit: 'cover' }}
                priority
                className="rounded"
              />
            ) : (
              <div className='w-full h-full bg-black/30 flex items-center justify-center text-blue-500/50'>
                <FaStar size={50} />
              </div>
            )}
          </div>
        </div>
        {/* Sağ Taraf: Detaylar, Puanlama, Favori */}
        <div className="w-full md:w-2/3 flex flex-col items-center md:items-start">
          {/* Başlık, Türler, Yayın Tarihi */}
          <div className='text-center md:text-left mb-2 px-4 md:px-0'>
            <h3 className='text-xl md:text-2xl font-bold text-blue-100'>{movieDetails.title}</h3>
            <p className='text-sm text-blue-200/80 mt-1'>
              {movieDetails.genres?.map(g => g.name).join(', ') || 'No genres'}
            </p>
            <p className='text-xs text-blue-300/60 mt-1'>{movieDetails.release_date}</p>
          </div>
          {/* Özet */}
          <p className="text-sm text-gray-300 mb-4 max-w-prose text-center md:text-left px-4 md:px-0">
            {movieDetails.overview || 'No overview available.'}
          </p>
          {/* Puanlama & Favori Butonları */}
          <div className="flex flex-col items-center md:items-start space-y-3 mt-auto pt-4 border-t border-gray-700/50 w-full">
            <RatingStars
              key={`detail-stars-${tmdbId}`} // key prop'u önemli
              totalStars={5}
              initialRating={initialRating}
              onRatingChange={setCurrentRating}
            />
            <div className='flex space-x-3'>
              <motion.button
                onClick={handleRatingSubmit}
                disabled={currentRating === 0}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${currentRating > 0 ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                whileTap={currentRating > 0 ? { scale: 0.95 } : {}}
              >
                {initialRating > 0 ? 'Update Rating' : 'Submit Rating'}
              </motion.button>
              {tmdbId && ( // Sadece tmdbId varsa favori butonunu göster
                  <motion.button
                    onClick={() => onToggleFavorite(tmdbId)} // tmdbId null olamaz
                    className={`flex items-center px-4 py-1.5 rounded-md transition-colors text-xs ${isFavorite ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                    title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isFavorite ? <FaHeart className='mr-1.5'/> : <FaRegHeart className='mr-1.5'/>} Favorite
                  </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Eğer hiçbir koşul eşleşmezse (beklenmedik durum), null döndür veya bir placeholder göster
  return null;
};

export default MovieDetailView; 