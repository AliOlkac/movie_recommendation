"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchMovies, Movie } from '@/lib/api';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';

// Debounce fonksiyonu için daha spesifik tipler
function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<void> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args); // Dönüş değerini kullanmıyoruz, void döndürüyoruz
        resolve();
      }, waitFor);
    });
  };
}

export default function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced API çağrısı fonksiyonu
  const debouncedFetchMovies = useCallback(
    debounce(async (term: string) => {
      setIsLoading(true);
      setError(null);
      console.log("Debounced search triggered for:", term);
      const data = await fetchMovies(1, 50, term);
      if (data) {
        setMovies(data.movies);
      } else {
        setError("Filmler getirilemedi.");
        setMovies([]);
      }
      setIsLoading(false);
    }, 500),
    []
  );

  // İlk yüklemede ve arama terimi değiştiğinde filmleri getir
  useEffect(() => {
    debouncedFetchMovies(searchTerm);
  }, [searchTerm, debouncedFetchMovies]);

  return (
    <div>
      <div className="mb-8 flex justify-center">
         <SearchBar 
           initialSearchTerm={searchTerm} 
           onSearchChange={setSearchTerm} 
         />
      </div>

      {isLoading && (
         <p className="text-center text-yellow-400">Yükleniyor...</p>
      )}

      {error && !isLoading && (
         <p className="text-center text-red-500">{error}</p>
      )}

      {!isLoading && !error && movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.movieId} 
              movieId={movie.movieId}
              title={movie.title}
              genres={movie.genres}
              posterUrl={movie.posterUrl} 
            />
          ))}
        </div>
      )}

      {!isLoading && !error && movies.length === 0 && searchTerm && (
         <p className="text-center text-white">&#39;{searchTerm}&#39; ile eşleşen film bulunamadı.</p>
      )}
       {!isLoading && !error && movies.length === 0 && !searchTerm && (
         <p className="text-center text-white">Gösterilecek film bulunamadı.</p>
      )}

       {/* TODO: Lazy loading / Infinite scroll butonu veya gözlemcisi */}
    </div>
  );
} 