"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchTmdbMovieDetails, TmdbMovieDetails } from '@/lib/api'; // TMDB detaylarını çeken fonksiyonu ve tipi import et
import RatingStars from './RatingStars'; // Yıldız bileşenini import et
import { FaTimes } from 'react-icons/fa'; // Kapatma ikonu için

// TMDB'den gelen afiş yolları için temel URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; 

interface MovieModalProps {
  tmdbId: number | null; // Expect tmdbId now
  onClose: () => void; // Modal kapatıldığında çağrılacak fonksiyon
  onRate: (tmdbId: number, rating: number) => void; // Expect tmdbId
  initialRating?: number; // Add optional initialRating prop
}

const MovieModal: React.FC<MovieModalProps> = ({ tmdbId, onClose, onRate, initialRating = 0 }) => {
  // Film detaylarını tutmak için state
  const [movieDetails, setMovieDetails] = useState<TmdbMovieDetails | null>(null);
  // Yüklenme durumunu tutmak için state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Hata durumunu tutmak için state
  const [error, setError] = useState<string | null>(null);
  // Kullanıcının seçtiği puanı tutmak için state
  const [currentRating, setCurrentRating] = useState<number>(initialRating);

  // Runs when tmdbId changes (modal opens or movie changes)
  useEffect(() => {
    // If a tmdbId exists (modal is opening)
    if (tmdbId) {
      // Clear previous data and set loading state
      setMovieDetails(null);
      setError(null);
      // Reset rating state based on the prop passed for the *new* movie
      // Important: Use the initialRating coming from props for the selected movie
      setCurrentRating(initialRating); 
      setIsLoading(true);

      // Fetch movie details asynchronously from TMDB
      const loadDetails = async () => {
        const details = await fetchTmdbMovieDetails(tmdbId); // Use tmdbId for API call
        if (details) {
          setMovieDetails(details); // Save details to state
        } else {
          setError('Failed to load movie details.'); // Set error message (English)
        }
        setIsLoading(false); // Loading finished
      };
      loadDetails();
    }
  }, [tmdbId, initialRating]); // Add initialRating to dependency array

  // Modal kapalıysa hiçbir şey render etme
  if (!tmdbId) {
    return null;
  }

  // Yıldızlardan gelen puan değişimini yakala
  const handleRatingChange = (rating: number) => {
    // Update local state (optional, as RatingStars also holds state)
    setCurrentRating(rating); 
    // Notify the parent component about the rating
    onRate(tmdbId, rating); // Send tmdbId and rating
    console.log(`Movie TMDB ID: ${tmdbId}, Rating: ${rating}`); // Log to console
    // İsteğe bağlı: Puan verdikten sonra modalı otomatik kapatabiliriz
    // onClose();
  };

  // Modal içeriğini oluştur
  return (
    // Semi-transparent modal backdrop with blur effect
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Modal content with glassmorphism effect */}
      <div 
        className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl text-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ backdropFilter: 'blur(12px)' }} // Ensure blur works in all browsers
      >
        {/* Close Button - repositioned and styled */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          aria-label="Close"
        >
          <FaTimes size={16} />
        </button>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-yellow-400 text-lg">Loading...</div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-400 text-lg">{error}</div>
          </div>
        )}

        {/* Movie Details with Enhanced Styling */}
        {movieDetails && !isLoading && !error && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster with shadow and animation */}
            <div className="flex-shrink-0 w-full md:w-2/5 transform transition-transform duration-500 hover:scale-105">
              <div className="relative rounded-lg overflow-hidden shadow-2xl aspect-[2/3]">
                <Image
                  src={movieDetails.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}` : '/images/default-poster.png'}
                  alt={`${movieDetails.title} poster`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                  priority
                />
              </div>
            </div>
            
            {/* Movie Info with enhanced typography */}
            <div className="flex-grow flex flex-col">
              <h2 className="text-4xl font-bold text-white mb-2">
                {movieDetails.title}
              </h2>
              
              <div className="flex items-center space-x-2 text-sm text-white/70 mb-4">
                <span>{movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 'Unknown'}</span>
                <span>•</span>
                <span>TMDB: {movieDetails.vote_average.toFixed(1)}/10</span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-white/90">Overview</h3>
              <p className="text-white/80 mb-6 text-sm leading-relaxed">
                {movieDetails.overview || 'Overview not available.'}
              </p>
              
              <div className="mt-auto">
                <h3 className="text-xl font-semibold mb-3 text-white/90">Rate This Movie</h3>
                <div className="flex items-center space-x-3">
                  <RatingStars 
                    onRatingChange={handleRatingChange}
                    initialRating={initialRating}
                  />
                  {currentRating > 0 && (
                    <span className="text-yellow-400 font-semibold">{currentRating} Star{currentRating > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal; 