"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Movie, 
  fetchRecommendations, 
  fetchTmdbTopRatedMovies, 
  searchTmdbMovies, 
  convertTmdbMovieToMovie 
} from '@/lib/api';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import MovieModal from './MovieModal';
import RatedMoviesPanel from './RatedMoviesPanel';
import FavoritesPanel from './FavoritesPanel';
import RecommendationsModal from './RecommendationsModal';
import InfiniteScroll from 'react-infinite-scroll-component';
import { debounce } from 'lodash';
import { FaStar, FaHeart, FaTimesCircle } from 'react-icons/fa';
import Image from 'next/image';

// --- localStorage Anahtarları ve Tipleri ---
const RATINGS_STORAGE_KEY = 'movieRatings';
const FAVORITES_STORAGE_KEY = 'movieFavorites';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

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
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
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
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Function to load TOP RATED movies from TMDB (paginated)
  const loadTopRatedMovies = useCallback(async (page: number) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    const data = await fetchTmdbTopRatedMovies(page);

    if (data) {
      const newMovies = data.results.map(convertTmdbMovieToMovie);
      setTopRatedMovies(prevMovies => page === 1 ? newMovies : [...prevMovies, ...newMovies]);
      setCurrentPage(page);
      setHasMore(page < data.total_pages);
    } else {
      setError('Could not load top rated movies.');
      setHasMore(false);
    }
    
    if (page === 1) setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  // Function to load SEARCH results from TMDB (only first page for now)
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

  // Debounced search function
  const debouncedLoadSearchResults = useCallback(debounce(loadSearchResults, 400), [loadSearchResults]);

  // Initial load of top rated movies
  useEffect(() => {
      loadTopRatedMovies(1); 
  }, [loadTopRatedMovies]);

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

  // Restore clearSearch function
  const clearSearch = () => {
      handleSearchChange('');
  };

  // Handler for infinite scroll
  const loadMoreMovies = () => {
    if (!isSearching && !isLoadingMore && hasMore) {
      loadTopRatedMovies(currentPage + 1);
    }
  };

  // Open modal when a movie card is clicked
  const handleCardClick = (tmdbId: number) => setSelectedTmdbId(tmdbId);

  // Close the modal
  const handleCloseModal = () => setSelectedTmdbId(null);

  // Find movie title helper (searches both lists)
  const findMovieTitle = (tmdbId: number): string => {
      const movieInTopRated = topRatedMovies.find(m => m.tmdbId === tmdbId);
      if (movieInTopRated) return movieInTopRated.title;
      const movieInSearch = searchResults?.find(m => m.tmdbId === tmdbId);
      if (movieInSearch) return movieInSearch.title;
      // Fallback: maybe check localStorage if title was stored previously?
      // Or return a default string
      return userRatings[tmdbId]?.title || userFavorites[tmdbId]?.title || 'Unknown Title'; 
  };

  // *** NEW HELPER: Find movie poster URL ***
  const findMoviePosterUrl = (tmdbId: number): string | null => {
      const movieInTopRated = topRatedMovies.find(m => m.tmdbId === tmdbId);
      if (movieInTopRated) return movieInTopRated.posterUrl;
      const movieInSearch = searchResults?.find(m => m.tmdbId === tmdbId);
      if (movieInSearch) return movieInSearch.posterUrl;
      // Fallback using localStorage data
      return userRatings[tmdbId]?.posterUrl || userFavorites[tmdbId]?.posterUrl || null;
  };

  // Process rating submitted from the modal - **UPDATE TO SAVE POSTERURL**
  const handleRateMovie = (tmdbId: number, rating: number) => { 
    const movieTitle = findMovieTitle(tmdbId);
    const moviePosterUrl = findMoviePosterUrl(tmdbId); // Get poster URL
    setUserRatings(prevRatings => {
        const newRatings = {
            ...prevRatings,
            [tmdbId]: { 
                rating: rating, 
                title: movieTitle,
                posterUrl: moviePosterUrl // Save poster URL
            },
        };
        saveRatingsToStorage(newRatings); 
        console.log("Current Ratings (saved):", newRatings);
        return newRatings;
    });
  };

  // Function to remove a rating
  const removeRating = (tmdbId: number) => {
    setUserRatings(prevRatings => {
      const newRatings = { ...prevRatings };
      delete newRatings[tmdbId];
      saveRatingsToStorage(newRatings); 
      return newRatings;
    });
  };

  // Favorite handler - **UPDATE TO SAVE POSTERURL**
  const toggleFavorite = (tmdbId: number) => {
    const movieTitle = findMovieTitle(tmdbId);
    const moviePosterUrl = findMoviePosterUrl(tmdbId); // Get poster URL
    setUserFavorites(prevFavorites => {
      const newFavorites = { ...prevFavorites };
      if (newFavorites[tmdbId]) {
        delete newFavorites[tmdbId];
      } else {
        newFavorites[tmdbId] = { 
            title: movieTitle, 
            posterUrl: moviePosterUrl // Save poster URL
        }; 
      }
      saveFavoritesToStorage(newFavorites); 
      console.log("Current Favorites (saved):", newFavorites);
      return newFavorites;
    });
  };

  // Panel toggle functions
  const openRatingsPanel = () => setIsRatingsPanelOpen(true);
  const closeRatingsPanel = () => setIsRatingsPanelOpen(false);
  const openFavoritesPanel = () => setIsFavoritesPanelOpen(true);
  const closeFavoritesPanel = () => setIsFavoritesPanelOpen(false);

  // Calculate number of rated movies for the button badge
  const ratedMoviesCount = Object.keys(userRatings).length;
  const favoriteMoviesCount = Object.keys(userFavorites).length;

  // Recommendation Modal handler
  const handleGetRecommendations = async () => {
    // Close the ratings panel first
    closeRatingsPanel(); 
    setIsRecModalOpen(true); // Open the recommendations modal immediately
    setIsRecLoading(true); // Set loading state
    setRecError(null); // Clear previous errors
    setRecommendedMovies(null); // Clear previous recommendations

    console.log("Requesting recommendations with ratings:", userRatings);

    // **Transform ratings object to the expected format { [tmdbId: number]: number }**
    const ratingsForApi: { [key: number]: number } = {};
    for (const tmdbId in userRatings) {
      ratingsForApi[parseInt(tmdbId, 10)] = userRatings[tmdbId].rating;
    }
    console.log("Ratings being sent to API:", ratingsForApi);

    // **Call API with the transformed ratings**
    const recommendations = await fetchRecommendations(ratingsForApi);

    if (recommendations) {
      setRecommendedMovies(recommendations);
      console.log("Recommendations received:", recommendations);
    } else {
      setRecError("Could not fetch recommendations. Please try again later.");
      console.error("Failed to fetch recommendations from API.");
    }
    setIsRecLoading(false); // End loading state
  };

  const closeRecModal = () => {
    setIsRecModalOpen(false);
    // Optionally clear state when closing
    // setRecommendedMovies(null);
    // setRecError(null);
  };

  return (
    <div className="relative min-h-screen pt-20">
      
      {/* --- Fixed Top Bar --- */}
      <div className="fixed top-0 left-0 right-0 z-30 h-20 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-lg border-b border-yellow-600/20 flex items-center justify-between px-4 md:px-8">
          
          {/* Left: Favorites Button */}
          <div className="flex-shrink-0">
              <button
                onClick={openFavoritesPanel}
                className="relative text-pink-400 hover:text-pink-300 p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open favorite movies panel"
              >
                 <FaHeart size={18} />
                 {/* Badge */} 
                 {favoriteMoviesCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                     {favoriteMoviesCount}
                   </span>
                 )}
              </button>
          </div>

          {/* Center: Search Bar */} 
          <div className="flex-grow max-w-xl mx-4 relative">
               <SearchBar 
                  initialSearchTerm={searchTerm}
                  onSearchChange={handleSearchChange} 
              />
              {/* Clear button inside SearchBar */} 
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

          {/* Right: Ratings Button */} 
          <div className="flex-shrink-0">
              <button
                onClick={openRatingsPanel}
                className="relative text-yellow-400 hover:text-yellow-300 p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors shadow-md"
                aria-label="Open rated movies panel"
              >
                 <FaStar size={18} />
                 {/* Badge */} 
                 {ratedMoviesCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                     {ratedMoviesCount}
                   </span>
                 )}
              </button>
          </div>
      </div>
      {/* --- End of Fixed Top Bar --- */} 

      {/* === Search Results Section === */} 
      {/* Show this section only when search term exists */} 
      {isSearching && (
          <div className="px-4 md:px-8 mb-8">
              {/* Loading/Error/Results logic for search... */} 
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

      {/* === Top Rated Movies Section (Infinite Scroll) === */} 
      {/* Always show this section if not searching */}
      {!isSearching && !error && (
          <div className="px-4 md:px-8">
              {/* Initial Loading for Top Rated */}
              {isLoading && topRatedMovies.length === 0 && (
                  <p className="text-center text-yellow-500 mt-10">Loading top rated movies...</p>
              )}
              {/* Infinite Scroll Component */} 
              <InfiniteScroll
                  dataLength={topRatedMovies.length} 
                  next={loadMoreMovies} 
                  hasMore={hasMore} 
                  loader={ 
                      <div className="text-center py-8">
                          {isLoadingMore && <p className="text-yellow-500">Loading more movies...</p>}
                      </div>
                  }
                  endMessage={ 
                      !isSearching && topRatedMovies.length > 0 ? (
                          <p className="text-center py-8 text-gray-500">
                              <b>You have seen all top rated movies!</b>
                          </p>
                      ) : null
                  }
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-16"
                  style={{ overflow: 'visible' }}
              >
                  {topRatedMovies.map((movie) => (
                      <MovieCard
                          key={`toprated-${movie.tmdbId}-${movie.movieId || 'tmdb'}`}
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
      
      {/* General Error Message */}
      {error && !isSearching && (
          <p className="text-center text-red-500 mt-10">{error}</p>
      )}

      {/* Movie Detail Modal */}
      <MovieModal 
        tmdbId={selectedTmdbId}
        onClose={handleCloseModal}
        onRate={handleRateMovie} 
        initialRating={selectedTmdbId ? userRatings[selectedTmdbId]?.rating ?? 0 : 0} 
        isFavorite={selectedTmdbId ? !!userFavorites[selectedTmdbId] : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* Rated Movies Panel - Pass onGetRecommendations */}
      <RatedMoviesPanel 
        isOpen={isRatingsPanelOpen} 
        onClose={closeRatingsPanel} 
        ratings={userRatings}
        onRemoveRating={removeRating}
        onGetRecommendations={handleGetRecommendations}
      />

      {/* Favorites Panel */}
      <FavoritesPanel
        isOpen={isFavoritesPanelOpen}
        onClose={closeFavoritesPanel}
        favorites={userFavorites}
        onRemoveFavorite={toggleFavorite}
      />

      {/* Recommendations Modal */}
      <RecommendationsModal
        isOpen={isRecModalOpen}
        onClose={closeRecModal}
        recommendations={recommendedMovies}
        isLoading={isRecLoading}
        error={recError}
      />
    </div>
  );
} 