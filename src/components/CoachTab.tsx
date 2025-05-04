
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis } from '@/utils/types';
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
import { CheckCircle, AlertTriangle, BookOpen, Clock, Trophy, Target, TrendingUp, TrendingDown, Clock3, CalendarDays } from "lucide-react";
import ChessAdviser from './ChessAdviser';

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
  
  // Find strongest openings for insights
  const getMostSignificantOpening = (color: 'white' | 'black') => {
    const openings = color === 'white' 
      ? analysis.openings.all.meaningfulWhite || []
      : analysis.openings.all.meaningfulBlack || [];
    
    return openings.length > 0 ? openings[0] : null;
  };
  
  const topWhiteOpening = getMostSignificantOpening('white');
  const topBlackOpening = getMostSignificantOpening('black');
  
  // Determine time-of-day performance insights
  let timeInsight = "";
  if (bestTimeSlot.slot === '16:00-19:59' && worstTimeSlot.slot === '12:00-15:59') {
    timeInsight = "Performance indicates you play best after work hours when you can focus fully on chess.";
  } else if (bestTimeSlot.slot === '20:00-23:59' && worstTimeSlot.slot === '04:00-07:59') {
    timeInsight = "You're a night owl - your evening games show significantly better focus than morning sessions.";
  } else if (bestTimeSlot.slot === '08:00-11:59' && worstTimeSlot.slot === '20:00-23:59') {
    timeInsight = "Morning mental clarity benefits your play - consider scheduling important matches before noon.";
  } else if (Math.abs(bestTimeSlot.winRate - worstTimeSlot.winRate) > 15) {
    timeInsight = `A significant performance difference of ${Math.abs(bestTimeSlot.winRate - worstTimeSlot.winRate).toFixed(1)} percentage points between your best and worst time slots suggests scheduling important games strategically.`;
  } else {
    timeInsight = "Your performance is relatively consistent across different times of day.";
  }
  
  // Determine day-of-week performance insights
  let dayInsight = "";
  if (bestDay.day === 'Wednesday' && worstDay.day === 'Sunday') {
    dayInsight = "Midweek play seems optimal for your concentration; weekend games may require more preparation or rest.";
  } else if ((bestDay.day === 'Saturday' || bestDay.day === 'Sunday') && (worstDay.day === 'Monday' || worstDay.day === 'Tuesday')) {
    dayInsight = "Weekend play suits your style better than weekdays, perhaps due to reduced work pressure.";
  } else if (Math.abs(bestDay.winRate - worstDay.winRate) > 12) {
    dayInsight = `Consider the ${Math.abs(bestDay.winRate - worstDay.winRate).toFixed(1)} percentage point difference between your best and worst days when scheduling important matches.`;
  } else {
    dayInsight = "Your performance is fairly consistent throughout the week.";
  }
  
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
                          Based on your last {totalGames} games, your {winRate}% win rate shows {winRate > 55 ? "strong" : winRate > 45 ? "solid" : "developing"} skills. 
                          {topWhiteOpening ? ` As White, the ${topWhiteOpening.name} is your strongest opening with a ${topWhiteOpening.winsPercentage}% win rate.` : ""} 
                          {topBlackOpening ? ` Playing Black, you achieve your best results with the ${topBlackOpening.name} (${topBlackOpening.winsPercentage}% wins).` : ""} 
                          Your {phaseData.sort((a, b) => b.value - a.value)[0].name.toLowerCase()} phase is your strongest, while your endgame conversion rate 
                          of {analysis.conversionRate}% when ahead in material {analysis.conversionRate! > 70 ? "is excellent" : analysis.conversionRate! > 60 ? "is solid" : "needs improvement"}.
                          {bestTimeSlot ? ` Performance peaks during ${bestTimeSlot.slot} (${bestTimeSlot.winRate}% win rate).` : ""} 
                          {bestDay ? ` ${bestDay.day}s are your best day (${bestDay.winRate}% win rate).` : ""} 
                          With focused study on your {phaseData.sort((a, b) => a.value - b.value)[0].name.toLowerCase()} phase and addressing time management, 
                          you could quickly gain 50-100 rating points.
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
                        {topWhiteOpening && (
                          <li className="text-gray-700">
                            Strong results with {topWhiteOpening.name} as White ({topWhiteOpening.winsPercentage}% win rate)
                          </li>
                        )}
                        {topBlackOpening && (
                          <li className="text-gray-700">
                            Effective use of {topBlackOpening.name} as Black ({topBlackOpening.winsPercentage}% win rate)
                          </li>
                        )}
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
                        <li className="text-gray-700">
                          {phaseData.sort((a, b) => a.value - b.value)[0].name} accuracy ({phaseData.sort((a, b) => a.value - b.value)[0].value}%) needs improvement
                        </li>
                        {analysis.conversionRate && analysis.conversionRate < 70 && (
                          <li className="text-gray-700">
                            Material advantage conversion rate ({analysis.conversionRate}%) could be higher
                          </li>
                        )}
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
                        {phaseData.sort((a, b) => a.value - b.value)[0].name === 'Opening' && (
                          <li className="text-gray-700">
                            Study the first 10-15 moves of your main openings to improve your opening preparation
                          </li>
                        )}
                        {phaseData.sort((a, b) => a.value - b.value)[0].name === 'Middlegame' && (
                          <li className="text-gray-700">
                            Practice positional play and planning in complex middlegame positions
                          </li>
                        )}
                        {phaseData.sort((a, b) => a.value - b.value)[0].name === 'Endgame' && (
                          <li className="text-gray-700">
                            Master basic endgame principles and practice common endgame patterns
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Add the Ask Me Anything Section */}
            <ChessAdviser analysis={analysis} />
          </TabsContent>
          
          {/* Performance Content */}
          <TabsContent value="performance" className="mt-6 space-y-8">
            <h2 className="text-2xl font-bold mb-4">When You Play Matters</h2>
            
            {/* Time of Day and Day of Week Analysis Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Time of Day Analysis */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-blue-50/70 flex flex-row items-center gap-2">
                  <Clock3 className="h-5 w-5 text-blue-600" />
                  <CardTitle>Time of Day Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                </CardContent>
              </Card>
              
              {/* Day of Week Analysis */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-blue-50/70 flex flex-row items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <CardTitle>Day of Week Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                </CardContent>
              </Card>
            </div>
            
            {/* Game Phase Accuracy */}
            <div>
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
              <p className="text-gray-700 italic mt-4">
                {phaseData[0].value > phaseData[1].value && phaseData[0].value > phaseData[2].value ? 
                  `Your opening knowledge is strong but middlegame transition could be improved. Consider studying typical pawn structures arising from ${topWhiteOpening?.name || "your main openings"}.` :
                phaseData[2].value > phaseData[0].value && phaseData[2].value > phaseData[1].value ?
                  `Your endgame technique is excellent - focus on reaching favorable endgames from your ${topWhiteOpening?.name || "main openings"} more consistently.` :
                  `Your middlegame understanding is your strength - consider studying opening theory to reach favorable middlegames more often, especially in the ${topWhiteOpening?.name || "lines you frequently play"}.`
                }
              </p>
            </div>
            
            {/* Performance Charts Section */}
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
                    <p className={`mt-4 ${
                      (analysis.conversionRate || 0) > 75 ? 'text-green-600' : 
                      (analysis.conversionRate || 0) < 65 ? 'text-red-600' : 
                      'text-amber-600'
                    }`}>
                      {(analysis.conversionRate || 0) > 75 ? 
                        `Excellent conversion - you consistently capitalize on advantages, especially in the ${topWhiteOpening?.name || "openings you play"}` : 
                        (analysis.conversionRate || 0) < 65 ? 
                        "Consider studying endgame techniques focused on converting material advantages into wins" :
                        "Decent conversion rate with room for improvement - practice converting winning positions in similar pawn structures"
                      }
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
