import { Platform, TimeRange, UserAnalysis, ChessVariant, UserInfo, Rating, OpeningsTableData, DayPerformance, TimeSlotPerformance } from './types';
import { toast } from '@/hooks/use-toast';

// Function to generate realistic FEN strings for chess positions
const generateFENForMoves = (moves: string): string => {
  // This is a simplified mapping for common openings to their FEN positions
  // In a real app, we would use a chess engine to calculate actual positions
  const openingPositions: Record<string, string> = {
    // Sicilian variations
    "1.e4 c5": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "1.e4 c5 2.Nf3": "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    "1.e4 c5 3.d4 cxd4 4.Nxd4 Nf6": "rnbqkb1r/pp1ppppp/5n2/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5",
    
    // French Defense
    "1.e4 e6": "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "1.e4 e6 2.d4 d5": "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    "1.e4 e6 2.d4 d5 3.Nc3": "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3",
    
    // Caro-Kann
    "1.e4 c6": "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "1.e4 c6 2.d4 d5": "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    "1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4": "rnbqkbnr/pp2pppp/2p5/8/3PN3/8/PPP2PPP/R1BQKBNR b KQkq - 0 4",
    
    // Ruy Lopez
    "1.e4 e5 2.Nf3 Nc6 3.Bb5": "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6": "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    
    // Queen's Gambit
    "1.d4 d5 2.c4": "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
    "1.d4 d5 2.c4 dxc4": "rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    
    // King's Indian
    "1.d4 Nf6 2.c4 g6": "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7": "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    
    // English Opening
    "1.c4 e5": "rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2",
    
    // Dutch Defense
    "1.d4 f5": "rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2",
    
    // Deeper variations
    "1.e4 c5 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6 6.Be2 Be7 7.0-0": "r1bqk2r/pp1pbppp/2n1pn2/8/3NP3/2N5/PPP1BPPP/R1BQ1RK1 b kq - 5 7",
    "1.e4 e6 4.e5 c5 5.a3 Bxc3+ 6.bxc3 Ne7 7.Qg4": "rnbqk2r/pp1pnppp/4p3/2p1P3/6Q1/P1P5/2PP1PPP/R1B1KBNR b KQkq - 1 7", 
    "1.e4 c6 5.Ng3 h6 6.Be2 Nf6 7.0-0": "rnbqkb1r/pp1ppp2/2p2n1p/8/4P3/6N1/PPPPBPPP/RNBQ1RK1 b kq - 3 7",
    "1.d4 d5 2.c4 dxc4 3.e3 Nf6 4.Bxc4 e6 5.0-0 Nbd7 6.Qe2 Be7 7.Rd1": "r1bqk2r/pppnbppp/4pn2/8/2BP4/4P3/PP1QNPPP/RNB2RK1 b kq - 5 7"
  };

  // Find the exact match first
  if (openingPositions[moves]) {
    return openingPositions[moves];
  }
  
  // If no exact match, find the longest matching prefix
  const moveParts = moves.split(' ');
  for (let i = moveParts.length; i > 0; i--) {
    const partialMoves = moveParts.slice(0, i).join(' ');
    if (openingPositions[partialMoves]) {
      return openingPositions[partialMoves];
    }
  }
  
  // Default to starting position if no match found
  return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
};

// Function to generate varied range of ratings based on username to ensure different users get different results
const generateRatings = (username: string): Rating => {
  // Use username as a seed for "random" but consistent generation
  const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const baseRating = 1200 + (seed % 800); // Rating between 1200-2000
  const variance = 200; // Variance between time controls
  
  return {
    blitz: baseRating + (seed % variance),
    rapid: baseRating + ((seed * 2) % variance),
    bullet: baseRating - ((seed * 3) % variance),
  };
};

