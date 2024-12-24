"use client";

import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import FavoritesList from "./components/FavoritesList";
import MoviesWatchedList from "./components/MoviesWatchedList";

interface Movie {
    id: number;
    title: string;
    poster_path: string;
}

interface WatchedMovie extends Movie {
    rating: number;
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [rating, setRating] = useState<number>(0);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    useEffect(() => {
        const fetchPopularMovies = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const data = await response.json();
                setPopularMovies(data.results.slice(0, 30));
            } catch (error) {
                console.error("Error fetching popular movies:", error);
            }
        };

        fetchPopularMovies();
    }, [apiKey]);

    const handleAddToFavorites = (movie: Movie) => {
        if (!favorites.find((fav) => fav.id === movie.id)) {
            setFavorites([...favorites, movie]);
            setSelectedMovie(null); // Favoriye eklenirse seçili film sıfırlanır
        }
    };

    const handleAddToWatched = () => {
        if (selectedMovie) {
            setWatchedMovies([...watchedMovies, { ...selectedMovie, rating }]);
            setSelectedMovie(null); // İzlenenlere eklenirse seçili film sıfırlanır
            setRating(0);
        }
    };

    const handleRemoveFromFavorites = (movie: Movie) => {
        setFavorites(favorites.filter((fav) => fav.id !== movie.id));
    };

    const handleRemoveFromWatched = (movie: WatchedMovie) => {
        setWatchedMovies(watchedMovies.filter((wm) => wm.id !== movie.id));
    };

    return (
        <div className="flex">
            {/* Favoriler Paneli */}
            <FavoritesList favorites={favorites} onRemove={handleRemoveFromFavorites} />

            {/* İzlenen Filmler Paneli */}
            <MoviesWatchedList watchedMovies={watchedMovies} onRemove={handleRemoveFromWatched} />

            <div className="flex-1 p-10">
                <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">
                    Welcome to MovieMatchHub
                </h1>

                {/* Search Bar */}
                <SearchBar onMovieSelect={setSelectedMovie} />

                {/* Orta Pencere: Seçilen Film */}
                {selectedMovie && (
                    <div className="mt-6 p-4 border border-gray-700 rounded shadow-md text-center">
                        <img
                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            className="mx-auto"
                        />
                        <h3 className="text-lg font-bold mt-2">{selectedMovie.title}</h3>
                        <div className="mt-4 flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={star <= rating ? "text-yellow-500" : "text-gray-500"}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={handleAddToWatched}
                                className="btn btn-success mr-2"
                            >
                                Add to Watched
                            </button>
                            <button
                                onClick={() => handleAddToFavorites(selectedMovie)}
                                className="btn btn-primary"
                            >
                                ❤ Add to Favorites
                            </button>
                        </div>
                    </div>
                )}

                {/* Popüler Filmler */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-base-100 cursor-pointer"
                            onClick={() => setSelectedMovie(movie)}
                        >
                            <h3 className="text-sm font-bold">{movie.title}</h3>
                            {movie.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                    alt={movie.title}
                                    className="mt-2"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
