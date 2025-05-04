
// Map of opening moves to names
export const openingNames: Record<string, string> = {
  // White openings
  "e4": "King's Pawn Opening",
  "d4": "Queen's Pawn Opening",
  "c4": "English Opening",
  "Nf3": "Réti Opening",
  "f4": "Bird's Opening",
  "b3": "Larsen's Opening",
  "g3": "King's Fianchetto Opening",
  "b4": "Sokolsky Opening",
  "a3": "Anderssen's Opening",
  "Nc3": "Van Geet Opening",
  
  // Black responses to e4
  "e4 e5": "Open Game",
  "e4 e6": "French Defense",
  "e4 c5": "Sicilian Defense",
  "e4 c6": "Caro-Kann Defense",
  "e4 d5": "Scandinavian Defense",
  "e4 d6": "Pirc Defense",
  "e4 g6": "Modern Defense",
  "e4 Nf6": "Alekhine's Defense",
  "e4 b6": "Owen's Defense",
  
  // Black responses to d4
  "d4 d5": "Closed Game",
  "d4 Nf6": "Indian Defense",
  "d4 f5": "Dutch Defense",
  "d4 c5": "Benoni Defense",
  "d4 e6": "French Defense Structure",
  "d4 g6": "King's Indian Defense",
  "d4 d6": "Old Indian Defense",
  "d4 b6": "Queen's Indian Defense",
  "d4 c6": "Slav Defense",
  
  // Black responses to c4
  "c4 e5": "English Opening, Reversed Sicilian",
  "c4 c5": "English Opening, Symmetrical Variation",
  "c4 Nf6": "English Opening, Knight's Variation",
  
  // Black responses to Nf3
  "Nf3 Nf6": "Réti Opening, King's Indian Attack",
  "Nf3 d5": "Réti Opening, Queen's Pawn Defense",
  
  // Deeper openings - e4
  "e4 e5 Nf3": "King's Knight Opening",
  "e4 e5 Nf3 Nc6": "Two Knights Defense",
  "e4 e5 Nf3 Nf6": "Petrov's Defense",
  "e4 e5 Bc4": "Bishop's Opening",
  "e4 e5 f4": "King's Gambit",
  "e4 c5 Nf3": "Open Sicilian",
  "e4 c5 Nf3 d6": "Sicilian Najdorf Variation",
  "e4 c5 Nf3 e6": "Sicilian Scheveningen",
  "e4 c5 c3": "Sicilian Alapin",
  "e4 c5 b4": "Sicilian Wing Gambit",
  "e4 e6 d4": "French Defense",
  "e4 e6 d4 d5": "French Defense Main Line",
  "e4 d5 exd5": "Scandinavian Defense",
  "e4 c6 d4": "Caro-Kann Defense",
  "e4 c6 d4 d5": "Caro-Kann Main Line",
  
  // Deeper openings - d4
  "d4 d5 c4": "Queen's Gambit",
  "d4 d5 c4 e6": "Queen's Gambit Declined",
  "d4 d5 c4 c6": "Slav Defense",
  "d4 d5 c4 dxc4": "Queen's Gambit Accepted",
  "d4 Nf6 c4": "Indian Defense",
  "d4 Nf6 c4 e6": "Queen's Indian Defense",
  "d4 Nf6 c4 g6": "King's Indian Defense",
  "d4 Nf6 c4 c5": "Benoni Defense",
  "d4 Nf6 Bf4": "London System",
  
  // Add more common openings for black pieces
  "e4 c5": "Sicilian Defense",
  "e4 e6": "French Defense",
  "e4 e5": "Open Game",
  "e4 c6": "Caro-Kann Defense",
  "e4 d6": "Pirc Defense",
  "e4 g6": "Modern Defense",
  "d4 d5": "Queen's Pawn Game",
  "d4 Nf6": "Indian Defense",
  "d4 f5": "Dutch Defense",
  "c4 e5": "English Opening",
};

// Get opening name based on sequence
export const getOpeningName = (sequence: string): string => {
  // Clean the sequence to simplify matching
  const cleanSequence = sequence.replace(/\d+\.\s/g, '').trim();
  
  // Try to find the longest matching sequence
  let bestMatch = '';
  
  // Check exact matches
  for (const key in openingNames) {
    if (cleanSequence.startsWith(key) && key.length > bestMatch.length) {
      bestMatch = key;
    }
  }
  
  // Return the match or a generic name
  return bestMatch ? openingNames[bestMatch] : "Unknown Opening";
};
