
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { OpeningsTableData } from '@/utils/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle } from "lucide-react";
import MeaningfulOpeningsTable from '../MeaningfulOpeningsTable';

interface CoachOpeningsProps {
  variantData: OpeningsTableData;
  totalGames: number;
}

const CoachOpenings: React.FC<CoachOpeningsProps> = ({ variantData, totalGames }) => {
  return (
    <>
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
            totalGames={totalGames}
          />
        </CardContent>
      </Card>
      
      {/* Opening Stats By Color */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
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
                  <TableHead>Games (N)</TableHead>
                  <TableHead>Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(variantData.white3 || []).slice(0, 5).map((opening, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{opening.name}</TableCell>
                    <TableCell>{opening.games} ({opening.gamesPercentage}%)</TableCell>
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
                  <TableHead>Games (N)</TableHead>
                  <TableHead>Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(variantData.black3 || []).slice(0, 5).map((opening, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{opening.name}</TableCell>
                    <TableCell>{opening.games} ({opening.gamesPercentage}%)</TableCell>
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
      
      {/* Opening Insights */}
      {variantData.insights && variantData.insights.length > 0 && (
        <Card className="border-l-4 border-l-chess-purple mt-8">
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
    </>
  );
};

export default CoachOpenings;
