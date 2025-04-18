// frontend/src/components/MovieCard.tsx
import Image from 'next/image'; // Image bileşenini import et

// TMDB afişleri için temel URL (next.config.js'de tanımlı domain)
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Bileşenin alacağı prop'ların tiplerini tanımlayalım
// Backend'den gelen verilere göre bu tipler daha sonra detaylandırılabilir
interface MovieCardProps {
  // movieId: number; // MovieLens ID - Artık gerekli değil
  tmdbId: number | null; // TMDB ID
  title: string;
  genres: string; // Türler genellikle '|' ile ayrılmış string olarak geliyor
  posterUrl: string | null; // posterUrl prop'u eklendi
  onClick: (tmdbId: number) => void; // Tıklama olayını dışarıdan almak için prop (TMDB ID ile çalışacak)
}

const MovieCard: React.FC<MovieCardProps> = ({ /* movieId, */ tmdbId, title, genres, posterUrl, onClick }) => {
  // Tam afiş URL'sini oluştur
  const fullPosterUrl = posterUrl 
    ? `${TMDB_IMAGE_BASE_URL}${posterUrl}` 
    : '/images/default-poster.png'; // Varsayılan afiş yolu

  // Türleri formatla (İngilizce için | ayıracı yeterli)
  const formattedGenres = genres.split('|').join(' | ');

  const handleCardClick = () => {
    if (tmdbId) { // Sadece TMDB ID varsa tıklama işlevini çalıştır
      onClick(tmdbId);
    }
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-yellow-500/30 ${tmdbId ? 'cursor-pointer' : 'cursor-default'} bg-black/10 aspect-[2/3]`} // Arka plana hafif bir renk verelim
      onClick={handleCardClick}
      // style={{ aspectRatio: '2/3' }} // Aspect ratio class ile ayarlandı
    >
      {/* Afiş */}
      <div className="absolute inset-0 transition-opacity duration-300">
        <Image
          src={fullPosterUrl}
          alt={`${title} poster`}
          layout="fill"
          objectFit="cover"
          className={`transition-transform duration-500 ${tmdbId ? 'group-hover:scale-110' : ''}`}
          priority={false}
        />
        {/* Hafif bir gradyan overlay (isteğe bağlı) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Bilgi Overlay - Altta, sadece hover'da belirgin */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-in-out">
        <h3 className="text-sm font-semibold text-white mb-1 truncate" title={title}>
          {title}
        </h3>
        {/* Türleri şimdilik göstermeyelim 
        <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate" title={formattedGenres}>
          {formattedGenres || 'N/A'}
        </p> 
        */}
        {!tmdbId && (
           <p className="text-xs text-red-400 mt-1">Details unavailable</p>
        )}
      </div>
    </div>
  );
};

export default MovieCard; 