"use client";

import React from 'react';
import { Movie } from '@/lib/api';
import MovieCard from './MovieCard'; // Reuse MovieCard for display
import { FaTimes } from 'react-icons/fa';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Movie[] | null;
  isLoading: boolean; // Add loading state prop
  error: string | null;   // Add error state prop
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ 
  isOpen, 
  onClose, 
  recommendations, 
  isLoading, 
  error 
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Modal Backdrop (similar to MovieModal)
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose} // Close on backdrop click
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Modal Content */}
      <div 
        className="bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] border border-white/20 flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent close on content click
        style={{ backdropFilter: 'blur(16px)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/20">
          <h2 className="text-xl md:text-2xl font-semibold text-yellow-400">Your Recommendations</h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
            aria-label="Close recommendations"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              <p className="ml-4 text-white/80">Getting recommendations...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button 
                onClick={onClose} 
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}
          
          {/* Recommendations Grid */}
          {!isLoading && !error && recommendations && recommendations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.map((movie) => (
                <MovieCard 
                  key={movie.tmdbId || movie.movieId} // Use tmdbId if available, fallback to movieId
                  tmdbId={movie.tmdbId} 
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  genres={movie.genres}
                  // Pass dummy handlers or disable interactions if needed for recommendations
                  onCardClick={() => {}} // Disable click for now
                />
              ))}
            </div>
          )}

          {/* No Recommendations State */}
          {!isLoading && !error && (!recommendations || recommendations.length === 0) && (
            <div className="flex justify-center items-center h-64">
              <p className="text-white/60 text-lg">No recommendations found based on your ratings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal; 