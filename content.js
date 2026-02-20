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
    if (url.includes('carcomplaints.com')) return 'carcomplaints';
    
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
    
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: cleanUrl(window.location.href),
        vin: vinText || null,
        timestamp: new Date().toISOString(),
        site: 'cars.com',
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
// AUTOTRADER EXTRACTOR
// =============================================================================

function extractAutoTraderData() {
    const priceElement = document.querySelector('.firstPrice') ||
                        document.querySelector('[data-cmp="pricing"]');
    
    const mileageElement = Array.from(document.querySelectorAll('span, div')).find(el => {
        const text = el.textContent.trim();
        return /^\d{1,3}(,?\d{3})*\s*(mi|miles?)$/i.test(text) && text.length < 20;
    });
    
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('[data-cmp="heading"]');
    
    let stockNumber = null;
    const stockElement = document.querySelector('.display-inline-block');
    if (stockElement) {
        const stockText = stockElement.textContent;
        const stockMatch = stockText.match(/Stock\s*#?:?\s*([A-Z0-9\-]+)/i) ||
                          stockText.match(/Inventory\s*#?:?\s*([A-Z0-9\-]+)/i);
        if (stockMatch) {
            stockNumber = stockMatch[1].trim();
        }
    }
    
    let vinText = null;
    const displayBlocks = document.querySelectorAll('.display-inline-block');
    for (let block of displayBlocks) {
        const vinMatch = block.textContent.match(/VIN:?\s*([A-HJ-NPR-Z0-9]{17})/i);
        if (vinMatch) {
            vinText = vinMatch[1].trim();
            break;
        }
    }
    
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
    
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: cleanUrl(window.location.href),
        vin: vinText || null,
        timestamp: new Date().toISOString(),
        site: 'autotrader.com',
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
// CARGURUS EXTRACTOR
// =============================================================================

function extractCarGurusData() {
    const priceElement = document.querySelector('[class*="_price_"][class*="yep"]') ||
                        document.querySelector('h2[class*="jyvfx"]') ||
                        document.querySelector('[class*="price"]');
    
    //Mileage extraction (updated 2/19/2026)
    let mileageText = null;

    // Method 1: Look for the label/value structure
    const mileageLabels = Array.from(document.querySelectorAll('[class*="ptpvP_label"][class*="ujolz"]'));

    for (let label of mileageLabels) {
        if (label.textContent.toLowerCase() === 'miles') {
            const parent = label.parentElement;
            // Try span first
            let valueElement = parent.querySelector('span[class*="ujolz"]:not([class*="label"])');
            // If not span, try p tag
            if (!valueElement) {
                valueElement = parent.querySelector('p[class*="jyvfx"]');
            }
            if (valueElement) {
                mileageText = valueElement.textContent.trim();
                console.log('Found mileage:', mileageText);
                break;
            }
        }
    }

    // Method 2: Fallback - look for any element with pattern like "38,916 mi"
    if (!mileageText) {
        const allElements = document.querySelectorAll('span, p, div');
        for (let el of allElements) {
            const text = el.textContent.trim();
            if (/^\d{1,3}(,\d{3})*\s*mi$/i.test(text) && text.length < 20) {
                mileageText = text;
                console.log('Found mileage (fallback):', mileageText);
                break;
            }
        }
    }   
    
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('[class*="heading"]');
    
    let vinText = null;
    const allText = document.body.textContent;
    const vinMatch = allText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
    if (vinMatch) {
        vinText = vinMatch[1].trim();
    }
    
    let stockNumber = null;
    const stockWrapper = document.querySelector('[data-cg-ft="stockNumber"]');
    if (stockWrapper) {
        const stockValue = stockWrapper.querySelector('span[class*="_value_ujolz"]') ||
                          stockWrapper.querySelector('span[class*="39l0l"]');
        if (stockValue) {
            let rawStock = stockValue.textContent.trim();
            const cleanMatch = rawStock.match(/^([A-Z0-9\-]+?)(?=[A-Z][a-z]|$)/);
            stockNumber = cleanMatch ? cleanMatch[1] : rawStock.split(/[A-Z][a-z]/)[0];
        }
    }
    
    let dealerText = null;
    const dealerLogo = document.querySelector('[class*="_logo"][alt]');
    if (dealerLogo) {
        dealerText = dealerLogo.alt;
    }
    
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
            const match = dealerElement.textContent.match(/^([^•]+)/);
            if (match) {
                dealerText = match[1].trim();
            }
        }
    }
    
    const locationElement = document.querySelector('[class*="location"]') ||
                           document.querySelector('[class*="address"]');
    
    const features = extractFeatures();
    
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let locationText = locationElement ? locationElement.textContent.trim() : null;
    
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: cleanUrl(window.location.href),
        vin: vinText || null,
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
    const priceElement = document.querySelector('.vdp-price');
    
    const overviewItems = document.querySelectorAll('.overview-item');
    
    let mileageText = null;
    let vinText = null;
    let stockNumber = null;
    
    overviewItems.forEach(item => {
        const label = item.querySelector('.overview-item-label');
        const value = item.querySelector('.overview-item-value');
        
        if (label && value) {
            const labelText = label.textContent.trim();
            const valueText = value.textContent.trim();
            
            if (labelText.toLowerCase() === 'miles') {
                mileageText = valueText;
            }
            if (labelText.toLowerCase().includes('vin')) {
                vinText = valueText;
            }
            if (labelText.toLowerCase().includes('stock')) {
                const stockMatch = valueText.match(/^([A-Z0-9\-]+)/i);
                stockNumber = stockMatch ? stockMatch[1] : valueText;
            }
        }
    });
    
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('.vehicle-title');
    
    let dealerText = null;
    const dealerElement = document.querySelector('.seller-info-link');
    if (dealerElement) {
        const dealerSpan = dealerElement.querySelector('span');
        dealerText = dealerSpan ? dealerSpan.textContent.trim() : null;
    }
    
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
    
    const knownSalvageDealer = isKnownSalvageDealer(dealerText);
    const titleStatus = detectTitleStatus();
    if (titleStatus === 'salvage/rebuilt' && dealerText) {
        addSalvageDealer(dealerText);
    }
    
    return {
        url: cleanUrl(window.location.href),
        vin: vinText || null,
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
// CARCOMPLAINTS EXTRACTOR
// =============================================================================

function extractCarComplaintsData() {
    const url = window.location.href;
    
    // Extract make/model/year from URL
    const urlParts = url.match(/carcomplaints\.com\/([^\/]+)\/([^\/]+)\/(\d{4})/);
    
    let make = null, model = null, year = null;
    if (urlParts) {
        make = urlParts[1];
        model = urlParts[2];
        year = urlParts[3];
    }
    
    // Determine page type
    const isOverview = url.match(/\/\d{4}\/?$/) !== null;
    const isProblemPage = url.includes('.shtml');
    
    if (isOverview) {
        return extractOverviewData(make, model, year);
    } else if (isProblemPage) {
        return extractProblemPageData(make, model, year);
    } else {
        return null;
    }
}

// Extract data from overview page (year summary)
function extractOverviewData(make, model, year) {
    console.log('=== CarComplaints Overview Extraction ===');
    
    const categories = [];
    
    const categoryItems = document.querySelectorAll('li[class]');
    
    console.log('Found li elements:', categoryItems.length);
    
    categoryItems.forEach((li, index) => {
        const categoryClass = li.className;
    
        if (!categoryClass || categoryClass.length < 3) return;
    
        console.log(`\nChecking li.${categoryClass}`);
    
        // Find the category name link
        const link = li.querySelector('a');
        if (!link) {
            console.log('  No link found');
            return;
        }
    
        // Get category text and clean it
        let categoryText = link.textContent.trim();
    
        console.log('  Raw text:', categoryText);
    
        // Find "problems" and cut off everything after it
        const problemsIndex = categoryText.toLowerCase().indexOf('problems');
        if (problemsIndex !== -1) {
            categoryText = categoryText.substring(0, problemsIndex + 8); // +8 for length of "problems"
        }
    
        // Normalize whitespace and trim
        categoryText = categoryText.replace(/\s+/g, ' ').trim();
    
        console.log('  Cleaned category:', categoryText);
    
        // Find the NHTSA count in <em class="nhtsa">
        const nhtsaElement = li.querySelector('em.nhtsa');
        if (!nhtsaElement) {
            console.log('  No NHTSA element found');
            return;
        }
    
        const nhtsaText = nhtsaElement.textContent;
        
        // Extract the number from "NHTSA complaints: 301"
        const nhtsaMatch = nhtsaText.match(/NHTSA\s+complaints?[:\s]+(\d+)/i);
        
        if (nhtsaMatch) {
            const nhtsaCount = parseInt(nhtsaMatch[1]);
            console.log('  ✓ Extracted NHTSA count:', nhtsaCount);
            
            if (nhtsaCount > 0) {
                categories.push({
                    category: categoryText,
                    nhtsaCount: nhtsaCount,
                    url: link.href
                });
                console.log('  ✅ Added category');
            }
        } else {
            console.log('  ❌ Could not parse NHTSA count from:', nhtsaText);
        }
    });
    
    console.log('\n=== FOUND CATEGORIES ===');
    console.log('Total categories:', categories.length);
    categories.forEach(cat => {
        console.log(`  ${cat.category}: ${cat.nhtsaCount} NHTSA`);
    });
    
    categories.sort((a, b) => b.nhtsaCount - a.nhtsaCount);
    const top3Categories = categories.slice(0, 3);
    
    console.log('\n=== TOP 3 ===');
    top3Categories.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat.category}: ${cat.nhtsaCount}`);
    });
    
    const totalNHTSA = categories.reduce((sum, cat) => sum + cat.nhtsaCount, 0);
    console.log('Total NHTSA complaints:', totalNHTSA);
    
    return {
        type: 'overview',
        make: make,
        model: model,
        year: year,
        url: window.location.href,
        site: 'carcomplaints.com',
        timestamp: new Date().toISOString(),
        
        allCategories: categories,
        top3Categories: top3Categories,
        totalNHTSAComplaints: totalNHTSA,
        
        summary: {
            totalCategories: categories.length,
            totalNHTSAComplaints: totalNHTSA,
            top3Problems: top3Categories.map(c => `${c.category}: ${c.nhtsaCount}`).join(', ')
        }
    };
}

// Extract data from specific problem page
function extractProblemPageData(make, model, year) {
    console.log('=== CarComplaints Problem Page Extraction ===');
    
    const urlMatch = window.location.pathname.match(/\/(\w+)\/(\w+)\.shtml$/);
    let problemCategory = urlMatch ? urlMatch[1].toUpperCase() : 'Unknown';
    let problemType = urlMatch ? urlMatch[2].replace(/_/g, ' ').toUpperCase() : 'Unknown';
    
    console.log('Problem category:', problemCategory);
    console.log('Problem type:', problemType);
    
    let nhtsaCount = null;
    const pageText = document.body.textContent;
    const nhtsaMatch = pageText.match(/NHTSA\s+complaints?[:\s]*(\d+)/i);
    if (nhtsaMatch) {
        nhtsaCount = parseInt(nhtsaMatch[1]);
        console.log('Found NHTSA count:', nhtsaCount);
    }
    
    const complaints = [];
    const complaintDivs = document.querySelectorAll('div.complaint');
    
    console.log('Found complaint divs:', complaintDivs.length);
    
    complaintDivs.forEach((complaintDiv, index) => {
        const complaintId = complaintDiv.id;
        const allChildDivs = complaintDiv.querySelectorAll('div');
        
        let complaintNumber = null;
        let date = null;
        let complaintText = '';
        let mileage = null;
        let location = null;
        
        allChildDivs.forEach(childDiv => {
            const className = childDiv.className;
            const text = childDiv.textContent.trim();
            
            // Header div (has complaint number and date)
            if (className.includes('header') || className.includes('cheader')) {
                const numberMatch = text.match(/#(\d+)/);
                if (numberMatch) {
                    complaintNumber = numberMatch[1];
                }
                
                const dateMatch = text.match(/([A-Z][a-z]{2}\s+\d{1,2}\s*\d{4})/i);
                if (dateMatch) {
                    date = dateMatch[1];
                }
                
                // Extract mileage from header (FIXED - was missing)
                const headerMileageMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi)/i);
                if (headerMileageMatch) {
                    mileage = parseInt(headerMileageMatch[1].replace(/,/g, ''));
                    console.log(`Complaint #${complaintNumber}: found mileage in header:`, mileage);
                }
            }
            
            // Comments div (has the actual complaint text)
            if (className === 'comments') {
                complaintText = text;
                
                // If mileage not in header, try to extract from text
                if (!mileage) {
                    const textMileageMatch = complaintText.match(/(?:at|with|around|approximately)\s+(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi)/i);
                    if (textMileageMatch) {
                        mileage = parseInt(textMileageMatch[1].replace(/,/g, ''));
                        console.log(`Complaint #${complaintNumber}: found mileage in text:`, mileage);
                    }
                }
            }
            
            // User info div (location)
            if (className.includes('userinfo')) {
                location = text;
            }
        });
        
        // Filter out ads (complaints with no real text)
        if (complaintText.length > 100 && !complaintText.includes('googletag')) {
            complaints.push({
                id: complaintId,
                number: complaintNumber,
                mileage: mileage,
                date: date,
                location: location,
                text: complaintText.substring(0, 1500)
            });
        }
    });
    
    console.log('Total complaints extracted:', complaints.length);
    
    // Calculate mileage statistics
    const validMileages = complaints.filter(c => c.mileage !== null).map(c => c.mileage);
    console.log('Complaints with mileage:', validMileages.length);
    
    const avgMileage = validMileages.length > 0 
        ? Math.round(validMileages.reduce((a, b) => a + b, 0) / validMileages.length)
        : null;
    
    const minMileage = validMileages.length > 0 ? Math.min(...validMileages) : null;
    const maxMileage = validMileages.length > 0 ? Math.max(...validMileages) : null;
    
    console.log('Mileage stats - avg:', avgMileage, 'min:', minMileage, 'max:', maxMileage);
    
    // Keyword analysis
    const allComplaintText = complaints.map(c => c.text).join(' ').toLowerCase();
    
    const keywordAnalysis = {
        battery: ['battery', 'dead battery', 'battery died', 'battery replaced'],
        starter: ['starter', 'won\'t start', 'no start'],
        alternator: ['alternator', 'charging'],
        wiring: ['wiring', 'harness'],
        display: ['display', 'screen', 'radio'],
        sensor: ['sensor', 'eyesight', 'camera']
    };
    
    const problemCounts = {};
    
    Object.keys(keywordAnalysis).forEach(category => {
        const keywords = keywordAnalysis[category];
        let count = 0;
        keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = allComplaintText.match(regex);
            if (matches) {
                count += matches.length;
            }
        });
        problemCounts[category] = count;
    });
    
    const topProblems = Object.entries(problemCounts)
        .map(([name, count]) => ({name, count}))
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    console.log('Top problems:', topProblems);
    
    // Extract costs
    const costPattern = /\$\s*(\d{1,3}(?:,\d{3})*)/g;
    const costs = [];
    let costMatch;
    while ((costMatch = costPattern.exec(allComplaintText)) !== null) {
        const cost = parseInt(costMatch[1].replace(/,/g, ''));
        if (cost > 50 && cost < 50000) {
            costs.push(cost);
        }
    }
    
    const avgCost = costs.length > 0 
        ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length)
        : null;
    
    console.log('Costs found:', costs.length, 'avg:', avgCost);
    
    return {
        type: 'problem_detail',
        make: make,
        model: model,
        year: year,
        problemCategory: problemCategory,
        problemType: problemType,
        url: window.location.href,
        site: 'carcomplaints.com',
        timestamp: new Date().toISOString(),
        
        nhtsaComplaintCount: nhtsaCount,
        complaints: complaints,
        
        topProblems: topProblems,
        
        statistics: {
            totalComplaints: complaints.length,
            complaintsWithMileage: validMileages.length,
            
            avgMileage: avgMileage,
            minMileage: minMileage,
            maxMileage: maxMileage,
            mileageRange: minMileage && maxMileage ? `${minMileage.toLocaleString()} - ${maxMileage.toLocaleString()} miles` : null,
            
            costsFound: costs.length,
            avgRepairCost: avgCost,
            minCost: costs.length > 0 ? Math.min(...costs) : null,
            maxCost: costs.length > 0 ? Math.max(...costs) : null
        }
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

    // ── Drivetrain terms that need scoped matching ────────────────────────────
    // These appear in page navigation, filters, and sidebar content for OTHER
    // vehicles. Only trust them if found in the listing's own features section.
    const drivetrainFeatures = ['all-wheel drive', 'awd', '4wd'];

    // ── Try to find the features/options container for this site ──────────────
    const site = detectSite();
    let featuresContainer = null;

    if (site === 'cars.com') {
        featuresContainer = document.querySelector('.features-section') ||
                           document.querySelector('[data-qa="features"]') ||
                           document.querySelector('.vehicle-features');
    } else if (site === 'autotrader') {
        featuresContainer = document.querySelector('[data-cmp="features"]') ||
                           document.querySelector('.features-list') ||
                           document.querySelector('[class*="features"]');
    } else if (site === 'cargurus') {
        featuresContainer = document.querySelector('[class*="features"]') ||
                           document.querySelector('[class*="options"]') ||
                           document.querySelector('[data-cg-ft="features"]');
    } else if (site === 'carsoup') {
        featuresContainer = document.querySelector('.features') ||
                           document.querySelector('.vehicle-features') ||
                           document.querySelector('.options-list');
    }

    const fullPageText = document.body.textContent.toLowerCase();
    const scopedText = featuresContainer
        ? featuresContainer.textContent.toLowerCase()
        : null;

    desiredFeatures.forEach(feature => {
        const featureLower = feature.toLowerCase();
        const isDrivetrain = drivetrainFeatures.includes(featureLower);

        let found = false;

        if (isDrivetrain) {
            // For drivetrain: only match if we have a scoped container
            // AND the feature appears there. If no container found, skip it
            // entirely rather than risk a false positive from the full page.
            if (scopedText && scopedText.includes(featureLower)) {
                found = true;
            }
        } else {
            // For all other features: full page search is safe
            if (fullPageText.includes(featureLower)) {
                found = true;
            }
        }

        if (found) {
            const displayFeature = feature.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            features.push(displayFeature);
        }
    });

    // Deduplicate (e.g. "awd" and "all-wheel drive" both matching)
    const uniqueFeatures = [...new Set(features)];
    return uniqueFeatures.sort();
}

