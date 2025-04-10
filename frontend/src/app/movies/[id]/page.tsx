// frontend/src/app/movies/[id]/page.tsx

// Sayfa bileşenine parametreleri almak için tip tanımı
type MovieDetailPageProps = {
  params: {
    id: string; // URL'deki [id] segmenti string olarak gelir
  };
};

// Async component (varsayılan olarak Server Component)
export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const movieId = params.id; // URL'den gelen ID'yi al

  // TODO: Bu ID'yi kullanarak backend'den film detaylarını fetch et
  // const movieDetails = await fetchMovieDetails(movieId);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Film Detay Sayfası</h1>
      
      <p className="text-xl">
        İstenen Film ID: <span className="font-semibold">{movieId}</span>
      </p>

      {/* Buraya backend'den çekilen film detayları gelecek. */}
      
    </main>
  );
} 