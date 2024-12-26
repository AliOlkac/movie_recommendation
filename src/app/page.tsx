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

interface WatchedMovie extends Movie {
    rating: number;
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const responseMain = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const dataMain = await responseMain.json();
                setPopularMovies(dataMain.results.slice(0, 20));
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };
        fetchMovies();
    }, [apiKey]);

    const handleMovieClick = (movie: Movie) => {
        setSelectedMovie(movie);

        // Ekranı yukarı kaydır
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleSuggestMovies = async () => {
        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

        const movieData = selectedMovies.map((movie) => ({
            film_adi: movie.title,
            yildiz_sayi: movie.rating,
        }));

        try {
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movies: movieData }),
            });

            const data = await response.json();
            setRecommendations(data.recommendations);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
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
                                    setSelectedMovie(null); // Film ekranını kapat
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
                            onClick={() => handleMovieClick(movie)}
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

                {recommendations.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-2xl font-bold text-center text-blue-600">
                            Recommendation Movies
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                            {recommendations.map((movie, index) => (
                                <div
                                    key={index}
                                    className="card shadow-md p-2 bg-base-100"
                                >
                                    <h3 className="text-sm font-bold">
                                        {movie.title}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