// Generate varied opening data based on username and color
const generateOpeningData = (
  username: string, 
  totalGames: number, 
  color: 'white' | 'black', 
  depth: 3 | 5 | 7
): any[] => {
  // Use username as a seed
  const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const openings = [
    { name: 'Sicilian Defense', sequence: color === 'white' ? '1.e4 c5' : '1.e4 c5', baseWinRate: 0.58 },
    { name: 'French Defense', sequence: color === 'white' ? '1.e4 e6 2.d4 d5' : '1.e4 e6', baseWinRate: 0.52 },
    { name: 'Caro Kann', sequence: color === 'white' ? '1.e4 c6 2.d4 d5' : '1.e4 c6', baseWinRate: 0.55 },
    { name: 'Ruy Lopez', sequence: color === 'white' ? '1.e4 e5 2.Nf3 Nc6 3.Bb5' : '1.e4 e5 2.Nf3 Nc6 3.Bb5', baseWinRate: 0.62 },
    { name: 'Queens Gambit', sequence: color === 'white' ? '1.d4 d5 2.c4' : '1.d4 d5 2.c4', baseWinRate: 0.59 },
    { name: 'Kings Indian', sequence: color === 'white' ? '1.d4 Nf6 2.c4 g6' : '1.d4 Nf6 2.c4 g6', baseWinRate: 0.48 },
    { name: 'Nimzo Indian', sequence: color === 'white' ? '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4' : '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', baseWinRate: 0.51 },
    { name: 'English Opening', sequence: color === 'white' ? '1.c4 e5' : '1.c4 e5', baseWinRate: 0.56 },
    { name: 'Dutch Defense', sequence: color === 'white' ? '1.d4 f5' : '1.d4 f5', baseWinRate: 0.45 },
    { name: 'Pirc Defense', sequence: color === 'white' ? '1.e4 d6 2.d4 Nf6' : '1.e4 d6 2.d4 Nf6', baseWinRate: 0.53 },
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

  // Use the username seed to vary win rates for each opening
  return openings.map((op, i) => {
    // Create a unique modifier for this opening based on username and opening index
    const uniqueModifier = ((seed * (i + 1)) % 20 - 10) / 100; // -0.1 to +0.1
    const personalizedWinRate = Math.max(0.3, Math.min(0.85, op.baseWinRate + uniqueModifier));
    
    // Calculate games played with this opening (different distribution for each user)
    const openingPopularity = 0.4 + (((seed * (i + 3)) % 60) / 100); // 0.4 to 1.0
    const games = Math.floor(totalGames * openingPopularity * (1 / openings.length) * (1 + ((seed * i) % 30) / 100));
    
    // Calculate results
    const wins = Math.floor(personalizedWinRate * games);
    const drawRate = 0.1 + ((seed * i) % 20) / 100; // 0.1 to 0.3
    const draws = Math.floor((1 - personalizedWinRate) * drawRate * games);
    const losses = games - wins - draws;
    
    // Generate proper FEN for the position
    const fen = generateFENForMoves(op.sequence);
    
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
      fen: fen
    };
  }).sort((a, b) => b.games - a.games); // Sort by most played
};

// Generate varied day performance data based on username
const generateDayPerformance = (username: string): DayPerformance[] => {
  const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Create a personalized pattern - some users better on weekends, some on weekdays
  const weekdayBonus = seed % 2 === 0 ? 5 : -5;
  
  return days.map((day, i) => {
    const dayIndex = i;
    const isWeekend = dayIndex >= 5;
    
    // Base values that are unique to this user and day
    const baseSeed = (seed * (i + 1)) % 100;
    const baseGames = 15 + baseSeed % 30;
    const baseWinRate = 45 + baseSeed % 25;
    
    // Apply weekday/weekend effect based on user pattern
    const winRate = baseWinRate + (isWeekend ? -weekdayBonus : weekdayBonus);
    const games = baseGames;
    
    // Calculate wins, draws, losses
    const wins = Math.floor((winRate / 100) * games);
    const draws = Math.floor((games - wins) * (0.2 + (baseSeed % 20) / 100));
    const losses = games - wins - draws;
    
    return { 
      day, 
      games, 
      wins, 
      draws, 
      losses, 
      winRate: parseFloat(winRate.toFixed(1)) 
    };
  });
};

