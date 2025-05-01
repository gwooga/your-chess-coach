
import { Platform, TimeRange, UserAnalysis, ChessVariant, UserInfo, Rating, OpeningsTableData, DayPerformance, TimeSlotPerformance } from './types';
import { toast } from '@/hooks/use-toast';

// Mock data for development purposes
const mockRatings: Rating = {
  blitz: 1550,
  rapid: 1670,
  bullet: 1450,
};

// Mock opening data generation
const generateMockOpeningData = (totalGames: number, color: 'white' | 'black', depth: 3 | 5 | 7): any[] => {
  const openings = [
    { name: 'Sicilian Defense', sequence: color === 'white' ? '1.e4 c5' : '1.e4 c5', win: 0.6 },
    { name: 'French Defense', sequence: color === 'white' ? '1.e4 e6 2.d4 d5' : '1.e4 e6', win: 0.5 },
    { name: 'Caro Kann', sequence: color === 'white' ? '1.e4 c6 2.d4 d5' : '1.e4 c6', win: 0.55 },
    { name: 'Ruy Lopez', sequence: color === 'white' ? '1.e4 e5 2.Nf3 Nc6 3.Bb5' : '1.e4 e5 2.Nf3 Nc6 3.Bb5', win: 0.7 },
    { name: 'Queens Gambit', sequence: color === 'white' ? '1.d4 d5 2.c4' : '1.d4 d5 2.c4', win: 0.65 },
    { name: 'Kings Indian', sequence: color === 'white' ? '1.d4 Nf6 2.c4 g6' : '1.d4 Nf6 2.c4 g6', win: 0.45 },
    { name: 'Nimzo Indian', sequence: color === 'white' ? '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4' : '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', win: 0.5 },
    { name: 'English Opening', sequence: color === 'white' ? '1.c4 e5' : '1.c4 e5', win: 0.6 },
    { name: 'Dutch Defense', sequence: color === 'white' ? '1.d4 f5' : '1.d4 f5', win: 0.4 },
    { name: 'Pirc Defense', sequence: color === 'white' ? '1.e4 d6 2.d4 Nf6' : '1.e4 d6 2.d4 Nf6', win: 0.55 },
  ];

  // Add more moves based on depth
  if (depth >= 5) {
    openings.forEach(op => {
      const moves = op.sequence.split(' ');
      if (moves.length < 10) {
        if (op.name.includes('Sicilian')) op.sequence += ' 3.d4 cxd4 4.Nxd4 Nf6';
        else if (op.name.includes('French')) op.sequence += ' 3.Nc3 Bb4';
        else if (op.name.includes('Caro')) op.sequence += ' 3.Nc3 dxe4 4.Nxe4';
        else if (op.name.includes('Ruy')) op.sequence += ' 3...a6 4.Ba4 Nf6 5.0-0';
        else if (op.name.includes('Queens Gambit')) op.sequence += ' 2...dxc4 3.e3 Nf6 4.Bxc4 e6';
        else op.sequence += ' 3.Nf3 Bg7 4.g3 0-0 5.Bg2';
      }
    });
  }
  
  if (depth >= 7) {
    openings.forEach(op => {
      const moves = op.sequence.split(' ');
      if (moves.length < 14) {
        if (op.name.includes('Sicilian')) op.sequence += ' 5.Nc3 e6 6.Be2 Be7 7.0-0';
        else if (op.name.includes('French')) op.sequence += ' 4.e5 c5 5.a3 Bxc3+ 6.bxc3 Ne7 7.Qg4';
        else if (op.name.includes('Caro')) op.sequence += ' 5.Ng3 h6 6.Be2 Nf6 7.0-0';
        else if (op.name.includes('Ruy')) op.sequence += ' 5...Be7 6.Re1 b5 7.Bb3 0-0';
        else if (op.name.includes('Queens Gambit')) op.sequence += ' 5.0-0 Nbd7 6.Qe2 Be7 7.Rd1';
        else op.sequence += ' 6.0-0 d6 7.Nc3';
      }
    });
  }

  return openings.map((op, i) => {
    const games = Math.floor(Math.random() * totalGames * 0.3) + 5;
    const wins = Math.floor(op.win * games);
    const draws = Math.floor((1 - op.win) * 0.3 * games);
    const losses = games - wins - draws;
    
    return {
      name: op.name,
      sequence: op.sequence,
      games: games,
      gamesPercentage: parseFloat((games / totalGames * 100).toFixed(1)),
      wins: wins,
      winsPercentage: parseFloat((wins / games * 100).toFixed(1)),
      draws: draws,
      drawsPercentage: parseFloat((draws / games * 100).toFixed(1)),
      losses: losses,
      lossesPercentage: parseFloat((losses / games * 100).toFixed(1)),
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" // Default starting position, would be replaced with actual FEN
    };
  });
};

