import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Rating, ChessVariant } from '@/utils/types';

interface RatingDisplayProps {
  ratings: Rating;
  variant?: ChessVariant;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ ratings, variant }) => {
  // Get the category icon and rating
  const getRatingInfo = (type: string) => {
    let icon = <Trophy className="size-6" />;
    let rating = 'N/A';
    
    if (type === 'blitz' && ratings.blitz) {
      rating = ratings.blitz.toString();
    } else if (type === 'rapid' && ratings.rapid) {
      rating = ratings.rapid.toString();
    } else if (type === 'bullet' && ratings.bullet) {
      rating = ratings.bullet.toString();
    }
    
    return { icon, rating };
  };
  
  // If variant is specified, only show that rating
  // Otherwise show all ratings
  const renderRatings = () => {
    if (variant && variant !== 'all') {
      const { icon, rating } = getRatingInfo(variant);
      return (
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-chess-purple/20 p-3">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{variant.charAt(0).toUpperCase() + variant.slice(1)}</p>
            <p className="text-2xl font-bold text-chess-dark">{rating}</p>
          </div>
        </div>
      );
    }
    
    // Show all ratings
    return (
      <div className="flex flex-wrap gap-6 justify-between">
        {['blitz', 'rapid', 'bullet'].map(type => {
          const { icon, rating } = getRatingInfo(type);
          return (
            <div key={type} className="flex items-center gap-4">
              <div className="rounded-full bg-chess-purple/20 p-3">
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                <p className="text-2xl font-bold text-chess-dark">{rating}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-6">
        {renderRatings()}
      </CardContent>
    </Card>
  );
};

export default RatingDisplay;
