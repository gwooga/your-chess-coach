
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform, UserInfo } from '@/utils/types';

interface UserFormProps {
  onSubmit: (userInfo: UserInfo) => void;
  isLoading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<Platform>('chess.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }
    
    onSubmit({
      username: username.trim(),
      platform,
    });
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
