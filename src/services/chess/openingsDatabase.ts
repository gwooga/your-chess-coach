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