// Generate varied time slot performance data based on username
const generateTimeSlotPerformance = (username: string): TimeSlotPerformance[] => {
  const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const slots = ['00:00-03:59', '04:00-07:59', '08:00-11:59', '12:00-15:59', '16:00-19:59', '20:00-23:59'];
  
  // Create a personalized pattern - some users better in morning, some in evening
  const morningPerson = seed % 3 === 0;
  const nightPerson = seed % 3 === 1;
  // If neither morning nor night person, they're an afternoon person
  
  return slots.map((slot, i) => {
    const slotIndex = i;
    const isMorning = slotIndex >= 1 && slotIndex <= 2;
    const isAfternoon = slotIndex >= 3 && slotIndex <= 4;
    const isNight = slotIndex === 5 || slotIndex === 0;
    
    // Base values unique to this user and time slot
    const baseSeed = (seed * (i + 1)) % 100;
    const baseGames = 10 + baseSeed % 40;
    const baseWinRate = 45 + baseSeed % 20;
    
    // Apply time preference bonus
    let winRateBonus = 0;
    if (morningPerson && isMorning) winRateBonus = 8;
    else if (nightPerson && isNight) winRateBonus = 10;
    else if (!morningPerson && !nightPerson && isAfternoon) winRateBonus = 7;
    
    const winRate = baseWinRate + winRateBonus;
    const games = baseGames;
    
    // Calculate wins, draws, losses
    const wins = Math.floor((winRate / 100) * games);
    const draws = Math.floor((games - wins) * (0.2 + (baseSeed % 20) / 100));
    const losses = games - wins - draws;
    
    return { 
      slot, 
      games, 
      wins, 
      draws, 
      losses, 
      winRate: parseFloat(winRate.toFixed(1)) 
    };
  });
};

