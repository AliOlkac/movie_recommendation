import React, { useState } from "react"; // React ve useState hook'unu içe aktarır

// -----------------------------------------------------------------------------
// 1) Arayüz Tanımları
// -----------------------------------------------------------------------------

/** StarRating bileşenine gelen özelliklerin tanımı */
interface StarRatingProps {
    onRate: (rating: number) => void; // Kullanıcının seçtiği puanı parent bileşene iletmek için işlev
}

// -----------------------------------------------------------------------------
// 2) Bileşen Tanımı
// -----------------------------------------------------------------------------

/**
 * Kullanıcının bir öğeye (örneğin bir film) 1-5 arasında puan vermesini sağlayan bileşen.
 * Yıldızlar hover ve tıklama ile dinamik olarak renklendirilir.
 */
const StarRating: React.FC<StarRatingProps> = ({ onRate }) => {
    // Kullanıcının fare ile üzerine geldiği yıldızın indeksi
    const [hovered, setHovered] = useState(0);
    // Kullanıcının seçtiği yıldız (puan) bilgisi
    const [rating, setRating] = useState(0);

    // Kullanıcı bir yıldızın üzerine geldiğinde çağrılır
    const handleMouseEnter = (index: number) => {
        setHovered(index); // Hover durumu için state güncellenir
    };

    // Kullanıcı fareyi yıldızdan uzaklaştırdığında çağrılır
    const handleMouseLeave = () => {
        setHovered(0); // Hover durumu sıfırlanır
    };

    // Kullanıcı bir yıldıza tıkladığında çağrılır
    const handleClick = (index: number) => {
        setRating(index); // Seçilen puan güncellenir
        onRate(index); // Üst bileşene seçilen puan iletilir
    };

    // -------------------------------------------------------------------------
    // 3) Render Edilen Kısım
    // -------------------------------------------------------------------------

    return (
        <div className="star-rating-container">
            {/* 1'den 5'e kadar yıldızları oluştur */}
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star} // Her yıldız için benzersiz bir anahtar
                    onMouseEnter={() => handleMouseEnter(star)} // Kullanıcı yıldızın üzerine geldiğinde çağrılır
                    onMouseLeave={handleMouseLeave} // Kullanıcı yıldızdan uzaklaştığında çağrılır
                    onClick={() => handleClick(star)} // Kullanıcı yıldıza tıkladığında çağrılır
                    xmlns="http://www.w3.org/2000/svg" // SVG formatı için namespace
                    fill={star <= (hovered || rating) ? "gold" : "gray"} // Hover veya seçili duruma göre yıldız rengi değişir
                    viewBox="0 0 24 24" // SVG görünüm kutusu
                    stroke="currentColor" // SVG çizgi rengi
                    className="w-8 h-8 cursor-pointer" // Boyut ve stil sınıfları
                >
                    <path
                        strokeLinecap="round" // Çizgi uçlarını yuvarlatır
                        strokeLinejoin="round" // Çizgi birleşim noktalarını yuvarlatır
                        strokeWidth="2" // Çizgi kalınlığını ayarlar
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22l1.18-7.86-5-4.87 6.91-1.01L12 2z"
                        // SVG path tanımı, yıldız şekli oluşturur
                    />
                </svg>
            ))}
        </div>
    );
};

// -----------------------------------------------------------------------------
// 4) Varsayılan Export
// -----------------------------------------------------------------------------
export default StarRating;
