"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Movie, 
  fetchRecommendations, 
  fetchMoviesByDiscover, 
  searchTmdbMovies, 
  convertTmdbMovieToMovie 
} from '@/lib/api';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import MovieModal from './MovieModal';
import RatedMoviesPanel from './RatedMoviesPanel';
import FavoritesPanel from './FavoritesPanel';
import InfiniteScroll from 'react-infinite-scroll-component';
import { debounce } from 'lodash';
import { FaStar, FaHeart, FaTimesCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// --- localStorage Anahtarları ve Tipleri ---
const RATINGS_STORAGE_KEY = 'movieRatings';
const FAVORITES_STORAGE_KEY = 'movieFavorites';

// Updated type definitions to include posterUrl
interface RatingInfo {
  rating: number;
  title: string;
  posterUrl: string | null;
}
interface FavoriteInfo {
  title: string;
  posterUrl: string | null;
}
interface UserRatings {
  [tmdbId: number]: RatingInfo;
}
interface Favorites {
  [tmdbId: number]: FavoriteInfo;
}

// --- localStorage Fonksiyonları (Güncellenmiş Tiplerle) ---

const loadRatingsFromStorage = (): UserRatings => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(RATINGS_STORAGE_KEY);
    // Add basic validation in case stored data is malformed
    const parsed = stored ? JSON.parse(stored) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error("Error reading ratings from localStorage:", error);
    return {};
  }
};

const saveRatingsToStorage = (ratings: UserRatings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.error("Error saving ratings to localStorage:", error);
  }
};

const loadFavoritesFromStorage = (): Favorites => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error("Error reading favorites from localStorage:", error);
    return {};
  }
};

const saveFavoritesToStorage = (favorites: Favorites) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorites to localStorage:", error);
  }
};

// Animasyon varyantları
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } }
};

// LoadingSpinner bileşeni için animasyonlu bekleme bileşeni
const LoadingSpinner = () => (
  <motion.div 
    className="text-center mt-10 py-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500 border-r-2 border-b-2 border-transparent"></div>
    <motion.p 
      className="mt-4 text-yellow-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      Popüler filmler yükleniyor...
    </motion.p>
  </motion.div>
);

// Hata mesajı için animasyonlu bileşen
const ErrorMessage = ({ errorMessage }: { errorMessage: string }) => (
  <motion.div 
    className="text-center p-8 text-red-500"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h3 className="text-xl font-bold mb-2">Hata Oluştu</h3>
    <p>{errorMessage}</p>
    <motion.button 
      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.location.reload()}
    >
      Yeniden Dene
    </motion.button>
  </motion.div>
);

// İlk satırlara CSS stil tanımlaması ekleyelim
export const searchResultStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE ve Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

