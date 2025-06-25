#!/usr/bin/env python3
# fetch_chess_games.py
#
# Pull games from Chess.com or Lichess, save as PGN,
# and (optionally) include engine evals.

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

# ------------------------------------------------------------
# Helper – convert period strings to timestamps
# ------------------------------------------------------------
def parse_date_range(period):
    """Convert period string to milliseconds since/until."""
    today = datetime.now()

    if period == "all":
        return None, None

    if period.startswith("last_"):
        days = int(period.split("_")[1])
        since_date = today - timedelta(days=days)
        return int(since_date.timestamp() * 1000), int(today.timestamp() * 1000)

    if ".." in period:
        start, end = period.split("..")
        since = datetime.strptime(start, "%Y-%m-%d")
        until = datetime.strptime(end, "%Y-%m-%d")
        return int(since.timestamp() * 1000), int(until.timestamp() * 1000)

    raise ValueError("Invalid period format")

# ------------------------------------------------------------
# Chess.com
# ------------------------------------------------------------
def fetch_chesscom_games(username, since_ts, until_ts, need_analysis=False):
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    response = requests.get(archives_url)
    if response.status_code != 200:
        print(f"Error fetching Chess.com archives: {response.status_code}")
        return None

    archives = response.json()["archives"]
    selected = []

    # filter archives by date
    if since_ts is None and until_ts is None:
        selected = archives
    else:
        for url in archives:
            year, month = map(int, url.split("/")[-2:])
            start = datetime(year, month, 1)
            end = datetime(year + (month == 12), 1 if month == 12 else month + 1, 1) - timedelta(days=1)
            if (since_ts is None or int(end.timestamp()*1000) >= since_ts) and \
               (until_ts is None or int(start.timestamp()*1000) <= until_ts):
                selected.append(url)

    selected.sort(reverse=True)

    raw_pgn, total = "", 0
    for url in selected:
        print(f"Fetching {url}/pgn")
        r = requests.get(f"{url}/pgn")
        if r.status_code == 200:
            part = r.text
            raw_pgn += part + "\n\n"
            reader = io.StringIO(part)
            while chess.pgn.read_game(reader):
                total += 1
            print(f"Found {total} games so far")
        else:
            print(f"Error fetching {url}/pgn: {r.status_code}")

    with open("raw.pgn", "w") as f:
        f.write(raw_pgn)

    if need_analysis:
        try:
            import chess.engine
            engine = chess.engine.SimpleEngine.popen_uci("stockfish")
            analyzed = ""
            with open("raw.pgn") as f:
                while (g := chess.pgn.read_game(f)):
                    board = g.board()
                    for mv in g.mainline_moves():
                        board.push(mv)
                        res = engine.analyse(board, chess.engine.Limit(depth=15))
                        score = res["score"].relative.score(mate_score=10000)
                        if score is not None:
                            val = f"{score/100:.2f}"
                        else:
                            mate = res["score"].relative.mate()
                            val = f"#{mate}" if mate else "0.00"
                        node = g.add_line([mv])
                        node.comment = f"%eval {val}"
                    analyzed += str(g) + "\n\n"
            engine.quit()
            with open("eval.pgn", "w") as f:
                f.write(analyzed)
            return "eval.pgn", total
        except Exception as e:
            print(f"Engine error: {e} – using raw PGN")
            return "raw.pgn", total

    return "raw.pgn", total

# ------------------------------------------------------------
# Lichess
# ------------------------------------------------------------
def fetch_lichess_games(username, since_ts, until_ts, need_analysis=False):
    """Fetch games from Lichess and save them as PGN."""
    api_url = f"https://lichess.org/api/games/user/{username}"

    # Lichess hard limit is 300 games per request
    params = {
        "max": 300,
        "opening": "true",
        "evals": "true" if need_analysis else "false"
    }
    if since_ts is not None:
        params["since"] = since_ts
    if until_ts is not None:
        params["until"] = until_ts

    query = "&".join(f"{k}={v}" for k, v in params.items())
    full_url = f"{api_url}?{query}"
    print(f"Fetching from Lichess API: {full_url}")

    headers = {"Accept": "application/x-chess-pgn"}
    response = requests.get(full_url, headers=headers, stream=True)
    if response.status_code != 200:
        print(f"Error fetching Lichess games: {response.status_code}")
        return None

    out_file = "eval.pgn" if need_analysis else "raw.pgn"
    with open(out_file, "wb") as f:
        for chunk in response.iter_content(8192):
            f.write(chunk)

    total_games = 0
    with open(out_file) as f:
        while chess.pgn.read_game(f):
            total_games += 1

    return out_file, total_games

# ------------------------------------------------------------
# Utilities
# ------------------------------------------------------------
def get_date_range_from_pgn(pgn_file):
    earliest = latest = None
    with open(pgn_file) as f:
        while (g := chess.pgn.read_game(f)):
            d = g.headers.get("Date", "????.??.??")
            if "????" in d:
                continue
            try:
                dt = datetime.strptime(d, "%Y.%m.%d")
                earliest = dt if earliest is None or dt < earliest else earliest
                latest = dt if latest is None or dt > latest else latest
            except ValueError:
                pass
    fmt = lambda x: x.strftime("%Y-%m-%d") if x else "unknown"
    return fmt(earliest), fmt(latest)

# ------------------------------------------------------------
# CLI
# ------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(description="Fetch chess game archives")
    p.add_argument("--platform", required=True, choices=["chess.com", "lichess"])
    p.add_argument("--username", required=True)
    p.add_argument("--period", required=True,
                   help="all, last_30, last_90, last_180, last_365 or YYYY-MM-DD..YYYY-MM-DD")
    p.add_argument("--need_analysis", action="store_true",
                   help="Include engine evals (Chess.com uses local Stockfish, Lichess uses server evals)")
    args = p.parse_args()

    try:
        since_ts, until_ts = parse_date_range(args.period)
    except ValueError as e:
        print(f"Date range error: {e}")
        return 1

    if args.platform == "chess.com":
        result = fetch_chesscom_games(args.username, since_ts, until_ts, args.need_analysis)
    else:
        result = fetch_lichess_games(args.username, since_ts, until_ts, args.need_analysis)

    if result is None:
        print("Failed to fetch games")
        return 1

    pgn_file, total = result
    period_tag = args.period.replace("..", "_to_")
    tag = "eval" if args.need_analysis else "raw"
    final_name = f"{args.username}_{period_tag}_{tag}.pgn"
    os.rename(pgn_file, final_name)

    first, last = get_date_range_from_pgn(final_name)
    print("\nSummary:")
    print(f"Total games pulled: {total}")
    print(f"Date range: {first} .. {last}")
    print(f"Saved to {os.path.abspath(final_name)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
