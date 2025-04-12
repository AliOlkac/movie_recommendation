"use client";

import React from 'react';
import Image from 'next/image';
import { Movie } from '@/lib/api';
import { FaTimes, FaHeart } from 'react-icons/fa'; // Favori için kalp ikonu

// TMDB image base URL
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

interface Favorites {
  [tmdbId: number]: boolean; // Favori durumu: true/false
}

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Favorites;
  movies: Movie[];
  onToggleFavorite: (tmdbId: number) => void; // Favori durumunu değiştirme fonksiyonu
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ 
  isOpen, 
  onClose, 
  favorites, 
  movies, 
  onToggleFavorite 
}) => {
  if (!isOpen) {
    return null;
  }

  // Favori filmleri filtrele
  const favoriteMovies = movies.filter(movie => movie.tmdbId && favorites[movie.tmdbId]);

  return (
    // Solda açılan Glassmorphism panel
    <div 
      className={`fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 shadow-lg z-40 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} p-4 overflow-y-auto`}
      style={{ backdropFilter: 'blur(12px)' }} 
    >
      {/* Panel Başlığı */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/20">
        <h2 className="text-xl font-semibold text-white">Favorite Movies</h2>
        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          aria-label="Close Panel"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Favori Film Listesi */}
      {favoriteMovies.length > 0 ? (
        <ul className="space-y-4">
          {favoriteMovies.map((movie) => (
            <li key={movie.tmdbId} className="flex items-start space-x-3 bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 relative group">
              {/* Poster Thumbnail */}
              <div className="flex-shrink-0 w-16 h-24 relative">
                <Image
                  src={movie.posterUrl ? `${TMDB_IMAGE_BASE_URL}${movie.posterUrl}` : '/images/default-poster.png'}
                  alt={`${movie.title} poster`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              {/* Film Bilgisi */}
              <div className="flex-grow min-w-0 p-2 pr-8"> 
                <h3 className="text-sm font-medium text-white truncate" title={movie.title}>
                  {movie.title}
                </h3>
                <p className="text-xs text-white/70 truncate" title={movie.genres.split('|').join(', ')}>
                  {movie.genres.split('|').join(', ')}
                </p>
              </div>
              {/* Favoriden Çıkar Butonu */}
              <button
                onClick={() => movie.tmdbId && onToggleFavorite(movie.tmdbId)}
                className="absolute top-2 right-2 text-pink-500 hover:text-pink-300 bg-black/20 hover:bg-black/40 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label={`Remove ${movie.title} from favorites`}
                title="Remove from Favorites"
              >
                <FaHeart size={12} /> 
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-white/50 mt-10">You haven&apos;t added any movies to favorites yet.</p>
      )}
    </div>
  );
};

export default FavoritesPanel; 