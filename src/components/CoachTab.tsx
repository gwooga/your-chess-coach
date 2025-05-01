
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, DayPerformance, TimeSlotPerformance } from '@/utils/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CoachTab: React.FC<{ analysis: UserAnalysis }> = ({ analysis }) => {
  // Find best and worst day performance
  const sortedDays = [...analysis.dayPerformance].sort((a, b) => b.winRate - a.winRate);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];
  
  // Find best and worst time performance
  const sortedTimeSlots = [...analysis.timePerformance].sort((a, b) => b.winRate - a.winRate);
  const bestTimeSlot = sortedTimeSlots[0];
  const worstTimeSlot = sortedTimeSlots[sortedTimeSlots.length - 1];
  
  // Move quality data
  const moveQualityData = [
    { name: 'Best', value: analysis.moveQuality?.best || 0, color: '#4ade80' },
    { name: 'Good', value: analysis.moveQuality?.good || 0, color: '#22c55e' },
    { name: 'Inaccuracy', value: analysis.moveQuality?.inaccuracy || 0, color: '#facc15' },
    { name: 'Mistake', value: analysis.moveQuality?.mistake || 0, color: '#f97316' },
    { name: 'Blunder', value: analysis.moveQuality?.blunder || 0, color: '#ef4444' }
  ];
  
  // Phase accuracy data
  const phaseData = [
    { name: 'Opening', value: analysis.phaseAccuracy?.opening || 0 },
    { name: 'Middlegame', value: analysis.phaseAccuracy?.middlegame || 0 },
    { name: 'Endgame', value: analysis.phaseAccuracy?.endgame || 0 }
  ];
  
  // Format day performance data for chart
  const dayChartData = analysis.dayPerformance.map(day => ({
    name: day.day.substring(0, 3),
    winRate: day.winRate,
    games: day.games
  }));
  
  // Format time performance data for chart
  const timeChartData = analysis.timePerformance.map(slot => ({
    name: slot.slot,
    winRate: slot.winRate,
    games: slot.games
  }));
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <RatingDisplay ratings={analysis.ratings} />
      </div>
      
      {/* Summary Section */}
      <Card className="border-l-4 border-l-chess-purple">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Coach's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold mb-2">Strengths</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2">Areas to Improve</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i}>{weakness}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Move Quality Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Move Quality Analysis</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moveQualityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {moveQualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Accuracy by Phase</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                  <Bar dataKey="value" fill="#9b87f5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance by Time */}
      <Card>
        <CardHeader>
          <CardTitle>Results by Time of Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border rounded-md bg-chess-soft-bg">
              <h3 className="font-medium mb-2">Performance Insights</h3>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Metric</th>
                    <th className="text-left py-2">Best</th>
                    <th className="text-left py-2">Worst</th>
                    <th className="text-left py-2">Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Day of week</td>
                    <td className="py-2">{bestDay.day} – {bestDay.winRate}% win-rate ({bestDay.wins}-{bestDay.losses}-{bestDay.draws} from {bestDay.games} games)</td>
                    <td className="py-2">{worstDay.day} – {worstDay.winRate}% win-rate ({worstDay.wins}-{worstDay.losses}-{worstDay.draws})</td>
                    <td className="py-2">A swing of +{(bestDay.winRate - worstDay.winRate).toFixed(1)} percentage points is {Math.abs(bestDay.winRate - worstDay.winRate) > 10 ? 'statistically meaningful' : 'worth noting'}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Time slot (4h)</td>
                    <td className="py-2">{bestTimeSlot.slot} – {bestTimeSlot.winRate}% win-rate ({bestTimeSlot.games} games)</td>
                    <td className="py-2">{worstTimeSlot.slot} – {worstTimeSlot.winRate}% win-rate ({worstTimeSlot.games} games)</td>
                    <td className="py-2">{bestTimeSlot.slot === '12:00-15:59' && worstTimeSlot.slot === '20:00-23:59' ? 'Evening fatigue shows: you drop from solid midday performance in the evening' : 'Consider your energy levels during different times of day'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-72">
                <h3 className="text-lg font-medium mb-2">Win Rate by Day</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                    <Bar dataKey="winRate" fill="#9b87f5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-72">
                <h3 className="text-lg font-medium mb-2">Win Rate by Time</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                    <Line type="monotone" dataKey="winRate" stroke="#9b87f5" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Material Advantage & Conversion */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Material Swings by Move Number</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analysis.materialSwings?.map((value, index) => ({ move: index + 1, value })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="move" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | string) => {
                      // Ensure value is treated as a number before operations
                      const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                      return [`${numValue > 0 ? '+' : ''}${numValue.toFixed(1)} pawns`, 'Material'];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#9b87f5" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Winning Positions Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl font-bold text-chess-purple mb-2">
                {analysis.conversionRate?.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">
                Success rate when +2 pawns ahead at move 30
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachTab;
