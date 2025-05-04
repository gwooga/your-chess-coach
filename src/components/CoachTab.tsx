
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
  CalendarDays, 
  LightbulbIcon
} from "lucide-react";
import ChessAdviser from './ChessAdviser';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MeaningfulOpeningsTable from './MeaningfulOpeningsTable';
import OpeningsTable from './OpeningsTable';

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
  const hasTimeData = analysis.timePerformance.length > 0 && 
                      analysis.timePerformance.some(slot => slot.games > 0);
  
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
  const timeChartData = hasTimeData ? analysis.timePerformance.map(slot => ({
    name: slot.slot,
    winRate: slot.winRate,
    games: slot.games
  })) : [];
  
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
  
  // Get the top 3 meaningful openings for coach analysis
  const topOpenings = (variantData.meaningfulCombined || []).slice(0, 3);
  
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
  let avgWinLen = 45; // Mock average move count for wins (would be calculated from game data)
  let avgLossLen = 38; // Mock average move count for losses (would be calculated from game data)
  
  // Best phase and worst phase
  const bestPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => b.value - a.value)[0] : null;
    
  const worstPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => a.value - b.value)[0] : null;
    
  // Calculate average rating
  const nonZeroRatings = Object.values(analysis.ratings).filter(rating => rating > 0);
  const avgElo = nonZeroRatings.length > 0 
    ? Math.round(nonZeroRatings.reduce((sum, rating) => sum + rating, 0) / nonZeroRatings.length)
    : 1500; // Default if no rating data
  
  // Calculate rating band for study recommendations
  const ratingBand = {
    lower: Math.floor(avgElo / 200) * 200 + 1,
    upper: Math.floor(avgElo / 200) * 200 + 200
  };
  
  // Get next rating band for study recommendations
  const nextRatingBand = {
    lower: ratingBand.upper + 1,
    upper: ratingBand.upper + 200
  };
  
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
            <Card className="border-l-4 border-l-chess-purple mb-6">
              <CardHeader className="pb-2">
                <CardTitle>Personal Coaching Report</CardTitle>
                <CardDescription className="text-md">
                  {getTimeRangeDescription()} – Approx. rating: ~{avgElo} ({ratingBand.lower}-{ratingBand.upper})
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-6">
                  {/* Coach Summary Box */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <Trophy className="h-7 w-7 text-chess-purple" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">Coach Analysis</h2>
                        <p className="text-gray-700 leading-relaxed">
                          Your {winRate}% win rate shows {winRate > 55 ? "strong" : winRate > 45 ? "solid" : "developing"} skills. 
                          
                          {topOpenings.length > 0 && (
                            <>
                              {` Your most frequent opening is the ${topOpenings[0].name} as ${topOpenings[0].color} (${topOpenings[0].gamesPercentage}% of ${topOpenings[0].color} games), with a ${topOpenings[0].winsPercentage}% win rate. `}
                              {topOpenings[0].winsPercentage > 55 && "This is a strong opening for you. "}
                              {topOpenings[0].winsPercentage < 45 && "You may want to review this opening more deeply. "}
                            </>
                          )}
                          
                          {topOpenings.length > 1 && (
                            <>
                              {` The ${topOpenings[1].name} as ${topOpenings[1].color} (${topOpenings[1].gamesPercentage}% of games) shows a ${topOpenings[1].winsPercentage}% win rate. `}
                            </>
                          )}

                          {bestPhase ? ` Your ${bestPhase.name.toLowerCase()} phase is your strongest (${bestPhase.value}% accuracy), ` : ""}
                          {worstPhase ? `while your ${worstPhase.name.toLowerCase()} phase (${worstPhase.value}% accuracy) needs more focus. ` : ""}
                          
                          {` On average, your wins last ${avgWinLen} moves compared to ${avgLossLen} for losses. `}
                          
                          {analysis.conversionRate ? `Your advantage conversion rate of ${analysis.conversionRate}% when ahead in material ${analysis.conversionRate > 70 ? "is excellent" : analysis.conversionRate > 60 ? "is solid" : "needs improvement"}. ` : ""}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-bold text-lg mb-2 flex items-center">
                        <LightbulbIcon className="h-5 w-5 mr-2 text-chess-purple" />
                        Key Statistical Signals
                      </h3>
                      <ul className="list-disc pl-8 space-y-2">
                        {bestTimeSlot && (
                          <li className="text-gray-700">
                            Performance peaks during {bestTimeSlot.slot} ({bestTimeSlot.winRate}% win rate)
                          </li>
                        )}
                        {bestDay && (
                          <li className="text-gray-700">
                            {bestDay.day}s are your best day ({bestDay.winRate}% win rate)
                          </li>
                        )}
                        {worstPhase && (
                          <li className="text-gray-700">
                            {worstPhase.name} phase is your weakest ({worstPhase.value}% accuracy)
                          </li>
                        )}
                        {analysis.timeScrambleRecord && (
                          <li className="text-gray-700">
                            Time scramble record: {analysis.timeScrambleRecord.wins}-{analysis.timeScrambleRecord.losses} (W-L)
                          </li>
                        )}
                      </ul>
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
                        {topOpenings.filter(o => o.winsPercentage >= 55 && o.gamesPercentage >= 3).map((opening, i) => (
                          <li key={i} className="text-gray-700">
                            Strong results with {opening.name} as {opening.color} ({opening.winsPercentage}% win rate)
                          </li>
                        ))}
                        {analysis.conversionRate && analysis.conversionRate > 70 && (
                          <li className="text-gray-700">
                            Excellent conversion of advantages ({analysis.conversionRate}% success rate)
                          </li>
                        )}
                        {bestPhase && (
                          <li className="text-gray-700">
                            Strong {bestPhase.name.toLowerCase()} play ({bestPhase.value}% accuracy)
                          </li>
                        )}
                        {bestDay && (
                          <li className="text-gray-700">
                            Consistent performance on {bestDay.day}s ({bestDay.winRate}% win rate)
                          </li>
                        )}
                        {topOpenings.every(o => o.gamesPercentage < 20) && (
                          <li className="text-gray-700">
                            Good opening diversity (no opening exceeds 20% of your games)
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
                      
                      <div className="space-y-4">
                        {topOpenings.filter(o => o.lossesPercentage >= 55 && o.gamesPercentage >= 3).map((opening, i) => (
                          <p key={i} className="text-gray-700">
                            Your results with the {opening.name} as {opening.color} show a high loss rate of {opening.lossesPercentage}%. 
                            Consider studying common middlegame plans or tactical patterns in this opening.
                          </p>
                        ))}
                        
                        {topOpenings.filter(o => o.gamesPercentage >= 10 && o.winsPercentage <= o.lossesPercentage).map((opening, i) => (
                          <p key={i} className="text-gray-700">
                            You frequently play the {opening.name} as {opening.color} ({opening.gamesPercentage}% of games), but only achieve a {opening.winsPercentage}% win rate. 
                            Since this is a significant part of your repertoire, improving here would boost your overall results.
                          </p>
                        ))}
                        
                        {worstPhase && (
                          <p className="text-gray-700">
                            Your {worstPhase.name.toLowerCase()} play shows room for improvement at {worstPhase.value}% accuracy. 
                            This is {Math.round(bestPhase ? bestPhase.value - worstPhase.value : 0)} percentage points lower than your strongest phase.
                          </p>
                        )}
                        
                        {analysis.timeScrambleRecord && (analysis.timeScrambleRecord.losses > analysis.timeScrambleRecord.wins) && (
                          <p className="text-gray-700">
                            Your time management could use work, with a {analysis.timeScrambleRecord.wins}-{analysis.timeScrambleRecord.losses} record in time scramble situations.
                            Practicing faster play or better clock management would improve your results.
                          </p>
                        )}
                        
                        {worstDay && worstDay.winRate < 40 && (
                          <p className="text-gray-700">
                            Your play on {worstDay.day}s is notably weaker ({worstDay.winRate}% win rate). Consider whether fatigue, 
                            scheduling, or other factors might be affecting your concentration on these days.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Study Recommendations Section */}
                    <div>
                      <div className="flex items-center mb-4">
                        <BookOpen className="mr-2 h-6 w-6 text-blue-500" />
                        <h3 className="text-xl font-bold">Study Recommendations</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Focus areas for {nextRatingBand.lower}-{nextRatingBand.upper} rating level
                      </p>
                      <ul className="list-disc pl-10 space-y-2">
                        {worstPhase && worstPhase.name === 'Opening' && (
                          <li className="text-gray-700">
                            Study the first 10-15 moves of your main openings, focusing on understanding the typical middlegame positions
                          </li>
                        )}
                        
                        {worstPhase && worstPhase.name === 'Middlegame' && (
                          <li className="text-gray-700">
                            Practice positional evaluation and planning in complex middlegame positions
                          </li>
                        )}
                        
                        {worstPhase && worstPhase.name === 'Endgame' && (
                          <li className="text-gray-700">
                            Master essential endgame principles and practice common endgame patterns like opposition and zugzwang
                          </li>
                        )}
                        
                        {topOpenings.filter(o => o.lossesPercentage >= 55 && o.gamesPercentage >= 3).map((opening, i) => (
                          <li key={i} className="text-gray-700">
                            Analyze your {opening.name} games as {opening.color} to identify recurring tactical or strategic issues
                          </li>
                        ))}
                        
                        {avgElo >= 1400 && avgElo < 1600 && (
                          <>
                            <li className="text-gray-700">
                              Work on positional themes like weak squares, outposts, and pawn structure analysis
                            </li>
                            <li className="text-gray-700">
                              Practice time management with daily puzzles under timed conditions
                            </li>
                          </>
                        )}
                        
                        {avgElo >= 1600 && avgElo < 1800 && (
                          <>
                            <li className="text-gray-700">
                              Study rook endgames in depth, particularly rook and pawn vs rook positions
                            </li>
                            <li className="text-gray-700">
                              Develop a calculation routine: candidate moves, forcing lines, evaluation
                            </li>
                            <li className="text-gray-700">
                              Create deeper opening preparation for your most frequent lines, reaching 12-15 moves deep
                            </li>
                          </>
                        )}
                        
                        {avgElo >= 1800 && avgElo < 2000 && (
                          <>
                            <li className="text-gray-700">
                              Study advanced pawn structures and piece coordination principles
                            </li>
                            <li className="text-gray-700">
                              Practice prophylactic thinking: anticipate opponent's plans and prevent them
                            </li>
                            <li className="text-gray-700">
                              Use engines to analyze your critical games and identify tactical opportunities
                            </li>
                          </>
                        )}
                        
                        {avgElo >= 2000 && (
                          <>
                            <li className="text-gray-700">
                              Prepare opening novelties in your core repertoire for surprise value
                            </li>
                            <li className="text-gray-700">
                              Study psychological aspects of playing against similarly rated opponents
                            </li>
                            <li className="text-gray-700">
                              Develop specialized endgame knowledge in your most common pawn structures
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top 20 Openings Table */}
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
            
            {/* Ask Me Anything Section */}
            <div className="mt-8">
              <ChessAdviser analysis={analysis} />
            </div>
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
            
            {/* Depth Tables */}
            <h3 className="text-xl font-medium mt-8 mb-4">Opening Move Analysis (Depths 2-5)</h3>
            
            {/* Depth 2 Paired Tables */}
            <h4 className="font-medium mb-2">Depth 2 Openings</h4>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <OpeningsTable 
                data={variantData.white2 || []} 
                title="As White - 2 Moves" 
                totalGames={variantData.totalWhiteGames}
              />
              <OpeningsTable 
                data={variantData.black2 || []} 
                title="As Black - 2 Moves" 
                totalGames={variantData.totalBlackGames}
              />
            </div>
            
            {/* Depth 3 Paired Tables */}
            <h4 className="font-medium mb-2">Depth 3 Openings</h4>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <OpeningsTable 
                data={variantData.white3 || []} 
                title="As White - 3 Moves" 
                totalGames={variantData.totalWhiteGames}
              />
              <OpeningsTable 
                data={variantData.black3 || []} 
                title="As Black - 3 Moves" 
                totalGames={variantData.totalBlackGames}
              />
            </div>
            
            {/* Depth 4 Paired Tables */}
            <h4 className="font-medium mb-2">Depth 4 Openings</h4>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <OpeningsTable 
                data={variantData.white4 || []} 
                title="As White - 4 Moves" 
                totalGames={variantData.totalWhiteGames}
              />
              <OpeningsTable 
                data={variantData.black4 || []} 
                title="As Black - 4 Moves" 
                totalGames={variantData.totalBlackGames}
              />
            </div>
            
            {/* Depth 5 Paired Tables */}
            <h4 className="font-medium mb-2">Depth 5 Openings</h4>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <OpeningsTable 
                data={variantData.white5 || []} 
                title="As White - 5 Moves" 
                totalGames={variantData.totalWhiteGames}
              />
              <OpeningsTable 
                data={variantData.black5 || []} 
                title="As Black - 5 Moves" 
                totalGames={variantData.totalBlackGames}
              />
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
