"use client";

import React from 'react';
import Image from 'next/image';
// Movie type is no longer needed here
// import { Movie } from '@/lib/api';
import { FaTimes, FaStar, FaTrash } from 'react-icons/fa'; // İkonlar

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; // Daha küçük resimler için w200

// Updated type definitions matching MovieList.tsx
interface RatingInfo {
  rating: number;
  title: string;
  posterUrl: string | null; // Add posterUrl
}
interface UserRatings {
  [tmdbId: number]: RatingInfo;
}

interface RatedMoviesPanelProps {
  isOpen: boolean; // Panel açık mı?
  onClose: () => void; // Paneli kapatma fonksiyonu
  ratings: UserRatings; // Use the updated type
  // movies: Movie[]; // REMOVE this prop
  onRemoveRating: (tmdbId: number) => void; // Yeni prop eklendi
  onGetRecommendations: () => void; // Add prop for recommendation request
}

const RatedMoviesPanel: React.FC<RatedMoviesPanelProps> = ({ 
  isOpen, 
  onClose, 
  ratings, 
  // movies, // Remove from destructuring
  onRemoveRating, 
  onGetRecommendations // Receive the new prop
}) => {
  if (!isOpen) {
    return null; // Panel kapalıysa render etme
  }

  // Convert ratings object into an array for rendering
  // Also parse the tmdbId back to a number
  const ratedItems = Object.entries(ratings).map(([tmdbIdStr, info]) => ({
    tmdbId: parseInt(tmdbIdStr, 10),
    title: info.title,
    rating: info.rating,
    posterUrl: info.posterUrl // Get posterUrl from info
  }));

  // Sort by rating (descending)
  ratedItems.sort((a, b) => b.rating - a.rating); 

  return (
    // Panel - Apply gold theme and glassmorphism
    <div 
      className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-yellow-900/10 via-black/20 to-yellow-900/10 backdrop-blur-lg border-l border-yellow-600/20 shadow-lg z-40 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      style={{ backdropFilter: 'blur(16px)' }} 
    >
      {/* Panel Header - Gold theme */}
      <div className="flex justify-between items-center p-4 border-b border-yellow-600/20 flex-shrink-0">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Rated Movies</h2>
        <button 
          onClick={onClose}
          className="text-yellow-100/60 hover:text-yellow-300 bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
          aria-label="Close Panel"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Rated Movies List - Scrollable body */}
      <div className="p-4 overflow-y-auto flex-grow">
        {ratedItems.length > 0 ? (
          <ul className="space-y-3">
            {ratedItems.map((item) => (
              <li key={item.tmdbId} className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-yellow-600/10 hover:border-yellow-600/30 transition-all duration-300 relative group p-2">
                {/* ** Display Poster Image ** */}
                <div className="flex-shrink-0 w-12 h-18 relative rounded overflow-hidden bg-black/50">
                  {item.posterUrl ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}${item.posterUrl}`}
                      alt={`${item.title} poster`}
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    // Placeholder if no poster
                    <div className="w-full h-full flex items-center justify-center">
                       <FaStar className="text-yellow-600/50" size={24}/>
                    </div>
                  )}
                </div>
                {/* Movie Info & Rating - Use item.title and item.rating */}
                <div className="flex-grow min-w-0 pr-8"> 
                  <h3 className="text-sm font-medium text-yellow-50 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  {/* Genre info is unavailable now */}
                  {/* <p className="text-xs text-yellow-100/60 truncate">...</p> */}
                  <div className="flex items-center mt-1 text-yellow-400">
                    <FaStar size={14} className="mr-1"/> 
                    <span className="text-sm font-bold">{item.rating}</span>
                    <span className="text-xs text-yellow-100/50 ml-1">/ 5</span>
                  </div>
                </div>
                {/* Remove Button - Use item.tmdbId */}
                <button
                  onClick={() => onRemoveRating(item.tmdbId)}
                  className="absolute top-1 right-1 text-yellow-100/40 hover:text-red-500 bg-black/20 hover:bg-black/40 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  aria-label={`Remove rating for ${item.title}`}
                  title="Remove Rating"
                >
                  <FaTrash size={10} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-yellow-100/50 mt-10">You haven&apos;t rated any movies yet.</p>
        )}
      </div>

      {/* Recommendations Button - Sticky at the bottom */}
      <div className="p-4 mt-auto border-t border-yellow-600/20 flex-shrink-0">
         {ratedItems.length >= 5 && (
             <button 
               onClick={onGetRecommendations} 
               className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300"
             >
               Get Recommendations
             </button>
         )}
         {ratedItems.length < 5 && (
             <p className="text-center text-xs text-yellow-100/60">
                 Rate at least {5 - ratedItems.length} more movie{5 - ratedItems.length > 1 ? 's' : ''} to get recommendations.
             </p>
         )}
      </div>
    </div>
  );
};

export default RatedMoviesPanel; 