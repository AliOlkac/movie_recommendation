import Image from 'next/image';
import MovieList from '@/components/MovieList';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-12">
        <Image 
          src="/images/NextFilmsLogo_1.png"
          alt="NextFilms Logo" 
          width={300}
          height={80} 
          priority 
        />
      </div>


      <MovieList />

      {/* TODO: Lazy loading / Infinite scroll implementasyonu buraya eklenecek */}
      {/* TODO: Arama çubuğu buraya veya layout'a eklenecek */}
      {/* TODO: Puanlanan filmler paneli buraya eklenecek */}

    </div>
  );
}
