import { Rating, Platform } from '../../utils/types';

// Add function to extract ratings from raw game data
export const extractRatings = (games: any[], platform: Platform): Rating => {
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
        if (typeof timeControl === 'string') {
          if (timeControl.includes('bullet') || (parseInt(timeControl) < 180)) {
            variantGames.bullet.push(game);
          } else if (timeControl.includes('blitz') || (parseInt(timeControl) >= 180 && parseInt(timeControl) <= 600)) {
            variantGames.blitz.push(game);
          } else if (timeControl.includes('rapid') || (parseInt(timeControl) > 600)) {
            variantGames.rapid.push(game);
          }
        }
      });
      
      // Extract most recent rating for each variant
      if (variantGames.bullet.length > 0) {
        const game = variantGames.bullet[0];
        // Try to get the player's rating, checking both white and black
        if (game.white && game.white.rating && game.white.username) {
          ratings.bullet = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.bullet = parseInt(game.black.rating);
        }
      }
      
      if (variantGames.blitz.length > 0) {
        const game = variantGames.blitz[0];
        if (game.white && game.white.rating && game.white.username) {
          ratings.blitz = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.blitz = parseInt(game.black.rating);
        }
      }
      
      if (variantGames.rapid.length > 0) {
        const game = variantGames.rapid[0];
        if (game.white && game.white.rating && game.white.username) {
          ratings.rapid = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.rapid = parseInt(game.black.rating);
        }
      }
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
