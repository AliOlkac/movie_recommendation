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

    return (
        <>
            {/* İzlenen Filmler Butonu */}
            <button
                className="fixed top-4 right-4 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? "✕" : "🎥"}
            </button>

            {/* İzlenen Filmler Paneli */}
            {isOpen && (
                <div className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-white shadow-md p-4 overflow-y-auto z-40">
                    <h2 className="text-xl font-bold mb-4">Movies Watched</h2>
                    <ul>
                        {watchedMovies.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-2 object-cover"
                                />
                                <div className="flex-1">
                                    <p>{movie.title}</p>
                                    <p>Rating: {movie.rating} ⭐</p>
                                </div>
                                <button
                                    onClick={() => onRemove(movie)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
