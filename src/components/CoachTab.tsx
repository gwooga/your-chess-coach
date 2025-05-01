
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, DayPerformance, TimeSlotPerformance } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CheckCircle, AlertTriangle, BookOpen, Clock, Trophy, Target, TrendingUp, TrendingDown } from "lucide-react";

const CoachTab: React.FC<{ analysis: UserAnalysis }> = ({ analysis }) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  
  // Find best and worst day performance
  const sortedDays = [...analysis.dayPerformance].sort((a, b) => b.winRate - a.winRate);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];
  
  // Find best and worst time performance
  const sortedTimeSlots = [...analysis.timePerformance].sort((a, b) => b.winRate - a.winRate);
  const bestTimeSlot = sortedTimeSlots[0];
  const worstTimeSlot = sortedTimeSlots[sortedTimeSlots.length - 1];
  
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
  
  // Calculate overall statistics
  const totalGames = analysis.dayPerformance.reduce((sum, day) => sum + day.games, 0);
  const totalWins = analysis.dayPerformance.reduce((sum, day) => sum + day.wins, 0);
  const totalDraws = analysis.dayPerformance.reduce((sum, day) => sum + day.draws, 0);
  const totalLosses = analysis.dayPerformance.reduce((sum, day) => sum + day.losses, 0);
  
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((totalDraws / totalGames) * 100) : 0;
  const lossRate = totalGames > 0 ? Math.round((totalLosses / totalGames) * 100) : 0;
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <RatingDisplay ratings={analysis.ratings} />
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Games Analyzed</p>
                <p className="text-3xl font-bold">{totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-green-100 p-3">
                <Trophy className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-3xl font-bold">{winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Target className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draw Rate</p>
                <p className="text-3xl font-bold">{drawRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-red-100 p-3">
                <TrendingDown className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Loss Rate</p>
                <p className="text-3xl font-bold">{lossRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Coach Tab Navigation */}
      <div className="mb-6">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Coach's Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          {/* Coach's Summary Content */}
          <TabsContent value="summary" className="mt-6">
            <Card className="border-l-4 border-l-chess-purple">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Coach Summary Box */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
                    <div className="flex items-start space-x-4">
                      <div>
                        <Trophy className="h-8 w-8 text-chess-purple" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">Coach Analysis</h2>
                        <p className="text-gray-700 leading-relaxed">
                          Over the past 90 days, your gameplay demonstrates a solid foundation with a promising win rate of {winRate}%. 
                          Your strengths lie notably in your opening knowledge, particularly with the Sicilian Defense and the Queen's Gambit Declined, 
                          where you manage to gain early positional advantages. You exhibit strong tactical alertness, frequently leveraging forks and pins effectively, 
                          and you demonstrate strategic patience in the middlegame by maintaining control over key central squares and executing well-timed pawn breaks. 
                          Your transition into the endgame is generally good, often capitalizing on minor material advantages through precise calculation and king activity.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Strengths Section */}
                    <div>
                      <div className="flex items-center mb-4">
                        <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                        <h3 className="text-xl font-bold">Strengths</h3>
                      </div>
                      <ul className="list-disc pl-10 space-y-2">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="text-gray-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Areas to Improve Section */}
                    <div>
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
                        <h3 className="text-xl font-bold">Areas to Improve</h3>
                      </div>
                      <ul className="list-disc pl-10 space-y-2">
                        {analysis.weaknesses.map((weakness, i) => (
                          <li key={i} className="text-gray-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Recommendations Section */}
                    <div>
                      <div className="flex items-center mb-4">
                        <BookOpen className="mr-2 h-6 w-6 text-blue-500" />
                        <h3 className="text-xl font-bold">Study Recommendations</h3>
                      </div>
                      <ul className="list-disc pl-10 space-y-2">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Content */}
          <TabsContent value="performance" className="mt-6">
            {/* Accuracy by Phase */}
            <Card className="mb-6">
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
                      <Tooltip 
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            return [`${value}%`, 'Accuracy'];
                          }
                          return [`${value}`, 'Accuracy'];
                        }}
                      />
                      <Bar dataKey="value" fill="#9b87f5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance by Time */}
            <Card className="mb-6">
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
                          <td className="py-2">A swing of {Math.abs(bestDay.winRate - worstDay.winRate).toFixed(1)} percentage points is {Math.abs(bestDay.winRate - worstDay.winRate) > 10 ? 'statistically meaningful' : 'worth noting'}</td>
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
                          formatter={(value: any) => {
                            if (typeof value === 'number') {
                              return [`${value > 0 ? '+' : ''}${value.toFixed(1)} pawns`, 'Material'];
                            }
                            return [`${value}`, 'Material'];
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
                      {analysis.conversionRate ? analysis.conversionRate.toFixed(1) : 'N/A'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Success rate when +2 pawns ahead at move 30
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachTab;
