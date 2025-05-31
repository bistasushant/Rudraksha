import { Star } from "lucide-react";

export const renderStars = (rating: number) => {
    const maxStars = 5;
    const filledStars = Math.round(rating);
    return (
        <div className="flex">
            {Array.from({ length: maxStars }).map((_, index) => (
                <Star
                    key={index}
                    size={16}
                    className={`${index < filledStars ? "text-yellow-400" : "text-gray-500"
                        }`}
                    fill={index < filledStars ? "currentColor" : "none"}
                />
            ))}
        </div>
    );
};