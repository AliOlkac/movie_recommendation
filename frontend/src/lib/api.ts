// frontend/src/lib/api.ts

// Backend API'mizin temel URL'si
// Ortam değişkenlerinden almak daha iyidir, ama şimdilik sabit yazalım.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Filmleri getiren fonksiyon tipi
// Backend'den gelen yanıta göre bu tipler daha detaylı olabilir
export interface Movie {
  movieId: number;
  tmdbId: number | null;
  title: string;
  genres: string;
  posterUrl: string | null;
}

export interface PaginatedMoviesResponse {
  page: number;
  limit: number;
  total_movies: number;
  total_pages: number;
  movies: Movie[];
}

/**
 * Backend API'sinden film listesini getirir.
 * @param page İstenen sayfa numarası
 * @param limit Sayfa başına film sayısı
 * @param searchTerm Film başlıklarında aranacak terim (opsiyonel)
 * @returns Film verilerini içeren bir Promise döndürür. Hata durumunda null döner.
 */
export async function fetchMovies(
  page: number = 1, 
  limit: number = 20, 
  searchTerm?: string // Arama terimi parametresi eklendi
): Promise<PaginatedMoviesResponse | null> {
  // URL'ye search parametresini sadece varsa ekle
  let url = `${API_BASE_URL}/movies?page=${page}&limit=${limit}`;
  if (searchTerm && searchTerm.trim() !== '') {
    url += `&search=${encodeURIComponent(searchTerm.trim())}`; // URL encode etmeyi unutma
  }

  console.log(`Fetching movies from: ${url}`); 

  try {
    const response = await fetch(url, {
      // Next.js 13+ App Router'da veri cache'leme davranışı önemlidir.
      // 'force-cache' (varsayılan): Mümkünse cache'den kullanır.
      // 'no-store': Asla cache'leme. Her zaman taze veri çeker.
      // Verinin ne sıklıkla değiştiğine bağlı olarak seçim yapılabilir.
      // Şimdilik varsayılanı kullanalım veya 'no-store' deneyebiliriz.
      cache: 'no-store', 
    });

    if (!response.ok) {
      // HTTP hata durumunu ele al
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: PaginatedMoviesResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Failed to fetch movies:", error);
    return null;
  }
}

// TODO: Film detaylarını getiren fonksiyon (fetchMovieDetails)
// TODO: Kullanıcı önerilerini getiren fonksiyon (fetchRecommendations)

export interface MovieDetails extends Movie {
    overview: string | null;
    vote_average: number | null;
    release_date: string | null;
}

/**
 * TMDB API'sinden dönen film detaylarının yapısını tanımlar.
 */
export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string; // Film özeti
  poster_path: string | null; // Afiş yolu (base URL eklenmeli)
  release_date: string; // Yayın tarihi
  vote_average: number; // Ortalama puan
  genres: { id: number; name: string }[]; // Genres alanı eklendi (dizi olarak)
  // İhtiyaç duyulursa başka alanlar eklenebilir
}

/**
 * Fetch movie details for a specific movie ID from the TMDB API.
 * Reads the API key from the NEXT_PUBLIC_TMDB_API_KEY environment variable.
 * @param tmdbId The TMDB ID of the movie to fetch details for.
 * @returns A Promise containing the movie details or null in case of an error.
 */
