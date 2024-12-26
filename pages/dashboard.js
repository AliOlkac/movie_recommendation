"use client";

import { useEffect, useState } from "react";
import SearchBar from "../src/app/components/SearchBar";
import FavoritesList from "../src/app/components/FavoritesList";
import MoviesWatchedList from "../src/app/components/MoviesWatchedList";
import StarRating from "../src/app/components/StarRating"; // StarRating bileşenini import ettik

export default function Dashboard() {
    const [favorites, setFavorites] = useState([]);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const responseMain = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const dataMain = await responseMain.json();
                const limitedMovies = dataMain.results.slice(0, 20);

                const responseComedy = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=35`
                );
                const dataComedy = await responseComedy.json();

                const comedyMovies = dataComedy.results.filter(
                    (comedyMovie) =>
                        !limitedMovies.some((mainMovie) => mainMovie.id === comedyMovie.id)
                );

                const extraMovies = comedyMovies.slice(0, 4);
                const moviesWithExtras = [...limitedMovies, ...extraMovies];

                setPopularMovies(moviesWithExtras);
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };

        fetchMovies();
    }, [apiKey]);

    const handleMovieClick = (movie) => {
        setSelectedMovie(movie);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleAddToFavorites = (movie) => {
        if (!favorites.find((fav) => fav.id === movie.id)) {
            setFavorites([...favorites, movie]);
            setSelectedMovie(null);
        }
    };

    const handleAddToWatched = (rating) => {
        if (selectedMovie) {
            setWatchedMovies([...watchedMovies, { ...selectedMovie, rating }]);
            setSelectedMovie(null);
        }
    };

    const handleRemoveFromFavorites = (movie) => {
        setFavorites(favorites.filter((fav) => fav.id !== movie.id));
    };

    const handleRemoveFromWatched = (movie) => {
        setWatchedMovies(watchedMovies.filter((wm) => wm.id !== movie.id));
    };

    return (
        <div className="flex">
            <FavoritesList favorites={favorites} onRemove={handleRemoveFromFavorites} />
            <MoviesWatchedList watchedMovies={watchedMovies} onRemove={handleRemoveFromWatched} />

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
                        <h3 className="text-lg font-bold mt-2 text-white">{selectedMovie.title}</h3>
                        <div className="flex justify-center mt-2">
                            <StarRating onRate={(rating) => handleAddToWatched(rating)} />
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => handleAddToFavorites(selectedMovie)}
                                className="btn bg-white text-black border border-gray-300 hover:bg-gray-100"
                            >
                                <span className="text-red-500">❤</span> Add to Favorites
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
