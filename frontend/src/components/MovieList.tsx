"use client";

import { useState, useEffect, useCallback } from 'react';
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
      setIsSearching(true);
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
      
      <div className="fixed top-0 left-0 right-0 z-30 h-20 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-lg border-b border-yellow-600/20 flex items-center justify-between px-4 md:px-8">
          
          <div className="flex-shrink-0">
              <button
                onClick={openFavoritesPanel}
                className="relative text-pink-400 hover:text-pink-300 p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open favorite movies panel"
              >
                 <FaHeart size={18} />
                 {favoriteMoviesCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                     {favoriteMoviesCount}
                   </span>
                 )}
              </button>
          </div>

          <div className="flex-grow max-w-xl mx-4 relative">
               <SearchBar 
                  initialSearchTerm={searchTerm}
                  onSearchChange={handleSearchChange} 
              />
              {searchTerm && (
                  <button 
                      onClick={clearSearch} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                      title="Clear search"
                    >
                      <FaTimesCircle size={18} />
                  </button>
              )}
          </div>

          <div className="flex-shrink-0">
              <button
                onClick={openRatingsPanel}
                className="relative text-yellow-400 hover:text-yellow-300 p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open rated movies panel"
              >
                 <FaStar size={18} />
                 {ratedMoviesCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                     {ratedMoviesCount}
                   </span>
                 )}
              </button>
          </div>
      </div>

      {isSearching && (
          <div className="px-4 md:px-8 mb-8">
              {isSearchLoading && searchResults === null && (
                  <p className="text-center text-gray-400">Searching...</p>
              )}
              {searchError && (
                  <p className="text-center text-red-500">{searchError}</p>
              )}
              {!isSearchLoading && searchResults && searchResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {searchResults.map((movie) => (
                          <MovieCard
                              key={`search-${movie.tmdbId}-${movie.movieId || 'tmdb'}`}
                              tmdbId={movie.tmdbId} 
                              title={movie.title}
                              genres={movie.genres}
                              posterUrl={movie.posterUrl}
                              onClick={handleCardClick} 
                          />
                      ))}
                  </div>
              )}
              {!isSearchLoading && searchResults && searchResults.length === 0 && (
                   <p className="text-center text-gray-400">No movies found matching &quot;{searchTerm}&quot;.</p>
              )}
          </div>
      )}

      {!isSearching && !error && (
          <div className="px-4 md:px-8">
              {isLoading && displayedMovies.length === 0 && (
                  <p className="text-center text-yellow-500 mt-10">Loading popular movies...</p>
              )}
              <InfiniteScroll
                  dataLength={displayedMovies.length} 
                  next={loadMoreMovies} 
                  hasMore={hasMore} 
                  loader={ 
                      <div className="text-center py-8">
                          {isLoadingMore && <p className="text-yellow-500">Loading more movies...</p>}
                      </div>
                  }
                  endMessage={ 
                      !isSearching && displayedMovies.length > 0 ? (
                          <p className="text-center py-8 text-gray-500">
                              <b>You have seen all movies!</b>
                          </p>
                      ) : null
                  }
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-16"
                  style={{ overflow: 'visible' }}
              >
                  {displayedMovies.map((movie) => (
                      <MovieCard
                          key={`discover-${movie.tmdbId}-${movie.movieId || 'tmdb'}`}
                          tmdbId={movie.tmdbId} 
                          title={movie.title}
                          genres={movie.genres} 
                          posterUrl={movie.posterUrl}
                          onClick={handleCardClick} 
                      />
                  ))}
              </InfiniteScroll>
          </div>
      )}
      
      {error && !isSearching && (
          <p className="text-center text-red-500 mt-10">{error}</p>
      )}

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