function cleanUrl(url) {
    if (!url) return url;
    try {
        const u = new URL(url);
        // Keep only the path, strip all query parameters and fragments
        return `${u.protocol}//${u.hostname}${u.pathname}`;
    } catch (e) {
        return url; // If parsing fails, return original
    }
}

function detectTitleStatus() {
    const pageText = document.body.textContent.toLowerCase();
    
    const descriptionElement = document.querySelector('.text-description-wrp');
    const descriptionText = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
    
    const notSalvageKeywords = [
        'not salvage',
        'no salvage',
        'clean title',
        'clear title',
        'non-salvage',
        'never salvage',
        'not a salvage'
    ];
    
    for (let keyword of notSalvageKeywords) {
        if (descriptionText.includes(keyword) || pageText.includes(keyword)) {
            console.log('✅ NOT SALVAGE - found keyword:', keyword);
            return 'clean';
        }
    }
    
    const salvagePatterns = [
        /salvage title/i,
        /salvage vehicle/i,
        /rebuilt title/i,
        /branded title/i,
        /salvage certificate/i,
        /title:\s*salvage/i,
        /salvage\s+rebuilt/i,
        /total loss/i,
        /insurance write-off/i
    ];
    
    for (let pattern of salvagePatterns) {
        if (pattern.test(descriptionText)) {
            const match = descriptionText.match(pattern);
            console.log('⚠️ SALVAGE DETECTED in description:', match[0]);
            return 'salvage/rebuilt';
        }
    }
    
    for (let pattern of salvagePatterns) {
        if (pattern.test(pageText)) {
            const match = pageText.match(pattern);
            console.log('⚠️ SALVAGE DETECTED on page:', match[0]);
            return 'salvage/rebuilt';
        }
    }
    
    return 'unknown';
}

