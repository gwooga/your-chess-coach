import aTsv from '../../data/Openings/a.tsv?raw';
import bTsv from '../../data/Openings/b.tsv?raw';
import cTsv from '../../data/Openings/c.tsv?raw';
import dTsv from '../../data/Openings/d.tsv?raw';
import eTsv from '../../data/Openings/e.tsv?raw';

// Helper to normalize move sequences: remove move numbers, dots, extra spaces
function normalizeSequence(pgn: string): string {
  return pgn
    .replace(/\d+\./g, '') // remove move numbers
    .replace(/\s+/g, ' ')   // collapse whitespace
    .trim();
}

// Parse a single TSV file into a map: normalized sequence -> name
function parseTsv(tsv: string): Record<string, string> {
  const lines = tsv.split('\n');
  const map: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) { // skip header
    const line = lines[i].trim();
    if (!line) continue;
    const [eco, name, pgn] = line.split('\t');
    if (!name || !pgn) continue;
    const norm = normalizeSequence(pgn);
    map[norm] = name;
  }
  return map;
}

// Build the full map from all TSVs
const openingMap: Record<string, string> = {
  ...parseTsv(aTsv),
  ...parseTsv(bTsv),
  ...parseTsv(cTsv),
  ...parseTsv(dTsv),
  ...parseTsv(eTsv),
};

export function getOpeningNameBySequence(sequence: string): string {
  const norm = normalizeSequence(sequence);
  if (openingMap[norm]) return openingMap[norm];
  // Prefix fallback: try shorter and shorter prefixes
  const moves = norm.split(' ');
  for (let i = moves.length - 1; i > 1; i--) {
    const prefix = moves.slice(0, i).join(' ');
    if (openingMap[prefix]) return openingMap[prefix];
  }
  return 'Unknown Opening';
}
