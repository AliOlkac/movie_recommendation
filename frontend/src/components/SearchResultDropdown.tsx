"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Movie } from '@/lib/api'; // Movie tipini import et
import { FaStar } from 'react-icons/fa'; // Yıldız ikonu (placeholder için)

// Scrollbar gizleme stilleri (MovieList.tsx'den kopyalandı)
// Eğer global stiller kullanılıyorsa bu gerekmeyebilir,
// ancak şimdilik bileşen özelinde tutmak daha güvenli olabilir.
const scrollbarStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE ve Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

interface SearchResultDropdownProps {
  searchTerm: string;
  searchResults: Movie[] | null;
  isLoading: boolean;
  error: string | null;
  onMovieClick: (tmdbId: number) => void;
  onViewAllClick: () => void;
}

const SearchResultDropdown: React.FC<SearchResultDropdownProps> = ({
  searchTerm,
  searchResults,
  isLoading,
  error,
  onMovieClick,
  onViewAllClick,
}) => {
  // Arama terimi yoksa veya yükleme/hata yokken sonuç yoksa gösterme
  if (!searchTerm || (!isLoading && !error && !searchResults)) {
    return null;
  }

  const hasMoreThanLimit = searchResults && searchResults.length > 10;

  return (
    <>
      {/* Scrollbar gizleme için stil */}
      <style jsx global>{scrollbarStyles}</style>

      <motion.div
        className="absolute mt-2 w-full left-0 right-0 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-md rounded-lg shadow-lg z-40 border border-gray-700/30 overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }} // Çıkış animasyonu eklendi
        transition={{ duration: 0.2 }}
      >
        {isLoading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        )}
        {error && !isLoading && (
          <p className="text-center py-4 text-red-400 text-sm">{error}</p>
        )}
        {!isLoading && searchResults && searchResults.length === 0 && (
          <p className="text-center py-4 text-gray-400 text-sm">
            No movies found matching &quot;{searchTerm}&quot;.
          </p>
        )}
        {!isLoading && searchResults && searchResults.length > 0 && (
          <div className="p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-400">
                Found {searchResults.length} results
              </p>
              {hasMoreThanLimit && (
                <motion.button
                  className="text-xs text-yellow-500 hover:text-yellow-400 bg-black/30 px-2 py-1 rounded-full transition-colors duration-200"
                  onClick={onViewAllClick}
                  whileTap={{ scale: 0.95 }}
                >
                  View all
                </motion.button>
              )}
            </div>

            {/* Yatay kaydırmalı sonuç listesi - scrollbar gizli */}
            <div className="relative">
              {/* Masaüstü için sol-sağ kaydırma butonları (4'ten fazla sonuç varsa) */}
              {searchResults.length > 4 && (
                <>
                  <button
                    className="hidden sm:flex absolute left-[-8px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const scrollContainer = e.currentTarget.parentElement?.querySelector<HTMLElement>('.scroll-container');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                      }
                    }}
                  >
                    &#10094;
                  </button>
                  <button
                    className="hidden sm:flex absolute right-[-8px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const scrollContainer = e.currentTarget.parentElement?.querySelector<HTMLElement>('.scroll-container');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
                      }
                    }}
                  >
                    &#10095;
                  </button>
                </>
              )}

              <div
                className="overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide scroll-container"
                ref={(el) => {
                  // Wheel kaydırma desteği
                  if (el) {
                    el.onwheel = (e) => {
                      if (e.deltaY === 0) return; // Dikey kaydırma değilse atla
                      e.preventDefault();
                      el.scrollLeft += e.deltaY;
                    };
                  }
                }}
              >
                <div className="flex space-x-2 min-w-max">
                  {searchResults.slice(0, 10).map((movie) => (
                    <motion.div
                      key={`search-dropdown-${movie.tmdbId}`}
                      className="flex-shrink-0 w-24 sm:w-28 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (movie.tmdbId) {
                           onMovieClick(movie.tmdbId);
                        }
                      }}
                    >
                      <div className="relative aspect-[2/3] rounded-md overflow-hidden border border-gray-700/30 bg-black/40 mb-1">
                        {movie.posterUrl ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${movie.posterUrl}`}
                            alt={movie.title}
                            fill
                            sizes="100px"
                            style={{ objectFit: 'cover' }}
                            className="rounded-md hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
                            <FaStar size={24} /> {/* Placeholder */}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/90 truncate mt-1" title={movie.title}>
                        {movie.title}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default SearchResultDropdown; 