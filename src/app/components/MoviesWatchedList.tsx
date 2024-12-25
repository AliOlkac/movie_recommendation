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
                🎥
            </button>

            {/* İzlenen Filmler Paneli */}
            {isOpen && (
                <div className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-white shadow-md p-4 overflow-y-auto z-40">
                    {/* Başlık ve Düğme */}
                    <div className="watched-movies-header">
                        <h2>Movies Watched</h2>
                    </div>

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
                                        Rating: {movie.rating}{" "}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 .587l3.668 7.568L24 9.423l-6 5.828L19.334 24 12 20.092 4.666 24 6 15.251 0 9.423l8.332-1.268L12 .587z" />
                                        </svg>
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemove(movie)}
                                    className="ml-2 text-white bg-red-600 rounded-full shadow-lg flex items-center justify-center transition-transform hover:bg-red-800"
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
