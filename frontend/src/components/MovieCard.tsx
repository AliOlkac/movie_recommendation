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
      className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-yellow-500/30 transition-shadow duration-300 flex flex-col h-full ${tmdbId ? 'cursor-pointer' : 'cursor-default'}`} // TMDB ID yoksa cursor değişmesin
      onClick={handleCardClick} // Tıklandığında dışarıya bildir
    >
      <div className="relative w-full h-64 sm:h-72 md:h-80"> {/* Yüksekliği sabit tut */}
        <Image
          src={fullPosterUrl}
          alt={`${title} poster`}
          layout="fill" // layout="fill" ebeveyn elementin boyutlarına uyar
          objectFit="cover" // Görüntüyü kırparak alanı doldurur
          className={`transition-transform duration-300 ${tmdbId ? 'hover:scale-105' : ''}`} // TMDB ID yoksa büyütme efekti olmasın
          priority={false} // İlk yüklenenler dışındakiler için false olabilir
          // Hata durumunda veya yüklenirken gösterilecek placeholder
          // placeholder="blur" 
          // blurDataURL="/images/placeholder-blur.png" // Küçük boyutlu bulanık bir resim
          unoptimized={posterUrl === null} // Eğer varsayılan afişse optimizasyonu kapat (isteğe bağlı)
        />
      </div>
      <div className="p-4 flex flex-col flex-grow"> {/* Metin alanı, kalan yüksekliği doldurur */}
        <h3 className="text-lg font-semibold text-yellow-500 mb-1 truncate" title={title}> {/* Uzun başlıkları kısalt */}
          {title}
        </h3>
        <p className="text-xs text-gray-400 flex-grow"> {/* Türler, kalan alanı doldurur */}
          {formattedGenres || 'N/A'} {/* Tür yoksa N/A yaz */}
        </p>
        {!tmdbId && (
           <p className="text-xs text-red-500 mt-1">Details unavailable</p> // TMDB ID yoksa uyarı
        )}
      </div>
    </div>
  );
};

export default MovieCard; 