// Mock Data Service
// Simulates live cricket match data

const TEAMS = ['IND', 'AUS', 'ENG', 'SA', 'NZ', 'PAK', 'WI', 'SL'];
const EVENTS = ['dot', '1', '2', '3', '4', '6', 'W', 'WD', 'NB'];

class MockDataService {
  constructor() {
    this.matches = this.generateInitialMatches();
  }

  generateInitialMatches() {
    return [
      {
        id: 'm1',
        team1: 'IND',
        team2: 'AUS',
        score: { runs: 120, wickets: 2 },
        overs: 15.4,
        battingTeam: 'IND',
        status: 'Live',
        lastEvent: 'dot'
      },
      {
        id: 'm2',
        team1: 'ENG',
        team2: 'SA',
        score: { runs: 45, wickets: 1 },
        overs: 5.2,
        battingTeam: 'SA',
        status: 'Live',
        lastEvent: '1'
      }
    ];
  }

  // Simulate an update for a specific match
  updateMatch(matchId) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return null;

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    match.lastEvent = event;

    if (event === 'W') {
      match.score.wickets += 1;
    } else if (!isNaN(parseInt(event))) {
      match.score.runs += parseInt(event);
    } else if (event === 'WD' || event === 'NB') {
      match.score.runs += 1;
      // Ball doesn't count in over
      return match;
    }

    // Update overs
    let balls = Math.round((match.overs % 1) * 10);
    balls++;
    if (balls >= 6) {
      match.overs = Math.floor(match.overs) + 1;
    } else {
      match.overs = Math.floor(match.overs) + balls / 10;
    }

    return match;
  }

  getLiveMatches() {
    return this.matches;
  }
  
  getMatchDetails(matchId) {
      return this.matches.find(m => m.id === matchId);
  }
}

// Export as a global for background.js (since modules in SW can be tricky without bundlers)
// In a real setup we'd use ES modules.
globalThis.MockDataService = MockDataService;
