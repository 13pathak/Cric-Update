class ApiProvider {
    constructor() {
        this.baseUrl = 'https://crickbarservice.heisenapp.com';
    }

    async getLiveMatches() {
        try {
            const response = await fetch(`${this.baseUrl}/matches`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            const data = await response.json();

            // Return raw data as it's clean enough
            return data.map(match => ({
                id: match.id,
                name: `${match.team1.name} vs ${match.team2.name}`,
                series: match.series,
                format: match.format,
                status: match.status,
                isLive: match.isLive,
                team1: match.team1,
                team2: match.team2
            }));
        } catch (error) {
            console.error('Error fetching live matches:', error);
            return [];
        }
    }

    async getMatchDetails(matchId) {
        try {
            const response = await fetch(`${this.baseUrl}/score/${matchId}`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching details for match ${matchId}:`, error);
            return null;
        }
    }
}

// Export for background.js
globalThis.ApiProvider = ApiProvider;
