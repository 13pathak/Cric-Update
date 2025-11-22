// Background Service Worker

importScripts('utils/apiProvider.js');

const ALARM_NAME = 'fetch_cricket_updates';
const UPDATE_INTERVAL_MINUTES = 0.0833; // 20 seconds

let apiProvider = new ApiProvider();
let previousMatchState = {};

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cric Updates Extension Installed');
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: UPDATE_INTERVAL_MINUTES
    });
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        fetchUpdates();
    }
});

async function fetchUpdates() {
    // Get selected match ID from storage
    const data = await chrome.storage.local.get(['selectedMatchId']);
    const matchId = data.selectedMatchId;

    console.log('Background: Fetching updates for matchId:', matchId);

    if (!matchId) return;

    try {
        // 1. Fetch basic info (names, flags, status) from match list
        const matches = await apiProvider.getLiveMatches();
        // console.log('Background: Fetched', matches.length, 'matches');

        const basicMatch = matches.find(m => m.id == matchId); // Loose equality for string/int mismatch

        if (!basicMatch) {
            console.log('Background: Match not found in live list. ID:', matchId);
            return;
        }

        // 2. Fetch detailed score (batsmen, bowlers)
        const matchDetails = await apiProvider.getMatchDetails(matchId);
        // console.log('Background: Fetched details:', matchDetails ? 'Success' : 'Failed');

        // 3. Merge data
        const mergedData = {
            ...basicMatch,
            ...(matchDetails || {}),
        };

        console.log('Background: Merged data for update:', mergedData);

        // Broadcast update to storage
        chrome.storage.local.set({
            currentMatchData: mergedData,
            lastUpdated: Date.now()
        });

        // Check for events
        checkForEvents(mergedData);

    } catch (error) {
        console.error('Background: Error in fetchUpdates:', error);
    }
}

function checkForEvents(match) {
    const prevMatch = previousMatchState[match.id];

    if (prevMatch && match.score && prevMatch.score) {
        // Check for wicket
        if (match.score.wickets > prevMatch.score.wickets) {
            sendNotification(match, 'W');
        }
        // Check for boundary (approximate)
        const runDiff = match.score.runs - prevMatch.score.runs;
        if (runDiff === 4) sendNotification(match, '4');
        if (runDiff === 6) sendNotification(match, '6');
    }

    // Update previous state
    previousMatchState[match.id] = JSON.parse(JSON.stringify(match));
}

function sendNotification(match, event) {
    let title = '';
    let message = `${match.battingTeam || 'Match'} ${match.score?.runs || 0}/${match.score?.wickets || 0} (${match.overs || 0})`;

    switch (event) {
        case 'W':
            title = 'Wicket Fallen!';
            message += ' - OUT!';
            break;
        case '4':
            title = 'Boundary!';
            message += ' - 4 Runs';
            break;
        case '6':
            title = 'Sixer!';
            message += ' - 6 Runs';
            break;
    }

    const iconDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

    chrome.notifications.create({
        type: 'basic',
        iconUrl: iconDataUri,
        title: title,
        message: message,
        priority: 2
    });
}

// Message handler for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background: Received message', request);
    if (request.type === 'GET_LIVE_MATCHES') {
        apiProvider.getLiveMatches().then(matches => {
            console.log('Background: Sending matches', matches);
            sendResponse({ matches: matches });
        });
        return true; // Keep channel open for async response
    } else if (request.type === 'TEST_NOTIFICATION') {
        console.log('Received test notification request');
        sendNotification({
            battingTeam: 'TEST',
            score: { runs: 100, wickets: 0 },
            overs: 10.0
        }, '6');
        sendResponse({ success: true });
    } else if (request.type === 'FORCE_UPDATE') {
        console.log('Background: Forcing update');
        fetchUpdates().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
    return true;
});
