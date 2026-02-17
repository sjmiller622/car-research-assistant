// This script runs directly on web pages
console.log('Car Research Assistant is active on this page!');

// =============================================================================
// SITE DETECTION
// =============================================================================

function detectSite() {
    const url = window.location.href.toLowerCase();
    
    if (url.includes('cars.com')) return 'cars.com';
    if (url.includes('autotrader.com')) return 'autotrader';
    if (url.includes('cargurus.com')) return 'cargurus';
    if (url.includes('carsoup.com')) return 'carsoup';
    
    return 'unknown';
}

// =============================================================================
// CARS.COM EXTRACTOR
// =============================================================================

function extractCarsComData() {
    const priceElement = document.querySelector('.list-price');
    const mileageElement = document.querySelector('.msrp');
    const titleElement = document.querySelector('h1');
    
    // Extract VIN and Stock from subtitle
    let vinText = null;
    let stockNumber = null;
    
    const subtitleElement = document.querySelector('.subtitle');
    if (subtitleElement) {
        const subtitleText = subtitleElement.textContent;
        const vinMatch = subtitleText.match(/VIN:\s*([A-HJ-NPR-Z0-9]{17})/i);
        if (vinMatch) {
            vinText = vinMatch[1].trim();
        }
        const stockMatch = subtitleText.match(/Stock\s*#?:\s*([A-Z0-9\-]+)/i);
        if (stockMatch) {
            stockNumber = stockMatch[1].trim();
        }
    }
    
    const dealerElement = document.querySelector('[data-qa="dealer-name"]') ||
                         document.querySelector('.dealer-name') ||
                         document.querySelector('.seller-name');
    
    const locationElement = document.querySelector('[data-qa="dealer-address"]') ||
                           document.querySelector('.dealer-location');
    
    const features = extractFeatures();
    
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let mileageText = mileageElement ? mileageElement.textContent.trim() : null;
    let dealerText = dealerElement ? dealerElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    return {
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
        titleStatus: detectTitleStatus(),
        knownSalvageDealer: false,
        accidentReported: null,
        rawPrice: priceText,
        rawMileage: mileageText
    };
}

// =============================================================================
// AUTOTRADER EXTRACTOR
// =============================================================================

function extractAutoTraderData() {
    // AutoTrader specific selectors
    const priceElement = document.querySelector('.firstPrice') ||
                        document.querySelector('[data-cmp="pricing"]');
    
    // The mileage has a very long generated class, so we'll use a more flexible approach
    const mileageElement = document.querySelector('[class*="iris-text"][class*="--comp-color-content-type-body"]') ||
                          document.querySelector('[data-cmp="mileage"]') ||
                          // Fallback: look for text containing "mi" near the top
                          Array.from(document.querySelectorAll('span')).find(el => {
                              const text = el.textContent.trim();
                              return text.match(/^\d{1,3}(,\d{3})*\s*mi$/i);
                          });
    
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('[data-cmp="heading"]');
    
    // Stock/Inventory number
    let stockNumber = null;
    const stockElement = document.querySelector('.display-inline-block');
    if (stockElement) {
        const stockText = stockElement.textContent;
        // Look for stock number pattern
        const stockMatch = stockText.match(/Stock\s*#?:?\s*([A-Z0-9\-]+)/i) ||
                          stockText.match(/Inventory\s*#?:?\s*([A-Z0-9\-]+)/i);
        if (stockMatch) {
            stockNumber = stockMatch[1].trim();
        }
    }
    
    // VIN on AutoTrader - try multiple approaches
    let vinText = null;
    
    // Approach 1: Look for VIN in display-inline-block elements
    const displayBlocks = document.querySelectorAll('.display-inline-block');
    for (let block of displayBlocks) {
        const vinMatch = block.textContent.match(/VIN:?\s*([A-HJ-NPR-Z0-9]{17})/i);
        if (vinMatch) {
            vinText = vinMatch[1].trim();
            break;
        }
    }
    
    // Approach 2: Broader search if not found
    if (!vinText) {
        const vinElement = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent.includes('VIN') && el.textContent.length < 100
        );
        if (vinElement) {
            const vinMatch = vinElement.textContent.match(/VIN:?\s*([A-HJ-NPR-Z0-9]{17})/i);
            if (vinMatch) {
                vinText = vinMatch[1].trim();
            }
        }
    }
    
    // Dealer info - AutoTrader often has this in structured data
    const dealerElement = document.querySelector('[data-cmp="sellerName"]') ||
                         document.querySelector('.seller-details-name') ||
                         document.querySelector('[class*="dealer-name"]');
    
    const locationElement = document.querySelector('[data-cmp="sellerLocation"]') ||
                           document.querySelector('.seller-details-location') ||
                           document.querySelector('[class*="dealer-location"]');
    
    const features = extractFeatures();
    
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let mileageText = mileageElement ? mileageElement.textContent.trim() : null;
    let dealerText = dealerElement ? dealerElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    return {
        url: window.location.href,
        vin: vinText || null,
        stockNumber: stockNumber || null,
        timestamp: new Date().toISOString(),
        site: 'autotrader.com',
        title: titleElement ? titleElement.textContent.trim() : document.title,
        price: validatePrice(priceText),
        mileage: validateMileage(mileageText),
        dealer: dealerText || 'Unknown',
        location: locationText || 'Unknown',
        features: features,
        titleStatus: detectTitleStatus(),
        knownSalvageDealer: false,
        accidentReported: null,
        rawPrice: priceText,
        rawMileage: mileageText
    };
}

// =============================================================================
// CARGURUS EXTRACTOR
// =============================================================================

function extractCarGurusData() {
    console.log('=== CarGurus Extraction Debug ===');
    
    // Price - look for the specific _price_1yep1_1 pattern
    const priceElement = document.querySelector('[class*="_price_"][class*="yep"]') ||
                        document.querySelector('h2[class*="jyvfx"]') ||
                        document.querySelector('[class*="price"]');
    
    console.log('Price element:', priceElement);
    console.log('Price text:', priceElement ? priceElement.textContent : 'null');
    
    // Mileage - it's in a span after the label, within _record_ujolz_1
    let mileageText = null;
    
    // Look for the mileage in the specific structure: label wrapper + value span
    const mileageLabels = Array.from(document.querySelectorAll('[class*="ptpvP_label"][class*="ujolz"]'));
    console.log('Found potential mileage labels:', mileageLabels.length);
    
    for (let label of mileageLabels) {
        console.log('Checking label:', label.textContent);
        if (label.textContent.toLowerCase().includes('mileage')) {
            // The value is in a sibling span with class containing "ujolz"
            const parent = label.parentElement;
            const valueSpan = parent.querySelector('span[class*="ujolz"]:not([class*="label"])');
            console.log('Found value span:', valueSpan);
            if (valueSpan) {
                mileageText = valueSpan.textContent.trim();
                console.log('Extracted mileage:', mileageText);
                break;
            }
        }
    }
    
    // Fallback: look for pattern like "38,916 mi" anywhere
    if (!mileageText) {
        const allSpans = document.querySelectorAll('span');
        for (let span of allSpans) {
            const text = span.textContent.trim();
            if (/^\d{1,3}(,\d{3})*\s*mi$/i.test(text)) {
                mileageText = text;
                console.log('Fallback found mileage:', mileageText);
                break;
            }
        }
    }
    
    // Title
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('[class*="heading"]');
    
    // VIN
    let vinText = null;
    const allText = document.body.textContent;
    const vinMatch = allText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
    if (vinMatch) {
        vinText = vinMatch[1].trim();
    }

    // Stock # - CarGurus uses data-cg-ft attribute
    let stockNumber = null;

    // Method 1: Look for data-cg-ft="stockNumber"
    const stockWrapper = document.querySelector('[data-cg-ft="stockNumber"]');
    if (stockWrapper) {
        const stockValue = stockWrapper.querySelector('span[class*="_value_ujolz"]') ||
                          stockWrapper.querySelector('span[class*="39l0l"]');
        if (stockValue) {
            let rawStock = stockValue.textContent.trim();
        
            // Clean up stock number - stock numbers don't usually have lowercase letters
            // Split on the first occurrence of a capital letter followed by lowercase (like "Fuel", "Type")
            const cleanMatch = rawStock.match(/^([A-Z0-9\-]+?)(?=[A-Z][a-z]|$)/);
            stockNumber = cleanMatch ? cleanMatch[1] : rawStock.split(/[A-Z][a-z]/)[0];
        
            console.log('Found stock # in data-cg-ft:', stockNumber, '(raw:', rawStock + ')');
        }
    }

    // Method 2: Fallback to text search  
    if (!stockNumber) {
        const stockMatch = allText.match(/Stock\s+number[:\s]*([A-Z0-9\-]+)/i);
        if (stockMatch) {
            stockNumber = stockMatch[1].trim();
            console.log('Found stock # in text:', stockNumber);
        }
    }

    // Dealer - CarGurus often has dealer name in alt text or near logo
    let dealerText = null;

    // Method 1: Look for dealer logo alt text
    const dealerLogo = document.querySelector('[class*="_logo"][alt]');
    if (dealerLogo) {
        dealerText = dealerLogo.alt;
        console.log('Found dealer in logo alt:', dealerText);
    }

    // Method 2: Look for dealer name in text near "inventory" or "website"
    if (!dealerText) {
        const dealerElement = Array.from(document.querySelectorAll('*')).find(el => {
            const text = el.textContent;
            return (text.includes('Dealer website') || 
                   text.includes('Dealer reviews') || 
                   text.includes('inventory')) && 
                   text.length < 200 && 
                   text.length > 10;
        });
    
        if (dealerElement) {
            // Extract just the dealer name (usually the first part before "Dealer website" etc)
            const match = dealerElement.textContent.match(/^([^•]+)/);
            if (match) {
                dealerText = match[1].trim();
                console.log('Found dealer in text:', dealerText);
            }
        }
    }

    // Method 3: Look for heading or strong text near contact info
    if (!dealerText) {
        const headings = document.querySelectorAll('h2, h3, strong');
        for (let heading of headings) {
            const text = heading.textContent.trim();
            // Dealer names are usually between 10-50 characters
            if (text.length > 10 && text.length < 50 && !text.includes('$') && !text.includes('Mileage')) {
                dealerText = text;
                console.log('Found dealer in heading:', dealerText);
                break;
            }
        }
    }
    
    const locationElement = document.querySelector('[class*="location"]') ||
                           document.querySelector('[class*="address"]');
    
    const features = extractFeatures();
    
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    console.log('Final extraction:', {
        price: priceText,
        mileage: mileageText,
        dealer: dealerText,
        vin: vinText,
        stock: stockNumber
    });
    
    // Check if this is a known salvage dealer
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    
    // If this dealer is selling a salvage car, add them to the list
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: window.location.href,
        vin: vinText || null,
        stockNumber: stockNumber || null,
        timestamp: new Date().toISOString(),
        site: 'cargurus.com',
        title: titleElement ? titleElement.textContent.trim() : document.title,
        price: validatePrice(priceText),
        mileage: validateMileage(mileageText),
        dealer: dealerText || 'Unknown',
        location: locationText || 'Unknown',
        features: features,
        titleStatus: titleStatus,
        knownSalvageDealer: knownSalvageDealer,
        accidentReported: null,
        rawPrice: priceText,
        rawMileage: mileageText
    };
}
// =============================================================================
// CARSOUP EXTRACTOR
// =============================================================================

function extractCarSoupData() {
    // CarSoup specific selectors
    const priceElement = document.querySelector('.vdp-price');
    
    // For mileage, VIN, stock - they're all in "overview-item-value" class
    const overviewItems = document.querySelectorAll('.overview-item');
    
    let mileageText = null;
    let vinText = null;
    let stockNumber = null;
    
    // Parse through overview items to find each piece of data
    overviewItems.forEach(item => {
        const label = item.querySelector('.overview-item-label');
        const value = item.querySelector('.overview-item-value');
        
        if (label && value) {
            const labelText = label.textContent.trim().toLowerCase();
            const valueText = value.textContent.trim();
            
            // Match "Miles" label (case-insensitive, handles extra spaces)
            if (labelText.toLowerCase() === 'miles') {
                mileageText = valueText;
                console.log('✅ Found mileage:', mileageText);
            }  
        
            if (labelText.includes('vin')) {
                    vinText = valueText;
            }
            if (labelText.includes('stock')) {
                // Clean stock number - extract just the numbers before any trailing text
                const stockMatch = valueText.match(/^([A-Z0-9\-]+)/i);
                stockNumber = stockMatch ? stockMatch[1] : valueText;
            }
        }
    });
    
    // Title
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('.vehicle-title');
    
    // Dealer info - CarSoup has it in seller-info-link
    let dealerText = null;
    const dealerElement = document.querySelector('.seller-info-link');
    if (dealerElement) {
        // Get the text content of the span inside the link
        const dealerSpan = dealerElement.querySelector('span');
        dealerText = dealerSpan ? dealerSpan.textContent.trim() : null;
    }
    
    // Fallback for dealer
    if (!dealerText) {
        const altDealerElement = document.querySelector('[class*="dealer-name"]') ||
                                document.querySelector('[class*="seller-name"]');
        dealerText = altDealerElement ? altDealerElement.textContent.trim() : null;
    }
    
    const locationElement = document.querySelector('[class*="dealer-location"]') ||
                           document.querySelector('[class*="dealer-address"]');
    
    const features = extractFeatures();
    
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    // Check if this is a known salvage dealer
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    
    // If this dealer is selling a salvage car, add them to the list
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: window.location.href,
        vin: vinText || null,
        stockNumber: stockNumber || null,
        timestamp: new Date().toISOString(),
        site: 'carsoup.com',
        title: titleElement ? titleElement.textContent.trim() : document.title,
        price: validatePrice(priceText),
        mileage: validateMileage(mileageText),
        dealer: dealerText || 'Unknown',
        location: locationText || 'Unknown',
        features: features,
        titleStatus: titleStatus,
        knownSalvageDealer: knownSalvageDealer,
        accidentReported: null,
        rawPrice: priceText,
        rawMileage: mileageText
    };
}

