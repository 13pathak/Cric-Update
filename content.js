// Content Script

let barElement = null;
let shadowRoot = null;

// Listen for storage changes to update the bar
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.currentMatchData) {
            console.log('ContentScript: Received match data', changes.currentMatchData.newValue);
            updateBar(changes.currentMatchData.newValue);
        }
        if (changes.selectedMatchId) {
            // If match changed, we might need to re-fetch or just wait for next update
            // Ideally we should hide if null
            if (!changes.selectedMatchId.newValue) {
                removeBar();
            }
        }
    }
});

// Initial check
chrome.storage.local.get(['currentMatchData', 'selectedMatchId'], (data) => {
    if (data.selectedMatchId && data.currentMatchData) {
        updateBar(data.currentMatchData);
    }
});

function createBar() {
    if (barElement) return;

    const host = document.createElement('div');
    host.id = 'cric-updates-host';
    document.body.appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles
    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadowRoot.appendChild(styleLink);

    barElement = document.createElement('div');
    barElement.id = 'cric-updates-bar';
    barElement.innerHTML = `
    <div class="cric-content">
      <span class="cric-teams" id="teams">Waiting for data...</span>
      <span class="cric-score" id="score">--/--</span>
      <span class="cric-overs" id="overs">(0.0)</span>
      <span class="cric-event" id="event"></span>
    </div>
  `;
    shadowRoot.appendChild(barElement);
}

