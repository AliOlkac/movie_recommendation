"use client";

import React, { useState, useEffect } from 'react';
// import Image from 'next/image'; // Artık burada kullanılmıyor
import { Movie, fetchTmdbMovieDetails, TmdbMovieDetails } from '@/lib/api';
// import RatingStars from './RatingStars'; // Alt bileşenlerde kullanılıyor
import { FaTimes } from 'react-icons/fa'; // Sadece FaTimes kullanılıyor
import { motion } from 'framer-motion';
import MovieDetailView from './MovieDetailView'; // Yeni import
import RecommendationView from './RecommendationView'; // Yeni import

// TMDB image base URL (Alt bileşenlere taşındı)
// const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Favorites tipini tanımla (MovieList'ten kopyala veya import et)
/*
interface FavoriteInfo {
  title: string;
  posterUrl: string | null;
}
interface Favorites {
  [tmdbId: number]: FavoriteInfo;
}
*/

// --- Modal Props --- 
interface MovieModalProps {
  tmdbId: number | null;
  onClose: () => void;
  onRate: (tmdbId: number, rating: number) => void;
  initialRating: number;
  isFavorite: boolean;
  onToggleFavorite: (tmdbId: number) => void;
  mode: 'detail' | 'recommendation';
  recommendationsData: Movie[] | null;
  isLoadingRecommendations: boolean;
  recommendationError: string | null;
  currentRecommendationIndex: number;
  onNavigateRecommendation: (direction: 'next' | 'prev') => void;
}

const MovieModal: React.FC<MovieModalProps> = ({
    tmdbId,
    onClose,
    onRate,
    initialRating,
    isFavorite,
    onToggleFavorite,
    mode,
    recommendationsData,
    isLoadingRecommendations,
    recommendationError,
    currentRecommendationIndex,
    onNavigateRecommendation,
}) => {
  // --- State for Detail Mode --- 
  const [movieDetails, setMovieDetails] = useState<TmdbMovieDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  // --- State for Rating (used in both modes) ---
  const [currentRating, setCurrentRating] = useState(initialRating);
  
  // Reset internal rating state when the initialRating prop changes
  useEffect(() => {
      setCurrentRating(initialRating);
  }, [initialRating]);

  // --- Effect to Fetch Movie Details (Only in Detail Mode) ---
  useEffect(() => {
    if (mode === 'detail' && tmdbId !== null && tmdbId > 0) { 
      setIsLoadingDetails(true);
      setDetailError(null);
      setMovieDetails(null);
      
      fetchTmdbMovieDetails(tmdbId)
        .then(data => {
          if (data) {
            setMovieDetails(data);
          } else {
            setDetailError('Could not load movie details.');
          }
        })
        .catch(err => {
          console.error("Error fetching movie details:", err);
          setDetailError('An error occurred while fetching details.');
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else if (mode === 'detail' && tmdbId === null) {
        setDetailError('Movie ID is missing.');
        setIsLoadingDetails(false);
        setMovieDetails(null);
    }
    // Eğer mod değişirse ve detay moduna geçiliyorsa detayları sıfırla
    if (mode !== 'detail') {
        setMovieDetails(null);
        setDetailError(null);
        setIsLoadingDetails(false);
    }
  }, [tmdbId, mode]);

  // --- Rating Handler (used in both modes, passed down) ---
  const handleRatingSubmit = () => {
    let idToRate: number | null = null;
    const ratingToSubmit = currentRating;
    
    if (mode === 'detail') {
        idToRate = tmdbId;
    } else if (mode === 'recommendation' && recommendationsData) {
        idToRate = recommendationsData[currentRecommendationIndex]?.tmdbId;
    }
        
    if (idToRate && ratingToSubmit > 0) {
      console.log(`[MovieModal] Calling onRate with: tmdbId=${idToRate}, rating=${ratingToSubmit}`);
      onRate(idToRate, ratingToSubmit);
    } else {
        console.warn(`[MovieModal] Rating not submitted: idToRate=${idToRate}, currentRating=${ratingToSubmit}`);
    }
  };
  
  // --- Render Logic --- 
  // Don't render if not open (tmdbId is null AND not in recommendation mode loading/error)
  // VEYA öneri modu aktif ama ne yükleme ne hata ne de veri yoksa
  if (tmdbId === null && (mode === 'detail' || (mode === 'recommendation' && !isLoadingRecommendations && !recommendationError && !recommendationsData))) {
      return null;
  }

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-gradient-to-br from-gray-900/10 via-black/20 to-gray-900/10 backdrop-blur-xl rounded-xl shadow-2xl max-w-md md:max-w-lg w-full max-h-[95vh] border border-gray-600/20 flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Consistent Close Button */}
        <div className="flex justify-end items-center p-3 absolute top-0 right-0 z-20">
          <motion.button
            onClick={onClose}
            className="text-gray-300/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
            aria-label="Close modal"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.7)'}}
            whileTap={{ scale: 0.90 }}
          >
            <FaTimes size={18} />
          </motion.button>
        </div>

        {/* --- Body (Alt bileşenleri render et) --- */} 
        <div className="overflow-y-auto flex-grow flex flex-col items-center justify-center relative pt-12 pb-6 px-4 md:px-6">
          {mode === 'detail' && (
            <MovieDetailView
              tmdbId={tmdbId} 
              movieDetails={movieDetails}
              isLoadingDetails={isLoadingDetails}
              detailError={detailError}
              initialRating={initialRating} // Doğrudan MovieModal'dan gelen prop
              isFavorite={isFavorite}       // Doğrudan MovieModal'dan gelen prop
              currentRating={currentRating} // Modal'ın state'i
              setCurrentRating={setCurrentRating} // Modal'ın state'ini güncelleyen fonksiyon
              handleRatingSubmit={handleRatingSubmit} // Modal'daki fonksiyon
              onToggleFavorite={onToggleFavorite}   // Doğrudan MovieModal'dan gelen prop
              onClose={onClose} // Kapatma fonksiyonu
            />
          )}
          
          {mode === 'recommendation' && (
            <RecommendationView
              recommendationsData={recommendationsData}
              isLoadingRecommendations={isLoadingRecommendations}
              recommendationError={recommendationError}
              currentRecommendationIndex={currentRecommendationIndex}
              initialRating={initialRating} // Modal'dan gelen, o anki öneriye göre hesaplanmış
              isFavorite={isFavorite}       // Modal'dan gelen, o anki öneriye göre hesaplanmış
              currentRating={currentRating} // Modal'ın state'i
              setCurrentRating={setCurrentRating} // Modal'ın state'ini güncelleyen fonksiyon
              handleRatingSubmit={handleRatingSubmit} // Modal'daki fonksiyon
              onToggleFavorite={onToggleFavorite}   // Modal'dan gelen prop
              onNavigateRecommendation={onNavigateRecommendation} // Modal'dan gelen prop
              onClose={onClose} // Kapatma fonksiyonu
            />
          )}
        </div> 
      </div>
    </div>
  );
};

export default MovieModal; 