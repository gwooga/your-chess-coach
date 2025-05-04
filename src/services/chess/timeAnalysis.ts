import { DayPerformance, TimeSlotPerformance } from '@/utils/types';

// Helper function to determine time slot
const getTimeSlot = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'Morning (6-12)';
  if (hour >= 12 && hour < 18) return 'Afternoon (12-18)';
  if (hour >= 18 && hour < 24) return 'Evening (18-24)';
  return 'Night (0-6)';
};

// Generate time analysis data
export const generateTimeAnalysis = (games: any[]): { 
  dayPerformance: DayPerformance[]; 
  timePerformance: TimeSlotPerformance[];
} => {
  // Initialize dayPerformance with all days of the week
  const dayPerformance: DayPerformance[] = [
    { day: 'Monday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Tuesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Wednesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Thursday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Friday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Saturday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { day: 'Sunday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  ];
  
  // Initialize timePerformance with time slots
  const timePerformance: TimeSlotPerformance[] = [
    { slot: 'Morning (6-12)', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { slot: 'Afternoon (12-18)', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { slot: 'Evening (18-24)', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    { slot: 'Night (0-6)', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  ];
  
  // Process games
  let hasTimeData = false;

  games.forEach(game => {
    try {
      // Extract date information
      let gameDate: Date | null = null;
      
      // Try to extract date from various formats
      if (game.end_time) {
        // Chess.com timestamp format (milliseconds)
        gameDate = new Date(parseInt(game.end_time) * 1000);
      } else if (game.lastMoveAt) {
        // Lichess timestamp format (ISO string)
        gameDate = new Date(game.lastMoveAt);
      } else if (game.createdAt) {
        // Alternative Lichess timestamp
        gameDate = new Date(game.createdAt);
      } else if (game.date && game.utcTime) {
        // PGN format (YYYY.MM.DD and HH:MM:SS)
        const [year, month, day] = game.date.split('.').map(Number);
        const [hours, minutes, seconds] = (game.utcTime || "00:00:00").split(':').map(Number);
        gameDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      } else if (game.date) {
        // Just date without time
        const [year, month, day] = game.date.split('.').map(Number);
        gameDate = new Date(Date.UTC(year, month - 1, day));
      } else if (game.UTCDate && game.UTCTime) {
        // Alternative PGN format
        const [year, month, day] = game.UTCDate.split('.').map(Number);
        const [hours, minutes, seconds] = (game.UTCTime || "00:00:00").split(':').map(Number);
        gameDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      }
      
      if (!gameDate) return;
      
      // Get day of the week
      const dayOfWeek = gameDate.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayIndex = (dayOfWeek + 6) % 7; // Convert to 0 = Monday, 1 = Tuesday, ...
      
      // Get hour of the day (0-23)
      const hourOfDay = gameDate.getHours();
      
      // Determine time slot
      let timeSlotIndex;
      if (hourOfDay >= 6 && hourOfDay < 12) {
        timeSlotIndex = 0; // Morning
      } else if (hourOfDay >= 12 && hourOfDay < 18) {
        timeSlotIndex = 1; // Afternoon
      } else if (hourOfDay >= 18 && hourOfDay < 24) {
        timeSlotIndex = 2; // Evening
      } else {
        timeSlotIndex = 3; // Night (0-6)
      }
      
      // If we got here, we have valid time data
      hasTimeData = true;
      
      // Get game result
      let result;
      if (typeof game.result === 'string') {
        result = game.result; // Our standard format
      } else if (game.winner) {
        // Lichess format
        const userColor = game.playerColor || 
          (game.username && game.players?.black?.user?.name?.toLowerCase() === game.username.toLowerCase() ? 'black' : 'white');
        result = (game.winner === userColor) ? 'win' : (game.status === 'draw' ? 'draw' : 'loss');
      } else if (game.white && game.black && game.username) {
        // Chess.com format
        const userColor = (game.white.username.toLowerCase() === game.username.toLowerCase()) ? 'white' : 'black';
        if (game.white.result === 'win') result = userColor === 'white' ? 'win' : 'loss';
        else if (game.black.result === 'win') result = userColor === 'black' ? 'win' : 'loss';
        else result = 'draw';
      }
      
      // Update day performance
      dayPerformance[dayIndex].games++;
      if (result === 'win') dayPerformance[dayIndex].wins++;
      else if (result === 'draw') dayPerformance[dayIndex].draws++;
      else if (result === 'loss') dayPerformance[dayIndex].losses++;
      
      // Update time performance
      timePerformance[timeSlotIndex].games++;
      if (result === 'win') timePerformance[timeSlotIndex].wins++;
      else if (result === 'draw') timePerformance[timeSlotIndex].draws++;
      else if (result === 'loss') timePerformance[timeSlotIndex].losses++;
    } catch (error) {
      console.error("Error processing game for time analysis:", error);
    }
  });
  
  // Calculate win rates for days
  dayPerformance.forEach(day => {
    if (day.games > 0) {
      day.winRate = parseFloat(((day.wins / day.games) * 100).toFixed(1));
    }
  });
  
  // If we don't have time data, return empty time performance
  if (!hasTimeData) {
    return { 
      dayPerformance, 
      timePerformance: [] 
    };
  }
  
  // Calculate win rates for time slots
  timePerformance.forEach(slot => {
    if (slot.games > 0) {
      slot.winRate = parseFloat(((slot.wins / slot.games) * 100).toFixed(1));
    }
  });

  return {
    dayPerformance,
    timePerformance
  };
};

// Find best and worst time slots/days for insights
export const findBestAndWorstPerformances = (
  dayPerformance: DayPerformance[],
  timePerformance: TimeSlotPerformance[]
): {
  bestTimeSlot: TimeSlotPerformance | null;
  worstTimeSlot: TimeSlotPerformance | null;
  bestDay: DayPerformance | null;
  worstDay: DayPerformance | null;
} => {
  // Find best and worst time slots
  const sortedTimePerformance = [...timePerformance].sort((a, b) => b.winRate - a.winRate);
  const bestTimeSlot = sortedTimePerformance.length > 0 ? sortedTimePerformance[0] : null;
  const worstTimeSlot = sortedTimePerformance.length > 0 ? sortedTimePerformance[sortedTimePerformance.length - 1] : null;
  
  // Find best and worst days
  const sortedDayPerformance = [...dayPerformance].sort((a, b) => b.winRate - a.winRate);
  const bestDay = sortedDayPerformance.length > 0 ? sortedDayPerformance[0] : null;
  const worstDay = sortedDayPerformance.length > 0 ? sortedDayPerformance[sortedDayPerformance.length - 1] : null;
  
  return {
    bestTimeSlot,
    worstTimeSlot,
    bestDay,
    worstDay
  };
};
