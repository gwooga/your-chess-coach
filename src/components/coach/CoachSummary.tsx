import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, BookOpen, Trophy } from "lucide-react";

interface CoachSummaryProps {
  personalReport: string;
  strengths: string[];
  areasToImprove: string[];
  studyRecommendations: string[];
}

const CoachSummary: React.FC<CoachSummaryProps> = ({ 
  personalReport, 
  strengths, 
  areasToImprove, 
  studyRecommendations 
}) => {
  // Function to format recommendation string
  const formatRecommendation = (rec: string) => {
    const focusMatch = rec.match(/Focus:\s*([^\-]+?)(?=\s*-|$)/i);
    const drillMatch = rec.match(/Drill:\s*([^\-]+?)(?=\s*-|$)/i);
    const rationaleMatch = rec.match(/Rationale:\s*(.+)/i);

    const focus = focusMatch ? focusMatch[1].trim() : '';
    const drill = drillMatch ? drillMatch[1].trim() : '';
    const rationale = rationaleMatch ? rationaleMatch[1].trim() : '';

    if (!focus && !drill && !rationale) return rec;

    // Build a natural sentence
    let sentence = '';
    if (drill) {
      sentence += drill;
      if (focus) sentence += ` in the ${focus}`;
      sentence = sentence.replace(/\.$/, ''); // remove period if exists
      sentence += '.';
    }
    if (rationale) {
      sentence += ` ${rationale}`;
    }
    return sentence.trim();
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
                  {personalReport}
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
                {strengths && strengths.map((strength, i) => (
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
                {areasToImprove && areasToImprove.map((item, i) => (
                  <li key={i} className="text-gray-700">{item}</li>
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
                {studyRecommendations && studyRecommendations.map((rec, i) => (
                  <li key={i} className="text-gray-700">{formatRecommendation(rec)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachSummary;
