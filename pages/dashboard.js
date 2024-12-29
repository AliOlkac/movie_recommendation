"use client"; // <-- Bu dosyanın (dashboard.js) Next.js tarafında client-side render edileceğini belirtir

import { useEffect, useState } from "react"; // <-- React Hook'ları import ediyoruz
import SearchBar from "../src/app/components/SearchBar"; // <-- Arama bileşeni
import FavoritesList from "../src/app/components/FavoritesList"; // <-- Favoriler bileşeni
import MoviesWatchedList from "../src/app/components/MoviesWatchedList"; // <-- İzlenen filmler bileşeni
import StarRating from "../src/app/components/StarRating"; // <-- Yıldız puanlama bileşeni

// -----------------------------------------------------------------------------
// Dashboard Bileşeni
// -----------------------------------------------------------------------------
export default function Dashboard() {
    // -------------------------------------------------------------------------
    // State Tanımlamaları
    // -------------------------------------------------------------------------
    const [favorites, setFavorites] = useState([]); // Favori filmleri tutan state
    const [watchedMovies, setWatchedMovies] = useState([]); // İzlenen filmleri tutan state
    const [popularMovies, setPopularMovies] = useState([]); // Popüler filmleri tutan state
    const [selectedMovie, setSelectedMovie] = useState(null); // Seçilen filmi tutar
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY; // TMDB API anahtarı

    // -------------------------------------------------------------------------
    // 1) TMDB'den Popüler ve Komedi Filmleri Çekme
    // -------------------------------------------------------------------------
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                // Popüler filmleri çekmek için TMDB API'sine istek gönderiyoruz
                const responseMain = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const dataMain = await responseMain.json();
                const limitedMovies = dataMain.results.slice(0, 20); // İlk 20 filmi seçiyoruz

                // Komedi filmleri için ayrı bir istek gönderiyoruz
                const responseComedy = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=35`
                );
                const dataComedy = await responseComedy.json();

                // Komedi filmlerini popüler filmlerle çakışmayacak şekilde filtreliyoruz
                const comedyMovies = dataComedy.results.filter(
                    (comedyMovie) =>
                        !limitedMovies.some((mainMovie) => mainMovie.id === comedyMovie.id)
                );

                // Ekstra olarak 4 komedi filmini ekliyoruz
                const extraMovies = comedyMovies.slice(0, 4);
                const moviesWithExtras = [...limitedMovies, ...extraMovies];

                setPopularMovies(moviesWithExtras); // Popüler filmleri state'e kaydediyoruz
            } catch (error) {
                console.error("Error fetching movies:", error); // Hata loglama
            }
        };

        fetchMovies(); // Filmleri çekmek için fonksiyonu çağırıyoruz
    }, [apiKey]); // `apiKey` değiştiğinde yeniden çalışır

    // -------------------------------------------------------------------------
    // 2) Event Handler Fonksiyonları
    // -------------------------------------------------------------------------

    // Film kartına tıklama
    const handleMovieClick = (movie) => {
        setSelectedMovie(movie); // Seçilen filmi kaydeder
        window.scrollTo({
            top: 0, // Sayfanın en üstüne kaydırır
            behavior: "smooth", // Animasyonlu kaydırma
        });
    };

    // Favorilere ekleme
    const handleAddToFavorites = (movie) => {
        if (!favorites.find((fav) => fav.id === movie.id)) {
            setFavorites([...favorites, movie]); // Favorilere filmi ekler
            setSelectedMovie(null); // Modal'ı kapatır
        }
    };

    // İzlenen filmlere ekleme
    const handleAddToWatched = (rating) => {
        if (selectedMovie) {
            setWatchedMovies([...watchedMovies, { ...selectedMovie, rating }]); // İzlenen filmleri günceller
            setSelectedMovie(null); // Modal'ı kapatır
        }
    };

    // Favorilerden kaldırma
    const handleRemoveFromFavorites = (movie) => {
        setFavorites(favorites.filter((fav) => fav.id !== movie.id)); // Favoriler listesini günceller
    };

    // İzlenen filmlerden kaldırma
    const handleRemoveFromWatched = (movie) => {
        setWatchedMovies(watchedMovies.filter((wm) => wm.id !== movie.id)); // İzlenen filmleri günceller
    };

    // -------------------------------------------------------------------------
    // 3) Ekran Çıktısı (Render Edilen Kısım)
    // -------------------------------------------------------------------------
    return (
        <div className="flex">
            {/* Favoriler Bileşeni */}
            <FavoritesList favorites={favorites} onRemove={handleRemoveFromFavorites} />

            {/* İzlenen Filmler Bileşeni */}
            <MoviesWatchedList watchedMovies={watchedMovies} onRemove={handleRemoveFromWatched} />

            <div className="flex-1 p-10">
                {/* Başlık */}
                <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">
                    Welcome to MovieMatchHub
                </h1>

                {/* Arama Bileşeni */}
                <SearchBar onMovieSelect={setSelectedMovie} />

                {/* Seçili Filmin Detayları */}
                {selectedMovie && (
                    <div className="relative mt-6 p-4 border border-gray-700 rounded shadow-md text-center bg-black bg-opacity-75">
                        <button
                            className="absolute top-4 right-4 text-white bg-purple-700 rounded-full p-3 hover:bg-purple-900 hover:scale-110 transition transform duration-200 ease-in-out shadow-lg"
                            onClick={() => setSelectedMovie(null)}
                        >
                            ✕
                        </button>

                        <img
                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            className="mx-auto"
                        />
                        <h3 className="text-lg font-bold mt-2 text-white">{selectedMovie.title}</h3>

                        {/* Yıldız Puanlama */}
                        <div className="flex justify-center mt-2">
                            <StarRating onRate={(rating) => handleAddToWatched(rating)} />
                        </div>

                        {/* Favorilere Ekleme Butonu */}
                        <div className="mt-4">
                            <button
                                onClick={() => handleAddToFavorites(selectedMovie)}
                                className="btn bg-white text-black border border-gray-300 hover:bg-gray-100"
                            >
                                <span className="text-red-500">❤</span> Add to Favorites
                            </button>
                        </div>
                    </div>
                )}

                {/* Popüler Filmleri Listeleme */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-base-100 cursor-pointer"
                            onClick={() => handleMovieClick(movie)}
                        >
                            <h3 className="text-sm font-bold">{movie.title}</h3>
                            {movie.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                    alt={movie.title}
                                    className="mt-2"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
