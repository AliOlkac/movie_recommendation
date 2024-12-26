import React, { useState } from "react";

interface StarRatingProps {
    onRate: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ onRate }) => {
    const [hovered, setHovered] = useState(0);
    const [rating, setRating] = useState(0);

    const handleMouseEnter = (index: number) => {
        setHovered(index);
    };

    const handleMouseLeave = () => {
        setHovered(0);
    };

    const handleClick = (index: number) => {
        setRating(index);
        onRate(index);
    };

    return (
        <div className="star-rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(star)}
                    xmlns="http://www.w3.org/2000/svg"
                    fill={star <= (hovered || rating) ? "gold" : "gray"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-8 h-8 cursor-pointer"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22l1.18-7.86-5-4.87 6.91-1.01L12 2z"
                    />
                </svg>
            ))}
        </div>
    );
};

export default StarRating;

