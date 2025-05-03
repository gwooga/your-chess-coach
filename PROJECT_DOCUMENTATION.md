
# Chess Insight Coach - Project Documentation

## Project Overview

Chess Insight Coach is a web application designed to analyze chess games and provide meaningful insights to players. The application allows users to upload their games (via PGN files) or retrieve them from popular chess platforms (chess.com and lichess), and then performs in-depth analysis to help players understand their strengths, weaknesses, and areas for improvement.

## Key Features

1. **Multi-platform Support**
   - Import games from Chess.com
   - Import games from Lichess.org
   - Upload PGN files directly

2. **Flexible Analysis Timeframes**
   - Last 30 days
   - Last 90 days
   - Last 180 days
   - Last 365 days

3. **Game Type Filtering**
   - All games
   - Blitz
   - Rapid
   - Bullet

4. **In-depth Analysis Areas**
   - Opening repertoire analysis
   - Time-of-day performance
   - Day-of-week performance
   - Phase accuracy (opening, middlegame, endgame)
   - Move quality statistics
   - Personalized recommendations

## Technical Architecture

The project is built using:
- React (v18)
- TypeScript
- TailwindCSS
- Shadcn/UI component library
- Recharts for data visualization
- Chess.js for PGN parsing and chess logic

## Key Components

### 1. ChessAnalyzer (src/components/ChessAnalyzer.tsx)
The main container component that orchestrates the entire application flow. It handles:
- User authentication and game retrieval
- PGN file uploads and parsing
- Time range selection and filtering
- Tab navigation between different analysis sections

### 2. UserForm (src/components/UserForm.tsx)
Handles user input for:
- Username entry
- Platform selection
- Time range selection
- PGN file uploads
- Validation and error handling

### 3. OpeningsTab (src/components/OpeningsTab.tsx)
This component provides analysis of the user's opening repertoire with:
- "Highlights" tab showing the most impactful openings
- "Full Breakdown" tab with detailed analysis of openings at different move depths
- Filtering to only show openings with meaningful frequency (>=1%)

### 4. OpeningsTable and MeaningfulOpeningsTable (src/components/OpeningsTable.tsx, src/components/MeaningfulOpeningsTable.tsx)
These components display tables of openings with:
- Opening names
- Move sequences
- Game frequency
- Win/Draw/Loss rates visualized with color bars
- Board visualization with FEN rendering
- Links to explore positions on Lichess

### 5. CoachTab (src/components/CoachTab.tsx)
Provides personalized coaching insights:
- Performance statistics
- Strengths and weaknesses analysis
- Specific recommendations based on game data
- Day and time performance analysis
- Game phase accuracy visualization

### 6. ChessAdviser (src/components/ChessAdviser.tsx)
An interactive component that provides personalized coaching advice based on the analyzed data.

### 7. Services
Several service modules handle specific aspects of the application:
- **chessAnalysisService.ts**: Processes raw game data into structured analysis
- **pgnDownloadService.ts**: Handles downloading games from chess platforms and parsing PGN files
- **chessComApi.ts**: Interface for the Chess.com API
- **lichessApi.ts**: Interface for the Lichess API

## Data Types

The application uses a well-defined TypeScript type system (in src/utils/types.ts) that includes:

- **Platform**: 'chess.com' | 'lichess' | 'uploaded'
- **TimeRange**: 'last30' | 'last90' | 'last180' | 'last365'
- **ChessVariant**: 'all' | 'blitz' | 'rapid' | 'bullet'
- **UserInfo**: Basic user identification data
- **OpeningData**: Detailed statistics about specific openings
- **OpeningsTableData**: Collection of openings at different move depths
- **DayPerformance**: Performance statistics by day of week
- **TimeSlotPerformance**: Performance statistics by time of day
- **PhaseAccuracy**: Accuracy measurements across game phases
- **UserAnalysis**: Complete analysis of a user's chess performance

## UI Components

The application leverages the shadcn/ui library for consistent UI components:
- Tables for data presentation
- Tabs for navigation
- Cards for information grouping
- Progress bars for loading indicators
- Tooltips for additional information
- Popovers for chessboard visualization

## Workflow

1. **User Input**
   - User enters username and selects platform or uploads PGN
   - Application validates input and begins game retrieval

2. **Data Retrieval**
   - Games are fetched from APIs or parsed from uploaded PGN
   - Progress is shown to the user during download/processing

3. **Analysis**
   - Raw game data is processed into structured analysis
   - Various metrics are calculated (win rates, opening statistics, etc.)

4. **Presentation**
   - Analysis is presented in organized tabs
   - Interactive visualizations allow exploration of the data
   - Meaningful insights are highlighted with clear explanations

5. **Refinement**
   - User can change time range to see different analysis periods
   - Different game types can be filtered for specific insights

## Key Features in Detail

### Opening Analysis
The application breaks down openings at multiple move depths (2, 3, 4, 5, 6, 7, 8 moves) and calculates:
- Frequency (percentage of games using this opening)
- Win/Draw/Loss percentages
- Impact score (combining frequency and performance)
- Opening success visualization with colored progress bars

### Performance Analysis
The application analyzes:
- Win rates by day of week
- Win rates by time of day
- Accuracy in different game phases
- Material advantage trends throughout games
- Conversion rates from winning positions

### Visualization
Data is visualized through:
- Bar and line charts for trends
- Progress bars for percentages
- Interactive chessboards for positions
- Color-coded indicators for performance

## Technical Features

### Time Range Filtering
The application can filter games by date range, allowing users to focus on recent performance or track progress over longer periods.

### Game Type Filtering
Analysis can be filtered by game type (blitz, rapid, bullet) to identify performance differences between time controls.

### PGN Parsing
The application can parse PGN files of various formats, handling:
- Multiple games in a single file
- Different PGN formats from various sources
- Comments and annotation filtering
- FEN position extraction

### FEN Integration
The application extracts and renders FEN positions, allowing users to visualize specific positions from their games.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Expanding the Project

To expand this project, consider:

1. **Additional Data Sources**
   - Add support for more chess platforms
   - Integrate with engine analysis APIs

2. **Enhanced Analysis**
   - Add move-by-move analysis
   - Include comparative analysis against players of similar rating
   - Add opening explorer with master game comparisons

3. **Improved Visualizations**
   - Add heat maps for piece activity
   - Include interactive game replay
   - Provide opening tree visualization

4. **User Features**
   - Add user accounts to save analysis
   - Enable sharing analysis with others
   - Add historical tracking of improvement

## Dependencies

The project relies on several key dependencies:
- React and React DOM (v18.3+)
- TailwindCSS for styling
- Recharts for data visualization
- Chess.js for chess logic and PGN parsing
- Radix UI for accessible component primitives
- Shadcn/UI for pre-built UI components
- Lucide React for icons

## Conclusion

Chess Insight Coach provides a comprehensive analysis tool for chess players looking to improve their game. By combining data from multiple sources and presenting it in an intuitive interface, it helps players identify patterns, strengths, and weaknesses in their play. The application's modular architecture allows for easy expansion and customization to meet evolving user needs.
