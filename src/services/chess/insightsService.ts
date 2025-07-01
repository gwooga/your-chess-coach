import { PhaseAccuracy, TimeSlotPerformance, DayPerformance, OpeningData } from '../../utils/types';

// Extract insights from user's chess data
export const extractInsights = (data: {
  timePerformance: TimeSlotPerformance[];
  dayPerformance: DayPerformance[];
  openings: {
    meaningfulWhite: OpeningData[];
    meaningfulBlack: OpeningData[];
  };
  phaseAccuracy?: PhaseAccuracy;
  weaknesses?: string[];
}): string[] => {
  const insights: string[] = [];
  
  // Time-of-day insights
  const timePerformance = data.timePerformance;
  // Find best and worst time slots
  const sortedTimeSlots = [...timePerformance].sort((a, b) => b.winRate - a.winRate);
  const bestTimeSlot = sortedTimeSlots.length > 0 ? sortedTimeSlots[0] : null;
  const worstTimeSlot = sortedTimeSlots.length > 0 ? sortedTimeSlots[sortedTimeSlots.length - 1] : null;
  
  if (bestTimeSlot && worstTimeSlot && bestTimeSlot.games > 10 && worstTimeSlot.games > 10) {
    const diff = bestTimeSlot.winRate - worstTimeSlot.winRate;
    if (diff > 15) {
      insights.push(`You perform ${diff.toFixed(1)}% better during ${bestTimeSlot.slot} compared to ${worstTimeSlot.slot}. Consider scheduling important games in your stronger time slot.`);
    }
  }
  
  // Day-of-week insights
  const dayPerformance = data.dayPerformance;
  // Find best and worst days
  const sortedDays = [...dayPerformance].sort((a, b) => b.winRate - a.winRate);
  const bestDay = sortedDays.length > 0 ? sortedDays[0] : null;
  const worstDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;
  
  if (bestDay && worstDay && bestDay.games > 10 && worstDay.games > 10) {
    insights.push(`Your strongest day is ${bestDay.day} (${bestDay.winRate}% win rate), while your most challenging is ${worstDay.day} (${worstDay.winRate}% win rate).`);
  }
  
  // Opening insights - more detailed
  if (data.openings) {
    // Find best white opening
    if (data.openings.meaningfulWhite && data.openings.meaningfulWhite.length > 0) {
      const bestWhiteOpening = data.openings.meaningfulWhite[0];
      if (bestWhiteOpening.games > 10) {
        insights.push(`Your strongest White opening is the ${bestWhiteOpening.name} with a ${bestWhiteOpening.winsPercentage}% win rate over ${bestWhiteOpening.games} games. You might want to research more theory on this opening to further improve your results.`);
      }
    }
    
    // Find best black opening
    if (data.openings.meaningfulBlack && data.openings.meaningfulBlack.length > 0) {
      const bestBlackOpening = data.openings.meaningfulBlack[0];
      if (bestBlackOpening.games > 10) {
        insights.push(`Your strongest response as Black is the ${bestBlackOpening.name} with a ${bestBlackOpening.winsPercentage}% win rate over ${bestBlackOpening.games} games. Consider focusing your study on this opening to capitalize on your strengths.`);
      }
    }
    
    // Find problematic opening
    if (data.openings.meaningfulWhite && data.openings.meaningfulWhite.length > 0) {
      const problematicWhite = [...data.openings.meaningfulWhite]
        .filter(o => o.games > 15)
        .sort((a, b) => a.winsPercentage - b.winsPercentage)[0];
      
      if (problematicWhite && problematicWhite.winsPercentage < 40) {
        insights.push(`Your results with the ${problematicWhite.name} as White are concerning (${problematicWhite.winsPercentage}% win rate over ${problematicWhite.games} games). Consider studying this opening more deeply or switching to an alternative.`);
      }
    }
  }
  
  // Game phase insights
  if (data.phaseAccuracy) {
    const phases = data.phaseAccuracy;
    const phaseEntries = Object.entries(phases)
      .filter(([key]) => key !== 'totalGames');
    
    if (phaseEntries.length > 0) {
      const strongest = phaseEntries.reduce((a, b) => a[1] > b[1] ? a : b);
      const weakest = phaseEntries.reduce((a, b) => a[1] < b[1] ? a : b);
      
      if (strongest && weakest) {
        insights.push(`Your ${strongest[0]} is your strongest phase at ${strongest[1]}% accuracy, while your ${weakest[0]} could use improvement at ${weakest[1]}%.`);
      }
    }
  }
  
  // Additional insights as needed
  if (data.weaknesses && data.weaknesses.length > 0) {
    insights.push(`Based on your game history, working on ${data.weaknesses[0].toLowerCase()} could significantly improve your results.`);
  }
  
  return insights.slice(0, 5); // Return at most 5 insights
};
