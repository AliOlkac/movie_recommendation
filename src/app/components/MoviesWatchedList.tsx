"use client";

import { useState } from "react";

// İzlenen filmleri temsil eden arayüz
interface WatchedMovie {
    id: number; // Filmin benzersiz kimliği
    title: string; // Filmin başlığı
    poster_path: string; // Poster görüntüsü yolu
    rating: number; // Filmin kullanıcı tarafından verilen puanı
}

// MoviesWatchedList bileşeni için özellikleri tanımlayan arayüz
interface MoviesWatchedListProps {
    watchedMovies: WatchedMovie[]; // İzlenen filmleri içeren bir dizi
    onRemove: (movie: WatchedMovie) => void; // Bir filmi izlenenlerden kaldırmak için işlev
}

// İzlenen filmleri yöneten React bileşeni
export default function MoviesWatchedList({ watchedMovies, onRemove }: MoviesWatchedListProps) {
    const [isOpen, setIsOpen] = useState(false); // Panelin açık/kapalı durumunu takip eden state
    const [recommendations, setRecommendations] = useState<WatchedMovie[]>([]); // Önerilen filmleri tutan state

    // Öneriler almak için Flask API'sine POST isteği yapan işlev
    const handleSuggestMovies = async () => {
        // İzlenen en yüksek puanlı 10 filmi seç
        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating) // Filme verilen puana göre sıralama
            .slice(0, 10); // İlk 10 filmi seç

        // Flask API'ye gönderilecek veri formatını oluştur
        const movieData = selectedMovies.map((movie) => ({
            film_adi: movie.title, // Filmin başlığı
            yildiz_sayi: movie.rating, // Kullanıcı puanı
        }));

        console.log("Gönderilen JSON Verisi:", JSON.stringify({ movies: movieData }));

        try {
            // Flask API'ye POST isteği
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movies: movieData }), // JSON formatında veri gönderimi
            });

            const data = await response.json(); // API'den dönen veriyi al
            setRecommendations(data.recommendations); // Önerileri state'e kaydet
        } catch (error) {
            console.error("Error fetching recommendations:", error); // Hata durumunda konsola yazdır
        }
    };

    return (
        <>
            {/* İzlenen filmleri gösteren paneli açma/kapatma butonu */}
            <button
                className="fixed top-4 right-4 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-md z-50"
                onClick={() => setIsOpen(!isOpen)} // Panel durumunu değiştirir
            >
                🎬 {/* Buton simgesi */}
            </button>

            {/* Panelin açık olduğu durumda içeriğin gösterilmesi */}
            {isOpen && (
                <div
                    className="fixed right-0 top-0 h-full w-72 bg-primary-lighter text-accent-dark shadow-md p-4 overflow-y-auto z-40 rounded-lg"
                >
                    {/* Panel başlığı */}
                    <h2 className="text-xl font-bold mb-4 text-center text-accent-dark watched-movies-header">
                        Movies Watched
                    </h2>

                    {/* İzlenen filmleri listeleme */}
                    <ul className="watched-movies-list mt-6">
                        {watchedMovies.map((movie) => (
                            <li key={movie.id} className="flex items-center mb-4">
                                {/* Film posteri */}
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Poster URL'si
                                    alt={movie.title} // Alternatif metin
                                    className="w-12 h-18 mr-2 object-cover rounded-lg border border-primary"
                                />
                                {/* Film bilgileri */}
                                <div className="flex-1">
                                    <p className="text-accent-dark font-bold">{movie.title}</p>
                                    <div className="flex items-center text-accent-dark">
                                        <span>Rating:</span>
                                        <div className="flex ml-2">
                                            {/* Film için yıldızlarla puan gösterimi */}
                                            {Array.from({ length: movie.rating }, (_, index) => (
                                                <span key={index} className="text-accent-dark ml-1">★</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* İzlenenlerden kaldırma butonu */}
                                <button
                                    onClick={() => onRemove(movie)} // Filmi kaldırma işlevi
                                    className="ml-2 text-white bg-accent-dark rounded-full p-2 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg flex items-center justify-center"
                                >
                                    ✕ {/* Çarpı simgesi */}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Öneri almak için buton */}
                    {watchedMovies.length >= 5 && (
                        <button
                            className="w-full bg-primary text-white py-2 px-4 rounded mt-4 hover:bg-primary-light transition"
                            onClick={handleSuggestMovies} // Öneri alma işlevini çağırır
                        >
                            Suggest Movies
                        </button>
                    )}

                    {/* Öneriler Listesi */}
                    {recommendations && recommendations.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-bold mb-2 text-accent-dark">Recommended Movies:</h3>
                            <ul>
                                {recommendations.map((movie, index) => (
                                    <li key={index} className="mb-2">
                                        {movie.title} {/* Önerilen filmin başlığı */}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
