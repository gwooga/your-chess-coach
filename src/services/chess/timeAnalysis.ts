
import { DayPerformance, TimeSlotPerformance } from '@/utils/types';

// Generate day and time performance data
export const generateTimeAnalysis = (games: any[]): { 
  dayPerformance: DayPerformance[],
  timePerformance: TimeSlotPerformance[]
} => {
  // Initialize day performance tracking
  const dayMap: Record<string, DayPerformance> = {
    'Monday': { day: 'Monday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Tuesday': { day: 'Tuesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Wednesday': { day: 'Wednesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Thursday': { day: 'Thursday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Friday': { day: 'Friday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Saturday': { day: 'Saturday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Sunday': { day: 'Sunday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  };
  
  // Initialize time slot performance tracking
  const timeSlotMap: Record<string, TimeSlotPerformance> = {
    '00:00-03:59': { slot: '00:00-03:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '04:00-07:59': { slot: '04:00-07:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '08:00-11:59': { slot: '08:00-11:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '12:00-15:59': { slot: '12:00-15:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '16:00-19:59': { slot: '16:00-19:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '20:00-23:59': { slot: '20:00-23:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  };
  
  // Flag to track if we have time data
  let hasTimeData = false;
  
  // Process each game
  games.forEach(game => {
    // Get game timestamp and result
    let timestamp: number | null = null;
    let result: 'win' | 'loss' | 'draw' = 'draw'; // Default
    
    // Get timestamp
    if (game.end_time) {
      // Chess.com format
      timestamp = game.end_time * 1000; // Convert to milliseconds
      hasTimeData = true;
    } else if (game.createdAt) {
      // Lichess format
      timestamp = game.createdAt;
      hasTimeData = true;
    } else if (game.date) {
      // Try to parse from date header
      try {
        const dateStr = game.date.replace(/\./g, '-');
        timestamp = new Date(dateStr).getTime();
        hasTimeData = true;
      } catch (e) {
        // Use default
        timestamp = null;
      }
    }
    
    // Get result
    result = game.result || 'draw';
    
    // Skip if we don't have timestamp data
    if (timestamp === null) return;
    
    // Create a date object
    const date = new Date(timestamp);
    
    // Get day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[date.getDay()];
    
    // Get time slot
    const hour = date.getHours();
    let timeSlot: string;
    
    if (hour >= 0 && hour < 4) timeSlot = '00:00-03:59';
    else if (hour >= 4 && hour < 8) timeSlot = '04:00-07:59';
    else if (hour >= 8 && hour < 12) timeSlot = '08:00-11:59';
    else if (hour >= 12 && hour < 16) timeSlot = '12:00-15:59';
    else if (hour >= 16 && hour < 20) timeSlot = '16:00-19:59';
    else timeSlot = '20:00-23:59';
    
    // Update day stats
    dayMap[day].games++;
    if (result === 'win') dayMap[day].wins++;
    else if (result === 'draw') dayMap[day].draws++;
    else dayMap[day].losses++;
    
    // Update time slot stats
    timeSlotMap[timeSlot].games++;
    if (result === 'win') timeSlotMap[timeSlot].wins++;
    else if (result === 'draw') timeSlotMap[timeSlot].draws++;
    else if (result === 'loss') timeSlotMap[timeSlot].losses++;
  });
  
  // Calculate win rates
  for (const day in dayMap) {
    const data = dayMap[day];
    data.winRate = data.games > 0 ? parseFloat(((data.wins / data.games) * 100).toFixed(1)) : 0;
  }
  
  for (const slot in timeSlotMap) {
    const data = timeSlotMap[slot];
    data.winRate = data.games > 0 ? parseFloat(((data.wins / data.games) * 100).toFixed(1)) : 0;
  }
  
  // Filter out slots with no games if we have time data
  const filteredTimePerformance = hasTimeData 
    ? Object.values(timeSlotMap).filter(slot => slot.games > 0) 
    : [];
  
  return {
    dayPerformance: Object.values(dayMap).filter(day => day.games > 0),
    timePerformance: filteredTimePerformance
  };
};

// Find best and worst performance slots based on win rate
export const findBestAndWorstPerformances = (
  dayPerformance: DayPerformance[], 
  timePerformance: TimeSlotPerformance[]
): {
  bestTimeSlot: TimeSlotPerformance | null;
  worstTimeSlot: TimeSlotPerformance | null;
  bestDay: DayPerformance | null;
  worstDay: DayPerformance | null;
} => {
  // Only process time slots if we have at least 2 with enough games
  const validTimeSlots = timePerformance.filter(slot => slot.games >= 5);
  
  // Find best and worst time slots for insights
  let bestTimeSlot = null;
  let worstTimeSlot = null;
  
  if (validTimeSlots.length >= 2) {
    const sortedTimeSlots = [...validTimeSlots].sort((a, b) => b.winRate - a.winRate);
    bestTimeSlot = sortedTimeSlots[0];
    worstTimeSlot = sortedTimeSlots[sortedTimeSlots.length - 1];
  }
  
  // Only process days if we have at least 2 with enough games
  const validDays = dayPerformance.filter(day => day.games >= 5);
  
  // Find best and worst days for insights
  let bestDay = null;
  let worstDay = null;
  
  if (validDays.length >= 2) {
    const sortedDays = [...validDays].sort((a, b) => b.winRate - a.winRate);
    bestDay = sortedDays[0];
    worstDay = sortedDays[sortedDays.length - 1];
  }

  return {
    bestTimeSlot,
    worstTimeSlot,
    bestDay,
    worstDay
  };
};