// =============================================================================
// SHARED UTILITY FUNCTIONS
// =============================================================================

function extractFeatures() {
    const features = [];
    
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
    
    const pageText = document.body.textContent.toLowerCase();
    
    desiredFeatures.forEach(feature => {
        if (pageText.includes(feature.toLowerCase())) {
            const displayFeature = feature.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            features.push(displayFeature);
        }
    });
    
    const uniqueFeatures = [...new Set(features)];
    return uniqueFeatures.sort();
}

function detectTitleStatus() {
    const pageText = document.body.textContent.toLowerCase();
    
    // For CarSoup, check the description specifically
    const descriptionElement = document.querySelector('.text-description-wrp');
    const descriptionText = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
    
    const salvageKeywords = [
        'salvage title',
        'salvage vehicle', 
        'rebuilt title',
        'branded title',
        'total loss',
        'insurance write-off',
        'salvage'  // Added broader match
    ];
    
    // Check description first (more reliable)
    for (let keyword of salvageKeywords) {
        if (descriptionText.includes(keyword)) {
            console.log('⚠️ SALVAGE DETECTED in description:', keyword);
            return 'salvage/rebuilt';
        }
    }
    
    // Then check entire page
    for (let keyword of salvageKeywords) {
        if (pageText.includes(keyword)) {
            console.log('⚠️ SALVAGE DETECTED on page:', keyword);
            return 'salvage/rebuilt';
        }
    }
    
    // Check for clean title mentions
    if (pageText.includes('clean title')) {
        return 'clean';
    }
    
    return 'unknown';
}

