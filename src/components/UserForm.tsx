import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform, UserInfo, TimeRange } from '@/utils/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpgradeButton from './UpgradeButton';

interface UserFormProps {
  onSubmit: (userInfo: UserInfo, timeRange: TimeRange) => void;
  onPgnUpload: (pgnContent: string) => void;
  isLoading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [timeRange, setTimeRange] = useState<TimeRange>('last90');
  const isTimeRangeDisabled = true;
  const [showTimeRangeUpgrade, setShowTimeRangeUpgrade] = useState(false);

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
            <div 
              className="relative"
              onMouseEnter={() => setShowTimeRangeUpgrade(true)}
              onMouseLeave={() => setShowTimeRangeUpgrade(false)}
            >
              <Select
                value={timeRange}
                onValueChange={(value) => setTimeRange(value as TimeRange)}
                disabled={isTimeRangeDisabled}
              >
                <SelectTrigger id="timeRange" className="border-chess-purple/30" disabled={isTimeRangeDisabled}>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last180">Last 180 days</SelectItem>
                  <SelectItem value="last365">Last 1 year</SelectItem>
                </SelectContent>
              </Select>
              {showTimeRangeUpgrade && isTimeRangeDisabled && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <UpgradeButton useImage={true} />
                </div>
              )}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-chess-purple hover:bg-chess-dark-purple"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze My Games'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;
