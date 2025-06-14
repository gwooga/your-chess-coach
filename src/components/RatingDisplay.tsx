
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Rating, ChessVariant, UserAnalysis } from '@/utils/types';
import { Zap, Clock, Rocket } from "lucide-react";
import StatCard from './StatCard';

interface RatingDisplayProps {
  ratings: Rating;
  variant?: ChessVariant;
  analysis?: UserAnalysis; // Add analysis prop for statistics
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ ratings, variant, analysis }) => {
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

  // Calculate statistics for the current variant
  const calculateVariantStats = (variant: ChessVariant = 'all') => {
    if (!analysis) return { totalGames: 0, totalWins: 0, totalDraws: 0, totalLosses: 0 };

    if (variant === 'all') {
      // For 'all', use the overall day performance data
      const totalGames = analysis.dayPerformance.reduce((sum, day) => sum + day.games, 0);
      const totalWins = analysis.dayPerformance.reduce((sum, day) => sum + day.wins, 0);
      const totalDraws = analysis.dayPerformance.reduce((sum, day) => sum + day.draws, 0);
      const totalLosses = analysis.dayPerformance.reduce((sum, day) => sum + day.losses, 0);
      
      return { totalGames, totalWins, totalDraws, totalLosses };
    } else {
      // For specific variants, use the opening data totals
      const variantOpenings = analysis.openings[variant];
      const totalGames = variantOpenings.totalWhiteGames + variantOpenings.totalBlackGames;
      
      // Calculate wins, draws, losses from opening data
      const allOpenings = [
        ...variantOpenings.white2,
        ...variantOpenings.black2,
        ...variantOpenings.white3,
        ...variantOpenings.black3,
        ...variantOpenings.white4,
        ...variantOpenings.black4,
        ...variantOpenings.white5,
        ...variantOpenings.black5
      ];
      
      const totalWins = allOpenings.reduce((sum, opening) => sum + opening.wins, 0);
      const totalDraws = allOpenings.reduce((sum, opening) => sum + opening.draws, 0);
      const totalLosses = allOpenings.reduce((sum, opening) => sum + opening.losses, 0);
      
      return { totalGames, totalWins, totalDraws, totalLosses };
    }
  };

  const { totalGames, totalWins, totalDraws, totalLosses } = calculateVariantStats(variant);
  
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((totalDraws / totalGames) * 100) : 0;
  const lossRate = totalGames > 0 ? Math.round((totalLosses / totalGames) * 100) : 0;
  
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
    <div className="space-y-6">
      <Card className="w-full shadow-sm">
        <CardContent className="p-6">
          {renderRatings()}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            icon="clock" 
            color="blue" 
            title="Games Analyzed" 
            value={totalGames.toString()} 
          />
          
          <StatCard 
            icon="trophy" 
            color="green" 
            title="Win Rate" 
            value={`${winRate}%`} 
          />
          
          <StatCard 
            icon="trend-up" 
            color="yellow" 
            title="Draw Rate" 
            value={`${drawRate}%`} 
          />
          
          <StatCard 
            icon="trend-down" 
            color="red" 
            title="Loss Rate" 
            value={`${lossRate}%`} 
          />
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
