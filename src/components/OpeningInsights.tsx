
import React from 'react';
import { LightbulbIcon } from 'lucide-react';

interface OpeningInsightsProps {
  insights: string[];
}

const OpeningInsights: React.FC<OpeningInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return <p className="text-muted-foreground italic">No insights available for your games yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {insights.map((insight, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-1">
            <LightbulbIcon className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-gray-700">{insight}</p>
        </li>
      ))}
    </ul>
  );
};

export default OpeningInsights;
