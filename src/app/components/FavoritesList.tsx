"use client";

import { useState } from "react";

interface Movie {
    id: number;
    title: string;
    poster_path: string;
}

interface FavoritesListProps {
    favorites: Movie[];
    onRemove: (movie: Movie) => void;
}

export default function FavoritesList({ favorites, onRemove }: FavoritesListProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Favoriler Butonu */}
            <button
                className="fixed top-4 left-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                ❤
            </button>


            {/* Favoriler Paneli */}
            {isOpen && (
                <div
                    className="fixed left-0 top-0 h-full w-64 bg-primary-lighter text-accent-dark shadow-md p-4 overflow-y-auto z-40 rounded-lg"
                >
                    {/* Başlık */}
                    <h2 className="text-xl font-bold mb-4 text-center text-accent-dark favorites-list-header">
                        Favorites
                    </h2>

                    {/* Favoriler Listesi */}
                    <ul className="favorites-list mt-6">
                        {favorites.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-2 object-cover rounded-lg border border-primary"
                                />
                                <div className="flex-1">
                                    <p className="text-accent">{movie.title}</p>
                                </div>
                                <button
                                    onClick={() => onRemove(movie)}
                                    className="ml-2 text-white bg-accent-dark rounded-full p-2 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            )}
        </>
    );
}

