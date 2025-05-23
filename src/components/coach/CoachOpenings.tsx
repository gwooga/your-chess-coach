
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { OpeningsTableData, OpeningData } from '@/utils/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle } from "lucide-react";
import MeaningfulOpeningsTable from '../MeaningfulOpeningsTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OpeningSummary from '../OpeningSummary';

interface CoachOpeningsProps {
  variantData: OpeningsTableData;
  totalGames: number;
  variant: string;
  whiteOpening?: OpeningData | null;
  blackOpening?: OpeningData | null;
}

const CoachOpenings: React.FC<CoachOpeningsProps> = ({ 
  variantData, 
  totalGames, 
  variant,
  whiteOpening,
  blackOpening
}) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Your Opening Repertoire</h2>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="breakdown">Full Breakdown</TabsTrigger>
        </TabsList>
        
        {/* New Summary Tab */}
        <TabsContent value="summary">
          <OpeningSummary data={variantData} variant={variant as any} />
        </TabsContent>
        
        {/* Highlights Tab */}
        <TabsContent value="highlights">
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
        </TabsContent>
        
        {/* Full Breakdown Tab */}
        <TabsContent value="breakdown">
          {/* Add the full breakdown content here */}
          <p className="text-gray-500">View the "Full Breakdown" tab from the main Openings tab for detailed analysis of all opening lines.</p>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default CoachOpenings;
