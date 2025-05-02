
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { UserAnalysis } from '@/utils/types';

interface ChessAdviserProps {
  analysis?: UserAnalysis;
}

const ChessAdviser: React.FC<ChessAdviserProps> = ({ analysis }) => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Generate a response based on the user's data and question
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const responseBasedOnData = generateResponse(question, analysis);
      setAnswer(responseBasedOnData);
    } catch (error) {
      setAnswer("I apologize, but I'm unable to provide an answer right now. Please try again later.");
      console.error("Error generating answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate personalized responses based on user data
  const generateResponse = (questionText: string, userData?: UserAnalysis): string => {
    // Default response if no user data is available
    if (!userData) {
      return "I need to analyze your games before I can give you personalized advice. Please submit your chess profile information first.";
    }

    const question = questionText.toLowerCase();
    
    // Performance time-related questions
    if (question.includes('best time') || question.includes('when should i play') || question.includes('time of day')) {
      const bestTimeSlot = [...userData.timePerformance].sort((a, b) => b.winRate - a.winRate)[0];
      const worstTimeSlot = [...userData.timePerformance].sort((a, b) => a.winRate - b.winRate)[0];
      return `Based on your game history, you perform best during ${bestTimeSlot.slot} with a ${bestTimeSlot.winRate}% win rate over ${bestTimeSlot.games} games. I'd recommend scheduling important matches during this time if possible. Your performance tends to dip during ${worstTimeSlot.slot} with only a ${worstTimeSlot.winRate}% win rate - you might want to avoid competitive play during this period.`;
    }
    
    // Day of week performance questions
    if (question.includes('day of week') || question.includes('best day') || question.includes('when to play')) {
      const bestDay = [...userData.dayPerformance].sort((a, b) => b.winRate - a.winRate)[0];
      const worstDay = [...userData.dayPerformance].sort((a, b) => a.winRate - b.winRate)[0];
      return `Your statistics show that ${bestDay.day} is your strongest day with a ${bestDay.winRate}% win rate (${bestDay.wins}-${bestDay.losses}-${bestDay.draws} record). On the other hand, ${worstDay.day} appears to be more challenging with only ${worstDay.winRate}% wins. This pattern might be related to your energy levels or focus throughout the week.`;
    }
    
    // Opening-related questions
    if (question.includes('opening') || question.includes('repertoire')) {
      const whiteOpenings = userData.openings.all.white3.sort((a, b) => b.winsPercentage - a.winsPercentage);
      const blackOpenings = userData.openings.all.black3.sort((a, b) => b.winsPercentage - a.winsPercentage);
      
      if (whiteOpenings.length === 0 || blackOpenings.length === 0) {
        return "I don't have enough opening data from your games yet. Play more games so I can analyze your opening repertoire.";
      }
      
      return `With white, your most successful opening is the ${whiteOpenings[0].name} (${whiteOpenings[0].winsPercentage}% win rate). As black, you're performing best with the ${blackOpenings[0].name} (${blackOpenings[0].winsPercentage}% win rate). Your weakest openings are ${whiteOpenings[whiteOpenings.length-1]?.name || 'not clear yet'} with white and ${blackOpenings[blackOpenings.length-1]?.name || 'not clear yet'} with black. Consider studying these weaker areas or deepening your knowledge of your successful lines.`;
    }
    
    // Game phase questions
    if (question.includes('phase') || question.includes('endgame') || question.includes('middlegame') || question.includes('opening phase')) {
      const phases = userData.phaseAccuracy;
      if (phases) {
        // Find strongest and weakest phases
        const phaseValues = [
          { name: 'opening', value: phases.opening },
          { name: 'middlegame', value: phases.middlegame },
          { name: 'endgame', value: phases.endgame }
        ];
        
        const strongest = phaseValues.reduce((a, b) => a.value > b.value ? a : b);
        const weakest = phaseValues.reduce((a, b) => a.value < b.value ? a : b);
        
        return `Your game phase analysis shows that your ${strongest.name} play is your strongest at ${strongest.value}% accuracy, while your ${weakest.name} could use improvement at ${weakest.value}%. I'd recommend focusing your study on improving ${weakest.name} positions - perhaps by analyzing master games that highlight typical ${weakest.name} themes.`;
      }
      
      return "I don't have enough data on your game phases yet. Play more analyzed games for better insights.";
    }
    
    // Ratings questions
    if (question.includes('rating') || question.includes('elo') || question.includes('improve rating')) {
      const ratings = userData.ratings;
      if (!ratings) {
        return "I don't have your current ratings information. Make sure your profile is public on the chess platform.";
      }
      
      const highestRating = Object.entries(ratings).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
      
      return `Your current ratings are: Blitz: ${ratings.blitz || 'N/A'}, Rapid: ${ratings.rapid || 'N/A'}, and Bullet: ${ratings.bullet || 'N/A'}. Your strongest time format appears to be ${highestRating[0]} at ${highestRating[1]} rating. Based on your performance metrics, focusing on ${userData.weaknesses[0]?.toLowerCase() || 'tactical play'} could help you break through to the next rating bracket. Many players at your level also benefit from targeted endgame practice and tactical puzzles.`;
    }
    
    // Strengths and weaknesses questions
    if (question.includes('strength') || question.includes('good at')) {
      if (!userData.strengths || userData.strengths.length === 0) {
        return "I haven't identified specific strengths yet. Play more analyzed games for better insights.";
      }
      
      return `Based on your game analysis, your main strengths are: ${userData.strengths.join(', ')}. I'd recommend leveraging these strengths while working on your areas for improvement.`;
    }
    
    if (question.includes('weakness') || question.includes('improve') || question.includes('bad at')) {
      if (!userData.weaknesses || userData.weaknesses.length === 0) {
        return "I haven't identified specific weaknesses yet. Play more analyzed games for better insights.";
      }
      
      return `Your game analysis indicates these areas need attention: ${userData.weaknesses.join(', ')}. Working on these specific aspects could significantly improve your overall play.`;
    }
    
    // Recommendations questions
    if (question.includes('recommend') || question.includes('study') || question.includes('practice') || question.includes('suggestion')) {
      if (!userData.recommendations || userData.recommendations.length === 0) {
        return "I need more game data to make specific recommendations. Play more analyzed games for personalized suggestions.";
      }
      
      return `Based on your performance data, here are my recommendations: ${userData.recommendations.join(', ')}. I'd suggest picking one area to focus on for the next few weeks before moving to the next.`;
    }
    
    // Questions about specific openings
    const openingNames = [
      'sicilian', 'french', 'caro-kann', 'pirc', 'modern', 'alekhine', 
      'scandinavian', 'nimzo', 'queen\'s gambit', 'king\'s indian', 'grunfeld', 
      'benoni', 'dutch', 'english', 'reti', 'catalan', 'slav', 'ruy lopez', 
      'italian', 'scotch', 'vienna', 'king\'s gambit', 'bishop\'s opening'
    ];
    
    for (const opening of openingNames) {
      if (question.includes(opening)) {
        // Look for this opening in the user's repertoire
        const allOpenings = [
          ...userData.openings.all.white3,
          ...userData.openings.all.black3,
          ...userData.openings.all.white5,
          ...userData.openings.all.black5
        ];
        
        const matchingOpenings = allOpenings.filter(op => 
          op.name.toLowerCase().includes(opening.toLowerCase()));
        
        if (matchingOpenings.length > 0) {
          const bestMatch = matchingOpenings.sort((a, b) => b.games - a.games)[0];
          return `You've played the ${bestMatch.name} in ${bestMatch.games} games with a ${bestMatch.winsPercentage}% win rate. This opening ${bestMatch.winsPercentage > 55 ? 'appears to suit your style well' : bestMatch.winsPercentage < 45 ? 'might not be optimal for your playing style' : 'gives you average results'}.`;
        } else {
          return `I don't see the ${opening} in your recent games. It might be worth exploring if you're interested in expanding your opening repertoire.`;
        }
      }
    }
    
    // Time management questions
    if (question.includes('time') || question.includes('clock') || question.includes('time pressure')) {
      if (userData.timeScrambleRecord) {
        const { wins, losses } = userData.timeScrambleRecord;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        
        return `In time scramble situations (less than 30 seconds on the clock), you have a ${winRate}% win rate (${wins} wins, ${losses} losses). ${winRate > 60 ? 'You seem to handle time pressure well!' : 'You might benefit from practicing bullet chess to improve your quick decision making under time pressure.'}`;
      }
    }
    
    // Default response based on user data
    return `Based on my analysis of your ${userData.openings.all.totalWhiteGames + userData.openings.all.totalBlackGames} games, I see that your ${userData.phaseAccuracy?.opening > userData.phaseAccuracy?.middlegame && userData.phaseAccuracy?.opening > userData.phaseAccuracy?.endgame ? 'opening' : (userData.phaseAccuracy?.middlegame > userData.phaseAccuracy?.endgame ? 'middlegame' : 'endgame')} play is your strongest phase. You perform best on ${[...userData.dayPerformance].sort((a, b) => b.winRate - a.winRate)[0].day}s and during ${[...userData.timePerformance].sort((a, b) => b.winRate - a.winRate)[0].slot} hours. To improve, I suggest working on ${userData.weaknesses[0]?.toLowerCase() || 'tactical puzzles'} as this appears to be your main area for growth.`;
  };

  return (
    <Card className="mt-6 border-l-4 border-l-chess-purple">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-chess-purple" />
          Ask Me Anything About Chess
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea 
              placeholder="Ask me about your chess games, opening strategies, or how to improve specific aspects of your play..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <Button 
            type="submit" 
            className="bg-chess-purple hover:bg-chess-purple/90" 
            disabled={isLoading || question.trim() === ''}
          >
            {isLoading ? 'Thinking...' : 'Get Advice'}
          </Button>
        </form>
        
        {answer && (
          <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
            <h4 className="font-semibold mb-2">Coach's Response:</h4>
            <p className="text-gray-700">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChessAdviser;
