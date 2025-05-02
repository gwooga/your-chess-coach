
#!/usr/bin/env python3

import requests
import json
import os
import time
import datetime
import sys
import argparse
import chess.pgn
import io
from datetime import datetime, timedelta

def parse_date_range(period):
    """Convert period to since/until timestamps in milliseconds"""
    today = datetime.now()
    
    if period == "all":
        return None, None
    
    if period.startswith("last_"):
        days = int(period.split("_")[1])
        since_date = today - timedelta(days=days)
        since_ts = int(since_date.timestamp() * 1000)
        until_ts = int(today.timestamp() * 1000)
        return since_ts, until_ts
    
    if ".." in period:
        dates = period.split("..")
        since_date = datetime.strptime(dates[0], "%Y-%m-%d")
        until_date = datetime.strptime(dates[1], "%Y-%m-%d")
        since_ts = int(since_date.timestamp() * 1000)
        until_ts = int(until_date.timestamp() * 1000)
        return since_ts, until_ts
    
    raise ValueError("Invalid period format")

def fetch_chesscom_games(username, since_ts, until_ts, need_analysis=False):
    """Fetch games from Chess.com"""
    # Get archives
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    response = requests.get(archives_url)
    if response.status_code != 200:
        print(f"Error fetching Chess.com archives: {response.status_code}")
        return None
    
    archives = response.json()["archives"]
    selected_archives = []
    
    # Filter archives by date range
    if since_ts is None and until_ts is None:
        selected_archives = archives
    else:
        for archive_url in archives:
            # Extract year and month from URL (format: .../YYYY/MM)
            parts = archive_url.split('/')
            year = int(parts[-2])
            month = int(parts[-1])
            
            # Calculate start and end timestamps for this month
            archive_start = datetime(year, month, 1)
            if month == 12:
                archive_end = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                archive_end = datetime(year, month + 1, 1) - timedelta(days=1)
            
            archive_start_ts = int(archive_start.timestamp() * 1000)
            archive_end_ts = int(archive_end.timestamp() * 1000)
            
            # Check if the archive overlaps with the desired range
            if (since_ts is None or archive_end_ts >= since_ts) and \
               (until_ts is None or archive_start_ts <= until_ts):
                selected_archives.append(archive_url)
    
    # Sort archives by date (most recent first)
    selected_archives.sort(reverse=True)
    
    # Fetch games from selected archives
    raw_pgn = ""
    total_games = 0
    
    for archive_url in selected_archives:
        print(f"Fetching {archive_url}/pgn")
        response = requests.get(f"{archive_url}/pgn")
        if response.status_code == 200:
            archive_pgn = response.text
            raw_pgn += archive_pgn + "\n\n"
            
            # Count games in this archive
            pgn_io = io.StringIO(archive_pgn)
            archive_games = 0
            while chess.pgn.read_game(pgn_io) is not None:
                archive_games += 1
            
            total_games += archive_games
            print(f"Found {archive_games} games")
        else:
            print(f"Error fetching {archive_url}/pgn: {response.status_code}")
    
    # Save raw PGN
    with open("raw.pgn", "w") as f:
        f.write(raw_pgn)
    
    # Process with Stockfish if requested
    if need_analysis:
        try:
            import chess.engine
            print("Running Stockfish analysis (this may take a while)...")
            
            engine = chess.engine.SimpleEngine.popen_uci("stockfish")
            analyzed_pgn = ""
            
            with open("raw.pgn", "r") as f:
                while (game := chess.pgn.read_game(f)) is not None:
                    board = game.board()
                    for move in game.mainline_moves():
                        board.push(move)
                        result = engine.analyse(board, chess.engine.Limit(depth=15))
                        score = result["score"].relative.score(mate_score=10000)
                        if score is not None:
                            score_str = f"{score/100.0:.2f}"
                        else:
                            # Handle mate scores
                            mate = result["score"].relative.mate()
                            if mate is not None:
                                score_str = f"#{mate}"
                            else:
                                score_str = "0.00"
                        
                        node = game.add_line([move])
                        node.comment = f"%eval {score_str}"
                    
                    analyzed_pgn += str(game) + "\n\n"
            
            engine.quit()
            
            # Save analyzed PGN
            with open("eval.pgn", "w") as f:
                f.write(analyzed_pgn)
                
            return "eval.pgn", total_games
            
        except ImportError:
            print("Could not import chess.engine for Stockfish analysis")
            print("Using raw PGN instead")
            return "raw.pgn", total_games
        except Exception as e:
            print(f"Error during Stockfish analysis: {e}")
            print("Using raw PGN instead")
            return "raw.pgn", total_games
    
    return "raw.pgn", total_games

