"use client";

// RecommendedMovies bileşenine gelen özellikler için bir arayüz tanımı
interface RecommendedMoviesProps {
    movies: any[]; // Önerilen filmleri içeren dizi
    onSelectMovie?: (movie: any) => void; // Bir film seçildiğinde çağrılacak işlev (isteğe bağlı)
    isSelectable?: boolean; // Filmlerin seçilebilir olup olmadığını belirten bayrak (isteğe bağlı)
}

// RecommendedMovies bileşeni: Önerilen filmleri bir grid düzeninde gösterir
export default function RecommendedMovies({
                                              movies, // Gösterilecek filmler
                                              onSelectMovie, // Bir film seçildiğinde çağrılacak işlev
                                              isSelectable = false, // Varsayılan olarak filmler seçilebilir değil
                                          }: RecommendedMoviesProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Önerilen filmleri map ile render etme */}
            {movies.map((movie) => (
                <div
                    key={movie.id} // Her film için benzersiz bir anahtar
                    className={`card shadow-md p-4 bg-base-100 ${
                        isSelectable ? "cursor-pointer hover:bg-gray-300" : ""
                    }`} // Seçilebilirlik durumuna göre CSS sınıfları eklenir
                    onClick={() => isSelectable && onSelectMovie && onSelectMovie(movie)} // Film seçimi işlevi tetiklenir
                >
                    {/* Filmin başlığı */}
                    <h3 className="text-lg font-bold">{movie.title}</h3>
                    {/* Eğer film posteri varsa, göster */}
                    {movie.poster_path && (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} // Poster URL'si
                            alt={movie.title} // Alternatif metin
                            className="mt-4" // Poster için stil
                        />
                    )}
                    {/* Filmin yayınlanma tarihi varsa, göster */}
                    <p className="mt-2 text-gray-600">
                        {movie.release_date ? `Release: ${movie.release_date}` : ""} {/* Yayınlanma tarihi */}
                    </p>
                </div>
            ))}
        </div>
    );
}
