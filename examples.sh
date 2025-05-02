
#!/bin/bash

# Make sure scripts are executable
chmod +x fetch_chess_games.py fetch_chess_games.sh

# Examples:

# Example 1: Fetch all games from a Chess.com user without analysis
echo "Example 1: Fetch all games from a Chess.com user without analysis"
./fetch_chess_games.sh --platform chess.com --username hikaru --period last_30 --need_analysis false

# Example 2: Fetch last 90 days of games from a Lichess user with analysis
echo "Example 2: Fetch last 90 days of games from a Lichess user with analysis"
./fetch_chess_games.sh --platform lichess --username DrNykterstein --period last_90 --need_analysis

# Example 3: Fetch games from a specific date range
echo "Example 3: Fetch games from a specific date range"
./fetch_chess_games.sh --platform chess.com --username MagnusCarlsen --period 2023-01-01..2023-03-31