// =============================================================================
// SALVAGE DEALER TRACKING
// =============================================================================

// Get the list of known salvage dealers from storage
function getKnownSalvageDealers(callback) {
    chrome.storage.local.get({knownSalvageDealers: []}, function(result) {
        callback(result.knownSalvageDealers);
    });
}

// Add a dealer to the known salvage dealers list
function addSalvageDealer(dealerName) {
    if (!dealerName || dealerName === 'Unknown') return;
    
    // Normalize dealer name (lowercase, trim)
    const normalizedName = dealerName.toLowerCase().trim();
    
    chrome.storage.local.get({knownSalvageDealers: []}, function(result) {
        const dealers = result.knownSalvageDealers;
        
        // Only add if not already in the list
        if (!dealers.includes(normalizedName)) {
            dealers.push(normalizedName);
            chrome.storage.local.set({knownSalvageDealers: dealers}, function() {
                console.log('🚨 Added to salvage dealer list:', dealerName);
            });
        }
    });
}

// Check if a dealer is in the known salvage dealers list
function isKnownSalvageDealer(dealerName) {
    if (!dealerName || dealerName === 'Unknown') return false;
    
    const normalizedName = dealerName.toLowerCase().trim();
    
    // Hard-coded list of major salvage dealers (always flagged)
    const majorSalvageDealers = [
        'copart',
        'iaai',
        'insurance auto auctions',
        'salvage direct',
        'salvage world',
        'north 61 auto sales'  // Adding this one from your example
    ];
    
    // Check against hard-coded list
    for (let salvageDealer of majorSalvageDealers) {
        if (normalizedName.includes(salvageDealer)) {
            return true;
        }
    }
    
    // Note: We can't check the dynamic list synchronously here
    // We'll handle that in the popup display
    return false;
}