export async function fetchTmdbMovieDetails(tmdbId: number): Promise<TmdbMovieDetails | null> {
  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // If API key is missing, log an error and return null
  if (!apiKey) {
    console.error(
      'TMDB API key (NEXT_PUBLIC_TMDB_API_KEY) not found. ' +
      'Check your .env.local file and restart the server.'
      );
    return null;
  }

  // Construct the TMDB API endpoint URL (with English language option)
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`; // Changed language to en-US

  try {
    // Send the request to the API
    const response = await fetch(url);

    // If the response is not successful (e.g., 404, 401), log an error and return null
    if (!response.ok) {
      console.error(`TMDB API error (${url}): ${response.status} ${response.statusText}`);
      // For more detailed error messages, response.json() could be checked
      // const errorData = await response.json();
      // console.error('TMDB Error Detail:', errorData);
      return null;
    }

    // Parse the JSON response and type it according to the specified interface
    const data: TmdbMovieDetails = await response.json();
    
    // Return the movie details on success
    return data;

  } catch (error) {
    // Handle network errors or other fetch issues
    console.error('An error occurred during the TMDB API request:', error);
    return null;
  }
}

// User ratings type definition (if not already defined, define it here)
// It might be better defined centrally if used in multiple places.
interface UserRatings {
  [tmdbId: number]: number; 
}

/**
 * Kullanıcının verdiği puanlara göre film önerileri getirir.
 * @param ratings Kullanıcının verdiği puanlar ({ tmdbId: rating } formatında).
 * @returns Önerilen film listesini (Movie[]) içeren bir Promise döndürür.
 *          Hata durumunda null döner.
 */
export async function fetchRecommendations(ratings: UserRatings): Promise<Movie[] | null> {
  const url = `${API_BASE_URL}/recommendations`;
  console.log(`Fetching recommendations from: ${url} with ratings:`, ratings);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratings),
      // Cache policy for POST requests is typically 'no-store' by default
      // cache: 'no-store', // Explicitly set if needed
    });

    if (!response.ok) {
      // Handle HTTP errors
      console.error(`API Error (Recommendations): ${response.status} ${response.statusText}`);
      try {
        // Attempt to get more detailed error from backend response body
        const errorData = await response.json();
        console.error("Backend Error Detail:", errorData);
      } catch {
        console.error("Could not parse error response body.");
      }
      return null;
    }

    // Backend should return an array of Movie objects
    const recommendedMovies: Movie[] = await response.json();
    return recommendedMovies;

  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return null;
  }
}

// TMDB Movie type (partial, only fields we need)
interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_count: number; // Ensure vote_count is included if needed for debugging/display
  // Add other fields if needed, like overview, vote_average etc.
}

// TMDB API response type for discover/top rated/popular (structure is similar)
interface TmdbDiscoverResponse { // Renamed interface for clarity
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

/**
 * Fetches movies from The Movie Database (TMDB) API using the /discover endpoint,
 * sorted by vote count descending.
 * Reads the API key from the NEXT_PUBLIC_TMDB_API_KEY environment variable.
 * @param page The page number to fetch.
 * @returns A Promise containing the API response or null in case of error.
 */
// Renamed function
export async function fetchMoviesByDiscover(page: number = 1): Promise<TmdbDiscoverResponse | null> { 
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key (NEXT_PUBLIC_TMDB_API_KEY) not found.');
    return null;
  }

  // Use the /discover/movie endpoint with sort_by=vote_count.desc
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=vote_count.desc&page=${page}&include_adult=false&include_video=false`;
  // Added include_adult and include_video for good measure
  console.log(`Fetching movies from TMDB Discover (sorted by vote count): ${url}`); 

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`TMDB API error (Discover Movies): ${response.status} ${response.statusText}`);
      return null;
    }

    // Use the updated interface name
    const data: TmdbDiscoverResponse = await response.json(); 
    return data;

  } catch (error) {
    console.error("Failed to fetch movies from TMDB Discover:", error);
    return null;
  }
}

/**
 * Helper function to convert TMDB movie data to our internal Movie format.
 * @param tmdbMovie Raw movie data from TMDB API.
 * @returns Movie object in our internal format.
 */
export function convertTmdbMovieToMovie(tmdbMovie: TmdbMovie): Movie {
  return {
    movieId: tmdbMovie.id, // Use TMDB ID as movieId for now, might cause issues if mixing sources
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    // For genres, we currently don't have a mapping from ID to name readily available
    // We can either fetch the genre list from TMDB separately or show IDs / placeholder
    genres: tmdbMovie.genre_ids.join('|'), // Placeholder: Join IDs
    posterUrl: tmdbMovie.poster_path, // Keep only the path, MovieCard adds base URL
  };
}

// TMDB API response type for search results (similar to popular/top-rated)
interface TmdbSearchResponse {
  page: number;
  results: TmdbMovie[]; // Reuses the TmdbMovie interface
  total_pages: number;
  total_results: number;
}

/**
 * Searches for movies on The Movie Database (TMDB) API.
 * @param query The search query string.
 * @param page The page number to fetch.
 * @returns A Promise containing the search results or null in case of error.
 */
export async function searchTmdbMovies(query: string, page: number = 1): Promise<TmdbSearchResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key (NEXT_PUBLIC_TMDB_API_KEY) not found.');
    return null;
  }

  // Encode the query parameter
  const encodedQuery = encodeURIComponent(query.trim());
  if (!encodedQuery) {
      return null; // Don't search if query is empty after trimming
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodedQuery}&page=${page}&include_adult=false`;
  console.log(`Searching TMDB movies: ${url}`);

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`TMDB API error (Search Movies): ${response.status} ${response.statusText}`);
      return null;
    }

    const data: TmdbSearchResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Failed to search movies from TMDB:", error);
    return null;
  }
}
