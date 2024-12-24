"use client";

interface RecommendedMoviesProps {
    movies: any[];
    onSelectMovie?: (movie: any) => void;
    isSelectable?: boolean;
}

export default function RecommendedMovies({
                                              movies,
                                              onSelectMovie,
                                              isSelectable = false,
                                          }: RecommendedMoviesProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => (
                <div
                    key={movie.id}
                    className={`card shadow-md p-4 bg-base-100 ${
                        isSelectable ? "cursor-pointer hover:bg-gray-300" : ""
                    }`}
                    onClick={() => isSelectable && onSelectMovie && onSelectMovie(movie)}
                >
                    <h3 className="text-lg font-bold">{movie.title}</h3>
                    {movie.poster_path && (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="mt-4"
                        />
                    )}
                    <p className="mt-2 text-gray-600">
                        {movie.release_date ? `Release: ${movie.release_date}` : ""}
                    </p>
                </div>
            ))}
        </div>
    );
}
