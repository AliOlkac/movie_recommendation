"use client";

import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import FavoritesList from "./components/FavoritesList";
import MoviesWatchedList from "./components/MoviesWatchedList";
import StarRating from "./components/StarRating";

interface Movie {
    id: number;
    title: string;
    poster_path: string;
}

interface Recommendation {
    title: string;
    genres: string; // Flask API'den gelen tür bilgisi
}

interface WatchedMovie extends Movie {
    rating: number;
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [error, setError] = useState<string | null>(null); // Hata mesajı
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const data = await response.json();
                setPopularMovies(data.results.slice(0, 20));
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };
        fetchMovies();
    }, [apiKey]);

    const handleSuggestMovies = async () => {
        setLoadingRecommendations(true);
        setError(null); // Hata durumunu sıfırla

        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

        const userRatings = selectedMovies.reduce<Record<string, number>>((acc, movie) => {
            acc[movie.title] = movie.rating;
            return acc;
        }, {});

        try {
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ratings: userRatings, top_n: 10 }),
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data || []);
                setPopularMovies([]);
            } else {
                setError("Failed to fetch recommendations");
                setRecommendations([]);
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            setError("Error fetching recommendations");
        } finally {
            setLoadingRecommendations(false);
        }
    };

    return (
        <div className="flex">
            <FavoritesList
                favorites={favorites}
                onRemove={(movie) =>
                    setFavorites(favorites.filter((fav) => fav.id !== movie.id))
                }
            />
            <MoviesWatchedList
                watchedMovies={watchedMovies}
                onRemove={(movie) =>
                    setWatchedMovies(
                        watchedMovies.filter((wm) => wm.id !== movie.id)
                    )
                }
            />

            <div className="flex-1 p-10">
                <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">
                    Welcome to MovieMatchHub
                </h1>

                <SearchBar onMovieSelect={setSelectedMovie} />

                {selectedMovie && (
                    <div className="relative mt-6 p-4 border border-gray-700 rounded shadow-md text-center bg-black bg-opacity-75">
                        <button
                            className="absolute top-4 right-4 text-white bg-purple-700 rounded-full p-3 hover:bg-purple-900 hover:scale-110 transition transform duration-200 ease-in-out shadow-lg"
                            onClick={() => setSelectedMovie(null)}
                        >
                            ✕
                        </button>
                        <img
                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            className="mx-auto"
                        />
                        <h3 className="text-lg font-bold mt-2 text-white">
                            {selectedMovie.title}
                        </h3>
                        <div className="flex justify-center mt-2">
                            <StarRating
                                onRate={(rating) => {
                                    setWatchedMovies([
                                        ...watchedMovies,
                                        { ...selectedMovie, rating },
                                    ]);
                                    setSelectedMovie(null);
                                }}
                            />
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() =>
                                    setFavorites([...favorites, selectedMovie])
                                }
                                className="btn bg-white text-black border border-gray-300 hover:bg-gray-100"
                            >
                                ❤ Add to Favorites
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-base-100 cursor-pointer"
                            onClick={() => {
                                setSelectedMovie(movie);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                        >
                            <h3 className="text-sm font-bold">{movie.title}</h3>
                            <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                className="mt-2"
                            />
                        </div>
                    ))}
                </div>

                {recommendations && recommendations.length > 0 ? (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-2">Recommended Movies:</h3>
                        <ul>
                            {recommendations.map((movie, index) => (
                                <li key={index} className="mb-2">
                                    {movie.title} - {movie.genres}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : error ? (
                    <div className="text-red-500 mt-4">{error}</div>
                ) : null}

                {loadingRecommendations && (
                    <div className="text-center mt-4">Loading recommendations...</div>
                )}

                {watchedMovies.length >= 10 && !loadingRecommendations && (
                    <button
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-700"
                        onClick={handleSuggestMovies}
                    >
                        Suggest Movies
                    </button>
                )}
            </div>
        </div>
    );
}
