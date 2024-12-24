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
                className="fixed top-4 left-4 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                ❤
            </button>

            {/* Favoriler Paneli */}
            {isOpen && (
                <div
                    className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-md p-4 overflow-y-auto z-40">
                    <h2 className="text-xl font-bold mb-4" style={{paddingLeft: "4rem"}}>
                        Favorites
                    </h2>
                    <ul className="favorites-list" style={{marginTop: '2rem'}}>
                        {favorites.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-2 object-cover"
                                />
                                <div className="flex-1">
                                    <p>{movie.title}</p>
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
