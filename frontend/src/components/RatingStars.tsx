"use client"; // State ve etkileşim içerdiği için Client Component olmalı

import { useState } from 'react';
import { FaStar } from 'react-icons/fa'; // Font Awesome yıldız ikonunu import et

interface RatingStarsProps {
  totalStars?: number; // Toplam yıldız sayısı (varsayılan 5)
  initialRating?: number; // Başlangıç puanı (varsayılan 0)
  onRatingChange?: (rating: number) => void; // Puan değiştiğinde çağrılacak fonksiyon
}

const RatingStars: React.FC<RatingStarsProps> = ({
  totalStars = 5, // Varsayılan toplam yıldız sayısı
  initialRating = 0, // Varsayılan başlangıç puanı
  onRatingChange, // Dışarıdan gelen puan değişim fonksiyonu
}) => {
  // Seçili olan puanı tutmak için state
  const [rating, setRating] = useState<number>(initialRating);
  // Fare üzerine geldiğinde hangi yıldızın vurgulanacağını tutmak için state
  const [hover, setHover] = useState<number | null>(null);

  // Bir yıldıza tıklandığında çağrılacak fonksiyon
  const handleClick = (ratingValue: number) => {
    setRating(ratingValue); // Seçilen puanı state'e kaydet
    if (onRatingChange) {
      onRatingChange(ratingValue); // Değişikliği dışarıya bildir
    }
  };

  return (
    <div className="flex items-center space-x-1"> {/* Yıldızları yan yana diz */}
      {[...Array(totalStars)].map((_, index) => { // Toplam yıldız sayısı kadar dön
        const ratingValue = index + 1; // Yıldızın değeri (1'den başlar)

        return (
          <label key={index} className="cursor-pointer"> {/* Erişilebilirlik için label kullan */}
            {/* Asıl radio butonu gizli tutuluyor, sadece yıldız görünecek */}
            <input
              type="radio"
              name="rating" // Aynı gruptaki radio butonları için aynı isim
              value={ratingValue}
              onClick={() => handleClick(ratingValue)} // Tıklandığında puanı ayarla
              className="hidden" // Radio butonunu gizle
            />
            <FaStar
              size={24} // Yıldız boyutu
              // Yıldızın rengini belirle:
              // Eğer fare üzerine gelindiyse (hover) ve yıldızın değeri hover değerinden küçük veya eşitse sarı,
              // değilse, seçili puandan (rating) küçük veya eşitse sarı,
              // aksi halde gri (boş yıldız) yap.
              color={ratingValue <= (hover ?? rating) ? "#ffc107" : "#e4e5e9"}
              onMouseEnter={() => setHover(ratingValue)} // Fare üzerine gelince hover state'ini ayarla
              onMouseLeave={() => setHover(null)} // Fare çekilince hover state'ini sıfırla
              className="transition-colors duration-200" // Renk geçişine animasyon ekle
            />
          </label>
        );
      })}
      {/* İsteğe bağlı: Seçili puanı metin olarak gösterme */}
      {/* <span className="ml-2 text-gray-600">({rating} / {totalStars})</span> */}
    </div>
  );
};

export default RatingStars; 