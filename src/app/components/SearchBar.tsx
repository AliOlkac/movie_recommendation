"use client";

import { useState } from "react";

interface SearchBarProps {
    onMovieSelect: (movie: any) => void;
}

export default function SearchBar({ onMovieSelect }: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    const handleSearch = async () => {
        if (searchTerm.trim() === "") return;

        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchTerm}`
            );
            const data = await response.json();
            setSearchResults(data.results.slice(0, 5)); // İlk 5 sonucu alın
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* Arama Çubuğu */}
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a movie..."
                className="input input-bordered w-full max-w-xs mb-4"
            />
            <button onClick={handleSearch} className="btn btn-primary">
                Search
            </button>

            {/* Arama Sonuçları */}
            {searchResults.length > 0 && (
                <ul
                    className="absolute top-full mt-4 w-full max-w-lg bg-black bg-opacity-95 text-white rounded-lg shadow-lg p-4 flex flex-col items-center z-50"
                >
                    {searchResults.map((movie: any) => (
                        <li
                            key={movie.id}
                            onClick={() => {
                                onMovieSelect(movie);
                                setSearchTerm("");
                                setSearchResults([]);
                            }}
                            className="flex items-center cursor-pointer p-2 hover:bg-gray-700 rounded w-full"
                        >
                            {movie.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-18 mr-4 object-cover rounded"
                                />
                            )}
                            <span className="truncate">{movie.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
