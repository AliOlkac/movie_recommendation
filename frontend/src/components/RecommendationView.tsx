"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Movie } from '@/lib/api'; // Movie tipini import et
import RatingStars from './RatingStars';
import { FaStar, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Sabitleri tanımla (MovieModal'dan taşındı)
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface RecommendationViewProps {
  recommendationsData: Movie[] | null;
  isLoadingRecommendations: boolean;
  recommendationError: string | null;
  currentRecommendationIndex: number;
  initialRating: number;
  isFavorite: boolean;
  currentRating: number;
  setCurrentRating: (rating: number) => void;
  handleRatingSubmit: () => void;
  onToggleFavorite: (tmdbId: number) => void;
  onNavigateRecommendation: (direction: 'next' | 'prev') => void;
  onClose: () => void; // Hata durumunda kapatma butonu için
}

const RecommendationView: React.FC<RecommendationViewProps> = ({
  recommendationsData,
  isLoadingRecommendations,
  recommendationError,
  currentRecommendationIndex,
  initialRating,
  isFavorite,
  currentRating,
  setCurrentRating,
  handleRatingSubmit,
  onToggleFavorite,
  onNavigateRecommendation,
  onClose, // onClose prop'unu al
}) => {
  const currentRecommendation = recommendationsData ? recommendationsData[currentRecommendationIndex] : null;

  // Yükleme Durumu
  if (isLoadingRecommendations) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
        <p className="text-yellow-100/80">Getting recommendations...</p>
      </div>
    );
  }

  // Hata Durumu
  if (recommendationError && !isLoadingRecommendations) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <p className="text-red-400 text-lg mb-4">{recommendationError}</p>
        <motion.button
          onClick={onClose} // Hata durumunda modalı kapat
          className="bg-yellow-600 text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>
      </div>
    );
  }

  // Önerilerin Gösterilmesi
  if (!isLoadingRecommendations && !recommendationError && currentRecommendation) {
    return (
      // Öneri görünümü JSX (MovieModal'dan taşındı)
      <div className='w-full flex flex-col items-center relative'> {/* Navigasyon okları için relative eklendi */}
        {/* Poster */}
        <div className='relative w-48 h-72 md:w-60 md:h-90 mb-4 rounded-lg overflow-hidden shadow-lg border-2 border-yellow-600/30'>
          {currentRecommendation.posterUrl ? (
            <Image
              src={`${TMDB_IMAGE_BASE_URL}${currentRecommendation.posterUrl}`}
              alt={`${currentRecommendation.title} poster`}
              fill
              sizes="(max-width: 768px) 200px, 240px"
              style={{ objectFit: 'cover' }}
              priority
              className="rounded"
            />
          ) : (
            <div className='w-full h-full bg-black/30 flex items-center justify-center text-yellow-500/50'>
              <FaStar size={50} />
            </div>
          )}
        </div>
        {/* Film Bilgisi */}
        <div className='text-center mb-4 px-4'>
          <h3 className='text-lg md:text-xl font-bold text-yellow-100 truncate' title={currentRecommendation.title}>
            {currentRecommendation.title}
          </h3>
          <p className='text-xs md:text-sm text-yellow-200/70 truncate' title={currentRecommendation.genres?.split('|').join(', ') || ''}>
            {currentRecommendation.genres?.split('|').join(', ') || 'No genres available'}
          </p>
        </div>
        {/* Puanlama & Favori Butonları */}
        <div className="flex flex-col items-center space-y-3 mb-4">
          <RatingStars
            key={`rec-stars-${currentRecommendation.tmdbId}`}
            totalStars={5}
            initialRating={initialRating}
            onRatingChange={setCurrentRating}
          />
          <motion.button
            onClick={handleRatingSubmit}
            disabled={currentRating === 0}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${currentRating > 0 ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
            whileTap={currentRating > 0 ? { scale: 0.95 } : {}}
          >
            {initialRating > 0 ? 'Update Rating' : 'Submit Rating'}
          </motion.button>
        </div>
        <div className='flex space-x-4'>
          {/* Favori Butonu */}
          {currentRecommendation.tmdbId && (
              <motion.button
                onClick={() => onToggleFavorite(currentRecommendation.tmdbId!)}
                className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm ${isFavorite ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                whileTap={{ scale: 0.95 }}
              >
                {isFavorite ? <FaHeart className='mr-2'/> : <FaRegHeart className='mr-2'/>} Favorite
              </motion.button>
          )}
        </div>

        {/* Navigasyon Okları (Birden fazla öneri varsa) */}
        {recommendationsData && recommendationsData.length > 1 && (
          <>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onNavigateRecommendation('prev'); }}
              className='absolute top-1/2 left-1 md:left-2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-yellow-300/70 hover:text-yellow-200 rounded-full p-2 z-10 transition-colors' // z-index düşürüldü
              aria-label='Previous recommendation'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.90 }}
            >
              <FaChevronLeft size={18} />
            </motion.button>
            <motion.button
              onClick={(e) => { e.stopPropagation(); onNavigateRecommendation('next'); }}
              className='absolute top-1/2 right-1 md:right-2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-yellow-300/70 hover:text-yellow-200 rounded-full p-2 z-10 transition-colors' // z-index düşürüldü
              aria-label='Next recommendation'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.90 }}
            >
              <FaChevronRight size={18} />
            </motion.button>
            {/* Index Göstergesi */}
            <div className='absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 text-xs text-yellow-100/50 bg-black/30 px-1.5 py-0.5 rounded'>
              {currentRecommendationIndex + 1} / {recommendationsData.length}
            </div>
          </>
        )}
      </div>
    );
  }

  // Eğer hiçbir koşul eşleşmezse
  return null;
};

export default RecommendationView; 