"use client";

import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import FavoritesList from "./components/FavoritesList";
import MoviesWatchedList from "./components/MoviesWatchedList";
import StarRating from "./components/StarRating";

interface Movie {
    id: number; // Filmin benzersiz kimliği
    title: string; // Filmin adı
    poster_path: string; // Poster görüntüsü yolu
    release_date: string; // Filmin yayınlanma tarihi (YYYY-MM-DD formatında)
    adult: boolean; // Yetişkin içerik olup olmadığını belirler
    overview: string; // Filmin açıklaması
    vote_average: number; // Filmin puan ortalaması
    vote_count: number; // Oy sayısı
    genre_ids: number[]; // Türlerin ID'leri
}

interface Recommendation {
    title: string;
    genres: string; // Flask API'den gelen tür bilgisi
}

interface WatchedMovie extends Movie {
    rating: number;
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]); // Favori filmler
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]); // İzlenen filmler
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]); // Popüler filmler
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null); // Seçilen film
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]); // Önerilen filmler
    const [loadingRecommendations, setLoadingRecommendations] = useState(false); // Öneri yükleniyor mu
    const [error, setError] = useState<string | null>(null); // Hata mesajı
    const [page, setPage] = useState(1); // Şu anki sayfa
    const [hasMore, setHasMore] = useState(true); // Daha fazla veri var mı

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // Popüler filmleri belirtilen sayfaya göre getirir
    const fetchMovies = async (currentPage: number) => {
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=${currentPage}&vote_count.gte=3000&sort_by=vote_count.desc`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                // Yetişkin içerikli olmayan filmleri filtrele
                const filteredMovies = data.results.filter((movie: Movie) => !movie.adult);

                setPopularMovies((prevMovies) => [...prevMovies, ...filteredMovies]);
            } else {
                setHasMore(false); // Daha fazla film yok
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
        }
    };




    // İlk yüklemede ve sayfa değiştikçe yeni filmleri getirir
    useEffect(() => {
        fetchMovies(page);
    }, [page]);

    // Sonsuz kaydırma için Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1); // Yeni sayfa yükle
                }
            },
            { threshold: 1.0 } // %100 görünür olduğunda tetiklenir
        );

        const sentinel = document.getElementById("scroll-sentinel"); // Gözlemlenecek öğe
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) observer.unobserve(sentinel); // Temizlik işlemi
        };
    }, [hasMore]);




    const handleSuggestMovies = async () => {
        setLoadingRecommendations(true);
        setError(null);

        // Kullanıcının izlediği en yüksek puanlı 10 filmi seç
        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

        const userRatings = selectedMovies.reduce<Record<string, number>>((acc, movie) => {
            acc[movie.title] = movie.rating;
            return acc;
        }, {});

        try {
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ratings: userRatings, top_n: 10 }),
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data || []);
                setPopularMovies([]);
            } else {
                setError("Failed to fetch recommendations");
                setRecommendations([]);
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            setError("Error fetching recommendations");
        } finally {
            setLoadingRecommendations(false);
        }
    };

    return (
        <div className="flex">
            <FavoritesList
                favorites={favorites}
                onRemove={(movie) =>
                    setFavorites(favorites.filter((fav) => fav.id !== movie.id))
                }
            />
            <MoviesWatchedList
                watchedMovies={watchedMovies}
                onRemove={(movie) =>
                    setWatchedMovies(
                        watchedMovies.filter((wm) => wm.id !== movie.id)
                    )
                }
            />

            <div className="flex-1 p-10">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-dark to-primary-light text-center">
                    MovieRecommendationHive
                </h1>

                <SearchBar onMovieSelect={setSelectedMovie}/>

                {selectedMovie && (
                    <div
                        className="relative mt-6 p-4 border border-gray-700 rounded shadow-md text-center bg-black bg-opacity-75">
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
                        <h3 className="text-lg font-bold mt-2 text-white">
                            {selectedMovie.title}
                        </h3>
                        <div className="flex justify-center mt-2">
                            <StarRating
                                onRate={(rating) => {
                                    setWatchedMovies([
                                        ...watchedMovies,
                                        { ...selectedMovie, rating },
                                    ]);
                                    setSelectedMovie(null);
                                }}
                            />
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() =>
                                    setFavorites([...favorites, selectedMovie])
                                }
                                className="btn bg-white text-black border border-gray-300 hover:bg-gray-100"
                            >
                                ❤ Add to Favorites
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-base-100 cursor-pointer"
                            onClick={() => {
                                setSelectedMovie(movie);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                        >
                            <h3 className="text-sm font-bold">{movie.title}</h3>
                            <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                className="mt-2"
                            />
                        </div>
                    ))}
                    <div id="scroll-sentinel" className="h-10"></div> {/* Sonsuz kaydırma için sentinel */}
                </div>

                {recommendations && recommendations.length > 0 ? (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-2">Recommended Movies:</h3>
                        <ul>
                            {recommendations.map((movie, index) => (
                                <li key={index} className="mb-2">
                                    {movie.title} - {movie.genres}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : error ? (
                    <div className="text-red-500 mt-4">{error}</div>
                ) : (
                    <p className="text-center mt-4">No recommendations available.</p>
                )}

                {loadingRecommendations && (
                    <div className="text-center mt-4">Loading recommendations...</div>
                )}

                {watchedMovies.length >= 10 && !loadingRecommendations && (
                    <button
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-700"
                        onClick={handleSuggestMovies}
                    >
                        Suggest Movies
                    </button>
                )}
            </div>
        </div>
    );
}