export default function MovieList() {
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userRatings, setUserRatings] = useState<UserRatings>(() => loadRatingsFromStorage());
  const [isRatingsPanelOpen, setIsRatingsPanelOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Favorites>(() => loadFavoritesFromStorage());
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[] | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'detail' | 'recommendation'>('detail');
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

  const loadMoviesByVoteCount = useCallback(async (page: number) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    const data = await fetchMoviesByDiscover(page);

    if (data) {
      const newMovies = data.results.map(convertTmdbMovieToMovie);
      setDisplayedMovies(prevMovies => page === 1 ? newMovies : [...prevMovies, ...newMovies]);
      setCurrentPage(page);
      setHasMore(page < data.total_pages);
    } else {
      setError('Could not load movies sorted by vote count.');
      setHasMore(false);
    }
    
    if (page === 1) setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  const loadSearchResults = useCallback(async (term: string) => {
    if (!term) return;
    setIsSearchLoading(true);
    setSearchError(null);

    const data = await searchTmdbMovies(term, 1);
    
    if (data) {
        if(data.results.length > 0){
            setSearchResults(data.results.map(convertTmdbMovieToMovie));
        } else {
            setSearchResults([]);
        }
    } else {
      setSearchResults(null);
      setSearchError('Could not perform search. Please try again.');
    }
    setIsSearchLoading(false);
  }, []);

  const debouncedLoadSearchResults = useCallback(debounce(loadSearchResults, 400), [loadSearchResults]);

  useEffect(() => {
      loadMoviesByVoteCount(1); 
  }, [loadMoviesByVoteCount]);

  const handleSearchChange = (term: string) => {
    const trimmedTerm = term.trim();
    setSearchTerm(term);

    if (trimmedTerm) {
      setSearchResults(null);
      setSearchError(null);
      setIsSearchLoading(true);
      debouncedLoadSearchResults(trimmedTerm);
    } else {
      setIsSearching(false);
      setSearchResults(null);
      setSearchError(null);
      setIsSearchLoading(false);
    }
  };

  const clearSearch = () => {
      handleSearchChange('');
  };

  const toggleFullSearchView = (show: boolean) => {
    setIsSearching(show);
    if (show) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadMoreMovies = () => {
    if (!isSearching && !isLoadingMore && hasMore) {
      loadMoviesByVoteCount(currentPage + 1);
    }
  };

  const handleCardClick = (tmdbId: number) => { 
      setModalMode('detail');
      setRecommendedMovies(null);
      setIsLoadingRecommendations(false);
      setRecommendationError(null);
      setCurrentRecommendationIndex(0);
      setSelectedTmdbId(tmdbId);
  };

  const handleCloseModal = () => {
      setSelectedTmdbId(null);
      setModalMode('detail'); 
      setRecommendedMovies(null);
      setIsLoadingRecommendations(false);
      setRecommendationError(null);
      setCurrentRecommendationIndex(0);
  };

  const findMovieTitle = (tmdbId: number): string => {
      const movieInDisplayed = displayedMovies.find(m => m.tmdbId === tmdbId);
      if (movieInDisplayed) return movieInDisplayed.title;
      const movieInSearch = searchResults?.find(m => m.tmdbId === tmdbId);
      if (movieInSearch) return movieInSearch.title;
      const movieInRecommended = recommendedMovies?.find(m => m.tmdbId === tmdbId);
      if (movieInRecommended) return movieInRecommended.title;
      return userRatings[tmdbId]?.title || userFavorites[tmdbId]?.title || 'Unknown Title'; 
  };

  const findMoviePosterUrl = (tmdbId: number): string | null => {
      const movieInDisplayed = displayedMovies.find(m => m.tmdbId === tmdbId);
      if (movieInDisplayed) return movieInDisplayed.posterUrl;
      const movieInSearch = searchResults?.find(m => m.tmdbId === tmdbId);
      if (movieInSearch) return movieInSearch.posterUrl;
      const movieInRecommended = recommendedMovies?.find(m => m.tmdbId === tmdbId);
      if (movieInRecommended) return movieInRecommended.posterUrl;
      return userRatings[tmdbId]?.posterUrl || userFavorites[tmdbId]?.posterUrl || null;
  };

  const handleRateMovie = (tmdbId: number, rating: number) => { 
    const movieTitle = findMovieTitle(tmdbId);
    const moviePosterUrl = findMoviePosterUrl(tmdbId);
    setUserRatings(prevRatings => {
        const newRatings = {
            ...prevRatings,
            [tmdbId]: { 
                rating: rating, 
                title: movieTitle,
                posterUrl: moviePosterUrl
            },
        };
        saveRatingsToStorage(newRatings); 
        console.log("Current Ratings (saved):", newRatings);
        return newRatings;
    });
  };

  const removeRating = (tmdbId: number) => {
    setUserRatings(prevRatings => {
      const newRatings = { ...prevRatings };
      delete newRatings[tmdbId];
      saveRatingsToStorage(newRatings); 
      return newRatings;
    });
  };

  const toggleFavorite = (tmdbId: number) => {
    const movieTitle = findMovieTitle(tmdbId);
    const moviePosterUrl = findMoviePosterUrl(tmdbId);
    setUserFavorites(prevFavorites => {
      const newFavorites = { ...prevFavorites };
      if (newFavorites[tmdbId]) {
        delete newFavorites[tmdbId];
      } else {
        newFavorites[tmdbId] = { 
            title: movieTitle, 
            posterUrl: moviePosterUrl
        }; 
      }
      saveFavoritesToStorage(newFavorites); 
      console.log("Current Favorites (saved):", newFavorites);
      return newFavorites;
    });
  };

  const openRatingsPanel = () => setIsRatingsPanelOpen(true);
  const closeRatingsPanel = () => setIsRatingsPanelOpen(false);
  const openFavoritesPanel = () => setIsFavoritesPanelOpen(true);
  const closeFavoritesPanel = () => setIsFavoritesPanelOpen(false);

  const ratedMoviesCount = Object.keys(userRatings).length;
  const favoriteMoviesCount = Object.keys(userFavorites).length;

  const handleGetRecommendations = async () => {
    closeRatingsPanel();
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setRecommendedMovies(null);
    setModalMode('detail');
    setSelectedTmdbId(null);
    setCurrentRecommendationIndex(0);

    console.log("Requesting recommendations with ratings:", userRatings);
    const ratingsForApi: { [key: number]: number } = {};
    for (const tmdbId in userRatings) {
      ratingsForApi[parseInt(tmdbId, 10)] = userRatings[tmdbId].rating;
    }
    console.log("Ratings being sent to API:", ratingsForApi);

    const recommendations = await fetchRecommendations(ratingsForApi);

    if (recommendations && recommendations.length > 0) {
      setRecommendedMovies(recommendations);
      setModalMode('recommendation');
      setSelectedTmdbId(recommendations[0].tmdbId);
      setCurrentRecommendationIndex(0);
      console.log("Recommendations received:", recommendations);
    } else if (recommendations) {
        setRecommendationError("No recommendations found based on your ratings.");
        setModalMode('recommendation');
        setSelectedTmdbId(null);
    } else {
      setRecommendationError("Could not fetch recommendations. Please try again later.");
      setModalMode('recommendation');
      setSelectedTmdbId(null);
      console.error("Failed to fetch recommendations from API.");
    }
    setIsLoadingRecommendations(false);
  };

  const handleNavigateRecommendation = (direction: 'next' | 'prev') => {
      if (!recommendedMovies) return;
      
      let newIndex = currentRecommendationIndex;
      if (direction === 'next') {
          newIndex = (currentRecommendationIndex + 1) % recommendedMovies.length;
      } else {
          newIndex = (currentRecommendationIndex - 1 + recommendedMovies.length) % recommendedMovies.length;
      }
      setCurrentRecommendationIndex(newIndex);
      setSelectedTmdbId(recommendedMovies[newIndex].tmdbId);
  };

  return (
    <div className="relative min-h-screen pt-20">
      {/* Scrollbar gizleme için gerekli stil */}
      <style jsx global>{searchResultStyles}</style>
      
      {/* Ana Yükleme Göstergesi (Overlay) */}
      {isLoadingRecommendations && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
            <p className="text-yellow-100/80 text-lg font-semibold">Getting recommendations...</p>
            <p className="text-yellow-100/60 text-sm mt-1">Please wait a moment.</p>
          </div>
        </motion.div>
      )}

      {/* Başlık Bölümü */}
      <div className="fixed top-0 left-0 right-0 z-30 h-20 sm:h-20 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-lg border-b border-yellow-600/20 flex flex-wrap items-center justify-between px-2 sm:px-4 md:px-8 py-2">
          
          <div className="flex-shrink-0 order-1 sm:order-1">
              <motion.button
                onClick={openFavoritesPanel}
                className="relative text-pink-400 hover:text-pink-300 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open favorite movies panel"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                 <FaHeart size={16} className="sm:hidden" />
                 <FaHeart size={18} className="hidden sm:block" />
                 {favoriteMoviesCount > 0 && (
                   <motion.span 
                     className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]"
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", stiffness: 500, damping: 20 }}
                   >
                     {favoriteMoviesCount}
                   </motion.span>
                 )}
              </motion.button>
          </div>

          <div className="flex-grow order-3 sm:order-2 w-full sm:w-auto sm:max-w-xl mx-2 mt-2 sm:mt-0 sm:mx-4 relative">
               <SearchBar 
                  initialSearchTerm={searchTerm}
                  onSearchChange={handleSearchChange} 
              />
              {searchTerm && (
                  <motion.button 
                      onClick={clearSearch} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                      title="Clear search"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimesCircle size={18} />
                  </motion.button>
              )}

              {/* Arama Sonuçları Dropdown Paneli - Modern ve kompakt tasarım */}
              {searchTerm && (
                <motion.div 
                  className="absolute mt-2 w-full left-0 right-0 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-md rounded-lg shadow-lg z-40 border border-gray-700/30 overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isSearchLoading && (
                    <div className="flex justify-center items-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                  )}
                  {searchError && !isSearchLoading && (
                    <p className="text-center py-4 text-red-400 text-sm">{searchError}</p>
                  )}
                  {!isSearchLoading && searchResults && searchResults.length === 0 && (
                    <p className="text-center py-4 text-gray-400 text-sm">No movies found matching &quot;{searchTerm}&quot;.</p>
                  )}
                  {!isSearchLoading && searchResults && searchResults.length > 0 && (
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-gray-400">Found {searchResults.length} results</p>
                        {searchResults.length > 10 && (
                          <button 
                            className="text-xs text-yellow-500 hover:text-yellow-400 bg-black/30 px-2 py-1 rounded-full transition-colors duration-200"
                            onClick={() => toggleFullSearchView(true)}
                          >
                            View all
                          </button>
                        )}
                      </div>
                      
                      {/* Yatay kaydırmalı sonuç listesi - scrollbar gizli */}
                      <div className="relative">
                        {/* Masaüstü için sol-sağ kaydırma butonları */}
                        {searchResults.length > 4 && (
                          <>
                            <button 
                              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                const scrollContainer = e.currentTarget.parentElement?.querySelector('.scroll-container');
                                if (scrollContainer) {
                                  scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                                }
                              }}
                            >
                              &#10094;
                            </button>
                            <button 
                              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                const scrollContainer = e.currentTarget.parentElement?.querySelector('.scroll-container');
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
                            // Wheel kaydırma desteği ekliyoruz
                            if (el) {
                              el.onwheel = (e) => {
                                e.preventDefault();
                                el.scrollLeft += e.deltaY;
                              };
                            }
                          }}
                        >
                          <div className="flex space-x-2 min-w-max">
                            {searchResults.slice(0, 10).map((movie) => (
                              <motion.div 
                                key={`search-${movie.tmdbId}`} 
                                className="flex-shrink-0 w-24 sm:w-28 cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  handleCardClick(movie.tmdbId!);
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
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-xs">
                                      No Poster
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-white/90 truncate mt-1" title={movie.title}>{movie.title}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
          </div>

          <div className="flex-shrink-0 order-2 sm:order-3">
              <motion.button
                onClick={openRatingsPanel}
                className="relative text-yellow-400 hover:text-yellow-300 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open rated movies panel"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                 <FaStar size={16} className="sm:hidden" />
                 <FaStar size={18} className="hidden sm:block" />
                 {ratedMoviesCount > 0 && (
                   <motion.span 
                     className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]"
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", stiffness: 500, damping: 20 }}
                   >
                     {ratedMoviesCount}
                   </motion.span>
                 )}
              </motion.button>
          </div>
      </div>

      {/* Main content container - Add padding for the fixed header */}
      <div className="pt-24 sm:pt-20">
          {isSearching && searchTerm && searchResults && searchResults.length > 0 && (
              <div className="px-2 sm:px-4 md:px-8 mb-8">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-base sm:text-lg text-white">
                      <span className="text-yellow-500">{searchResults.length}</span> results for &quot;{searchTerm}&quot;
                    </h2>
                    <button 
                      onClick={() => toggleFullSearchView(false)} 
                      className="px-3 py-1 text-xs bg-yellow-600/20 hover:bg-yellow-600/30 rounded-full text-yellow-500 border border-yellow-600/30 transition-colors"
                    >
                      Back to Discover
                    </button>
                  </div>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
                  >
                    <AnimatePresence>
                      {searchResults.map((movie) => (
                        <motion.div
                          key={`search-${movie.tmdbId}-${movie.movieId || 'tmdb'}`}
                          variants={itemVariants}
                          layout
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <MovieCard
                              tmdbId={movie.tmdbId} 
                              title={movie.title}
                              genres={movie.genres}
                              posterUrl={movie.posterUrl}
                              onClick={handleCardClick} 
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
              </div>
          )}

          {(!isSearching || !searchTerm) && !error && (
              <div className="px-2 sm:px-4 md:px-8">
                  {isLoading && displayedMovies.length === 0 && (
                      <LoadingSpinner />
                  )}
                  <InfiniteScroll
                      dataLength={displayedMovies.length} 
                      next={loadMoreMovies} 
                      hasMore={hasMore} 
                      loader={ 
                          <div className="text-center py-8">
                              {isLoadingMore && <motion.p 
                                className="text-yellow-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                Loading more movies...
                              </motion.p>}
                          </div>
                      }
                      endMessage={ 
                          !isSearching && displayedMovies.length > 0 ? (
                              <motion.p 
                                className="text-center py-8 text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                  <b>You have seen all movies!</b>
                              </motion.p>
                          ) : null
                      }
                      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-16"
                      style={{ overflow: 'visible' }}
                  >
                      <AnimatePresence>
                        {displayedMovies.map((movie) => (
                            <motion.div
                                key={`discover-${movie.tmdbId}-${movie.movieId || 'tmdb'}`}
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <MovieCard
                                    tmdbId={movie.tmdbId} 
                                    title={movie.title}
                                    genres={movie.genres} 
                                    posterUrl={movie.posterUrl}
                                    onClick={handleCardClick} 
                                />
                            </motion.div>
                        ))}
                      </AnimatePresence>
                  </InfiniteScroll>
              </div>
          )}
        
          {error && !isSearching && (
              <div className="px-2 sm:px-4 md:px-8">
                  <ErrorMessage errorMessage={error} />
              </div>
          )}
      </div>

      {(selectedTmdbId !== null || modalMode === 'recommendation') && (
          <MovieModal 
            tmdbId={selectedTmdbId}
            onClose={handleCloseModal}
            onRate={handleRateMovie} 
            initialRating={modalMode === 'recommendation' && recommendedMovies 
                               ? userRatings[recommendedMovies[currentRecommendationIndex].tmdbId!]?.rating ?? 0
                               : selectedTmdbId ? userRatings[selectedTmdbId]?.rating ?? 0 : 0}
            isFavorite={modalMode === 'recommendation' && recommendedMovies
                            ? !!userFavorites[recommendedMovies[currentRecommendationIndex].tmdbId!]
                            : selectedTmdbId ? !!userFavorites[selectedTmdbId] : false}
            onToggleFavorite={toggleFavorite}
            mode={modalMode}
            recommendationsData={recommendedMovies}
            isLoadingRecommendations={isLoadingRecommendations}
            recommendationError={recommendationError}
            currentRecommendationIndex={currentRecommendationIndex}
            onNavigateRecommendation={handleNavigateRecommendation}
          />
      )}

      <RatedMoviesPanel 
        isOpen={isRatingsPanelOpen} 
        onClose={closeRatingsPanel} 
        ratings={userRatings}
        onRemoveRating={removeRating}
        onGetRecommendations={handleGetRecommendations}
      />

      <FavoritesPanel
        isOpen={isFavoritesPanelOpen}
        onClose={closeFavoritesPanel}
        favorites={userFavorites}
        onRemoveFavorite={toggleFavorite}
      />
    </div>
  );
} 