// Mock fetch user analysis data
const fetchUserAnalysis = async (userInfo: UserInfo, timeRange: TimeRange): Promise<UserAnalysis> => {
  // In a real app, we'd make API calls to chess.com or lichess here
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const username = userInfo.username;
      const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Generate game counts based on username and time range
      const baseGameCount = 200 + (seed % 400);
      const timeMultiplier = timeRange === 'last30' ? 0.3 : 
                            timeRange === 'last90' ? 1.0 : 
                            timeRange === 'last180' ? 1.8 : 2.5;
      
      const totalGamesWhite = Math.floor(baseGameCount * timeMultiplier * (0.9 + ((seed % 20) / 100)));
      const totalGamesBlack = Math.floor(baseGameCount * timeMultiplier * (1.1 - ((seed % 20) / 100)));
      
      const ratings = generateRatings(username);
      
      const createOpeningsData = (variant: ChessVariant): OpeningsTableData => {
        const variantSeed = variant === 'blitz' ? seed * 2 : 
                           variant === 'rapid' ? seed * 3 : 
                           variant === 'bullet' ? seed * 5 : seed;
        
        const variantUsername = username + variant; // Create variant-specific username seed
        const multiplier = variant === 'all' ? 1 : 0.5;
        
        // Calculate total games for this variant
        const variantTotalGamesWhite = Math.floor(totalGamesWhite * multiplier);
        const variantTotalGamesBlack = Math.floor(totalGamesBlack * multiplier);
        
        // Calculate wins, draws, losses
        const winRateWhite = 0.45 + ((variantSeed % 30) / 100); // 45-75% win rate
        const drawRateWhite = 0.1 + ((variantSeed % 15) / 100); // 10-25% draw rate
        const lossRateWhite = 1 - winRateWhite - drawRateWhite;
        
        const winRateBlack = 0.40 + ((variantSeed % 25) / 100); // 40-65% win rate
        const drawRateBlack = 0.1 + ((variantSeed % 15) / 100); // 10-25% draw rate
        const lossRateBlack = 1 - winRateBlack - drawRateBlack;
        
        // Calculate total wins, draws, losses
        const totalWhiteWins = Math.floor(variantTotalGamesWhite * winRateWhite);
        const totalWhiteDraws = Math.floor(variantTotalGamesWhite * drawRateWhite);
        const totalWhiteLosses = variantTotalGamesWhite - totalWhiteWins - totalWhiteDraws;
        
        const totalBlackWins = Math.floor(variantTotalGamesBlack * winRateBlack);
        const totalBlackDraws = Math.floor(variantTotalGamesBlack * drawRateBlack);
        const totalBlackLosses = variantTotalGamesBlack - totalBlackWins - totalBlackDraws;
        
        return {
          white2: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 3),
          black2: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 3),
          white3: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 3),
          black3: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 3),
          white4: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 3),
          black4: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 3),
          white5: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 5),
          black5: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 5),
          white6: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 5),
          black6: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 5),
          white7: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 7),
          black7: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 7),
          white8: generateOpeningData(variantUsername, variantTotalGamesWhite, 'white', 7),
          black8: generateOpeningData(variantUsername, variantTotalGamesBlack, 'black', 7),
          totalWhiteGames: variantTotalGamesWhite,
          totalBlackGames: variantTotalGamesBlack,
          totalWhiteWins: totalWhiteWins,
          totalBlackWins: totalBlackWins,
          totalWhiteDraws: totalWhiteDraws,
          totalBlackDraws: totalBlackDraws,
          totalWhiteLosses: totalWhiteLosses,
          totalBlackLosses: totalBlackLosses
        };
      };
      
      // Generate phase accuracies based on user tendencies
      const openingSkill = 65 + ((seed * 3) % 25);
      const middlegameSkill = 60 + ((seed * 7) % 25);
      const endgameSkill = 55 + ((seed * 11) % 30);
      
      // Generate strengths and weaknesses based on the phase skills
      const phaseSkills = [
        { phase: 'opening', skill: openingSkill },
        { phase: 'middlegame', skill: middlegameSkill },
        { phase: 'endgame', skill: endgameSkill }
      ];
      
      const sortedByStrength = [...phaseSkills].sort((a, b) => b.skill - a.skill);
      const sortedByWeakness = [...phaseSkills].sort((a, b) => a.skill - b.skill);
      
      // Create personalized strengths, weaknesses, and recommendations
      const strengthsPool = [
        `Strong ${sortedByStrength[0].phase} play with good positional understanding`,
        `Effective piece coordination in ${sortedByStrength[0].phase} positions`,
        `Good tactical awareness in ${sortedByStrength[0].phase} situations`,
        `Solid ${sortedByStrength[0].phase} preparation with key openings`,
        `Consistent performance during ${seed % 2 === 0 ? 'morning' : 'evening'} sessions`
      ];
      
      const weaknessesPool = [
        `Tendency to overlook tactics in ${sortedByWeakness[0].phase} positions`,
        `Time management issues in longer games`,
        `Difficulty converting winning positions in the ${sortedByWeakness[0].phase}`,
        `Struggles in closed ${sortedByWeakness[0].phase} positions`,
        `Performance drops during ${seed % 2 === 0 ? 'evening' : 'morning'} sessions`
      ];
      
      const recommendationsPool = [
        `Focus on improving ${sortedByWeakness[0].phase} technique`,
        `Practice calculation in complex positions`,
        `Work on time management in critical positions`,
        `Study master games featuring ${sortedByWeakness[0].phase} themes`,
        `Schedule important games during your peak performance hours (${seed % 2 === 0 ? 'morning' : 'evening'})`
      ];
      
      // Pick 4 unique items from each pool based on seed
      const pickUniqueItems = (pool: string[], count: number, seedOffset: number) => {
        const result = [];
        const usedIndices = new Set<number>();
        for (let i = 0; i < count && result.length < pool.length; i++) {
          const index = (seed * (i + seedOffset)) % pool.length;
          if (!usedIndices.has(index)) {
            result.push(pool[index]);
            usedIndices.add(index);
          }
        }
        return result;
      };
      
      const strengths = pickUniqueItems(strengthsPool, 4, 1);
      const weaknesses = pickUniqueItems(weaknessesPool, 4, 2);
      const recommendations = pickUniqueItems(recommendationsPool, 4, 3);
      
      const analysis: UserAnalysis = {
        ratings: ratings,
        openings: {
          all: createOpeningsData('all'),
          blitz: createOpeningsData('blitz'),
          rapid: createOpeningsData('rapid'),
          bullet: createOpeningsData('bullet')
        },
        dayPerformance: generateDayPerformance(username),
        timePerformance: generateTimeSlotPerformance(username),
        phaseAccuracy: {
          opening: openingSkill,
          middlegame: middlegameSkill,
          endgame: endgameSkill,
          totalGames: totalGamesWhite + totalGamesBlack
        },
        moveQuality: {
          best: Math.floor(((seed % 15) + 30)),
          good: Math.floor(((seed * 2) % 20) + 20),
          inaccuracy: Math.floor(((seed * 3) % 15) + 10),
          mistake: Math.floor(((seed * 4) % 10) + 5),
          blunder: Math.floor(((seed * 5) % 8) + 3),
          totalMoves: Math.floor((totalGamesWhite + totalGamesBlack) * 40)
        },
        materialSwings: Array.from({length: 40}, (_, i) => ((Math.sin(i * 0.3 + seed * 0.1) * (i/10)) + (Math.random() - 0.5) * 0.5)),
        conversionRate: 60 + ((seed * 7) % 30),
        timeScrambleRecord: { 
          wins: Math.floor(((seed * 3) % 20) + 30), 
          losses: Math.floor(((seed * 5) % 15) + 15) 
        },
        strengths: strengths,
        weaknesses: weaknesses,
        recommendations: recommendations
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
