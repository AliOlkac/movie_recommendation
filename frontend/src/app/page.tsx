
import MovieCard from "@/components/MovieCard";
import { fetchMovies } from "@/lib/api";
import Image from 'next/image';

export default async function HomePage() {
  const initialMoviesData = await fetchMovies(1, 20);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-12">
        <Image 
          src="/images/NextFilmsLogo_1.png"
          alt="NextFilms Logo" 
          width={300}
          height={80} 
          priority 
        />
        <div className="mt-6 w-full max-w-md">
           <input 
             type="text" 
             placeholder="Film ara..." 
             className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent backdrop-blur-sm"
           />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-yellow-500 mb-6 text-center border-b-2 border-yellow-500/30 pb-2">
        Popüler Filmler
      </h2>
      {initialMoviesData && initialMoviesData.movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {initialMoviesData.movies.map((movie) => (
            <MovieCard 
              key={movie.movieId}
              movieId={movie.movieId}
              title={movie.title}
              genres={movie.genres}
              posterUrl={movie.posterUrl}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-white text-lg">
          Filmler yüklenemedi veya hiç film bulunamadı. Backend sunucusunun çalıştığından emin olun.
        </p>
      )}

      {/* TODO: Lazy loading / Infinite scroll implementasyonu buraya eklenecek */}
      {/* TODO: Arama çubuğu buraya veya layout'a eklenecek */}
      {/* TODO: Puanlanan filmler paneli buraya eklenecek */}

    </div>
  );
}
