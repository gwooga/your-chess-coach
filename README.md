
# Chess Game Archive Fetcher

This tool allows you to fetch PGN archives from Chess.com or Lichess for any player, with optional computer analysis.

## Requirements

- Python 3
- python-chess package (`pip install python-chess`)
- Stockfish (optional, for analysis when using Chess.com data)

## Usage

```bash
./fetch_chess_games.sh --platform <platform> --username <username> --period <period> [--need_analysis]
```

### Parameters:

- `--platform`: Either "chess.com" or "lichess"
- `--username`: Player's username
- `--period`: One of:
  - "all" - all available games
  - "last_30", "last_90", "last_180", "last_365" - games from the last X days
  - "YYYY-MM-DD..YYYY-MM-DD" - games between two specific dates
- `--need_analysis`: Flag to include computer analysis (optional)

### Examples:

```bash
# Fetch the last 30 days of games from Chess.com without analysis
./fetch_chess_games.sh --platform chess.com --username hikaru --period last_30

# Fetch the last 90 days of games from Lichess with analysis
./fetch_chess_games.sh --platform lichess --username DrNykterstein --period last_90 --need_analysis

# Fetch games from a specific date range
./fetch_chess_games.sh --platform chess.com --username MagnusCarlsen --period 2023-01-01..2023-03-31
```

## Output

The tool will output a PGN file named `<username>_<period>_<raw|eval>.pgn` containing the fetched games.

- If `--need_analysis` is not specified, the file will have "raw" in the name.
- If `--need_analysis` is specified, the file will have "eval" in the name.

## Notes

- When fetching from Chess.com with analysis, Stockfish must be installed and available in your PATH.
- Lichess API already provides computer evaluations when `--need_analysis` is used.
- The tool is limited to fetching a maximum of 300 games from Lichess due to API restrictions.
