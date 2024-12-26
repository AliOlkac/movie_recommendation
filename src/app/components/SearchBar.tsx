"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
    onMovieSelect: (movie: any) => void;
}

export default function SearchBar({ onMovieSelect }: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // Kullanıcı her yazdığında API'den veri çekme
    useEffect(() => {
        const fetchSearchResults = async () => {
            if (searchTerm.trim() === "") {
                setSearchResults([]);
                return;
            }

            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchTerm}`
                );
                const data = await response.json();
                setSearchResults(data.results.slice(0, 5)); // İlk 5 öneriyi alın
            } catch (error) {
                console.error("Error fetching search results:", error);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults();
        }, 500); // Kullanıcı duraksayınca 500ms bekler

        return () => clearTimeout(delayDebounceFn); // Eski timeout'u temizler
    }, [searchTerm, apiKey]);

    return (
        <div className="flex flex-col items-center relative">
            {/* Arama Kutusu */}
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a movie..."
                className="input input-bordered w-full max-w-xs mb-4"
            />

            {/* Öneri Listesi */}
            {searchResults.length > 0 && (
                <ul className="search-results">
                    {searchResults.map((movie: any) => (
                        <li
                            key={movie.id}
                            onClick={() => {
                                onMovieSelect(movie);
                                setSearchTerm("");
                                setSearchResults([]);
                            }}
                        >
                            <img
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                alt={movie.title}
                            />
                            <span>{movie.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

