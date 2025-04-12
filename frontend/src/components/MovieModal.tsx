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
    // Modal arka planı (overlay)
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose} // Arka plana tıklayınca kapat
    >
      {/* Modal içeriği (tıklayınca kapanmayı engelle) */}
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl relative text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // İçeriğe tıklama arka plana yayılmasın
      >
        {/* Kapatma Butonu */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Close" // English
        >
          <FaTimes size={20} />
        </button>

        {/* Yükleniyor Durumu */}
        {isLoading && <p className="text-center text-lg p-8">Loading...</p>} {/* English */}

        {/* Hata Durumu */}
        {error && <p className="text-center text-red-500 text-lg p-8">{error}</p>}

        {/* Film Detayları */}
        {movieDetails && !isLoading && !error && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Afiş */}
            <div className="flex-shrink-0 w-full md:w-1/3">
              <Image
                src={movieDetails.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}` : '/images/default-poster.png'} // Varsayılan afiş eklenebilir
                alt={`${movieDetails.title} poster`}
                width={500}
                height={750}
                className="rounded-md w-full h-auto object-cover"
                priority // Modal açıldığında önemli
              />
            </div>
            {/* Bilgiler */}
            <div className="flex-grow">
              <h2 className="text-3xl font-bold text-yellow-500 mb-3">{movieDetails.title}</h2>
              <p className="text-sm text-gray-400 mb-4">
                Release Date: {movieDetails.release_date ? new Date(movieDetails.release_date).toLocaleDateString('en-US') : 'Unknown'} | {/* English Date & Text */}
                TMDB Rating: {movieDetails.vote_average.toFixed(1)}/10
              </p>
              <h3 className="text-xl font-semibold mb-2 border-b border-gray-600 pb-1">Overview</h3> {/* English */}
              <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                {movieDetails.overview || 'Overview not available.'} {/* English */}
              </p>
              
              <h3 className="text-xl font-semibold mb-2 border-b border-gray-600 pb-1">Rate Movie</h3> {/* English */}
              <div className="flex items-center space-x-3">
                <RatingStars 
                  onRatingChange={handleRatingChange} // Call handleRatingChange on rating change
                  initialRating={initialRating} // Pass the initialRating prop down
                />
                {/* Display the rating from the RatingStars component's internal state 
                    OR use the currentRating state from MovieModal if needed elsewhere here */} 
                {/* We rely on RatingStars to display its current state visually */}
                {/* {currentRating > 0 && ( 
                  <span className="text-yellow-500 font-semibold">{currentRating} Star{currentRating > 1 ? 's' : ''}</span> 
                )} */} 
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal; 