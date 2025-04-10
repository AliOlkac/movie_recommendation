// frontend/src/lib/api.ts

// Backend API'mizin temel URL'si
// Ortam değişkenlerinden almak daha iyidir, ama şimdilik sabit yazalım.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Filmleri getiren fonksiyon tipi
// Backend'den gelen yanıta göre bu tipler daha detaylı olabilir
export interface Movie {
  movieId: number;
  title: string;
  genres: string;
  posterUrl: string | null;
}

export interface PaginatedMoviesResponse {
  page: number;
  limit: number;
  total_movies: number;
  total_pages: number;
  movies: Movie[];
}

/**
 * Backend API'sinden film listesini (sayfalanmış) getirir.
 * @param page İstenen sayfa numarası
 * @param limit Sayfa başına film sayısı
 * @returns Film verilerini içeren bir Promise döndürür. Hata durumunda null döner.
 */
export async function fetchMovies(page: number = 1, limit: number = 20): Promise<PaginatedMoviesResponse | null> {
  const url = `${API_BASE_URL}/movies?page=${page}&limit=${limit}`;
  console.log(`Fetching movies from: ${url}`); // İstek URL'sini loglayalım

  try {
    const response = await fetch(url, {
      // Next.js 13+ App Router'da veri cache'leme davranışı önemlidir.
      // 'force-cache' (varsayılan): Mümkünse cache'den kullanır.
      // 'no-store': Asla cache'leme. Her zaman taze veri çeker.
      // Verinin ne sıklıkla değiştiğine bağlı olarak seçim yapılabilir.
      // Şimdilik varsayılanı kullanalım veya 'no-store' deneyebiliriz.
      cache: 'no-store', 
    });

    if (!response.ok) {
      // HTTP hata durumunu ele al
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: PaginatedMoviesResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Failed to fetch movies:", error);
    return null;
  }
}

// TODO: Film detaylarını getiren fonksiyon (fetchMovieDetails)
// TODO: Kullanıcı önerilerini getiren fonksiyon (fetchRecommendations)

export interface MovieDetails extends Movie {
    overview: string | null;
    vote_average: number | null;
    release_date: string | null;
}
