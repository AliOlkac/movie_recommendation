// frontend/src/components/MovieCard.tsx
import Image from 'next/image'; // Image bileşenini import et

// Bileşenin alacağı prop'ların tiplerini tanımlayalım
// Backend'den gelen verilere göre bu tipler daha sonra detaylandırılabilir
type MovieCardProps = {
  movieId: number;
  title: string;
  genres: string; // Türler genellikle '|' ile ayrılmış string olarak geliyor
  posterUrl: string | null; // posterUrl prop'u eklendi
};

export default function MovieCard({ movieId, title, genres, posterUrl }: MovieCardProps) {
  // Türler string'ini '|' karakterinden ayırıp bir listeye dönüştürelim
  const genreList = genres ? genres.split('|') : [];

  return (
    // Kartın genel yapısını biraz değiştirelim: Afiş üstte, içerik altta
    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/10 text-white flex flex-col h-full group transition-all duration-300 hover:border-white/30 hover:shadow-yellow-500/20">
      {/* Afiş Alanı */}
      <div className="relative w-full h-64 sm:h-72 md:h-80"> 
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${title} Afişi`}
            fill // Konteyneri doldurması için
            style={{ objectFit: 'cover' }} // Resmin oranını koruyarak kaplaması için
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw" // Farklı ekran boyutları için optimizasyon
            className="transition-transform duration-300 group-hover:scale-105" // Hover efekti
            priority={false} // İlk yüklenenler dışındakiler için false daha iyi
          />
        ) : (
          // Afiş yoksa yer tutucu göster
          <div className="w-full h-full flex items-center justify-center bg-gray-700/50">
            <span className="text-gray-400 text-sm">Afiş Yok</span>
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className="p-4 flex flex-col flex-grow"> 
        <h3 className="text-base font-semibold mb-1 truncate" title={title}>
          {title}
        </h3>
        
        <div className="text-xs text-gray-400 mb-3 space-x-1 flex-wrap"> {/* flex-wrap eklendi */}
          {genreList.slice(0, 3).map((genre) => ( // Çok fazla türü engellemek için slice(0, 3)
            <span key={genre} className="bg-gray-600/60 px-2 py-0.5 rounded-full inline-block mb-1">
              {genre}
            </span>
          ))}
          {genreList.length === 0 && <span className="italic">Tür belirtilmemiş</span>}
        </div>

        {/* Puanlama Alanı (Aşağı itmek için mt-auto) */}
        <div className="mt-auto pt-3 border-t border-white/10">
          <p className="text-sm text-gray-400">Puanlama Yakında...</p>
        </div>
      </div>
    </div>
  );
} 