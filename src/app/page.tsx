"use client"; // <-- Bu dosyanın (page.tsx) Next.js tarafında client-side render edileceğini belirtir

import { useEffect, useState } from "react"; // <-- React Hook'ları import ediyoruz
import SearchBar from "./components/SearchBar"; // <-- Arama bileşeni
import FavoritesList from "./components/FavoritesList"; // <-- Favori film bileşeni
import MoviesWatchedList from "./components/MoviesWatchedList"; // <-- İzlenen film bileşeni
import StarRating from "./components/StarRating"; // <-- Yıldız puanlama bileşeni

// -----------------------------------------------------------------------------
// 1) Tip (interface) tanımları
// -----------------------------------------------------------------------------

/** TMDB'den veya API'den çektiğimiz film bilgilerini temsil eden arayüz. */
interface Movie {
    id: number;                  // Filmin benzersiz ID'si (TMDB'den gelen "id")
    title: string;               // Filmin adı
    poster_path: string;         // Poster için TMDB yol bilgisi (ör: "/abc.jpg")
    release_date: string;        // Yayınlanma tarihi
    adult: boolean;              // Yetişkin içerik mi
    overview: string;            // Filmin açıklaması
    vote_average: number;        // TMDB oylama ortalaması
    vote_count: number;          // TMDB'de toplam oy sayısı
    genre_ids: number[];         // Tür ID'leri (TMDB'den gelen)
}

/** Kullanıcının izlediği filmleri (ve verdiği puanı) tutan arayüz. */
interface WatchedMovie extends Movie {
    rating: number; // Kullanıcının verdiği puan

}

/** Flask'tan dönen öneri formatını (enrich edilmeden önce) temsil eden arayüz. */
interface Recommendation {
    movieId: number;   // CSV'deki movieId (ör: 356)
    tmdbId: number;    // TMDB'deki ID (ör: 13)
    title: string;     // Filmin başlığı
    genres: string;    // "Crime|Mystery|Thriller" gibi tür bilgisi
    poster_path?: string;   // TMDB'den elde edeceğimiz poster
    release_date?: string;  // TMDB'den elde edeceğimiz çıkış tarihi
    overview?: string;      // TMDB'den elde edeceğimiz açıklama
    vote_average?: number;  // TMDB'den elde edeceğimiz oy ortalaması
}

// -----------------------------------------------------------------------------
// 2) Ana Bileşen (Home)
// -----------------------------------------------------------------------------

