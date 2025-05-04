
import React from 'react';
import { MoveQuality } from '@/utils/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface MoveQualityTabProps {
  moveQuality?: MoveQuality;
  materialSwings?: number[];
}

const MoveQualityTab: React.FC<MoveQualityTabProps> = ({ moveQuality, materialSwings }) => {
  // If no move quality data, show empty state
  if (!moveQuality) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Move quality data is not available.</p>
      </div>
    );
  }

  // Transform move quality data for pie chart
  const moveQualityData = [
    { name: 'Best Moves', value: moveQuality.best, color: '#4ade80' }, // green
    { name: 'Good Moves', value: moveQuality.good, color: '#60a5fa' }, // blue
    { name: 'Inaccuracies', value: moveQuality.inaccuracy, color: '#facc15' }, // yellow
    { name: 'Mistakes', value: moveQuality.mistake, color: '#fb923c' }, // orange
    { name: 'Blunders', value: moveQuality.blunder, color: '#f87171' }, // red
  ];
  
  // Format material swings data if available
  const swingsData = materialSwings 
    ? materialSwings.map((value, index) => ({ move: index + 1, value }))
    : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Move Quality Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moveQualityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {moveQualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Total moves analyzed: {moveQuality.totalMoves}
            </p>
          </div>
        </CardContent>
      </Card>

      {materialSwings && materialSwings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material Swings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={swingsData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="move" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoveQualityTab;
