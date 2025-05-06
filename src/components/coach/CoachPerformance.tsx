
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserAnalysis } from '@/utils/types';
import { CalendarDays, Clock3 } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface CoachPerformanceProps {
  analysis: UserAnalysis;
}

const CoachPerformance: React.FC<CoachPerformanceProps> = ({ analysis }) => {
  // Find best and worst day performance
  const bestDay = analysis.dayPerformance.length > 0 ? 
    [...analysis.dayPerformance].sort((a, b) => b.winRate - a.winRate)[0] : null;
    
  const worstDay = analysis.dayPerformance.length > 0 ? 
    [...analysis.dayPerformance].sort((a, b) => a.winRate - b.winRate)[0] : null;
  
  // Find best and worst time performance if available
  const hasTimeData = analysis.timePerformance.length > 0;
  
  const bestTimeSlot = hasTimeData ? 
    [...analysis.timePerformance].sort((a, b) => b.winRate - a.winRate)[0] : null;
    
  const worstTimeSlot = hasTimeData ? 
    [...analysis.timePerformance].sort((a, b) => a.winRate - b.winRate)[0] : null;
  
  // Format day performance data for chart
  const dayChartData = analysis.dayPerformance.map(day => ({
    name: day.day.substring(0, 3),
    winRate: day.winRate,
    games: day.games
  }));
  
  // Format time performance data for chart if available
  const timeChartData = analysis.timePerformance.map(slot => ({
    name: slot.slot,
    winRate: slot.winRate,
    games: slot.games
  }));
  
  // Get phase accuracy data
  const phaseData = analysis.phaseAccuracy ? [
    { name: 'Opening', value: analysis.phaseAccuracy.opening || 0 },
    { name: 'Middlegame', value: analysis.phaseAccuracy.middlegame || 0 },
    { name: 'Endgame', value: analysis.phaseAccuracy.endgame || 0 }
  ] : [];
  
  // Determine time-of-day performance insights
  let timeInsight = "";
  if (bestTimeSlot && worstTimeSlot) {
    if (Math.abs(bestTimeSlot.winRate - worstTimeSlot.winRate) > 15) {
      timeInsight = `A significant performance difference of ${Math.abs(bestTimeSlot.winRate - worstTimeSlot.winRate).toFixed(1)} percentage points between your best and worst time slots suggests scheduling important games strategically.`;
    } else {
      timeInsight = "Your performance is relatively consistent across different times of day.";
    }
  } else {
    timeInsight = "Insufficient time data to analyze performance patterns across the day.";
  }
  
  // Determine day-of-week performance insights
  let dayInsight = "";
  if (bestDay && worstDay) {
    if (Math.abs(bestDay.winRate - worstDay.winRate) > 12) {
      dayInsight = `Consider the ${Math.abs(bestDay.winRate - worstDay.winRate).toFixed(1)} percentage point difference between your best and worst days when scheduling important matches.`;
    } else {
      dayInsight = "Your performance is fairly consistent throughout the week.";
    }
  } else {
    dayInsight = "Insufficient data to analyze day-of-week performance patterns.";
  }
  
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">When You Play Matters</h2>
      
      {/* Time of Day and Day of Week Analysis Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Day of Week Analysis - Always show this */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-blue-50/70 flex flex-row items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <CardTitle>Day of Week Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bestDay && worstDay ? (
              <>
                <div className="bg-green-50 p-4 border-t border-b border-green-100">
                  <h3 className="text-green-700 font-bold">Best Day:</h3>
                  <p className="text-lg font-bold mt-1">{bestDay.day} – {bestDay.winRate}% win-rate</p>
                  <p className="text-sm text-gray-600">({bestDay.wins}-{bestDay.losses}-{bestDay.draws} from {bestDay.games} games)</p>
                </div>
                <div className="bg-red-50 p-4 border-b border-red-100">
                  <h3 className="text-red-700 font-bold">Worst Day:</h3>
                  <p className="text-lg font-bold mt-1">{worstDay.day} – {worstDay.winRate}% win-rate</p>
                  <p className="text-sm text-gray-600">({worstDay.games} games)</p>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 italic">{dayInsight}</p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Not enough data to analyze day of week performance
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Time of Day Analysis - Only show if we have time data */}
        {hasTimeData && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-blue-50/70 flex flex-row items-center gap-2">
              <Clock3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Time of Day Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bestTimeSlot && worstTimeSlot ? (
                <>
                  <div className="bg-green-50 p-4 border-t border-b border-green-100">
                    <h3 className="text-green-700 font-bold">Best Time Slot:</h3>
                    <p className="text-lg font-bold mt-1">{bestTimeSlot.slot} – {bestTimeSlot.winRate}% win-rate</p>
                    <p className="text-sm text-gray-600">({bestTimeSlot.games} games)</p>
                  </div>
                  <div className="bg-red-50 p-4 border-b border-red-100">
                    <h3 className="text-red-700 font-bold">Worst Time Slot:</h3>
                    <p className="text-lg font-bold mt-1">{worstTimeSlot.slot} – {worstTimeSlot.winRate}% win-rate</p>
                    <p className="text-sm text-gray-600">({worstTimeSlot.games} games)</p>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 italic">{timeInsight}</p>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Not enough data to analyze time of day performance
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Performance Charts Section */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Day of Week Chart */}
        <div className="h-72">
          <h3 className="text-lg font-medium mb-2">Win Rate by Day</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return [`${value}%`, 'Win Rate'];
                  }
                  return [`${value}`, 'Win Rate'];
                }}
              />
              <Bar dataKey="winRate" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Time of Day Chart - Only if we have time data */}
        {hasTimeData && (
          <div className="h-72">
            <h3 className="text-lg font-medium mb-2">Win Rate by Time</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any) => {
                    if (typeof value === 'number') {
                      return [`${value}%`, 'Win Rate'];
                    }
                    return [`${value}`, 'Win Rate'];
                  }}
                />
                <Line type="monotone" dataKey="winRate" stroke="#9b87f5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Game Phase Accuracy - If available */}
      {phaseData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Game Phase Accuracy</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-3">
            {phaseData.map((phase) => (
              <Card key={phase.name} className={`${
                phase.value > 75 ? 'border-green-300 bg-green-50/50' : 
                phase.value < 65 ? 'border-red-300 bg-red-50/50' : 
                'border-yellow-300 bg-yellow-50/50'
              }`}>
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-medium">{phase.name}</h3>
                  <p className={`text-4xl font-bold mt-2 ${
                    phase.value > 75 ? 'text-green-700' : 
                    phase.value < 65 ? 'text-red-700' : 
                    'text-yellow-700'
                  }`}>{phase.value}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CoachPerformance;
