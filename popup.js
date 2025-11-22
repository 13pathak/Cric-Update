document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('matches-container');
    const testBtn = document.getElementById('test-notification');

    const stopBtn = document.getElementById('stop-tracking');

    if (testBtn) {
        testBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' }, (response) => {
                console.log('Test notification sent', response);
            });
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            chrome.storage.local.set({ selectedMatchId: null }, () => {
                // Refresh list to remove active state
                chrome.runtime.sendMessage({ type: 'GET_LIVE_MATCHES' }, (response) => {
                    if (response && response.matches) {
                        renderMatches(response.matches);
                    }
                });
            });
        });
    }

    // Fetch live matches from background
    console.log('Popup: Sending GET_LIVE_MATCHES message');
    chrome.runtime.sendMessage({ type: 'GET_LIVE_MATCHES' }, (response) => {
        console.log('Popup: Received response', response);
        if (chrome.runtime.lastError) {
            console.error('Popup: Runtime error', chrome.runtime.lastError);
            container.innerHTML = 'Error connecting to background script.';
            return;
        }
        if (response && response.matches) {
            renderMatches(response.matches);
        } else {
            container.innerHTML = 'No live matches found.';
        }
    });

    // Debug Info
    chrome.storage.local.get(['lastUpdated', 'currentMatchData'], (data) => {
        const debugDiv = document.createElement('div');
        debugDiv.style.fontSize = '10px';
        debugDiv.style.color = '#666';
        debugDiv.style.marginTop = '10px';
        debugDiv.style.padding = '5px';
        debugDiv.innerHTML = `
            Last Updated: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Never'}<br>
            Match Data: ${data.currentMatchData ? 'Present' : 'Missing'}
        `;
        document.body.appendChild(debugDiv);
    });

    function renderMatches(matches) {
        container.innerHTML = '';
        const list = document.createElement('ul');
        list.className = 'match-list';

        chrome.storage.local.get(['selectedMatchId'], (data) => {
            const selectedId = data.selectedMatchId;

            matches.forEach(match => {
                const li = document.createElement('li');
                li.className = 'match-item';
                if (match.id === selectedId) {
                    li.classList.add('active');
                }

                li.innerHTML = `
          <div class="teams">${match.team1.name} vs ${match.team2.name}</div>
          <div class="score">
            ${match.team1.name}: ${match.team1.score || '0/0'} <br>
            ${match.team2.name}: ${match.team2.score || '0/0'}
          </div>
          <div class="status">${match.status}</div>
        `;

                li.addEventListener('click', () => {
                    selectMatch(match.id);
                });

                list.appendChild(li);
            });
        });

        container.appendChild(list);
    }

    function selectMatch(matchId) {
        chrome.storage.local.set({ selectedMatchId: matchId }, () => {
            // Trigger immediate update in background
            chrome.runtime.sendMessage({ type: 'FORCE_UPDATE' });

            // Refresh list to show active state
            chrome.runtime.sendMessage({ type: 'GET_LIVE_MATCHES' }, (response) => {
                renderMatches(response.matches);
            });
        });
    }
});