function validatePrice(text) {
    if (!text) return 'Not found';
    
    const priceMatch = text.match(/\$[\d,]+/);
    
    if (priceMatch) {
        return priceMatch[0];
    }
    
    if (!text.includes('$')) {
        return `${text} (verify - no $ found)`;
    }
    
    return text;
}

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

// =============================================================================
// SALVAGE DEALER TRACKING
// =============================================================================

function getKnownSalvageDealers(callback) {
    chrome.storage.local.get({knownSalvageDealers: []}, function(result) {
        callback(result.knownSalvageDealers);
    });
}

function addSalvageDealer(dealerName) {
    if (!dealerName || dealerName === 'Unknown') return;
    
    const normalizedName = dealerName.toLowerCase().trim();
    
    chrome.storage.local.get({knownSalvageDealers: []}, function(result) {
        const dealers = result.knownSalvageDealers;
        
        if (!dealers.includes(normalizedName)) {
            dealers.push(normalizedName);
            chrome.storage.local.set({knownSalvageDealers: dealers}, function() {
                console.log('🚨 Added to salvage dealer list:', dealerName);
            });
        }
    });
}

function isKnownSalvageDealer(dealerName) {
    if (!dealerName || dealerName === 'Unknown') return false;
    
    const normalizedName = dealerName.toLowerCase().trim();
    
    const majorSalvageDealers = [
        'copart',
        'iaai',
        'insurance auto auctions',
        'salvage direct',
        'salvage world',
        'north 61 auto sales'
    ];
    
    for (let salvageDealer of majorSalvageDealers) {
        if (normalizedName.includes(salvageDealer)) {
            return true;
        }
    }
    
    return false;
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
        case 'carcomplaints':
            return extractCarComplaintsData();
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


// =============================================================================
// AUTO-SEND COMPLAINT DATA FOR BACKGROUND FETCHING
// =============================================================================

// When on CarComplaints overview page, automatically extract and send data
// This is triggered by the background script when auto-fetching
if (window.location.href.includes('carcomplaints.com')) {
    // Check if this is an overview page (ends with /YEAR/ or /YEAR)
    const isOverview = window.location.pathname.match(/\/\d{4}\/?$/);
    
    if (isOverview) {
        console.log('CarComplaints overview page detected - will auto-extract');
        
        // Wait for page to fully load
        window.addEventListener('load', function() {
            setTimeout(() => {
                console.log('Auto-extracting complaint data...');
                const data = extractPageData();
                
                if (data && data.type === 'overview') {
                    console.log('Sending complaint data to background script');
                    
                    // Send to background script
                    chrome.runtime.sendMessage({
                        action: 'complaintDataExtracted',
                        data: data
                    }).catch(err => {
                        console.log('Error sending message (normal if popup opened this):', err);
                    });
                } else {
                    console.log('No overview data extracted');
                }
            }, 2000); // Wait 2 seconds for dynamic content
        });
    }
}