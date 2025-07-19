import { Rating, Platform } from '../../utils/types';

// Add function to extract ratings from raw game data
export const extractRatings = (games: any[], platform: Platform, username?: string): Rating => {
  const ratings: Rating = {};
  
  // Group games by variant
  const variantGames = {
    bullet: [] as any[],
    blitz: [] as any[],
    rapid: [] as any[],
  };
  
  // Process games based on platform
  if (games.length > 0) {
    if (platform === 'chess.com') {
      // For chess.com, filter games by time control
      games.forEach(game => {
        const timeControl = game.time_control || '';
        let variant = 'blitz'; // default
        
        if (typeof timeControl === 'string') {
          // Parse time control to determine variant
          const timeMatch = timeControl.match(/(\d+)/);
          const seconds = timeMatch ? parseInt(timeMatch[1]) : 600;
          
          if (timeControl.includes('bullet') || seconds < 180) {
            variant = 'bullet';
          } else if (timeControl.includes('blitz') || (seconds >= 180 && seconds <= 900)) {
            variant = 'blitz';
          } else if (timeControl.includes('rapid') || seconds > 900) {
            variant = 'rapid';
          }
        }
        
        variantGames[variant as keyof typeof variantGames].push(game);
      });
      
      // Extract the user's rating for each variant
      const extractUserRating = (games: any[], variant: string) => {
        for (const game of games) {
          // Check if user played as white
          if (username && game.white && game.white.username && 
              game.white.username.toLowerCase() === username.toLowerCase() && 
              game.white.rating) {
            return parseInt(game.white.rating);
          }
          // Check if user played as black
          if (username && game.black && game.black.username && 
              game.black.username.toLowerCase() === username.toLowerCase() && 
              game.black.rating) {
            return parseInt(game.black.rating);
          }
        }
        return null;
      };

      // Extract ratings for each variant
      if (variantGames.bullet.length > 0) {
        const rating = extractUserRating(variantGames.bullet, 'bullet');
        if (rating) ratings.bullet = rating;
      }
      
      if (variantGames.blitz.length > 0) {
        const rating = extractUserRating(variantGames.blitz, 'blitz');
        if (rating) ratings.blitz = rating;
      }
      
      if (variantGames.rapid.length > 0) {
        const rating = extractUserRating(variantGames.rapid, 'rapid');
        if (rating) ratings.rapid = rating;
      }
      
      // Log game counts by variant
      console.log('Games by variant:', {
        bullet: variantGames.bullet.length,
        blitz: variantGames.blitz.length,
        rapid: variantGames.rapid.length
      });
      console.log('Extracted ratings:', ratings);
    } else if (platform === 'lichess') {
      // For lichess, extract from players object
      games.forEach(game => {
        const variant = game.speed || 'blitz';
        if (variant === 'bullet') {
          variantGames.bullet.push(game);
        } else if (variant === 'blitz') {
          variantGames.blitz.push(game);
        } else if (variant === 'rapid') {
          variantGames.rapid.push(game);
        }
      });
      
      // Extract most recent rating for each variant
      if (variantGames.bullet.length > 0) {
        const game = variantGames.bullet[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.bullet = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.bullet = game.players.black.rating;
        }
      }
      
      if (variantGames.blitz.length > 0) {
        const game = variantGames.blitz[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.blitz = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.blitz = game.players.black.rating;
        }
      }
      
      if (variantGames.rapid.length > 0) {
        const game = variantGames.rapid[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.rapid = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.rapid = game.players.black.rating;
        }
      }
    }
    
    // Placeholder for uploaded games
    else {
      // For uploaded games, use some dummy ratings if not available otherwise
      if (!ratings.blitz) ratings.blitz = 1500 + Math.floor(Math.random() * 500);
      if (!ratings.rapid) ratings.rapid = 1500 + Math.floor(Math.random() * 500);
      if (!ratings.bullet) ratings.bullet = 1500 + Math.floor(Math.random() * 500);
    }
  }
  
  return ratings;
};
