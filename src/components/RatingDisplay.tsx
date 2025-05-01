
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Rating, ChessVariant } from '@/utils/types';
import { Zap, Clock, Rocket } from "lucide-react";

interface RatingDisplayProps {
  ratings: Rating;
  variant?: ChessVariant;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ ratings, variant }) => {
  // Get the category icon and rating
  const getRatingInfo = (type: string) => {
    let icon;
    let rating = 'N/A';
    
    // Set appropriate icon based on game type
    if (type === 'blitz') {
      icon = <Zap className="size-6 text-blue-600" />;
      rating = ratings.blitz?.toString() || 'N/A';
    } else if (type === 'rapid') {
      icon = <Clock className="size-6 text-green-600" />;
      rating = ratings.rapid?.toString() || 'N/A';
    } else if (type === 'bullet') {
      icon = <Rocket className="size-6 text-red-600" />;
      rating = ratings.bullet?.toString() || 'N/A';
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