function updateBar(matchData) {
    console.log('ContentScript: Updating bar with', matchData);
    if (!barElement) {
        createBar();
    }

    try {
        const teamsEl = shadowRoot.getElementById('teams');
        const scoreEl = shadowRoot.getElementById('score');
        const oversEl = shadowRoot.getElementById('overs');
        const eventEl = shadowRoot.getElementById('event');

        if (!matchData || !matchData.team1) {
            console.error('ContentScript: Invalid match data', matchData);
            if (scoreEl) scoreEl.textContent = 'Loading data...';
            return;
        }

        // Extract data
        const battingTeam = matchData.innings?.batting?.team || matchData.team1.name;
        const battingScore = matchData.innings?.batting?.score || '0/0';
        const overs = matchData.innings?.batting?.overs || '0.0';
        const matchStatus = matchData.matchStatus || '';

        // Run Rates
        const crr = matchData.runRates?.current || '-';
        const rrr = matchData.runRates?.required ? `RRR: ${matchData.runRates.required}` : '';

        // Partnership
        const partnership = matchData.partnership
            ? `Part: ${matchData.partnership.runs}(${matchData.partnership.balls})`
            : '';

        if (teamsEl) teamsEl.textContent = `${matchData.team1.name} vs ${matchData.team2.name}`;

        // Render TV Style Layout
        if (scoreEl) {
            // Prepare Batsmen Rows with Strike Rate
            let batsmenHtml = '';
            if (matchData.currentBatsmen && matchData.currentBatsmen.length > 0) {
                batsmenHtml = matchData.currentBatsmen.map(b => {
                    const strikeRate = b.strikeRate ? b.strikeRate.toFixed(1) : '0.0';
                    const srHtml = `<span style="font-size:10px; color:#4fc3f7; margin-left:4px;">SR ${strikeRate}</span>`;

                    return `
                        <div class="tv-batsman-row">
                            <div class="tv-batsman-name">
                                <span class="tv-striker-indicator ${b.onStrike ? 'active' : ''}">►</span>
                                <span>${b.name.split(' ').pop()}</span>
                            </div>
                            <div class="tv-batsman-stats">
                                <span class="tv-batsman-score">${b.runs}</span>
                                <span class="tv-batsman-balls">(${b.balls})</span>
                                ${srHtml}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                batsmenHtml = '<div style="text-align:center; opacity:0.7;">No Batsmen</div>';
            }

            // Extract Target Information from matchStatus
            let targetInfo = '';
            if (matchData.matchStatus) {
                const needMatch = matchData.matchStatus.match(/need (\d+) runs?/i);
                if (needMatch) {
                    targetInfo = `Need ${needMatch[1]}`;
                }
            }

            // Prepare Bowler with Maidens and full figures
            const bowlerName = matchData.currentBowler ? matchData.currentBowler.name.split(' ').pop() : 'Bowler';
            const bowlerOvers = matchData.currentBowler ? matchData.currentBowler.overs : '';
            const bowlerMaidens = matchData.currentBowler ? matchData.currentBowler.maidens : 0;
            const bowlerRuns = matchData.currentBowler ? matchData.currentBowler.runs : 0;
            const bowlerWickets = matchData.currentBowler ? matchData.currentBowler.wickets : 0;
            const bowlerFigs = matchData.currentBowler ? `${bowlerOvers}-${bowlerMaidens}-${bowlerRuns}-${bowlerWickets}` : '';
            const bowlerEcon = matchData.currentBowler?.economy ? `${matchData.currentBowler.economy.toFixed(2)}` : '';

            // Prepare Last Wicket Details
            let lastWicketHtml = '';
            if (matchData.lastWicket) {
                const wkt = matchData.lastWicket;
                lastWicketHtml = `${wkt.batsman ? wkt.batsman.split(' ').pop() : ''} ${wkt.runs}(${wkt.balls})`;
            }

            // Recent Balls (Squares)
            let recentBallsHtml = '';
            const recentData = matchData.currentOver;
            if (recentData && Array.isArray(recentData)) {
                recentBallsHtml = recentData.map(ball => {
                    let className = 'tv-ball';
                    const text = ball.original || ball.runs || '.';
                    if (ball.isWicket) className += ' wicket';
                    else if (ball.runs === 4 || ball.runs === 6) className += ' boundary';
                    return `<span class="${className}">${text}</span>`;
                }).join('');
            }

            scoreEl.innerHTML = `
                <div class="cric-content">
                    <!-- LEFT: Team & Score -->
                    <div class="tv-score-section">
                        <div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
                            <span class="tv-team-name">${battingTeam.substring(0, 3).toUpperCase()}</span>
                            <span class="tv-overs">${overs}</span>
                            ${targetInfo ? `<span style="font-size:10px; color:#ffa726; font-weight:600;">${targetInfo}</span>` : ''}
                        </div>
                        <span class="tv-main-score">${battingScore}</span>
                    </div>

                    <div class="tv-divider"></div>

                    <!-- CENTER: Batsmen -->
                    <div class="tv-batsmen-section">
                        ${batsmenHtml}
                    </div>

                    <!-- INFO BOX (Partnership or RRR) -->
                    <div class="tv-info-box">
                        ${partnership ? `
                            <span class="tv-info-label">PSHIP</span>
                            <span class="tv-info-value">${matchData.partnership.runs}</span>
                            <span class="tv-info-label" style="margin-top:2px; font-size:8px;">${matchData.partnership.balls}b</span>
                        ` : rrr ? `
                            <span class="tv-info-label">RRR</span>
                            <span class="tv-info-value">${matchData.runRates.required}</span>
                            <span class="tv-info-label" style="margin-top:2px;">REQ</span>
                        ` : `
                            <span class="tv-info-label">CRR</span>
                            <span class="tv-info-value">${crr}</span>
                            <span class="tv-info-label" style="margin-top:2px;">RATE</span>
                        `}
                    </div>

                    <!-- RIGHT: Bowler & Recent -->
                    <div class="tv-bowler-section">
                        <div class="tv-bowler-row">
                            <span class="tv-bowler-name">${bowlerName}</span>
                            <span class="tv-bowler-figs" style="font-size:13px;">${bowlerFigs}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                            <div class="tv-recent-row">
                                ${recentBallsHtml}
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; font-size:10px; color:#aaa;">
                                ${bowlerEcon ? `<span>Eco ${bowlerEcon}</span>` : ''}
                                ${lastWicketHtml ? `<span style="color:#ff8a80; margin-top:2px;" title="${matchData.lastWicket?.text || ''}">${lastWicketHtml}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (oversEl) oversEl.style.display = 'none';

        // Event handling
        if (eventEl && matchData.lastWicket) {
            eventEl.classList.remove('visible');
        }
    } catch (e) {
        console.error('ContentScript: Error updating bar', e);
    }
}

function removeBar() {
    const host = document.getElementById('cric-updates-host');
    if (host) {
        host.remove();
        barElement = null;
        shadowRoot = null;
    }
}
