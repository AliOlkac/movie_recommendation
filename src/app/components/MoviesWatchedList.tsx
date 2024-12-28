"use client";

import { useState } from "react";

// ---------------------------------------------------------------------
// 1) Arayüz Tipleri
// ---------------------------------------------------------------------
interface WatchedMovie {
    id: number;
    title: string;
    poster_path: string;
    rating: number;
}

interface MoviesWatchedListProps {
    watchedMovies: WatchedMovie[];
    onRemove: (movie: WatchedMovie) => void;
    onSuggestMovies: () => void; // <-- Burada tanımladığımız prop: Parent fonksiyonu
}

// ---------------------------------------------------------------------
// 2) Bileşen
// ---------------------------------------------------------------------
export default function MoviesWatchedList({
                                              watchedMovies,
                                              onRemove,
                                              onSuggestMovies,
                                          }: MoviesWatchedListProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Yanda açılan paneli kontrol eden buton */}
            <button
                className="fixed top-4 right-4 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                🎬
            </button>

            {isOpen && (
                <div className="fixed right-0 top-0 h-full w-72 bg-primary-lighter text-accent-dark shadow-md p-4 overflow-y-auto z-40 rounded-lg">
                    <h2 className="text-xl font-bold mb-4 text-center text-accent-dark watched-movies-header">
                        Movies Watched
                    </h2>

                    <ul className="watched-movies-list mt-6">
                        {watchedMovies.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                {/* Poster */}
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-2 object-cover rounded-lg border border-primary"
                                />
                                {/* Başlık + Puan */}
                                <div className="flex-1">
                                    <p className="text-accent-dark font-bold">{movie.title}</p>
                                    <div className="flex items-center text-accent-dark">
                                        <span>Rating:</span>
                                        <div className="flex ml-2">
                                            {Array.from({ length: movie.rating }, (_, index) => (
                                                <span key={index} className="text-accent-dark ml-1">★</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Kaldırma butonu */}
                                <button
                                    onClick={() => onRemove(movie)}
                                    className="ml-2 text-white bg-accent-dark rounded-full p-2 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* İzlenen filmin sayısı yeterince çoksa "Suggest Movies" butonu */}
                    {watchedMovies.length >= 5 && (
                        <button
                            className="w-full bg-primary text-white py-2 px-4 rounded mt-4 hover:bg-primary-light transition"
                            onClick={onSuggestMovies} // <-- Parent fonksiyonunu tetikliyor
                        >
                            Suggest Movies
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
