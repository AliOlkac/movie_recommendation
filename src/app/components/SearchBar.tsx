"use client";

import { useState, useEffect } from "react";

// SearchBar bileşenine gelen özellikler için bir arayüz tanımı
interface SearchBarProps {
    onMovieSelect: (movie: any) => void; // Bir film seçildiğinde çalışacak işlev
}

// SearchBar bileşeni: Kullanıcının film araması yapmasını sağlar ve sonuçları önerir
export default function SearchBar({ onMovieSelect }: SearchBarProps) {
    // Arama terimini saklamak için state
    const [searchTerm, setSearchTerm] = useState("");
    // API'den gelen arama sonuçlarını saklamak için state
    const [searchResults, setSearchResults] = useState([]);
    // TMDB API anahtarı (ortam değişkeninden alınır)
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // Kullanıcı her yazdığında API'den veri çekmek için `useEffect`
    useEffect(() => {
        // Arama sonuçlarını API'den getiren fonksiyon
        const fetchSearchResults = async () => {
            // Eğer arama terimi boşsa sonuçları temizle
            if (searchTerm.trim() === "") {
                setSearchResults([]);
                return;
            }

            try {
                // TMDB API'sine arama isteği gönder
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchTerm}`
                );
                const data = await response.json();
                setSearchResults(data.results.slice(0, 5)); // İlk 5 öneriyi sonuçlara ekle
            } catch (error) {
                console.error("Error fetching search results:", error); // Hata durumunda log yazdır
            }
        };

        // Kullanıcının yazmayı bitirmesini beklemek için debounce mekanizması
        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults(); // API çağrısını yap
        }, 500); // Kullanıcı duraksadıktan sonra 500ms bekler

        return () => clearTimeout(delayDebounceFn); // Eski timeout'u temizler
    }, [searchTerm, apiKey]); // `searchTerm` veya `apiKey` değişirse `useEffect` yeniden çalışır

    return (
        <div className="flex flex-col items-center relative">
            {/* Arama kutusu */}
            <input
                type="text" // Metin girişi
                value={searchTerm} // Kullanıcının girdiği terimi bağla
                onChange={(e) => setSearchTerm(e.target.value)} // Kullanıcı bir şey yazdığında `searchTerm` state'ini güncelle
                placeholder="Search for a movie..." // Placeholder metni
                className="w-full max-w-xs p-4 border-2 border-primary-light rounded-full bg-primary-lighter text-accent-dark placeholder-accent focus:outline-none focus:ring-4 focus:ring-primary shadow-lg transition duration-300 ease-in-out"
            />

            {/* Öneri listesi */}
            {searchResults.length > 0 && ( // Eğer sonuç varsa listeyi göster
                <ul className="search-results">
                    {searchResults.map((movie: any) => (
                        <li
                            key={movie.id} // Her film için benzersiz bir anahtar
                            onClick={() => {
                                onMovieSelect(movie); // Bir film seçildiğinde `onMovieSelect` işlevini çağır
                                setSearchTerm(""); // Arama kutusunu temizle
                                setSearchResults([]); // Öneri listesini temizle
                            }}
                        >
                            {/* Film posteri */}
                            <img
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Film posterinin URL'si
                                alt={movie.title} // Poster için alternatif metin
                            />
                            {/* Film başlığı */}
                            <span>{movie.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
