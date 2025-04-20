"use client";

import React from 'react';
import Image from 'next/image';
// Movie type is no longer needed
// import { Movie } from '@/lib/api';
import { FaTimes, FaHeart, FaTrash } from 'react-icons/fa'; // İkonlar
import { motion } from 'framer-motion'; // motion eklendi

// Add base URL back
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

// Updated type definition matching MovieList.tsx - include posterUrl
interface FavoriteInfo {
  title: string;
  posterUrl: string | null; // Add posterUrl
}
interface Favorites {
  [tmdbId: number]: FavoriteInfo; 
}

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Favorites; 
  onRemoveFavorite: (tmdbId: number) => void; 
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ 
  isOpen, 
  onClose, 
  favorites, 
  onRemoveFavorite
}) => {
  if (!isOpen) return null;

  // Convert favorites object into an array for rendering
  const favoriteItems = Object.entries(favorites).map(([tmdbIdStr, info]) => ({
    tmdbId: parseInt(tmdbIdStr, 10),
    title: info.title,
    posterUrl: info.posterUrl // Get posterUrl from info
  }));

  return (
    // Panel - Apply pink theme and glassmorphism - POSITION LEFT
    <div 
      className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-bl from-pink-900/10 via-black/20 to-pink-900/10 backdrop-blur-lg border-r border-pink-600/20 shadow-lg z-40 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      style={{ backdropFilter: 'blur(16px)' }} 
    >
      {/* Panel Header - Adjust theme color */}
      <div className="flex justify-between items-center p-4 border-b border-pink-600/20 flex-shrink-0">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-500">Favorite Movies</h2>
        <motion.button // motion.button kullan
          onClick={onClose}
          className="text-pink-100/60 hover:text-pink-300 bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
          aria-label="Close Panel"
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.7)'}}
          whileTap={{ scale: 0.90 }}
        >
          <FaTimes size={16} />
        </motion.button>
      </div>

      {/* Favorites List - Scrollable body */}
      <div className="p-4 overflow-y-auto flex-grow">
        {favoriteItems.length > 0 ? (
          <ul className="space-y-2">
            {favoriteItems.map((item) => (
              // List item - subtle background, pink heart
              <li key={item.tmdbId} className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-pink-600/10 hover:border-pink-600/30 transition-all duration-300 relative group p-1.5 sm:p-2">
                
                {/* ** Display Poster Image ** */}
                <div className="flex-shrink-0 w-10 h-15 sm:w-12 sm:h-18 relative rounded overflow-hidden bg-black/50">
                   {item.posterUrl ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}${item.posterUrl}`}
                      alt={`${item.title} poster`}
                      fill
                      sizes="100px"
                      style={{ objectFit: 'cover' }}
                      className="rounded"
                    />
                  ) : (
                    // Placeholder if no poster
                    <div className="w-full h-full flex items-center justify-center">
                       <FaHeart className="text-pink-600/50" size={20}/>
                    </div>
                  )}
                </div>
                
                {/* Movie Info - Use item.title */} 
                <div className="flex-grow min-w-0 pr-7">
                  <h3 className="text-xs sm:text-sm font-medium text-pink-50 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  {/* Genre info is unavailable now */}
                  {/* <p className="text-xs text-pink-100/60 truncate">...</p> */}
                </div>
                {/* Remove Button - Use item.tmdbId */} 
                <motion.button // motion.button kullan
                  onClick={() => onRemoveFavorite(item.tmdbId)}
                  className="absolute top-1 right-1 text-pink-100/70 hover:text-red-500 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-all duration-200 sm:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Remove ${item.title} from favorites`}
                  title="Remove from Favorites"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.90 }}
                >
                  <FaTrash size={10} />
                </motion.button>
              </li>
            ))}
          </ul>
        ) : (
          // Adjust message color
          <p className="text-center text-pink-100/50 mt-10">You haven&apos;t added any movies to favorites yet.</p>
        )}
      </div>

      {/* Optional Footer (if needed) */}
      {/* <div className="p-4 mt-auto border-t border-pink-600/20 flex-shrink-0">...</div> */} 
    </div>
  );
};

export default FavoritesPanel; 