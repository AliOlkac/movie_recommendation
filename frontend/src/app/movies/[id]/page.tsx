// Bu dosya, Next.js'in dinamik route özelliğiyle /movies/[id] yoluna karşılık gelir.
// Next.js, params nesnesini doğrudan nesne olarak (Promise olmadan) bu bileşene iletir.
// Yani, MovieDetailPageProps tipinde params: { id: string } olmalıdır.

// Sayfa bileşenine parametreleri almak için tip tanımı
// params: URL'deki [id] segmentini içerir (ör. /movies/123 -> params.id = "123")
type MovieDetailPageProps = {
  params: Promise<{ // params: URL'deki [id] segmenti Promise olarak gelir
    id: string;     // URL'deki [id] segmenti string olarak gelir
  }>;
};

// Async component (varsayılan olarak Server Component)
export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  // Promise içindeki params çözümleniyor
  const { id: movieId } = await params; // URL'den gelen ID'yi al

  // TODO: Bu ID'yi kullanarak backend'den film detaylarını fetch et
  // const movieDetails = await fetchMovieDetails(movieId);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Film Detay Sayfası</h1>
      a
      <p className="text-xl">
        İstenen Film ID: <span className="font-semibold">{movieId}</span>
      </p>

      {/* Buraya backend'den çekilen film detayları gelecek. */}
      
    </main>
  );
} 