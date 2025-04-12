"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchMovies, Movie, fetchRecommendations } from '@/lib/api';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import MovieModal from './MovieModal';
import RatedMoviesPanel from './RatedMoviesPanel';
import FavoritesPanel from './FavoritesPanel';
import RecommendationsModal from './RecommendationsModal';
import { debounce } from 'lodash';
import { FaStar, FaHeart } from 'react-icons/fa';

// localStorage anahtarı
const RATINGS_STORAGE_KEY = 'movieRatings';
const FAVORITES_STORAGE_KEY = 'movieFavorites';

// User ratings type definition
interface UserRatings {
  [tmdbId: number]: number; // Use tmdbId as the key
}

// Favorites type definition
interface Favorites {
  [tmdbId: number]: boolean; // true if favorited
}

// localStorage'dan güvenli okuma fonksiyonu
const loadRatingsFromStorage = (): UserRatings => {
  // localStorage sadece tarayıcıda mevcut
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const storedRatings = localStorage.getItem(RATINGS_STORAGE_KEY);
    return storedRatings ? JSON.parse(storedRatings) : {};
  } catch (error) {
    console.error("Error reading ratings from localStorage:", error);
    return {};
  }
};

const loadFavoritesFromStorage = (): Favorites => {
  if (typeof window === 'undefined') return {};
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return storedFavorites ? JSON.parse(storedFavorites) : {};
  } catch (error) {
    console.error("Error reading favorites from localStorage:", error);
    return {};
  }
};

// localStorage'a güvenli yazma fonksiyonu
const saveRatingsToStorage = (ratings: UserRatings) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.error("Error saving ratings to localStorage:", error);
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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [userRatings, setUserRatings] = useState<UserRatings>(() => loadRatingsFromStorage());
  const [isRatingsPanelOpen, setIsRatingsPanelOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Favorites>(() => loadFavoritesFromStorage());
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[] | null>(null);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Fetch movie data function
  const loadMovies = useCallback(async (term: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMovies(1, 50, term); // Fetch first 50 movies (pagination can be added later)
      if (data && data.movies) {
        setMovies(data.movies);
      } else {
        setMovies([]); // Clear list if no movies found
      }
    } catch (err) {
      console.error("Error loading movies:", err);
      setError('An error occurred while loading movies.'); // English error
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced movie loading based on search term
  const debouncedLoadMovies = useCallback(debounce(loadMovies, 500), [loadMovies]);

  // Load movies on initial render and when search term changes
  useEffect(() => {
    if (searchTerm) {
        debouncedLoadMovies(searchTerm);
    } else {
        loadMovies(''); // Load immediately if no search term (initial load or clear)
    }
    // Cleanup function to cancel debounce
    return () => {
        debouncedLoadMovies.cancel();
    };
  }, [searchTerm, loadMovies, debouncedLoadMovies]);

  // Update state based on changes from SearchBar
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Open modal when a movie card is clicked
  const handleCardClick = (tmdbId: number) => {
    setSelectedTmdbId(tmdbId);
  };

  // Close the modal
  const handleCloseModal = () => {
    setSelectedTmdbId(null);
  };

  // Process rating submitted from the modal
  const handleRateMovie = (tmdbId: number, rating: number) => {
    const newRatings = {
        ...userRatings,
        [tmdbId]: rating,
    };
    setUserRatings(newRatings);
    saveRatingsToStorage(newRatings); 
    console.log("Current Ratings (saved):", newRatings); 
  };

  // Favorite handler
  const toggleFavorite = (tmdbId: number) => {
    setUserFavorites(prevFavorites => {
      const newFavorites = { ...prevFavorites };
      if (newFavorites[tmdbId]) {
        delete newFavorites[tmdbId];
      } else {
        newFavorites[tmdbId] = true;
      }
      saveFavoritesToStorage(newFavorites);
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

  // Function to remove a rating
  const removeRating = (tmdbId: number) => {
    setUserRatings(prevRatings => {
      const newRatings = { ...prevRatings };
      delete newRatings[tmdbId];
      saveRatingsToStorage(newRatings); // Save to localStorage
      return newRatings;
    });
  };

  // Recommendation Modal handler
  const handleGetRecommendations = async () => {
    // Close the ratings panel first
    closeRatingsPanel(); 
    setIsRecModalOpen(true); // Open the recommendations modal immediately
    setIsRecLoading(true); // Set loading state
    setRecError(null); // Clear previous errors
    setRecommendedMovies(null); // Clear previous recommendations

    console.log("Requesting recommendations with ratings:", userRatings);

    const recommendations = await fetchRecommendations(userRatings);

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
    <div className="relative min-h-screen">
      
      {/* Button to Open Favorites Panel (Fixed Position - Left) */}
      <button
        onClick={openFavoritesPanel}
        className="fixed top-20 left-4 z-30 bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-colors duration-300"
        aria-label="Open favorite movies panel"
      >
         <FaHeart size={20} />
         {favoriteMoviesCount > 0 && (
           <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
             {favoriteMoviesCount}
           </span>
         )}
      </button>

      {/* Button to Open Rated Movies Panel (Fixed Position - Right) - Renamed onClick */}
      <button
        onClick={openRatingsPanel}
        className="fixed top-20 right-4 z-30 bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-3 rounded-full shadow-lg transition-colors duration-300"
        aria-label="Open rated movies panel"
      >
         <FaStar size={20} />
         {ratedMoviesCount > 0 && (
           <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
             {ratedMoviesCount}
           </span>
         )}
      </button>

      {/* Search Bar */}
      <div className="mb-8 max-w-xl mx-auto pt-4">
         <SearchBar 
            onSearchChange={handleSearchChange} 
         />
      </div>

      {/* Movie List or Status Messages */}
      {isLoading && <p className="text-center text-yellow-500">Loading movies...</p>} {/* English */} 
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!isLoading && !error && movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-16">
          {movies.map((movie) => (
            <MovieCard
              key={movie.movieId} // Still use movieId for React key, as it's unique in our list
              tmdbId={movie.tmdbId} // Pass tmdbId
              title={movie.title}
              genres={movie.genres}
              posterUrl={movie.posterUrl}
              onClick={handleCardClick} // Connect click event
            />
          ))}
        </div>
      )}

      {!isLoading && !error && movies.length === 0 && searchTerm && (
         <p className="text-center text-gray-400">No movies found matching &quot;{searchTerm}&quot;.</p> // English
      )}
      
      {!isLoading && !error && movies.length === 0 && !searchTerm && (
         <p className="text-center text-gray-400">No movies to display.</p> // English
      )}

      {/* Movie Detail Modal */}
      <MovieModal 
        tmdbId={selectedTmdbId}
        onClose={handleCloseModal}
        onRate={handleRateMovie} 
        initialRating={selectedTmdbId ? userRatings[selectedTmdbId] : 0} 
        isFavorite={selectedTmdbId ? !!userFavorites[selectedTmdbId] : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* Rated Movies Panel - Pass onGetRecommendations */}
      <RatedMoviesPanel 
        isOpen={isRatingsPanelOpen} 
        onClose={closeRatingsPanel} 
        ratings={userRatings}
        movies={movies}
        onRemoveRating={removeRating}
        onGetRecommendations={handleGetRecommendations} // Pass the handler
      />

      {/* Favorites Panel */}
      <FavoritesPanel
        isOpen={isFavoritesPanelOpen}
        onClose={closeFavoritesPanel}
        favorites={userFavorites}
        movies={movies}
        onToggleFavorite={toggleFavorite}
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