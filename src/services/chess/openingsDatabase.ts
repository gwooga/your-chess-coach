// Import all ECO JSON files
import ecoA from '../../data/Openings/ecoA.json';
import ecoB from '../../data/Openings/ecoB.json';
import ecoC from '../../data/Openings/ecoC.json';
import ecoD from '../../data/Openings/ecoD.json';
import ecoE from '../../data/Openings/ecoE.json';

// Merge all openings into a single object
const allOpenings: Record<string, any> = {
  ...ecoA,
  ...ecoB,
  ...ecoC,
  ...ecoD,
  ...ecoE,
};

// Utility to normalize move sequences: remove move numbers, dots, extra spaces
function normalizeMoveSequence(moves: string): string {
  // Remove move numbers (e.g., '1.', '2.', etc.) and dots, then trim and collapse spaces
  return moves.replace(/\d+\.(\s*)/g, '').replace(/\s+/g, ' ').trim();
}

// Build a map: normalized move sequence => { name, fen, eco, ... }
const sequenceToOpening: Record<string, { name: string; fen: string; eco?: string }> = {};
for (const [fen, data] of Object.entries(allOpenings)) {
  if (data && data.moves && data.name) {
    const normSeq = normalizeMoveSequence(data.moves);
    // Only keep the longest sequence for a given prefix (most specific)
    if (!sequenceToOpening[normSeq] || (normSeq.length > sequenceToOpening[normSeq].fen?.length)) {
      sequenceToOpening[normSeq] = { name: data.name, fen, eco: data.eco };
    }
  }
}

/**
 * Get the opening name by normalized move sequence, with prefix fallback.
 * @param sequence The move sequence (e.g., 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nc6 Nc3 g6')
 * @returns The opening name, or 'Unknown Opening' if not found
 */
export function getOpeningNameBySequence(sequence: string): string {
  let normSeq = normalizeMoveSequence(sequence);
  // Try exact match first
  if (sequenceToOpening[normSeq]) {
    return sequenceToOpening[normSeq].name;
  }
  // Prefix fallback: remove moves from the end one by one
  let movesArr = normSeq.split(' ');
  while (movesArr.length > 2) { // Don't go below 2 moves
    movesArr.pop();
    const prefix = movesArr.join(' ');
    if (sequenceToOpening[prefix]) {
      return sequenceToOpening[prefix].name;
    }
  }
  return 'Unknown Opening';
}

/**
 * Get the opening name by FEN from the merged database.
 * @param fen The FEN string (should match the key format in the database)
 * @returns The opening name, or 'Unknown Opening' if not found
 */
export function getOpeningNameByFEN(fen: string): string {
  // The FEN in the database may not include move counters, so try both full and partial matches
  if (fen in allOpenings && allOpenings[fen]?.name) {
    return allOpenings[fen].name;
  }
  // Try matching only the first 6 fields (ignore move counters)
  const fen6 = fen.split(' ').slice(0, 6).join(' ');
  if (fen6 in allOpenings && allOpenings[fen6]?.name) {
    return allOpenings[fen6].name;
  }
  return 'Unknown Opening';
}