export default function Home() {
    // Favori filmleri tutan state
    const [favorites, setFavorites] = useState<Movie[]>([]);

    // İzlenen filmleri tutan state (içinde rating var)
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);

    // Popüler filmler ve kullanıcının seçtiği film
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    // Öneriler, yükleme durumu ve hata mesajı
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sonsuz kaydırma için sayfa numarası ve "daha fazla var mı" bilgisi
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // .env.local (veya benzeri) dosyadan gelen TMDB API anahtarı
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    // ---------------------------------------------------------------------------
    // 3) Popüler filmleri TMDB'den çekme fonksiyonu
    // ---------------------------------------------------------------------------
    async function fetchMovies(currentPage: number) {
        try {
            // TMDB endpoint: Çok oy almış filmleri çekmek için parametreler
            const response = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=${currentPage}&vote_count.gte=3000&sort_by=vote_count.desc`
            );

            // JSON olarak parse
            const data = await response.json();

            // Eğer results varsa ve en az 1 film içeriyorsa
            if (data.results && data.results.length > 0) {
                // Yetişkin içerikli filmleri filtreliyoruz
                const filteredMovies = data.results.filter((m: Movie) => !m.adult);

                // Mevcut popüler filmlerin sonuna ekliyoruz
                setPopularMovies((prev) => [...prev, ...filteredMovies]);
            } else {
                // Artık daha fazla film yok
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error fetching movies:", err); // Hata varsa log
        }
    }

    // useEffect: Bileşen ilk yüklendiğinde veya "page" değiştiğinde popüler filmleri getir
    useEffect(() => {
        fetchMovies(page);
    }, [page]);

    // ---------------------------------------------------------------------------
    // 4) Sonsuz kaydırma mantığı (Intersection Observer)
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // IntersectionObserver ile belirli bir sentinel elemana ulaşıldığında sayfa numarasını artır
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    // Görünürse bir sonraki sayfayı yükle
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 1.0 } // Eleman %100 görünür olunca tetikle
        );

        // "scroll-sentinel" id'li elemanı bul
        const sentinel = document.getElementById("scroll-sentinel");
        // sentinel varsa observer başlatalım
        if (sentinel) observer.observe(sentinel);

        // Temizlik: bileşen kapatılırken observer'ı devre dışı bırak
        return () => {
            if (sentinel) observer.unobserve(sentinel);
        };
    }, [hasMore]);

    // ---------------------------------------------------------------------------
    // 5) Flask’tan gelen önerileri TMDB verileriyle zenginleştirme fonksiyonu
    // ---------------------------------------------------------------------------
    async function enrichRecommendationsWithTmdbData(recs: Recommendation[]) {
        // Yeni bir dizi oluşturarak "poster_path" vb. ekliyoruz
        const enriched: Recommendation[] = [];

        // API key yoksa direkt gelen "recs" döndür
        if (!apiKey) return recs;

        // Her bir öneri için döngü
        for (const r of recs) {
            // Eğer tmdbId yoksa poster ekleyemeyiz, olduğu gibi ekle
            if (!r.tmdbId) {
                enriched.push(r);
                continue;
            }
            try {
                // TMDB detay endpoint'i: /movie/{tmdbId}
                const tmdbRes = await fetch(
                    `https://api.themoviedb.org/3/movie/${r.tmdbId}?api_key=${apiKey}`
                );

                // Yanıt başarılı değilse orijinal datayı ekle
                if (!tmdbRes.ok) {
                    enriched.push(r);
                    continue;
                }

                // JSON parse
                const tmdbData = await tmdbRes.json();

                // Orijinal "r" objesinin üstüne poster_path, overview vb. ekliyoruz
                enriched.push({
                    ...r,
                    poster_path: tmdbData.poster_path,
                    release_date: tmdbData.release_date,
                    overview: tmdbData.overview,
                    vote_average: tmdbData.vote_average,
                });
            } catch (error) {
                // Hata varsa yine de orijinal "r" ekle
                console.error("Error fetching TMDB details:", error);
                enriched.push(r);
            }
        }

        return enriched;
    }

    // ---------------------------------------------------------------------------
    // 6) "Suggest Movies" butonuna tıklandığında Flask API'ye istek atma
    // ---------------------------------------------------------------------------
    async function handleSuggestMovies() {
        // Öneri yükleniyor, spinner göstermek için
        setLoadingRecommendations(true);
        // Hata mesajını sıfırla
        setError(null);

        try {
            // İzlenen filmleri rating'e göre büyükten küçüğe sırala ve ilk 5 tanesini seç
            const topRated = [...watchedMovies]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5);

            // Flask'a göndereceğimiz format: { film_adi: "..", yildiz_sayi: 5 }
            const moviesToSend = topRated.map((mov) => ({
                film_adi: mov.title,
                yildiz_sayi: mov.rating,
                tmdb_id: mov.id,
            }));

            console.log("Gönderilen JSON verisi:", { movies: moviesToSend });

            setPopularMovies([])
            setHasMore(false);

            // Flask API'ye POST isteği
            const response = await fetch("http://127.0.0.1:5000/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movies: moviesToSend }),
            });

            // Yanıt başarılı değilse hata mesajı
            if (!response.ok) {
                setError("Failed to fetch recommendations");
                return;
            }

            // JSON'u parse
            const data = await response.json();
            console.log("Flask'tan gelen öneriler:", data);

            // (data) => [{ movieId, tmdbId, title, genres }, ...] bekliyoruz
            // TMDB'den poster vb. eklemek için enrich fonksiyonunu çağırıyoruz
            const enriched = await enrichRecommendationsWithTmdbData(data);

            // Enrich edilmiş önerileri state'e at
            setRecommendations(enriched);
        } catch (err: any) {
            // Hata olması durumunda log
            console.error("Error in handleSuggestMovies:", err);
            setError(err.message || "Error fetching recommendations");
        } finally {
            // Yüklenme bitti
            setLoadingRecommendations(false);
            // İstersen popüler filmleri temizliyoruz (UI rahat olsun diye)
            setPopularMovies([]);
        }
    }

    // ---------------------------------------------------------------------------
    // 7) Ekrana Render Edilen Kısım
    // ---------------------------------------------------------------------------
    return (
        <div className="flex">
            {/* Tüm içeriği kenara yaslamak için bir wrapper */}
            <div className="flex-1 p-10">
                {/* Logo kısmı */}
                <div className="flex-1 p-10 text-center">
                    <img
                        src="/NextFilmsLogo_1.png" // Uygulama logosu
                        alt="MovieRecommendationHive Logo"
                        className="mx-auto"
                        style={{ width: "400px", height: "auto", scale: 1.5 }}
                    />
                </div>

                {/* Favori film listesi bileşeni */}
                <FavoritesList
                    favorites={favorites} // Favori filmler dizisi
                    onRemove={(movie) =>
                        setFavorites((prev) => prev.filter((fav) => fav.id !== movie.id))
                    }
                />

                {/* İzlenen filmler bileşeni */}
                <MoviesWatchedList
                    watchedMovies={watchedMovies} // İzlenen filmler dizisi
                    onRemove={(movie) =>
                        setWatchedMovies((prev) => prev.filter((wm) => wm.id !== movie.id))
                    }
                    onSuggestMovies={handleSuggestMovies} // "Suggest Movies" tıklandığında bu fonksiyonu çağır
                />

                {/* Arama çubuğu bileşeni (Film seçmek için) */}
                <SearchBar onMovieSelect={setSelectedMovie} />

                {/* Seçili filmi (popup gibi) rating vererek kaydetme ve favoriye ekleme */}
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
                        {/* Poster gösterimi */}
                        <img
                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            className="mx-auto rounded-lg border border-primary"
                        />
                        {/* Filmin başlığı */}
                        <h3 className="text-lg font-bold mt-2 text-accent-dark">
                            {selectedMovie.title}
                        </h3>
                        {/* Yıldız puanlama bileşeni */}
                        <div className="flex justify-center mt-2">
                            <StarRating
                                onRate={(rating) => {
                                    // Kullanıcı puan verdiğinde watchedMovies state'ine ekle
                                    setWatchedMovies((prev) => [
                                        ...prev,
                                        { ...selectedMovie, rating },
                                    ]);
                                    // Modal'ı kapat
                                    setSelectedMovie(null);
                                }}
                            />
                        </div>
                        {/* Favorilere ekleme butonu */}
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

                {/* Popüler filmleri listeleme alanı */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                    {/* Her bir popüler film için kart */}
                    {popularMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="card shadow-md p-2 bg-primary-light cursor-pointer hover:shadow-lg transition"
                            onClick={() => {
                                // Film seçildiğinde selectedMovie ayarla
                                setSelectedMovie(movie);
                            }}
                        >
                            {/* Filmin adı */}
                            <h3 className="text-sm font-bold text-accent-dark">{movie.title}</h3>
                            {/* Filmin posteri */}
                            <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                className="mt-2 rounded-lg border border-primary"
                            />
                        </div>
                    ))}

                    {/* Sonsuz kaydırma için sentinel elemanı */}
                    <div id="scroll-sentinel" className="h-10"></div>
                </div>

                {/* Modal */}
                {selectedMovie && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                        onClick={() => setSelectedMovie(null)} // Modal kapatmak için dışına tıklama
                    >
                        <div
                            className="bg-primary-lighter rounded-lg shadow-lg p-6 relative w-11/12 max-w-md"
                            onClick={(e) => e.stopPropagation()} // İçeriğe tıklamayı durdur
                        >
                            {/* Kapatma butonu */}
                            <button
                                className="absolute top-2 right-2 bg-primary-light text-black rounded-full p-2"
                                onClick={() => setSelectedMovie(null)}
                            >
                                ✕
                            </button>

                            {/* Modal içeriği */}
                            <img
                                src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                                alt={selectedMovie.title}
                                className="mx-auto rounded-lg"
                            />
                            <h3 className="text-lg font-bold text-center mt-4">{selectedMovie.title}</h3>
                            <p className="text-sm text-gray-700 mt-2">{selectedMovie.overview}</p>

                            {/* Yıldız Verme */}
                            <div className="flex justify-center mt-4">
                                <StarRating
                                    onRate={(rating) => {
                                        setWatchedMovies((prev) => [
                                            ...prev,
                                            { ...selectedMovie, rating }, // Filmi izlenenler listesine ekle
                                        ]);
                                        setSelectedMovie(null); // Modalı kapat
                                    }}
                                />
                            </div>

                            {/* Favorilere Ekleme Butonu */}
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => {
                                        setFavorites((prev) => [...prev, selectedMovie]); // Favorilere ekle
                                        setSelectedMovie(null); // Modalı kapat
                                    }}
                                    className="btn bg-accent text-white border border-accent-dark hover:bg-accent-dark transition"
                                >
                                    ❤ Add to Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                )}




                {/* Önerilen filmleri listeleme bölümü */}
                {recommendations && recommendations.length > 0 ? (
                    //populer filmleri sıfırlama setPopularMovies([])

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
                                    {/* Filmin başlığı */}
                                    <h4 className="text-sm font-bold text-accent-dark mb-1">
                                        {movie.title}
                                    </h4>
                                    {/* Poster (enrichRecommendationsWithTmdbData'dan gelmiş) */}
                                    {movie.poster_path && (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                            alt={movie.title}
                                            className="rounded-lg border border-primary"
                                        />
                                    )}
                                    {/* Flask'tan gelen genres alanı */}
                                    <p className="text-xs text-accent">{movie.genres}</p>
                                    {/* Filmin overview'ünün ilk 80 karakteri */}
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
                    // Eğer hata varsa hata mesajını göster
                    <div className="text-accent-dark mt-4">{error}</div>
                ) : (
                    // Eğer henüz öneri yoksa
                    <p className="text-center mt-4 text-accent">
                        No recommendations available.
                    </p>
                )}

                {/* Yükleme durumu (öneriler gelene kadar "Loading..." metni) */}
                {loadingRecommendations && (
                    <div className="text-center mt-4 text-accent">
                        Loading recommendations...
                    </div>
                )}
            </div>
        </div>
    );
}
