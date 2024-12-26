"use client";

import { useState } from "react";

interface WatchedMovie {
    id: number;
    title: string;
    poster_path: string;
    rating: number;
}

interface MoviesWatchedListProps {
    watchedMovies: WatchedMovie[];
    onRemove: (movie: WatchedMovie) => void;
}

export default function MoviesWatchedList({ watchedMovies, onRemove }: MoviesWatchedListProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recommendations, setRecommendations] = useState<WatchedMovie[]>([]);

    const handleSuggestMovies = async () => {
        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating) // En beğenilen filmleri sırala
            .slice(0, 10); // İlk 10 filmi seç

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
            setRecommendations(data.recommendations); // API'den gelen öneriler
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        }
    };

    return (
        <>
            <button
                className="fixed top-4 right-4 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                🎥
            </button>

            {isOpen && (
                <div className="fixed right-0 top-0 h-full w-72 bg-gray-800 text-white shadow-md p-4 overflow-y-auto z-40">
                    <h2 className="text-xl font mb-4 text-center favorites-list-header watched-movies-header">Movies Watched</h2>
                    <ul className="watched-movies-list mt-6">
                        {watchedMovies.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-2 object-cover"
                                />
                                <div className="flex-1">
                                    <p>{movie.title}</p>
                                    <p className="text-yellow-400 flex items-center">
                                        Rating: {movie.rating} ⭐
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemove(movie)}
                                    className="ml-2 text-white bg-red-600 rounded-full p-2 hover:bg-red-800 transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>

                    {watchedMovies.length >= 10 && (
                        <button
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-700"
                            onClick={handleSuggestMovies}
                        >
                            Suggest Movies
                        </button>
                    )}


                    {/* Önerilen Filmleri Göster */}
                    {recommendations.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-bold mb-2">Recommended Movies:</h3>
                            <ul>
                                {recommendations.map((movie, index) => (
                                    <li key={index} className="mb-2">
                                        {movie.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

