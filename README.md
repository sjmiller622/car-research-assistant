# 🚗 Car Research Assistant

> A Chrome extension that automates used car research — capturing listings, fetching reliability data, and surfacing known problems, all during your normal browsing session.

![Version](https://img.shields.io/badge/version-1.3-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![Status](https://img.shields.io/badge/status-active%20development-orange)

---

## The Problem

Researching a used car the right way means visiting 4–5 different sites:

1. Browse listings on Cars.com, AutoTrader, CarGurus, or CarSoup
2. Cross-reference reliability on CarComplaints.com
3. Note NHTSA complaint categories
4. Manually copy all of it into a spreadsheet
5. Repeat for 6–10 cars

That process takes hours of manual copying, pasting, and post-processing — *after* the browsing session is already over.

---

## The Solution

Car Research Assistant is a Chrome extension that captures everything **during** your browsing session. Visit a listing, click **Capture This Page**, and the extension automatically:

- Extracts price, mileage, VIN, dealer, and 20+ features
- Detects salvage titles and flags known salvage dealers
- Fetches NHTSA complaint data from CarComplaints.com in the background
- Caches complaint data by make/model/year — subsequent saves of the same car type attach instantly from local cache
- Displays everything on unified car cards with color-coded warnings

No spreadsheet. No switching tabs to copy data. No post-session manual work.

---

## Features

### 🔍 Car Listing Capture
- **Multi-site support** — Cars.com, AutoTrader, CarGurus, CarSoup
- **VIN-based duplicate detection** with URL fallback
- **Price & mileage extraction** with validation
- **Dealer & location tracking**
- **20+ feature detection** — Backup Camera, Heated Seats, Apple CarPlay, Remote Start, and more
- **Drivetrain detection** scoped to the features section to prevent false positives from page UI

### ⚠️ Reliability Intelligence
- **Automatic background fetching** of CarComplaints.com data when a car is saved
- **Complaint data cached separately** by make/model/year — only fetches once per unique car type
- **Top 3 NHTSA complaint categories** displayed on each car card
- **Manual capture support** — navigate to any CarComplaints page and click Capture to store data

### 🚨 Salvage Detection
- Detects salvage/rebuilt/branded titles from listing text
- Tracks known salvage dealers across sessions
- Manual override to mark/unmark individual cars
- Visual indicators — red card borders and warning badges

### 🗂️ Storage Architecture
- `savedCars` — all captured listings with attached complaint summaries
- `savedComplaints` — complaint data keyed by `make_model_year`, shared across all matching cars
- `knownSalvageDealers` — persisted list of flagged dealers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 |
| Language | JavaScript (ES6+) |
| Storage | Chrome Storage API (local) |
| Scraping | DOM manipulation, CSS selectors |
| Background | Service Worker |
| Version Control | Git / GitHub |

---

## Project Structure

```
car-research-assistant/
├── manifest.json       # Extension config (MV3)
├── popup.html          # Extension UI
├── popup.js            # UI logic, storage orchestration
├── content.js          # Page data extraction (all sites)
├── background.js       # Service worker — background tab fetching
├── utils.js            # Shared utilities: parseCarTitle, makeComplaintKey,
│                       # getCarComplaintsUrl, getUniqueCarTypes, MAKE_REGISTRY
└── icon.png
```

---

## Installation

### Prerequisites
- Google Chrome (or Chromium-based browser)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sjmiller622/car-research-assistant.git
   cd car-research-assistant
   ```

2. **Load the extension in Chrome**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `car-research-assistant` folder

3. **Pin the extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Pin **Car Research Assistant** for easy access

---

## Usage

### Capturing a Car Listing

1. Visit a supported listing site (Cars.com, AutoTrader, CarGurus, CarSoup)
2. Open a specific vehicle listing page
3. Click the extension icon → **Capture This Page**
4. The car is saved and complaint data is fetched automatically in the background
5. Within 10–15 seconds the car card updates with NHTSA issues

### Viewing Saved Cars

- Open the extension popup at any time
- Scroll through car cards showing price, mileage, dealer, features, and known issues
- Yellow warning boxes show the top 3 NHTSA problem categories
- Red borders and badges flag salvage titles or known salvage dealers
- Click the source badge to return to the original listing

### Manual Complaint Capture

If auto-fetch fails or you want detail-level data:
1. Navigate directly to a CarComplaints.com overview page
   - e.g. `https://www.carcomplaints.com/Honda/Accord/2016/`
2. Click **Capture This Page**
3. Data is saved to the complaints cache and linked to any matching saved cars

### Salvage Title Override

If a title status is incorrectly detected:
- Click **Mark Clean** or **Mark Salvage** on any car card
- Overrides are stored persistently and labeled *(Manual)*

---

## Supported Sites

| Site | Listings | Complaints |
|------|----------|------------|
| Cars.com | ✅ | — |
| AutoTrader.com | ✅ | — |
| CarGurus.com | ✅ | — |
| CarSoup.com | ✅ | — |
| CarComplaints.com | — | ✅ |

---

## Roadmap

### ✅ Completed
- Phase 1–2: Extension scaffold, DOM extraction, message passing
- Phase 3: Chrome Storage, VIN deduplication, feature extraction
- Phase 4: Multi-site support (4 listing sites)
- Phase 5A: Manual CarComplaints capture (overview + detail pages)
- Phase 5B: Automated background complaint fetching with local caching

### 🔲 Upcoming
- **Phase 6 — Data Export**: Export to Excel/CSV using SheetJS, client-ready formatted reports
- **Phase 7 — Python Analysis**: TCO calculations, repair likelihood predictions by mileage, market comparisons, matplotlib/plotly visualizations
- **Phase 8 — Polish**: Professional screenshots, demo video, deployment guide, architecture diagrams

---

## Debugging

| Problem | Where to look |
|---------|--------------|
| Extension not loading | `chrome://extensions` → Errors button |
| Capture button does nothing | Right-click popup → Inspect → Console |
| Complaint data not fetching | `chrome://extensions` → Inspect views: service worker |
| Data not saving | Application tab → Local Storage in DevTools |
| Wrong features detected | Check browser console for `[utils]` and `extractFeatures` logs |

---

## Contributing

This project is currently built for personal consulting use. If you'd like to suggest improvements or report bugs, feel free to open an issue.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built to turn a 3-hour manual research process into a single browsing session.*