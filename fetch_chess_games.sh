
#!/bin/bash

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if required Python packages are installed
python3 -c "import chess" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Installing required Python packages..."
    pip install python-chess
fi

# Execute the Python script with the provided arguments
python3 fetch_chess_games.py "$@"
