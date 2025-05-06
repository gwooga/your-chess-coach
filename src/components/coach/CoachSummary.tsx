
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { OpeningData, PhaseAccuracy, UserAnalysis } from '@/utils/types';
import { CheckCircle, AlertTriangle, BookOpen, Trophy } from "lucide-react";

interface CoachSummaryProps {
  analysis: UserAnalysis;
  topWhiteOpening: OpeningData | null;
  topBlackOpening: OpeningData | null;
  winRate: number;
  totalGames: number;
}

const CoachSummary: React.FC<CoachSummaryProps> = ({ 
  analysis, 
  topWhiteOpening, 
  topBlackOpening, 
  winRate, 
  totalGames 
}) => {
  // Best phase and worst phase
  const phaseData = [
    { name: 'Opening', value: analysis.phaseAccuracy.opening || 0 },
    { name: 'Middlegame', value: analysis.phaseAccuracy.middlegame || 0 },
    { name: 'Endgame', value: analysis.phaseAccuracy.endgame || 0 }
  ];
  
  const bestPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => b.value - a.value)[0] : null;
    
  const worstPhase = phaseData.length > 0 ? 
    [...phaseData].sort((a, b) => a.value - b.value)[0] : null;
  
  // Find best time slot for insights
  const bestTimeSlot = analysis.timePerformance.length > 0 ? 
    [...analysis.timePerformance].sort((a, b) => b.winRate - a.winRate)[0] : null;
  
  // Find best and worst day performance
  const bestDay = analysis.dayPerformance.length > 0 ? 
    [...analysis.dayPerformance].sort((a, b) => b.winRate - a.winRate)[0] : null;
  
  // Format the date range description
  const getTimeRangeDescription = () => {
    return `Based on your last ${totalGames} games`;
  };
  
  return (
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
  );
};

export default CoachSummary;
