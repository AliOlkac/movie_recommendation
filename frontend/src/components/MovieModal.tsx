"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchTmdbMovieDetails, TmdbMovieDetails } from '@/lib/api';
import RatingStars from './RatingStars'; // Ensure this path is correct
import { FaTimes, FaHeart, FaRegHeart } from 'react-icons/fa'; // Add FaHeart and FaRegHeart

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // Larger image for modal

interface MovieModalProps {
  tmdbId: number | null;
  onClose: () => void;
  onRate: (tmdbId: number, rating: number) => void; // Ensure this is used correctly
  initialRating?: number; // Make initialRating optional, default to 0 if not provided
  isFavorite: boolean; // Add isFavorite prop
  onToggleFavorite: (tmdbId: number) => void; // Add favorite toggle handler
}

const MovieModal: React.FC<MovieModalProps> = ({ 
  tmdbId, 
  onClose, 
  onRate, 
  initialRating = 0, // Default to 0 if not provided
  isFavorite, 
  onToggleFavorite 
}) => {
  const [movieDetails, setMovieDetails] = useState<TmdbMovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize currentRating with initialRating from props
  // Rename handleRatingChange from MovieList as it conflicts here
  const handleRatingSubmit = (newRating: number) => {
    if (tmdbId) {
      onRate(tmdbId, newRating); // Call the onRate passed from MovieList
    }
  };

  // Handle clicking the favorite button
  const handleFavoriteClick = () => {
    if (tmdbId) {
      onToggleFavorite(tmdbId);
    }
  };

  useEffect(() => {
    if (tmdbId !== null) {
      const loadDetails = async () => {
        setLoading(true);
        setError(null);
        setMovieDetails(null); // Clear previous details
        try {
          const details = await fetchTmdbMovieDetails(tmdbId);
          setMovieDetails(details);
        } catch (err) {
          console.error("Error fetching movie details:", err);
          setError('Failed to load movie details.');
        } finally {
          setLoading(false);
        }
      };
      loadDetails();
    } else {
      // Reset state if tmdbId becomes null (modal closed)
      setMovieDetails(null);
      setLoading(false);
      setError(null);
    }
  }, [tmdbId]);

  // Prevent rendering if tmdbId is null (modal is not open)
  if (tmdbId === null) {
    return null;
  }

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      onClick={onClose} // Close modal on backdrop click
      style={{ backdropFilter: 'blur(6px)' }} // Consistent blur
    >
      {/* Modal Content - Prevent closing when clicking inside */}
      <div 
        className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl max-w-3xl w-full overflow-hidden relative border border-white/20" 
        onClick={(e) => e.stopPropagation()} // Prevents modal close on content click
        style={{ backdropFilter: 'blur(16px)' }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors z-10"
          aria-label="Close modal"
        >
          <FaTimes size={18} />
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col justify-center items-center h-96 text-center p-6">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={onClose}
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Content: Movie Details */}
        {!loading && !error && movieDetails && (
          <div className="flex flex-col md:flex-row">
            {/* Left Side: Poster */}
            <div className="md:w-1/3 flex-shrink-0 bg-black/20">
              <Image 
                src={movieDetails.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}` : '/images/default-poster.png'}
                alt={`${movieDetails.title} Poster`}
                width={500}
                height={750}
                className="w-full h-auto object-cover md:rounded-l-lg"
                priority // Prioritize loading the poster image
              />
            </div>

            {/* Right Side: Details, Rating, Favorite */}
            <div className="md:w-2/3 p-6 md:p-8 text-white flex flex-col justify-between">
              <div>
                {/* Title and Year */}
                <h2 className="text-3xl font-bold mb-2">{movieDetails.title} ({movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 'N/A'})</h2>
                {/* Genres */}
                <p className="text-sm text-white/70 mb-4">
                  {movieDetails.genres?.map((g: { id: number; name: string }) => g.name).join(', ') || 'No genres listed'}
                </p>
                {/* Overview */}
                <p className="text-base text-white/90 mb-6">
                  {movieDetails.overview || 'No overview available.'}
                </p>
              </div>
              
              {/* Rating and Favorite Section */}
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/20">
                {/* Rating Stars */}
                <div className="flex flex-col items-start">
                  <span className="text-sm text-white/70 mb-1">Your Rating:</span>
                  <RatingStars 
                    initialRating={initialRating} 
                    onRatingChange={handleRatingSubmit} // Use the renamed handler
                  />
                </div>
                {/* Favorite Button */}
                <button
                  onClick={handleFavoriteClick}
                  className={`p-3 rounded-full transition-colors duration-200 ${isFavorite ? 'bg-pink-600/30 text-pink-400 hover:bg-pink-600/50' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-pink-400'}`}
                  aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  {isFavorite ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal; 