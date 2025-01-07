"use client"; // Bu dosyanın client-side render için kullanılacağını belirtir

import { useState } from "react"; // React Hook olan useState'i içe aktarır

// ---------------------------------------------------------------------
// 1) Arayüz Tipleri
// ---------------------------------------------------------------------

/** Kullanıcının izlediği filmleri temsil eden arayüz */
interface WatchedMovie {
    id: number; // Filmin benzersiz kimliği
    title: string; // Filmin başlığı
    poster_path: string; // Poster görüntüsü yolu
    rating: number; // Kullanıcının filme verdiği puan
}

/** Bileşene gelen özellikleri tanımlayan arayüz */
interface MoviesWatchedListProps {
    watchedMovies: WatchedMovie[]; // İzlenen filmleri içeren liste
    onRemove: (movie: WatchedMovie) => void; // Bir filmi izlenenlerden kaldırmak için işlev
    onSuggestMovies: () => void; // Öneri almak için parent fonksiyonunu tetikleyen işlev
}

// ---------------------------------------------------------------------
// 2) Bileşen
// ---------------------------------------------------------------------

/**
 * Kullanıcının izlediği filmleri listeleyen ve puanlarını gösteren bir bileşen.
 * Ayrıca kullanıcı yeterince film izlediyse "Suggest Movies" butonuyla öneri almayı sağlar.
 */
export default function MoviesWatchedList({
                                              watchedMovies, // Kullanıcının izlediği filmler
                                              onRemove, // Filmleri kaldırmak için parent'tan gelen işlev
                                              onSuggestMovies, // Öneri almak için parent'tan gelen işlev
                                          }: MoviesWatchedListProps) {
    const [isOpen, setIsOpen] = useState(false); // Panelin açık/kapalı durumunu takip eden state

    return (
        <>
            {/* Yanda açılan paneli kontrol eden buton */}
            <button
                className="fixed top-4 right-4 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)} // Butona tıklanınca paneli aç/kapat
            >
                🎬 {/* Paneli açma/kapatma için buton simgesi */}
            </button>

            {/* Eğer panel açıksa */}
            {isOpen && (
                <div className="fixed right-0 top-0 h-full w-72 bg-primary-lighter text-accent-dark shadow-md p-4 overflow-y-auto z-40 rounded-lg">
                    {/* Panel başlığı */}
                    <h2 className="text-xl font-bold mb-4 text-center text-accent-dark watched-movies-header">
                        Movies Watched {/* Panel başlığı */}
                    </h2>

                    {/* İzlenen filmler listesi */}
                    <ul className="watched-movies-list mt-6">
                        {watchedMovies.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                {/* Poster görüntüsü */}
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Film posteri URL'si
                                    alt={movie.title} // Poster için alternatif metin
                                    className="w-12 h-18 mr-2 object-cover rounded-lg border border-primary"
                                />
                                {/* Film başlığı ve puan */}
                                <div className="flex-1">
                                    <p className="text-accent-dark font-bold">{movie.title}</p>
                                    <div className="flex items-center text-accent-dark">
                                        <span>Rating:</span> {/* Kullanıcı puanı başlığı */}
                                        <div className="flex ml-2">
                                            {/* Kullanıcının verdiği puan kadar yıldız oluştur */}
                                            {Array.from({ length: movie.rating }, (_, index) => (
                                                <span key={index} className="text-accent-dark ml-1">★</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* İzlenen filmlerden kaldırma butonu */}
                                <button
                                    onClick={() => onRemove(movie)} // Parent'tan gelen kaldırma işlevini çağır
                                    className="ml-2 text-white bg-accent-dark rounded-full p-2 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    ✕ {/* Çarpı simgesi */}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Kullanıcı en az 5 film izlediyse "Suggest Movies" butonunu göster */}
                    {watchedMovies.length >= 5 && (
                        <button
                            className="w-full bg-primary text-white py-2 px-4 rounded mt-4 hover:bg-primary-light transition"
                            onClick={onSuggestMovies} // Parent fonksiyonunu çağır
                        >
                            Suggest Movies {/* Buton metni */}
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
