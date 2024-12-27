import React, { useState } from "react";

// StarRating bileşenine gelen özellikler için bir arayüz tanımı
interface StarRatingProps {
    onRate: (rating: number) => void; // Kullanıcının seçtiği puanı üst bileşene bildirmek için işlev
}

// StarRating bileşeni: Kullanıcının bir film veya öğe için 1-5 arasında puan vermesini sağlar
const StarRating: React.FC<StarRatingProps> = ({ onRate }) => {
    // Kullanıcının üzerine geldiği yıldızın indeksi
    const [hovered, setHovered] = useState(0);
    // Kullanıcının seçtiği puanı saklamak için state
    const [rating, setRating] = useState(0);

    // Kullanıcı bir yıldızın üzerine geldiğinde çağrılır
    const handleMouseEnter = (index: number) => {
        setHovered(index); // Hovered state'ini günceller
    };

    // Kullanıcı fareyi yıldızdan uzaklaştırdığında çağrılır
    const handleMouseLeave = () => {
        setHovered(0); // Hovered state'ini sıfırlar
    };

    // Kullanıcı bir yıldıza tıkladığında çağrılır
    const handleClick = (index: number) => {
        setRating(index); // Seçilen puanı günceller
        onRate(index); // Üst bileşene seçilen puanı iletir
    };

    return (
        <div className="star-rating-container">
            {/* 1'den 5'e kadar yıldızları oluştur */}
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star} // Her yıldız için benzersiz bir anahtar
                    onMouseEnter={() => handleMouseEnter(star)} // Fare yıldızın üzerine geldiğinde
                    onMouseLeave={handleMouseLeave} // Fare yıldızdan uzaklaştığında
                    onClick={() => handleClick(star)} // Yıldıza tıklandığında
                    xmlns="http://www.w3.org/2000/svg" // SVG formatı için namespace
                    fill={star <= (hovered || rating) ? "gold" : "gray"} // Yıldız rengi: hover veya seçili duruma göre değişir
                    viewBox="0 0 24 24" // SVG görünüm kutusu
                    stroke="currentColor" // SVG çizgi rengi
                    className="w-8 h-8 cursor-pointer" // Boyut ve stil sınıfları
                >
                    <path
                        strokeLinecap="round" // Çizgi uçları yuvarlatılır
                        strokeLinejoin="round" // Çizgi birleşim yerleri yuvarlatılır
                        strokeWidth="2" // Çizgi kalınlığı
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22l1.18-7.86-5-4.87 6.91-1.01L12 2z"
                        // Yıldız şekli için SVG path tanımı
                    />
                </svg>
            ))}
        </div>
    );
};

export default StarRating;
