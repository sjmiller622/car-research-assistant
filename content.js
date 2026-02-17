// This script runs directly on web pages
console.log('Car Research Assistant is active on this page!');

// Function to extract car data from Cars.com
function extractCarsComData() {
    // Use the exact class names
    const priceElement = document.querySelector('.list-price');
    const mileageElement = document.querySelector('.msrp');
    const titleElement = document.querySelector('h1');
    
    // Try to find VIN - it's in a subtitle element with format "VIN: xxx / Stock #: yyy"
    let vinText = null;
    let stockNumber = null;
    
    const subtitleElement = document.querySelector('.subtitle');
    if (subtitleElement) {
        const subtitleText = subtitleElement.textContent;
        
        // Extract VIN (after "VIN:" and before "/")
        const vinMatch = subtitleText.match(/VIN:\s*([A-HJ-NPR-Z0-9]{17})/i);
        if (vinMatch) {
            vinText = vinMatch[1].trim();
        }
        
        // Extract Stock # (after "Stock #:" or "Stock:")
        const stockMatch = subtitleText.match(/Stock\s*#?:\s*([A-Z0-9\-]+)/i);
        if (stockMatch) {
            stockNumber = stockMatch[1].trim();
        }
    }
    
    // Try to find dealer/seller name
    const dealerElement = document.querySelector('[data-qa="dealer-name"]') ||
                         document.querySelector('.dealer-name') ||
                         document.querySelector('.seller-name');
    
    // Try to find location
    const locationElement = document.querySelector('[data-qa="dealer-address"]') ||
                           document.querySelector('.dealer-location');
    
    // Extract features (we'll do basic extraction now, improve later)
    const features = extractFeatures();
    
    // Extract raw text
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let mileageText = mileageElement ? mileageElement.textContent.trim() : null;
    let dealerText = dealerElement ? dealerElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    // Validate and clean the data
    const carData = {
        url: window.location.href,
        vin: vinText || null,
        stockNumber: stockNumber || null,
        timestamp: new Date().toISOString(),
        site: 'cars.com',
        title: titleElement ? titleElement.textContent.trim() : document.title,
        price: validatePrice(priceText),
        mileage: validateMileage(mileageText),
        dealer: dealerText || 'Unknown',
        location: locationText || 'Unknown',
        features: features,
    
        // Salvage/accident tracking (to be populated in Phase 5)
        titleStatus: detectTitleStatus(),  // 'clean', 'salvage', 'rebuilt', 'unknown'
        knownSalvageDealer: false,  // Will flag known salvage dealers
        accidentReported: null,  // Will capture from CarFax/AutoCheck later
    
        rawPrice: priceText,
        rawMileage: mileageText    };
    
    console.log('Extracted car data:', carData);
    return carData;
}

// Basic feature extraction (will improve in Phase 5)
function extractFeatures() {
    const features = [];
    
    // Features to look for
    const desiredFeatures = [
        'backup camera',
        'back-up camera',
        'rear camera',
        'remote start',
        'heated seats',
        'leather seats',
        'sunroof',
        'moonroof',
        'navigation',
        'bluetooth',
        'apple carplay',
        'android auto',
        'blind spot',
        'lane assist',
        'parking sensors',
        'cruise control',
        'keyless entry',
        'all-wheel drive',
        'awd',
        '4wd'
    ];
    
    // Get all text on the page (simple approach for now)
    const pageText = document.body.textContent.toLowerCase();
    
    // Check which features are mentioned
    desiredFeatures.forEach(feature => {
        if (pageText.includes(feature.toLowerCase())) {
            // Capitalize first letter of each word for display
            const displayFeature = feature.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            features.push(displayFeature);
        }
    });
    
    // Remove duplicates
    return [...new Set(features)];
}

// Validate that price looks like a price
function validatePrice(text) {
    if (!text) return 'Not found';
    
    if (!text.includes('$')) {
        return `${text} (verify - no $ found)`;
    }
    
    return text;
}

// Validate mileage field
function validateMileage(text) {
    if (!text) return 'Not found';
    
    if (text.includes('$')) {
        return 'New car (MSRP shown - no mileage)';
    }
    
    if (text.toLowerCase().includes('mi') || /\d/.test(text)) {
        return text;
    }
    
    return text;
}

// Function to detect which site we're on and extract accordingly
function extractPageData() {
    const url = window.location.href;
    
    if (url.includes('cars.com')) {
        return extractCarsComData();
    } else {
        return {
            url: url,
            title: document.title,
            timestamp: new Date().toISOString(),
            error: 'Site not yet supported'
        };
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'extractData') {
        const data = extractPageData();
        sendResponse({success: true, data: data});
    }
});

// Basic title status detection (will improve in Phase 5)
function detectTitleStatus() {
    const pageText = document.body.textContent.toLowerCase();
    
    // Obvious salvage indicators
    const salvageKeywords = [
        'salvage title',
        'salvage vehicle', 
        'rebuilt title',
        'branded title',
        'total loss',
        'insurance write-off'
    ];
    
    for (let keyword of salvageKeywords) {
        if (pageText.includes(keyword)) {
            console.log('⚠️ SALVAGE DETECTED:', keyword);
            return 'salvage/rebuilt';
        }
    }   
    
    // Check for clean title mentions
    if (pageText.includes('clean title')) {
        return 'clean';
    }
    
    // Default to unknown - we'll improve this in Phase 5
    return 'unknown';
}

console.log('Content script loaded and ready!');