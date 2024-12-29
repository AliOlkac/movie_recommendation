"use client"; // Bu dosyanın client-side render için kullanılacağını belirtir

import { useState } from "react"; // React Hook olan useState'i içe aktarır

// -----------------------------------------------------------------------------
// 1) Tip (interface) Tanımları
// -----------------------------------------------------------------------------

/** Filmleri temsil eden arayüz */
interface Movie {
    id: number; // Filmin benzersiz kimliği (ör: TMDB'den gelen id)
    title: string; // Filmin başlığı
    poster_path: string; // Poster görüntüsüne ulaşmak için yol (ör: "/poster.jpg")
}

/** Favori filmleri ve kaldırma işlevini temsil eden bileşenin özellikleri */
interface FavoritesListProps {
    favorites: Movie[]; // Favori filmler listesi
    onRemove: (movie: Movie) => void; // Bir filmi favorilerden kaldırmak için çağrılan işlev
}

// -----------------------------------------------------------------------------
// 2) Favoriler Listesi Bileşeni
// -----------------------------------------------------------------------------

/**
 * Bu bileşen, kullanıcıların favori filmlerini listelemelerini sağlar.
 * Kullanıcı, listeden bir filmi kaldırabilir veya paneli açıp kapatabilir.
 */
export default function FavoritesList({ favorites, onRemove }: FavoritesListProps) {
    // Panelin açık/kapalı durumunu kontrol eden state
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Favoriler Butonu */}
            <button
                className="fixed top-4 left-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)} // Butona tıklanınca panelin durumunu değiştir
            >
                ❤ {/* Butonun içindeki kalp simgesi */}
            </button>

            {/* Favoriler Paneli */}
            {isOpen && ( // Eğer panel açıksa, paneli render et
                <div
                    className="fixed left-0 top-0 h-full w-64 bg-primary-lighter text-accent-dark shadow-md p-4 overflow-y-auto z-40 rounded-lg"
                >
                    {/* Panel Başlığı */}
                    <h2 className="text-xl font-bold mb-4 text-center text-accent-dark favorites-list-header">
                        Favorites {/* Panel başlığı */}
                    </h2>

                    {/* Favoriler Listesi */}
                    <ul className="favorites-list mt-6">
                        {favorites.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                {/* Film Posteri */}
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Poster URL'si
                                    alt={movie.title} // Poster için alternatif metin
                                    className="w-12 h-18 mr-2 object-cover rounded-lg border border-primary"
                                />
                                {/* Film Başlığı */}
                                <div className="flex-1">
                                    <p className="text-accent-dark font-bold">{movie.title}</p> {/* Filmin adı */}
                                </div>
                                {/* Favorilerden Kaldırma Butonu */}
                                <button
                                    onClick={() => onRemove(movie)} // Favorilerden kaldırma işlevi
                                    className="ml-2 text-white bg-accent-dark rounded-full p-2 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    {/* Çarpı simgesi */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
