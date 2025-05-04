
import React from 'react';
import { DayPerformance, TimeSlotPerformance } from '@/utils/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TimeAnalysisTabProps {
  dayPerformance: DayPerformance[];
  timePerformance: TimeSlotPerformance[];
}

const TimeAnalysisTab: React.FC<TimeAnalysisTabProps> = ({ dayPerformance, timePerformance }) => {
  // Check if we have time data
  const hasTimeData = timePerformance && timePerformance.length > 0;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Performance by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          {dayPerformance && dayPerformance.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayPerformance}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="games" name="Games Played" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="winRate" name="Win Rate (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available for day performance.</p>
          )}
        </CardContent>
      </Card>
      
      {hasTimeData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timePerformance}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="slot" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="games" name="Games Played" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="winRate" name="Win Rate (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeAnalysisTab;
