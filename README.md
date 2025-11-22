# Cricket Live Updates - Browser Extension

A sleek Chromium extension that displays live cricket match updates in a TV broadcast-style bottom bar on any webpage.

![Extension Preview](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-blue)
![Update Interval](https://img.shields.io/badge/Updates-Every%205s-green)

## 🏏 Features

### Live Match Scorecard
- **TV Broadcast Style UI** - Professional, non-intrusive floating bar at the bottom of your screen
- **Real-time Updates** - Refreshes every 5 seconds for near real-time match data
- **Ball-by-Ball Commentary** - See the last 6 balls of the current over with color-coded indicators:
  - 🟢 Green for boundaries (4s & 6s)
  - 🔴 Red for wickets
  - ⚪ White for other deliveries

### Comprehensive Statistics
- **Batting Stats**:
  - Current batsmen with runs, balls faced, and strike rate
  - Visual indicator (►) for batsman on strike
  - Partnership details (runs and balls)

- **Bowling Stats**:
  - Current bowler with full figures (Overs-Maidens-Runs-Wickets)
  - Economy rate
  - Last wicket details

- **Match Info**:
  - Live team score and wickets
  - Overs bowled
  - Current Run Rate (CRR)
  - Required Run Rate (RRR) for chasing teams
  - Target information ("Need X runs")

## 📦 Installation

### For Users
1. Download or clone this repository
2. Open Chrome/Edge/Brave and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the extension directory (`Cric Updates`)
6. The extension icon will appear in your toolbar

### For Developers
```bash
git clone <repository-url>
cd "Cric Updates"
# Load the extension as described above
```

## 🚀 Usage

1. **Select a Match**:
   - Click the extension icon in your toolbar
   - Choose from the list of live cricket matches
   - Click on your preferred match

2. **View Live Updates**:
   - The scorecard bar will automatically appear at the bottom of your current webpage
   - Updates refresh automatically every 5 seconds
   - The bar stays visible across all tabs

3. **Dismiss**:
   - Open the popup and deselect the match
   - Or simply close/reload the extension

## 🎨 UI Highlights

### Professional Design
- **Dark blue gradient** background for premium look
- **Centered floating bar** with subtle shadow
- **Color-coded elements**:
  - Orange/Gold for scores
  - Light blue for CRR/Partnership box
  - Cyan for strike rates
  - Red for wicket information

### Responsive Layout
- Automatically adjusts to different screen widths
- Text truncation to prevent overflow
- Optimized spacing for readability

## 🔧 Technical Details

### File Structure
```
Cric Updates/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for data fetching
├── content.js            # Content script for UI rendering
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic
├── styles.css            # TV-style scorecard styles
└── utils/
    └── apiProvider.js    # API integration layer
```

### API Integration
- **Data Source**: `crickbarservice.heisenapp.com`
- **Update Frequency**: 5 seconds (configurable in `background.js`)
- **Endpoints**:
  - `/matches` - List of live matches
  - `/score/{matchId}` - Detailed match data

### Key Technologies
- **Manifest V3** - Latest Chrome extension platform
- **Shadow DOM** - Isolated styles to avoid conflicts with host pages
- **Chrome Storage API** - Persistent match selection
- **Chrome Alarms API** - Efficient background updates

## ⚙️ Configuration

### Change Update Interval
Edit `background.js` line 6:
```javascript
const UPDATE_INTERVAL_MINUTES = 0.0833; // 5 seconds
// Change to 0.1667 for 10 seconds
// Change to 0.33 for 20 seconds
```

### Adjust Bar Position
Edit `styles.css` line 6:
```css
bottom: 0px; /* Distance from bottom edge */
```

## 🛠️ Development

### Making Changes
1. Edit source files as needed
2. Go to `chrome://extensions/`
3. Click the **Reload** button for this extension
4. Refresh your browser tab to see changes

### Debug Tips
- Open DevTools Console (F12) to see logs
- Check `ContentScript:` prefixed logs for UI issues
- Check `Background:` prefixed logs for data fetching issues

## 📋 Permissions

The extension requires:
- **`storage`** - Save selected match preference
- **`alarms`** - Schedule periodic updates
- **`activeTab`** - Inject scorecard into current tab
- **`host_permissions`** - Access cricket API

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- [ ] Add notification support for wickets/boundaries
- [ ] Support for multiple match formats (Test, ODI, T20)
- [ ] Customizable themes
- [ ] Detailed scorecard view in popup

## 📄 License

This project is created for personal use. API data is provided by third-party services.

## 🐛 Known Issues

- Bar may briefly flicker during page navigation
- Some websites with fixed bottom elements may overlap the bar
- API rate limits may affect update frequency during high traffic

## 📞 Support

For issues or feature requests, please create an issue in the repository.

---

**Enjoy live cricket updates while browsing! 🏏**
