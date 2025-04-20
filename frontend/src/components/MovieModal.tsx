"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Movie, fetchTmdbMovieDetails, TmdbMovieDetails } from '@/lib/api';
import RatingStars from './RatingStars'; // Ensure this path is correct
import { FaTimes, FaHeart, FaRegHeart, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Add FaHeart, FaRegHeart, FaStar, FaChevronLeft, FaChevronRight
import { motion } from 'framer-motion';

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // Larger image for modal

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
  // Core props for detail view
  tmdbId: number | null; // Null olabilir (öneri modu yükleme/hata)
  onClose: () => void;
  onRate: (tmdbId: number, rating: number) => void;
  initialRating: number; // Dinamik olarak ayarlanacak
  isFavorite: boolean;   // Dinamik olarak ayarlanacak
  onToggleFavorite: (tmdbId: number) => void;
  
  // --- Props for Recommendation Mode --- 
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
    // Recommendation props
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
  // Reset internal rating state when the initialRating prop changes (new movie selected)
  useEffect(() => {
      setCurrentRating(initialRating);
  }, [initialRating]);

  // --- Effect to Fetch Movie Details (Only in Detail Mode) ---
  useEffect(() => {
    // Sadece 'detail' modunda ve geçerli bir tmdbId varsa detayları çek
    if (mode === 'detail' && tmdbId !== null && tmdbId > 0) { 
      setIsLoadingDetails(true);
      setDetailError(null);
      setMovieDetails(null); // Önceki veriyi temizle
      
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
        // Detail modunda ama ID null ise (olmamalı ama hata durumu)
        setDetailError('Movie ID is missing.');
        setIsLoadingDetails(false);
        setMovieDetails(null);
    }
  }, [tmdbId, mode]); // tmdbId veya mode değiştiğinde tekrar çalıştır

  // --- Rating Handler (used in both modes) ---
  const handleRatingSubmit = () => {
    let idToRate: number | null = null;
    const ratingToSubmit = currentRating; // Capture current rating value
    
    if (mode === 'detail') {
        idToRate = tmdbId;
    } else if (mode === 'recommendation' && recommendationsData) {
        // Ensure we get the ID of the currently VISIBLE recommendation
        idToRate = recommendationsData[currentRecommendationIndex]?.tmdbId;
    }
    
    // *** ADDING LOGS ***
    console.log(`[MovieModal] handleRatingSubmit called. Mode: ${mode}`);
    console.log(`[MovieModal] Current tmdbId prop: ${tmdbId}`);
    console.log(`[MovieModal] Current recommendation index: ${currentRecommendationIndex}`);
    console.log(`[MovieModal] recommendationsData available: ${!!recommendationsData}`);
    console.log(`[MovieModal] Calculated idToRate: ${idToRate}`);
    console.log(`[MovieModal] currentRating state: ${ratingToSubmit}`);
    console.log(`[MovieModal] initialRating prop: ${initialRating}`);
    
    if (idToRate && ratingToSubmit > 0) {
      console.log(`[MovieModal] Calling onRate with: tmdbId=${idToRate}, rating=${ratingToSubmit}`); // Log before calling
      onRate(idToRate, ratingToSubmit);
    } else {
        console.warn(`[MovieModal] Rating not submitted: idToRate=${idToRate}, currentRating=${ratingToSubmit}`);
    }
  };

  // --- Determine Current Movie Info (for Recommendation Mode) ---
  const currentRecommendation = (mode === 'recommendation' && recommendationsData) 
                                ? recommendationsData[currentRecommendationIndex] 
                                : null;

  // --- Render Logic --- 
  // Don't render if not open (tmdbId is null AND not in recommendation mode showing loading/error)
  if (tmdbId === null && (mode === 'detail' || (mode === 'recommendation' && !isLoadingRecommendations && !recommendationError))) {
      return null;
  }

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-opacity duration-300"
      onClick={onClose} // Backdrop click closes the modal
    >
      {/* Modal Content */} 
      <div 
        className="bg-gradient-to-br from-gray-900/10 via-black/20 to-gray-900/10 backdrop-blur-xl rounded-xl shadow-2xl max-w-md md:max-w-lg w-full max-h-[95vh] border border-gray-600/20 flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking content
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

        {/* --- Body (Conditional Rendering based on mode) --- */} 
        <div className="overflow-y-auto flex-grow flex flex-col items-center justify-center relative pt-12 pb-6 px-4 md:px-6">
        
          {/* ====== Recommendation Mode ====== */} 
          {mode === 'recommendation' && (
            <>
              {isLoadingRecommendations && (
                  <div className="flex flex-col justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
                      <p className="text-yellow-100/80">Getting recommendations...</p>
                  </div>
              )}
              {recommendationError && !isLoadingRecommendations && (
                   <div className="flex flex-col justify-center items-center h-full text-center">
                      <p className="text-red-400 text-lg mb-4">{recommendationError}</p>
                      {/* Optional: Add a retry button? */}
                      <button 
                          onClick={onClose} // Close on error for now
                          className="bg-yellow-600 text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
                      >
                          Close
                      </button>
                  </div>
              )}
              {!isLoadingRecommendations && !recommendationError && currentRecommendation && (
                  <div className='w-full flex flex-col items-center'>
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
                                  <FaStar size={50}/>
                              </div>
                          )}
                      </div>
                      {/* Movie Info */} 
                      <div className='text-center mb-4 px-4'>
                          <h3 className='text-lg md:text-xl font-bold text-yellow-100 truncate' title={currentRecommendation.title}>
                              {currentRecommendation.title}
                          </h3>
                          <p className='text-xs md:text-sm text-yellow-200/70 truncate' title={currentRecommendation.genres?.split('|').join(', ') || ''}>
                              {currentRecommendation.genres?.split('|').join(', ') || 'No genres available'}
                          </p>
                      </div>
                      {/* Rating & Favorite Buttons for Recommendation */} 
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
                           {/* Favorite Button */} 
                          <motion.button
                              onClick={() => onToggleFavorite(currentRecommendation.tmdbId!)}
                              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm ${isFavorite ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                              whileTap={{ scale: 0.95 }}
                          >
                              {isFavorite ? <FaHeart className='mr-2'/> : <FaRegHeart className='mr-2'/>} Favorite
                          </motion.button>
                      </div>
                  </div>
              )}
              {/* Navigation Arrows */} 
              {!isLoadingRecommendations && !recommendationError && recommendationsData && recommendationsData.length > 1 && (
                  <>
                      <motion.button
                          onClick={(e) => { e.stopPropagation(); onNavigateRecommendation('prev'); }}
                          className='absolute top-1/2 left-1 md:left-2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-yellow-300/70 hover:text-yellow-200 rounded-full p-2 z-30 transition-colors'
                          aria-label='Previous recommendation'
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.90 }}
                      >
                          <FaChevronLeft size={18} />
                      </motion.button>
                      <motion.button
                          onClick={(e) => { e.stopPropagation(); onNavigateRecommendation('next'); }}
                          className='absolute top-1/2 right-1 md:right-2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-yellow-300/70 hover:text-yellow-200 rounded-full p-2 z-30 transition-colors'
                          aria-label='Next recommendation'
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.90 }}
                      >
                          <FaChevronRight size={18} />
                      </motion.button>
                      {/* Index Indicator */}
                      <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-yellow-100/50 bg-black/30 px-1.5 py-0.5 rounded'>
                          {currentRecommendationIndex + 1} / {recommendationsData.length}
                      </div>
                  </>
              )}
            </>
          )}
          
          {/* ====== Detail Mode ====== */} 
          {mode === 'detail' && (
            <>
              {isLoadingDetails && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                </div>
              )}
              {detailError && !isLoadingDetails && (
                 <div className="flex flex-col justify-center items-center h-64 text-center">
                    <p className="text-red-400 text-lg mb-4">{detailError}</p>
                    <button 
                      onClick={onClose} 
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
                    >
                      Close
                    </button>
                 </div>
              )}
              {!isLoadingDetails && !detailError && movieDetails && (
                // --- REVERT TO OLDER LAYOUT STRUCTURE (APPROXIMATION) --- 
                // Use flex-row for side-by-side layout on medium screens and up
                <div className="w-full flex flex-col md:flex-row">
                  {/* Left Side: Poster */}
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
                             <FaStar size={50}/>
                         </div>
                      )}
                    </div>
                  </div>
                  {/* Right Side: Details, Rating, Favorite */} 
                  <div className="w-full md:w-2/3 flex flex-col items-center md:items-start">
                      {/* Title, Genres, Release Date */} 
                      <div className='text-center md:text-left mb-2 px-4 md:px-0'>
                        <h3 className='text-xl md:text-2xl font-bold text-blue-100'>{movieDetails.title}</h3>
                        <p className='text-sm text-blue-200/80 mt-1'>
                            {movieDetails.genres?.map(g => g.name).join(', ') || 'No genres'}
                        </p>
                        <p className='text-xs text-blue-300/60 mt-1'>{movieDetails.release_date}</p>
                      </div>
                      {/* Overview */} 
                      <p className="text-sm text-gray-300 mb-4 max-w-prose text-center md:text-left px-4 md:px-0">
                          {movieDetails.overview || 'No overview available.'}
                      </p>
                      {/* Rating & Favorite Buttons */} 
                      <div className="flex flex-col items-center md:items-start space-y-3 mt-auto pt-4 border-t border-gray-700/50 w-full">
                          <RatingStars 
                              key={`detail-stars-${tmdbId}`} 
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
                              <motion.button
                                  onClick={() => onToggleFavorite(tmdbId!)} 
                                  className={`flex items-center px-4 py-1.5 rounded-md transition-colors text-xs ${isFavorite ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                  whileTap={{ scale: 0.95 }}
                              >
                                  {isFavorite ? <FaHeart className='mr-1.5'/> : <FaRegHeart className='mr-1.5'/>} Favorite
                              </motion.button>
                          </div>
                      </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div> 
      </div>
    </div>
  );
};

export default MovieModal; 