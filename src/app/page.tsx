"use client";

import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import FavoritesList from "./components/FavoritesList";
import MoviesWatchedList from "./components/MoviesWatchedList";
import StarRating from "./components/StarRating"; // StarRating bileşenini import ettik

interface Movie {
    id: number;
    title: string;
    poster_path: string;
}

interface WatchedMovie extends Movie {
    rating: number;
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                // Ana popüler filmleri al
                const responseMain = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
                );
                const dataMain = await responseMain.json();
                const limitedMovies = dataMain.results.slice(0, 20);

                // Komedi türünden filmleri al
                const responseComedy = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=35`
                );
                const dataComedy = await responseComedy.json();

                // Çakışmayan komedi filmlerini seç
                const comedyMovies = dataComedy.results.filter(
                    (comedyMovie: any) =>
                        !limitedMovies.some((mainMovie: any) => mainMovie.id === comedyMovie.id)
                );

                // İlk 4 komedi filmini seç
                const extraMovies = comedyMovies.slice(0, 4);

                // Ana filmler ve ekstra komedi filmlerini birleştir
                const moviesWithExtras = [...limitedMovies, ...extraMovies];

                setPopularMovies(moviesWithExtras);
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };

        fetchMovies();
    }, [apiKey]);

    // Filme tıklandığında ekranı yukarı kaydırma fonksiyonu
    const handleMovieClick = (movie: Movie) => {
        setSelectedMovie(movie);
        window.scrollTo({
            top: 0, // Sayfanın en üst kısmına kaydır
            behavior: "smooth", // Animasyonlu kaydırma
        });
    };

    const handleAddToFavorites = (movie: Movie) => {
        if (!favorites.find((fav) => fav.id === movie.id)) {
            setFavorites([...favorites, movie]);
            setSelectedMovie(null); // Favoriye eklenirse seçili film sıfırlanır
        }
    };

    const handleAddToWatched = (rating: number) => {
        if (selectedMovie) {
            setWatchedMovies([...watchedMovies, { ...selectedMovie, rating }]);
            setSelectedMovie(null); // İzlenenlere eklenirse seçili film sıfırlanır
        }
    };

    const handleRemoveFromFavorites = (movie: Movie) => {
        setFavorites(favorites.filter((fav) => fav.id !== movie.id));
    };

    const handleRemoveFromWatched = (movie: WatchedMovie) => {
        setWatchedMovies(watchedMovies.filter((wm) => wm.id !== movie.id));
    };

    return (
        <div className="flex">
            {/* Favoriler Paneli */}
            <FavoritesList favorites={favorites} onRemove={handleRemoveFromFavorites} />

            {/* İzlenen Filmler Paneli */}
            <MoviesWatchedList watchedMovies={watchedMovies} onRemove={handleRemoveFromWatched} />

            <div className="flex-1 p-10">
                <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">
                    Welcome to MovieMatchHub
                </h1>

                {/* Search Bar */}
                <SearchBar onMovieSelect={setSelectedMovie} />

                {/* Orta Pencere: Seçilen Film */}
                {selectedMovie && (
                    <div
                        className="relative mt-6 p-4 border border-gray-700 rounded shadow-md text-center bg-black bg-opacity-75"
                    >
                        {/* Çarpı Butonu */}
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
                        <div className="flex justify-center mt-2">
                            {/* StarRating bileşeni */}
                            <StarRating onRate={(rating) => handleAddToWatched(rating)} />
                        </div>
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

                {/* Popüler Filmler */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-base-100 cursor-pointer"
                            onClick={() => handleMovieClick(movie)} // Güncel fonksiyon
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

