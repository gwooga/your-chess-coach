
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { UserAnalysis } from '@/utils/types';
import UpgradeButton from './UpgradeButton';

interface ChessAdviserProps {
  analysis?: UserAnalysis;
}

const ChessAdviser: React.FC<ChessAdviserProps> = ({ analysis }) => {
  const [question, setQuestion] = useState<string>('');
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowUpgrade(true);
    setIsLoading(false);
  };

  // Removed detailed answer generation for Pro upgrade prompt

  return (
    <Card className="mt-6 border-l-4 border-l-chess-purple">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-chess-purple" />
          Ask Me Anything
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
        
        {showUpgrade && (
          <div className="mt-6 flex justify-center">
            <UpgradeButton useImage={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChessAdviser;
