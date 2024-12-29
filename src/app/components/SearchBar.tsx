"use client"; // Bu dosyanın client-side render için çalışacağını belirtir

import { useState, useEffect } from "react"; // React Hook'larını içe aktarır

// -----------------------------------------------------------------------------
// 1) Arayüz Tanımları
// -----------------------------------------------------------------------------

/** SearchBar bileşenine gelen özelliklerin tanımı */
interface SearchBarProps {
    onMovieSelect: (movie: any) => void; // Kullanıcı bir film seçtiğinde çağrılacak işlev
}

// -----------------------------------------------------------------------------
// 2) Bileşen Tanımı
// -----------------------------------------------------------------------------

/**
 * SearchBar bileşeni, kullanıcıların film araması yapmasını ve öneri listesinden seçim yapmasını sağlar.
 */
export default function SearchBar({ onMovieSelect }: SearchBarProps) {
    // Arama terimi state'i (kullanıcının girdiği metni tutar)
    const [searchTerm, setSearchTerm] = useState("");
    // API'den dönen arama sonuçları
    const [searchResults, setSearchResults] = useState([]);
    // TMDB API anahtarı (ortam değişkeninden alınır)
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // -------------------------------------------------------------------------
    // 3) Arama İşlemi ve Debounce
    // -------------------------------------------------------------------------

    /**
     * Kullanıcı bir şey yazdığında TMDB API'ye istek göndererek sonuçları alır.
     */
    useEffect(() => {
        // TMDB'den arama sonuçlarını getiren yardımcı bir fonksiyon
        const fetchSearchResults = async () => {
            // Eğer arama terimi boşsa, sonuçları temizle
            if (searchTerm.trim() === "") {
                setSearchResults([]); // Sonuçlar sıfırlanır
                return;
            }

            try {
                // TMDB API'sine istek gönder
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchTerm}`
                );
                const data = await response.json(); // Yanıtı JSON'a çevir
                setSearchResults(data.results.slice(0, 5)); // İlk 5 sonucu kaydet
            } catch (error) {
                console.error("Error fetching search results:", error); // Hata durumunda log yazdır
            }
        };

        // Kullanıcının yazmayı bitirmesini beklemek için debounce mekanizması
        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults(); // API çağrısı yapılır
        }, 500); // Kullanıcı duraksadıktan sonra 500ms bekler

        // Temizlik: Yeni bir arama yapılmadan önce önceki timeout temizlenir
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, apiKey]); // Arama terimi veya API anahtarı değiştiğinde çalışır

    // -------------------------------------------------------------------------
    // 4) Render Edilen Kısım
    // -------------------------------------------------------------------------

    return (
        <div className="flex flex-col items-center relative">
            {/* Arama Kutusu */}
            <input
                type="text" // Metin girişi
                value={searchTerm} // Kullanıcının girdiği metni bağlar
                onChange={(e) => setSearchTerm(e.target.value)} // Kullanıcı her yazdığında state güncellenir
                placeholder="Search for a movie..." // Kullanıcıya rehberlik eden metin
                className="w-full max-w-xs p-4 border-2 border-primary-light rounded-full bg-primary-lighter text-accent-dark placeholder-accent focus:outline-none focus:ring-4 focus:ring-primary shadow-lg transition duration-300 ease-in-out"
            />

            {/* Öneri Listesi */}
            {searchResults.length > 0 && ( // Eğer sonuçlar varsa
                <ul className="search-results">
                    {searchResults.map((movie: any) => (
                        <li
                            key={movie.id} // Her film için benzersiz bir anahtar
                            onClick={() => {
                                onMovieSelect(movie); // Seçilen film parent bileşene bildirilir
                                setSearchTerm(""); // Arama kutusu temizlenir
                                setSearchResults([]); // Öneri listesi sıfırlanır
                            }}
                        >
                            {/* Film Posteri */}
                            <img
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Poster URL'si
                                alt={movie.title} // Alternatif metin
                            />
                            {/* Film Başlığı */}
                            <span>{movie.title}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
