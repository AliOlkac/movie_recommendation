"use client"; // Bu dosyanın client-side render için kullanılacağını belirtiyor

import { useEffect, useState } from "react"; // React'ten gerekli hook'lar import ediliyor
import SearchBar from "./components/SearchBar"; // Arama bileşeni
import FavoritesList from "./components/FavoritesList"; // Favori filmler bileşeni
import MoviesWatchedList from "./components/MoviesWatchedList"; // İzlenen filmler bileşeni
import StarRating from "./components/StarRating"; // Yıldız ile puanlama bileşeni

// Film verilerini tanımlayan bir TypeScript arayüzü
interface Movie {
    id: number; // Filmin benzersiz kimliği
    title: string; // Filmin başlığı
    poster_path: string; // Film posterinin yolu
    release_date: string; // Filmin yayınlanma tarihi
    adult: boolean; // Filmin yetişkinlere uygun olup olmadığını belirtir
    overview: string; // Filmin açıklaması
    vote_average: number; // Filmin kullanıcı puan ortalaması
    vote_count: number; // Filme yapılan toplam oy sayısı
    genre_ids: number[]; // Filmin türlerinin ID'leri
}

// Önerilen filmleri tanımlayan bir arayüz
interface Recommendation {
    title: string; // Filmin başlığı
    genres: string; // Filmin tür bilgisi
}

// İzlenen filmlere ek olarak kullanıcı puanı içeren bir arayüz
interface WatchedMovie extends Movie {
    rating: number; // Kullanıcının filme verdiği puan
}

// Home bileşeni, uygulamanın ana ekranı
export default function Home() {
    const [favorites, setFavorites] = useState<Movie[]>([]); // Favori filmleri tutan state
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]); // İzlenen filmleri tutan state
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]); // Popüler filmleri tutan state
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null); // Kullanıcının seçtiği film
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]); // Önerilen filmleri tutan state
    const [loadingRecommendations, setLoadingRecommendations] = useState(false); // Önerilerin yüklenip yüklenmediğini tutar
    const [error, setError] = useState<string | null>(null); // Hata mesajını tutar
    const [page, setPage] = useState(1); // Şu anki sayfa numarası
    const [hasMore, setHasMore] = useState(true); // Daha fazla film olup olmadığını kontrol eder

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY; // TMDB API anahtarı

    // TMDB API'den popüler filmleri çeken bir fonksiyon
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
                setPopularMovies((prevMovies) => [...prevMovies, ...filteredMovies]);
            } else {
                setHasMore(false); // Daha fazla film olmadığını belirt
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
        }
    };

    // İlk yüklemede ve her sayfa değişiminde yeni filmleri getir
    useEffect(() => {
        fetchMovies(page);
    }, [page]);

    // Sonsuz kaydırma (infinite scroll) için Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1); // Yeni sayfa yükle
                }
            },
            { threshold: 1.0 } // Eleman %100 görünür olduğunda tetiklenir
        );

        const sentinel = document.getElementById("scroll-sentinel"); // Gözlemlenecek öğe
        if (sentinel) {
            observer.observe(sentinel); // Gözlemlemeyi başlat
        }

        return () => {
            if (sentinel) observer.unobserve(sentinel); // Temizlik işlemi
        };
    }, [hasMore]);

    // Flask API'ye öneriler için istek gönderen bir fonksiyon
    const handleSuggestMovies = async () => {
        setLoadingRecommendations(true); // Öneriler yükleniyor olarak işaretle
        setError(null); // Hata mesajını sıfırla

        // İzlenen en yüksek puanlı 10 filmi seç
        const selectedMovies = watchedMovies
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

        // Kullanıcı puanlarını JSON formatına dönüştür
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
                setRecommendations(data || []); // Önerileri kaydet
                setPopularMovies([]); // Popüler filmleri temizle
            } else {
                setError("Failed to fetch recommendations"); // Hata mesajı ayarla
                setRecommendations([]); // Önerileri sıfırla
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            setError("Error fetching recommendations");
        } finally {
            setLoadingRecommendations(false); // Yükleme durumunu sıfırla
        }
    };

    return (
        <div className="flex">
            {/* Sol panel: Favoriler ve İzlenen Filmler */}
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
                        setFavorites(favorites.filter((fav) => fav.id !== movie.id))
                    }
                />

                {/* İzlenen filmleri listele */}
                <MoviesWatchedList
                    watchedMovies={watchedMovies}
                    onRemove={(movie) =>
                        setWatchedMovies(
                            watchedMovies.filter((wm) => wm.id !== movie.id)
                        )
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
                                onClick={() => {
                                    setFavorites([...favorites, selectedMovie]);
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
                            <h3 className="text-sm font-bold text-accent-dark">{movie.title}</h3>
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
                        <h3 className="text-lg font-bold mb-2 text-accent-dark">Recommended Movies:</h3>
                        <ul>
                            {recommendations.map((movie, index) => (
                                <li key={index} className="mb-2 text-accent">
                                    {movie.title} - {movie.genres}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : error ? (
                    <div className="text-accent-dark mt-4">{error}</div>
                ) : (
                    <p className="text-center mt-4 text-accent">No recommendations available.</p>
                )}

                {/* Yükleme durumu */}
                {loadingRecommendations && (
                    <div className="text-center mt-4 text-accent">Loading recommendations...</div>
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
