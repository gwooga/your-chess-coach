
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform, UserInfo, TimeRange } from '@/utils/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Upload } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Chess } from 'chess.js';

interface UserFormProps {
  onSubmit: (userInfo: UserInfo, timeRange: TimeRange) => void;
  onPgnUpload: (pgnContent: string) => void;
  isLoading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, onPgnUpload, isLoading }) => {
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [timeRange, setTimeRange] = useState<TimeRange>('last90');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }
    
    onSubmit({
      username: username.trim(),
      platform,
    }, timeRange);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: "Reading file",
      description: "Processing your file...",
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        console.log("File loaded, size:", content.length);
        
        // Perform a basic validation check
        if (!content.includes('[Event') || !content.includes('[Date')) {
          toast({
            title: "Invalid PGN format",
            description: "The file doesn't appear to be a valid PGN file",
            variant: "destructive",
          });
          return;
        }
        
        // Count how many games might be in the file by counting [Event occurrences
        const potentialGameCount = (content.match(/\[Event /g) || []).length;
        console.log(`Detected approximately ${potentialGameCount} games in the file`);
        
        if (potentialGameCount === 0) {
          toast({
            title: "No games found",
            description: "The file doesn't appear to contain any valid chess games",
            variant: "destructive",
          });
          return;
        }
        
        try {
          // Try to identify at least one valid game in the file to confirm format
          const gameSample = content.split('[Event')[1];
          if (gameSample) {
            const tempGame = `[Event${gameSample.split(/\n\n\[Event/)[0]}`;
            const chess = new Chess();
            
            // Use Chess.js to validate, but clean up the PGN text first
            const cleanedPgn = tempGame
              .replace(/\{[^}]*\}/g, '') // Remove comments in curly braces
              .replace(/%[^\s\n]*/g, '') // Remove %eval, %clk annotations
              .replace(/\$\d+/g, '');     // Remove numeric annotation glyphs
            
            chess.loadPgn(cleanedPgn);
            
            toast({
              title: "File accepted",
              description: `Processing ${potentialGameCount} games from file...`,
            });
            
            onPgnUpload(content);
          } else {
            toast({
              title: "Invalid PGN format",
              description: "Could not identify valid games in the file",
              variant: "destructive",
            });
          }
        } catch (e) {
          console.error("Error validating PGN:", e);
          toast({
            title: "Error processing file",
            description: "The file appears to be in an unsupported format",
            variant: "destructive",
          });
        }
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the uploaded file",
        variant: "destructive",
      });
    };
    
    // Read the file as text
    reader.readAsText(file, 'UTF-8');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="bg-chess-purple/10">
        <CardTitle className="text-2xl font-bold text-center text-chess-dark">
          Chess Insight Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your chess username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-chess-purple/30 focus:border-chess-purple"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Platform</Label>
            <RadioGroup
              value={platform}
              onValueChange={(value) => setPlatform(value as Platform)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="chess.com" id="chess-com" />
                <Label htmlFor="chess-com" className="cursor-pointer">Chess.com</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lichess" id="lichess" />
                <Label htmlFor="lichess" className="cursor-pointer">Lichess</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeRange">Time Range</Label>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
            >
              <SelectTrigger id="timeRange" className="border-chess-purple/30">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="last180">Last 180 days</SelectItem>
                <SelectItem value="last365">Last 1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-chess-purple hover:bg-chess-dark-purple"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze My Games'}
          </Button>

          <Separator className="my-4" />
          
          <div className="text-center text-sm text-muted-foreground mb-2">
            OR
          </div>
          
          <div className="space-y-2">
            <input 
              type="file" 
              accept=".pgn,.txt" 
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <Button 
              type="button"
              variant="outline"
              className="w-full border-chess-purple/30 text-chess-purple hover:bg-chess-purple/10"
              onClick={triggerFileInput}
              disabled={isLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload PGN or TXT File
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;
