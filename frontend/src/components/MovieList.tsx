"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchMovies, Movie } from '@/lib/api';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import MovieModal from './MovieModal';
import RatedMoviesPanel from './RatedMoviesPanel';
import { debounce } from 'lodash';
import { FaStar } from 'react-icons/fa';

// localStorage anahtarı
const RATINGS_STORAGE_KEY = 'nextfilms_user_ratings';

// User ratings type definition
interface UserRatings {
  [tmdbId: number]: number; // Use tmdbId as the key
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

export default function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null); // Renamed state
  // userRatings state'ini localStorage'dan okuyarak başlat
  const [userRatings, setUserRatings] = useState<UserRatings>(() => loadRatingsFromStorage());
  const [isPanelOpen, setIsPanelOpen] = useState(false); // State for panel visibility

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
  const handleCardClick = (tmdbId: number) => { // Expects tmdbId now
    setSelectedTmdbId(tmdbId); // Set the correct state
  };

  // Close the modal
  const handleCloseModal = () => {
    setSelectedTmdbId(null);
  };

  // Process rating submitted from the modal
  const handleRateMovie = (tmdbId: number, rating: number) => { // Expects tmdbId
    // Yeni puanlar objesini oluştur
    const newRatings = {
        ...userRatings,
        [tmdbId]: rating,
    };
    // State'i güncelle
    setUserRatings(newRatings);
    // localStorage'ı güncelle
    saveRatingsToStorage(newRatings); 
    console.log("Current Ratings (saved):", newRatings); 
    // TODO: Persist these ratings (localStorage, Context, backend etc.)
    // Let's not close the modal immediately, so user can see changes.
    // handleCloseModal(); // Can be uncommented to auto-close after rating.
  };

  // Panel toggle functions
  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);

  // Calculate number of rated movies for the button badge
  const ratedMoviesCount = Object.keys(userRatings).length;

  return (
    <div className="relative min-h-screen">
      
      {/* Button to Open Rated Movies Panel (Fixed Position) */}
      <button
        onClick={openPanel}
        className="fixed top-20 right-4 z-30 bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-3 rounded-full shadow-lg transition-colors duration-300"
        aria-label="Open rated movies panel"
      >
         <FaStar size={20} />
         {/* Badge for rated movie count */} 
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
              // movieId={movie.movieId} // Pass movieId if needed elsewhere
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
        tmdbId={selectedTmdbId} // Pass the selected tmdbId to the modal
        onClose={handleCloseModal} // Pass the close handler
        onRate={handleRateMovie} // Pass the rating handler
        // Modal'a mevcut puanı da iletelim ki gösterebilsin
        initialRating={selectedTmdbId ? userRatings[selectedTmdbId] : 0} 
      />

      {/* Rated Movies Panel */}
      <RatedMoviesPanel 
        isOpen={isPanelOpen}
        onClose={closePanel}
        ratings={userRatings}
        movies={movies} // Pass the main movie list to find details
      />
    </div>
  );
} 