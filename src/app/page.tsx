"use client"; // Bu dosyanın client-side render için kullanılacağını belirtiyor

import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import FavoritesList from "./components/FavoritesList";
import MoviesWatchedList from "./components/MoviesWatchedList";
import StarRating from "./components/StarRating";

// Film verilerini tanımlayan bir TypeScript arayüzü
interface Movie {
    id: number;
    title: string;
    poster_path: string;
    release_date: string;
    adult: boolean;
    overview: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
}

// Önerilen Filmleri tanımlayan bir arayüz
interface Recommendation {
    movieId: number;
    tmdbId: number;
    title: string;
    genres: string;
    poster_path?: string;    // TMDB'den çekilecek
    release_date?: string;   // TMDB'den çekilecek
    overview?: string;       // TMDB'den çekilecek
    vote_average?: number;   // TMDB'den çekilecek
}

// İzlenen filmlere ek olarak kullanıcı puanı içeren bir arayüz
interface WatchedMovie extends Movie {
    rating: number; // Kullanıcının filme verdiği puan
}

export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    // Öneriler ve yükleme-hata durumları
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sonsuz kaydırma sayfası
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // TMDB API key
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // =======================================
    // 1) Popüler filmleri çekmek
    // =======================================
    const fetchMovies = async (currentPage: number) => {
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=${currentPage}&vote_count.gte=3000&sort_by=vote_count.desc`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                // Yetişkin içerikli filmleri filtrele
                const filteredMovies = data.results.filter((movie: Movie) => !movie.adult);
                // Yeni filmleri mevcut listeye ekle
                setPopularMovies((prev) => [...prev, ...filteredMovies]);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error fetching movies:", err);
        }
    };

    // Sayfa veya bileşen ilk yüklendiğinde popüler filmleri getir
    useEffect(() => {
        fetchMovies(page);
    }, [page]);

    // Sonsuz kaydırma (infinite scroll)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            },
            { threshold: 1.0 }
        );

        const sentinel = document.getElementById("scroll-sentinel");
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) observer.unobserve(sentinel);
        };
    }, [hasMore]);

    // =======================================
    // 2) TMDB’den film detaylarını çekmek
    // =======================================
    async function enrichRecommendationsWithTmdbData(recs: Recommendation[]) {
        const enriched: Recommendation[] = [];

        for (const r of recs) {
            if (!r.tmdbId || !apiKey) {
                // tmdbId yoksa direkt ekle
                enriched.push(r);
                continue;
            }
            try {
                const tmdbRes = await fetch(
                    `https://api.themoviedb.org/3/movie/${r.tmdbId}?api_key=${apiKey}`
                );
                if (!tmdbRes.ok) {
                    enriched.push(r);
                    continue;
                }
                const tmdbData = await tmdbRes.json();
                enriched.push({
                    ...r,
                    poster_path: tmdbData.poster_path,
                    release_date: tmdbData.release_date,
                    overview: tmdbData.overview,
                    vote_average: tmdbData.vote_average,
                });
            } catch (error) {
                console.error("Error fetching TMDB details:", error);
                enriched.push(r);
            }
        }

        return enriched;
    }

    // =======================================
    // 3) Flask API'ye öneriler için istek gönderme
    // =======================================
    async function handleSuggestMovies() {
        setLoadingRecommendations(true);
        setError(null);

        try {
            // Kullanıcının en çok puan verdiği ilk 10 filmi alalım
            const topRatedMovies = [...watchedMovies]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10);

            // userRatings => { "Shutter Island": 5, "Fight Club": 4, ... }
            const userRatings: Record<string, number> = {};
            for (const movie of topRatedMovies) {
                userRatings[movie.title] = movie.rating;
            }

            console.log("Gönderilen userRatings:", userRatings);

            // Flask'a POST isteği
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ratings: userRatings, top_n: 10 }),
            });

            if (!response.ok) {
                setError("Failed to fetch recommendations");
                setLoadingRecommendations(false);
                return;
            }

            const data = await response.json();
            console.log("Flask'tan gelen öneriler:", data);

            // data => [
            //   { movieId: 50, tmdbId: 629, title: "...", genres: "..." },
            //   ...
            // ]

            // TMDB'den poster gibi detayları çekelim
            const enriched = await enrichRecommendationsWithTmdbData(data);
            setRecommendations(enriched);

        } catch (err: any) {
            console.error("Hata:", err);
            setError(err.message || "Error fetching recommendations");
        } finally {
            setLoadingRecommendations(false);
            // Popüler filmleri temizlemek istersen:
            setPopularMovies([]);
        }
    }

    // =======================================
    // Render
    // =======================================
    return (
        <div className="flex">
            <div className="flex-1 p-10">
                <div className="flex-1 p-10 text-center">
                    <img
                        src="/NextFilmsLogo_1.png"
                        alt="MovieRecommendationHive Logo"
                        className="mx-auto"
                        style={{ width: "400px", height: "auto", scale: 1.5 }}
                    />
                </div>

                {/* Favori filmleri listele */}
                <FavoritesList
                    favorites={favorites}
                    onRemove={(movie) =>
                        setFavorites((prev) => prev.filter((fav) => fav.id !== movie.id))
                    }
                />

                {/* İzlenen filmleri listele */}
                <MoviesWatchedList
                    watchedMovies={watchedMovies}
                    onRemove={(movie) =>
                        setWatchedMovies((prev) => prev.filter((wm) => wm.id !== movie.id))
                    }
                />

                {/* Arama çubuğu */}
                <SearchBar onMovieSelect={setSelectedMovie} />

                {/* Seçilen film için modal */}
                {selectedMovie && (
                    <div
                        className="relative mt-6 p-4 border border-primary-dark rounded shadow-md text-center bg-primary-light bg-opacity-90"
                        id="rating-section"
                    >
                        <button
                            className="absolute top-4 right-4 text-white bg-accent-dark rounded-full p-3 hover:bg-accent transition transform duration-200 ease-in-out shadow-lg"
                            onClick={() => setSelectedMovie(null)}
                        >
                            ✕
                        </button>
                        <img
                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            className="mx-auto rounded-lg border border-primary"
                        />
                        <h3 className="text-lg font-bold mt-2 text-accent-dark">
                            {selectedMovie.title}
                        </h3>
                        <div className="flex justify-center mt-2">
                            <StarRating
                                onRate={(rating) => {
                                    setWatchedMovies((prev) => [
                                        ...prev,
                                        { ...selectedMovie, rating },
                                    ]);
                                    setSelectedMovie(null);
                                }}
                            />
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setFavorites((prev) => [...prev, selectedMovie]);
                                    setSelectedMovie(null);
                                }}
                                className="btn bg-accent text-white border border-accent-dark hover:bg-accent-dark transition"
                            >
                                ❤ Add to Favorites
                            </button>
                        </div>
                    </div>
                )}

                {/* Popüler filmleri listele */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-primary-light cursor-pointer hover:shadow-lg transition"
                            onClick={() => {
                                setSelectedMovie(movie);
                                const ratingSection = document.getElementById("rating-section");
                                if (ratingSection) {
                                    ratingSection.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                    });
                                }
                            }}
                        >
                            <h3 className="text-sm font-bold text-accent-dark">
                                {movie.title}
                            </h3>
                            <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                className="mt-2 rounded-lg border border-primary"
                            />
                        </div>
                    ))}
                    <div id="scroll-sentinel" className="h-10"></div>
                </div>

                {/* Öneri listesi */}
                {recommendations && recommendations.length > 0 ? (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-2 text-accent-dark">
                            Recommended Movies:
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                            {recommendations.map((movie, index) => (
                                <div
                                    key={index}
                                    className="card shadow-md p-2 bg-primary-light"
                                >
                                    <h4 className="text-sm font-bold text-accent-dark mb-1">
                                        {movie.title}
                                    </h4>
                                    {movie.poster_path && (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                            alt={movie.title}
                                            className="rounded-lg border border-primary"
                                        />
                                    )}
                                    <p className="text-xs text-accent">
                                        {movie.genres}
                                    </p>
                                    {movie.overview && (
                                        <p className="text-xs text-accent mt-2">
                                            {movie.overview.slice(0, 80)}...
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-accent-dark mt-4">{error}</div>
                ) : (
                    <p className="text-center mt-4 text-accent">
                        No recommendations available.
                    </p>
                )}

                {/* Yükleme durumu */}
                {loadingRecommendations && (
                    <div className="text-center mt-4 text-accent">
                        Loading recommendations...
                    </div>
                )}

                {/* Öneri butonu */}
                {watchedMovies.length >= 10 && !loadingRecommendations && (
                    <button
                        className="w-full bg-primary text-white py-2 px-4 rounded mt-4 hover:bg-primary-dark transition"
                        onClick={handleSuggestMovies}
                    >
                        Suggest Movies
                    </button>
                )}
            </div>
        </div>
    );
}