const generateDayPerformance = (): DayPerformance[] => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map(day => {
    const games = Math.floor(Math.random() * 80) + 20;
    const wins = Math.floor(Math.random() * games * 0.7);
    const draws = Math.floor(Math.random() * (games - wins) * 0.4);
    const losses = games - wins - draws;
    const winRate = parseFloat((wins / games * 100).toFixed(1));
    
    return { day, games, wins, draws, losses, winRate };
  });
};

const generateTimeSlotPerformance = (): TimeSlotPerformance[] => {
  const slots = ['00:00-03:59', '04:00-07:59', '08:00-11:59', '12:00-15:59', '16:00-19:59', '20:00-23:59'];
  return slots.map(slot => {
    const games = Math.floor(Math.random() * 100) + 10;
    const wins = Math.floor(Math.random() * games * 0.7);
    const draws = Math.floor(Math.random() * (games - wins) * 0.4);
    const losses = games - wins - draws;
    const winRate = parseFloat((wins / games * 100).toFixed(1));
    
    return { slot, games, wins, draws, losses, winRate };
  });
};

// Mock fetch user analysis data
const fetchUserAnalysis = async (userInfo: UserInfo, timeRange: TimeRange): Promise<UserAnalysis> => {
  // In a real app, we'd make API calls to chess.com or lichess here
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const totalGamesWhite = Math.floor(Math.random() * 300) + 100;
      const totalGamesBlack = Math.floor(Math.random() * 300) + 100;
      
      const createOpeningsData = (variant: ChessVariant): OpeningsTableData => {
        const multiplier = variant === 'all' ? 1 : 0.5;
        return {
          white3: generateMockOpeningData(Math.floor(totalGamesWhite * multiplier), 'white', 3),
          black3: generateMockOpeningData(Math.floor(totalGamesBlack * multiplier), 'black', 3),
          white5: generateMockOpeningData(Math.floor(totalGamesWhite * multiplier), 'white', 5),
          black5: generateMockOpeningData(Math.floor(totalGamesBlack * multiplier), 'black', 5),
          white7: generateMockOpeningData(Math.floor(totalGamesWhite * multiplier), 'white', 7),
          black7: generateMockOpeningData(Math.floor(totalGamesBlack * multiplier), 'black', 7),
          totalWhiteGames: Math.floor(totalGamesWhite * multiplier),
          totalBlackGames: Math.floor(totalGamesBlack * multiplier)
        };
      };
      
      const analysis: UserAnalysis = {
        ratings: mockRatings,
        openings: {
          all: createOpeningsData('all'),
          blitz: createOpeningsData('blitz'),
          rapid: createOpeningsData('rapid'),
          bullet: createOpeningsData('bullet')
        },
        dayPerformance: generateDayPerformance(),
        timePerformance: generateTimeSlotPerformance(),
        phaseAccuracy: {
          opening: Math.floor(Math.random() * 20) + 70,
          middlegame: Math.floor(Math.random() * 20) + 60,
          endgame: Math.floor(Math.random() * 30) + 50,
          totalGames: Math.floor(Math.random() * 200) + 100
        },
        moveQuality: {
          best: Math.floor(Math.random() * 30) + 30,
          good: Math.floor(Math.random() * 20) + 20,
          inaccuracy: Math.floor(Math.random() * 15) + 5,
          mistake: Math.floor(Math.random() * 10) + 3,
          blunder: Math.floor(Math.random() * 10) + 1,
          totalMoves: Math.floor(Math.random() * 4000) + 2000
        },
        materialSwings: Array.from({length: 40}, () => Math.random() * 4 - 2),
        conversionRate: Math.random() * 30 + 60,
        timeScrambleRecord: { wins: Math.floor(Math.random() * 50), losses: Math.floor(Math.random() * 30) },
        strengths: [
          "Strong opening preparation with the Sicilian Defense as black",
          "Good tactical awareness in complex middlegame positions",
          "Effective piece coordination in open positions",
          "Consistent development pattern as white"
        ],
        weaknesses: [
          "Tendency to overlook tactics after move 30",
          "Struggles in closed positions with blocked pawn structures",
          "Time management issues in longer games",
          "Difficulty converting winning endgame positions"
        ],
        recommendations: [
          "Focus on endgame technique, particularly in rook endings",
          "Practice calculation in complex positions",
          "Develop a more solid repertoire against 1.d4 openings",
          "Work on time management in critical positions"
        ]
      };
      
      resolve(analysis);
    }, 1500);
  });
};

export const fetchUserData = async (userInfo: UserInfo, timeRange: TimeRange): Promise<UserAnalysis> => {
  try {
    toast({
      title: "Fetching chess data",
      description: `Analyzing ${userInfo.username}'s games from ${userInfo.platform}...`,
    });
    
    const data = await fetchUserAnalysis(userInfo, timeRange);
    
    toast({
      title: "Analysis complete",
      description: `Successfully analyzed ${userInfo.username}'s games!`,
    });
    
    return data;
  } catch (error) {
    toast({
      title: "Error fetching data",
      description: "Failed to fetch or analyze chess games. Please try again.",
      variant: "destructive",
    });
    
    throw error;
  }
};
