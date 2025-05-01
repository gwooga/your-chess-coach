
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
      
      return `With white, your most successful opening is the ${whiteOpenings[0].name} (${whiteOpenings[0].winsPercentage}% win rate). As black, you're performing best with the ${blackOpenings[0].name} (${blackOpenings[0].winsPercentage}% win rate). Your weakest openings are ${whiteOpenings[whiteOpenings.length-1].name} with white and ${blackOpenings[blackOpenings.length-1].name} with black. Consider studying these weaker areas or deepening your knowledge of your successful lines.`;
    }
    
    // Game phase questions
    if (question.includes('phase') || question.includes('endgame') || question.includes('middlegame') || question.includes('opening phase')) {
      const phases = userData.phaseAccuracy;
      if (phases) {
        const strongest = Object.entries(phases).reduce((a, b) => 
          a[0] !== 'totalGames' && b[0] !== 'totalGames' && a[1] > b[1] ? a : b
        );
        const weakest = Object.entries(phases).reduce((a, b) => 
          a[0] !== 'totalGames' && b[0] !== 'totalGames' && a[1] < b[1] ? a : b
        );
        
        return `Your game phase analysis shows that your ${strongest[0]} play is your strongest at ${strongest[1]}% accuracy, while your ${weakest[0]} could use improvement at ${weakest[1]}%. I'd recommend focusing your study on improving ${weakest[0]} positions - perhaps by analyzing master games that highlight typical ${weakest[0]} themes.`;
      }
    }
    
    // Ratings questions
    if (question.includes('rating') || question.includes('elo') || question.includes('improve rating')) {
      const ratings = userData.ratings;
      const highestRating = Object.entries(ratings).reduce((a, b) => a[1] > b[1] ? a : b);
      
      return `Your current ratings are: Blitz: ${ratings.blitz}, Rapid: ${ratings.rapid}, and Bullet: ${ratings.bullet}. Your strongest time format appears to be ${highestRating[0]} at ${highestRating[1]} rating. Based on your performance metrics, focusing on ${userData.weaknesses[0].toLowerCase()} could help you break through to the next rating bracket. Many players at your level also benefit from targeted endgame practice and tactical puzzles.`;
    }
    
    // Strengths and weaknesses questions
    if (question.includes('strength') || question.includes('good at')) {
      return `Based on your game analysis, your main strengths are: ${userData.strengths.join(', ')}. I'd recommend leveraging these strengths while working on your areas for improvement.`;
    }
    
    if (question.includes('weakness') || question.includes('improve') || question.includes('bad at')) {
      return `Your game analysis indicates these areas need attention: ${userData.weaknesses.join(', ')}. Working on these specific aspects could significantly improve your overall play.`;
    }
    
    // Recommendations questions
    if (question.includes('recommend') || question.includes('study') || question.includes('practice') || question.includes('suggestion')) {
      return `Based on your performance data, here are my recommendations: ${userData.recommendations.join(', ')}. I'd suggest picking one area to focus on for the next few weeks before moving to the next.`;
    }
    
    // General advice
    return `Based on your performance data, I can see that you have a ${userData.strengths[0].toLowerCase()}. However, you might improve by ${userData.weaknesses[0].toLowerCase()}. I recommend that you ${userData.recommendations[0].toLowerCase()} to see improvement in your rating and overall play.`;
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
