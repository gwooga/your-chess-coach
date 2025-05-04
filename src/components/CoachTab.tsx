
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, ChessVariant, OpeningData } from '@/utils/types';
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
  ResponsiveContainer,
} from 'recharts';
import { 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Clock3, 
  CalendarDays 
} from "lucide-react";
import ChessAdviser from './ChessAdviser';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MeaningfulOpeningsTable from './MeaningfulOpeningsTable';

const CoachTab: React.FC<{ analysis: UserAnalysis; variant: ChessVariant }> = ({ analysis, variant }) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  
  // Get variant-specific data
  const variantData = analysis.openings[variant];
  
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
  
  // Get phase accuracy data
  const phaseData = analysis.phaseAccuracy ? [
    { name: 'Opening', value: analysis.phaseAccuracy.opening || 0 },
    { name: 'Middlegame', value: analysis.phaseAccuracy.middlegame || 0 },
    { name: 'Endgame', value: analysis.phaseAccuracy.endgame || 0 }
  ] : [];
  
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
  
  // Calculate overall statistics
  const totalGames = analysis.dayPerformance.reduce((sum, day) => sum + day.games, 0);
  const totalWins = analysis.dayPerformance.reduce((sum, day) => sum + day.wins, 0);
  const totalDraws = analysis.dayPerformance.reduce((sum, day) => sum + day.draws, 0);
  const totalLosses = analysis.dayPerformance.reduce((sum, day) => sum + day.losses, 0);
  
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((totalDraws / totalGames) * 100) : 0;
  const lossRate = totalGames > 0 ? Math.round((totalLosses / totalGames) * 100) : 0;
  
  // Find strongest openings for insights
  const getMostSignificantOpening = (color: 'white' | 'black'): OpeningData | null => {
    const openings = color === 'white' 
      ? variantData.meaningfulWhite || []
      : variantData.meaningfulBlack || [];
    
    return openings.length > 0 ? openings[0] : null;
  };
  
  const topWhiteOpening = getMostSignificantOpening('white');
  const topBlackOpening = getMostSignificantOpening('black');
  
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
  
  // Calculate average time data
  let avgWinLen = 0;
  let avgLossLen = 0;
  
  // Best phase and worst phase
  const bestPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => b.value - a.value)[0] : null;
    
  const worstPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => a.value - b.value)[0] : null;
    
  // Format the date range description based on timeRange
  const getTimeRangeDescription = () => {
    const now = new Date();
    
    switch (true) {
      case totalGames > 0:
        return `Based on your last ${totalGames} games`;
      default:
        return "Based on your recent games";
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <RatingDisplay ratings={analysis.ratings} variant={variant === 'all' ? undefined : variant} />
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
                <TrendingUp className="h-6 w-6 text-yellow-700" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Coach's Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="openings">Opening Analysis</TabsTrigger>
          </TabsList>
          
          {/* Coach's Summary Content */}
          <TabsContent value="summary" className="mt-6">
            <Card className="border-l-4 border-l-chess-purple">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Coach Summary Box */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <Trophy className="h-8 w-8 text-chess-purple" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">Personal Coaching Report</h2>
                        <p className="text-gray-700 leading-relaxed">
                          {getTimeRangeDescription()}, your {winRate}% win rate shows {winRate > 55 ? "strong" : winRate > 45 ? "solid" : "developing"} skills. 
                          {topWhiteOpening ? ` As White, the ${topWhiteOpening.name} is your strongest opening with a ${topWhiteOpening.winsPercentage}% win rate over ${topWhiteOpening.games} games.` : ""} 
                          {topBlackOpening ? ` Playing Black, you achieve your best results with the ${topBlackOpening.name} (${topBlackOpening.winsPercentage}% wins over ${topBlackOpening.games} games).` : ""} 
                          {bestPhase ? ` Your ${bestPhase.name.toLowerCase()} phase is your strongest (${bestPhase.value}% accuracy), ` : ""}
                          {worstPhase ? `while your ${worstPhase.name.toLowerCase()} phase (${worstPhase.value}% accuracy) needs more focus. ` : ""}
                          {analysis.conversionRate ? `Your advantage conversion rate of ${analysis.conversionRate}% when ahead in material ${analysis.conversionRate > 70 ? "is excellent" : analysis.conversionRate > 60 ? "is solid" : "needs improvement"}. ` : ""}
                          {bestTimeSlot ? `Performance peaks during ${bestTimeSlot.slot} (${bestTimeSlot.winRate}% win rate). ` : ""} 
                          {bestDay ? `${bestDay.day}s are your best day (${bestDay.winRate}% win rate). ` : ""} 
                          {worstPhase ? `With focused study on your ${worstPhase.name.toLowerCase()} phase, you could quickly gain rating points.` : ""}
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
                            Strong results with {topWhiteOpening.name} as White ({topWhiteOpening.winsPercentage}% win rate over {topWhiteOpening.games} games)
                          </li>
                        )}
                        {topBlackOpening && (
                          <li className="text-gray-700">
                            Effective use of {topBlackOpening.name} as Black ({topBlackOpening.winsPercentage}% win rate over {topBlackOpening.games} games)
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
                        {worstPhase && (
                          <li className="text-gray-700">
                            {worstPhase.name} accuracy ({worstPhase.value}%) needs improvement
                          </li>
                        )}
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
                        {worstPhase && worstPhase.name === 'Opening' && (
                          <li className="text-gray-700">
                            Study the first 10-15 moves of your main openings to improve your opening preparation
                          </li>
                        )}
                        {worstPhase && worstPhase.name === 'Middlegame' && (
                          <li className="text-gray-700">
                            Practice positional play and planning in complex middlegame positions
                          </li>
                        )}
                        {worstPhase && worstPhase.name === 'Endgame' && (
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
            <div className="grid md:grid-cols-2 gap-6">
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
              </div>
            )}
          </TabsContent>
          
          {/* Openings Analysis Tab */}
          <TabsContent value="openings" className="mt-6 space-y-8">
            <h2 className="text-2xl font-bold mb-4">Your Opening Repertoire</h2>
            
            {/* Top 20 Meaningful Openings */}
            <Card>
              <CardHeader>
                <CardTitle>Your Top 20 Most Meaningful Openings</CardTitle>
                <CardDescription>
                  Most significant openings based on frequency and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeaningfulOpeningsTable 
                  data={variantData.meaningfulCombined || []}
                  totalGames={variantData.totalWhiteGames + variantData.totalBlackGames}
                />
              </CardContent>
            </Card>
            
            {/* Opening Stats By Color */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* White Opening Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>White Opening Stats</CardTitle>
                  <CardDescription>
                    Top 5 openings as White by frequency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opening</TableHead>
                        <TableHead>Games %</TableHead>
                        <TableHead>Win %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(variantData.white3 || []).slice(0, 5).map((opening, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{opening.name}</TableCell>
                          <TableCell>{opening.gamesPercentage}%</TableCell>
                          <TableCell className={opening.winsPercentage > 55 ? "text-green-600 font-medium" : ""}>{opening.winsPercentage}%</TableCell>
                        </TableRow>
                      ))}
                      {(variantData.white3 || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-gray-500">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Black Opening Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Black Opening Stats</CardTitle>
                  <CardDescription>
                    Top 5 openings as Black by frequency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opening</TableHead>
                        <TableHead>Games %</TableHead>
                        <TableHead>Win %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(variantData.black3 || []).slice(0, 5).map((opening, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{opening.name}</TableCell>
                          <TableCell>{opening.gamesPercentage}%</TableCell>
                          <TableCell className={opening.winsPercentage > 50 ? "text-green-600 font-medium" : ""}>{opening.winsPercentage}%</TableCell>
                        </TableRow>
                      ))}
                      {(variantData.black3 || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-gray-500">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            {/* Opening Insights */}
            {variantData.insights && variantData.insights.length > 0 && (
              <Card className="border-l-4 border-l-chess-purple">
                <CardHeader>
                  <CardTitle>Opening Insights</CardTitle>
                  <CardDescription>Strategic observations based on your opening repertoire</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {variantData.insights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 text-chess-purple mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachTab;