function validatePrice(text) {
    if (!text) return 'Not found';
    
    // Clean up the price text
    // Extract just the price part (e.g., "$38,988" from "$38,988See estimated payment")
    const priceMatch = text.match(/\$[\d,]+/);
    
    if (priceMatch) {
        return priceMatch[0];  // Returns just "$38,988"
    }
    
    // If no dollar sign found
    if (!text.includes('$')) {
        return `${text} (verify - no $ found)`;
    }
    
    return text;
}

function validateMileage(text) {
    console.log('validateMileage input:', text);
    
    if (!text) {
        console.log('validateMileage: text is null/undefined');
        return 'Not found';
    }
    
    if (text.includes('$')) {
        console.log('validateMileage: contains $, returning new car message');
        return 'New car (MSRP shown - no mileage)';
    }
    
    if (text.toLowerCase().includes('mi') || /\d/.test(text)) {
        console.log('validateMileage: valid mileage, returning:', text);
        return text;
    }
    
    console.log('validateMileage: fallback, returning text as-is');
    return text;
}

// =============================================================================
// MAIN EXTRACTION ROUTER
// =============================================================================

function extractPageData() {
    const site = detectSite();
    
    console.log('Detected site:', site);
    
    switch(site) {
        case 'cars.com':
            return extractCarsComData();
        case 'autotrader':
            return extractAutoTraderData();
        case 'cargurus':
            return extractCarGurusData();
        case 'carsoup':
            return extractCarSoupData();
        default:
            return {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString(),
                site: 'unknown',
                error: 'Site not yet supported'
            };
    }
}

// =============================================================================
// MESSAGE LISTENER
// =============================================================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'extractData') {
        const data = extractPageData();
        sendResponse({success: true, data: data});
    }
});

console.log('Content script loaded and ready!');