def fetch_lichess_games(username, since_ts, until_ts, need_analysis=False):
    """Fetch games from Lichess"""
    api_url = f"https://lichess.org/api/games/user/{username}"
    
    # Build parameters
    params = {
        "max": 3000,
        "opening": "true",
        "evals": "true" if need_analysis else "false"
    }
    
    if since_ts is not None:
        params["since"] = since_ts
    if until_ts is not None:
        params["until"] = until_ts
    
    # Construct query string
    query = "&".join([f"{k}={v}" for k, v in params.items()])
    full_url = f"{api_url}?{query}"
    
    print(f"Fetching from Lichess API: {full_url}")
    
    headers = {"Accept": "application/x-chess-pgn"}
    response = requests.get(full_url, headers=headers, stream=True)
    
    if response.status_code != 200:
        print(f"Error fetching Lichess games: {response.status_code}")
        return None
    
    # Save the raw PGN
    output_file = "eval.pgn" if need_analysis else "raw.pgn"
    with open(output_file, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    # Count games in the downloaded PGN
    total_games = 0
    with open(output_file, "r") as f:
        while chess.pgn.read_game(f) is not None:
            total_games += 1
    
    return output_file, total_games

def get_date_range_from_pgn(pgn_file):
    """Extract the earliest and latest game dates from a PGN file"""
    earliest_date = None
    latest_date = None
    
    try:
        with open(pgn_file, "r") as f:
            while True:
                game = chess.pgn.read_game(f)
                if game is None:
                    break
                
                date_str = game.headers.get("Date", "????-??-??")
                if "????" not in date_str:
                    try:
                        game_date = datetime.strptime(date_str, "%Y.%m.%d")
                        if earliest_date is None or game_date < earliest_date:
                            earliest_date = game_date
                        if latest_date is None or game_date > latest_date:
                            latest_date = game_date
                    except ValueError:
                        pass  # Skip invalid dates
    except Exception as e:
        print(f"Error reading dates from PGN: {e}")
    
    # Format dates for output
    earliest_str = earliest_date.strftime("%Y-%m-%d") if earliest_date else "unknown"
    latest_str = latest_date.strftime("%Y-%m-%d") if latest_date else "unknown"
    
    return earliest_str, latest_str

def main():
    parser = argparse.ArgumentParser(description="Fetch chess game archives")
    parser.add_argument("--platform", required=True, choices=["chess.com", "lichess"], 
                        help="Platform to fetch games from")
    parser.add_argument("--username", required=True, help="Player username")
    parser.add_argument("--period", required=True, 
                        help="Time period (all, last_30, last_90, last_180, last_365, or YYYY-MM-DD..YYYY-MM-DD)")
    parser.add_argument("--need_analysis", action="store_true", help="Include computer analysis")
    
    args = parser.parse_args()
    
    # Parse date range
    try:
        since_ts, until_ts = parse_date_range(args.period)
    except ValueError as e:
        print(f"Error parsing date range: {e}")
        return 1
    
    # Fetch games based on platform
    if args.platform == "chess.com":
        result = fetch_chesscom_games(args.username, since_ts, until_ts, args.need_analysis)
    else:  # lichess
        result = fetch_lichess_games(args.username, since_ts, until_ts, args.need_analysis)
    
    if result is None:
        print("Failed to fetch games")
        return 1
    
    pgn_file, total_games = result
    
    # Create final filename
    period_str = args.period.replace("..", "_to_")
    analysis_str = "eval" if args.need_analysis else "raw"
    final_filename = f"{args.username}_{period_str}_{analysis_str}.pgn"
    
    # Rename the output file
    os.rename(pgn_file, final_filename)
    
    # Get date range actually covered
    earliest_date, latest_date = get_date_range_from_pgn(final_filename)
    
    # Print summary
    print("\nSummary:")
    print(f"Total games pulled: {total_games}")
    print(f"Date range covered: {earliest_date} .. {latest_date}")
    print(f"Saved to {os.path.abspath(final_filename)}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
