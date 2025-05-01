
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const ChessAdviser: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Here we would normally make an API call to a language model
      // For now, we'll simulate a response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the question is chess-related
      const chessKeywords = ['chess', 'opening', 'endgame', 'middlegame', 'tactic', 'strategy', 'rating', 'elo', 'queen', 'king', 'rook', 'bishop', 'knight', 'pawn', 'checkmate', 'stalemate', 'draw', 'tournament', 'position', 'analyze', 'game', 'sicilian', 'french', 'caro-kann', 'defense', 'attack'];
      
      const isChessRelated = chessKeywords.some(keyword => 
        question.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!isChessRelated) {
        setAnswer("I'm sorry, I can only answer chess-related questions. Please ask something about chess, your games, openings, tactics, or strategy.");
      } else {
        // Simulate response for chess questions
        const responses = [
          "Based on your games, I'd recommend focusing more on endgame technique. Practice king and pawn endings to improve your conversion rate.",
          "Looking at your opening repertoire, you might benefit from studying the key ideas of the Sicilian Defense in more depth, particularly the typical middlegame structures.",
          "Your tactical awareness is strong, but your strategic planning could use improvement. Consider studying games by positional masters like Karpov or Kramnik.",
          "Your time management appears to be an issue in longer games. Try setting personal checkpoints during games to assess your remaining time.",
          "Based on your performance data, you tend to play better in morning sessions. Consider scheduling important games during your peak performance hours.",
          "To improve your calculation accuracy, I suggest daily tactical puzzles focusing specifically on piece coordination.",
          "Your opening knowledge is solid, but you might benefit from reviewing typical pawn structures that arise from your favorite openings."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setAnswer(randomResponse);
      }
    } catch (error) {
      setAnswer("I apologize, but I'm unable to provide an answer right now. Please try again later.");
      console.error("Error generating answer:", error);
    } finally {
      setIsLoading(false);
    }
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
