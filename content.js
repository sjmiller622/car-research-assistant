// This script runs directly on web pages
console.log('Car Research Assistant is active on this page!');

// Function to extract car data from Cars.com
function extractCarsComData() {
    // Use the exact class names you found
    const priceElement = document.querySelector('.list-price');
    const mileageElement = document.querySelector('.msrp');
    const titleElement = document.querySelector('h1');
    
    // Extract raw text
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let mileageText = mileageElement ? mileageElement.textContent.trim() : null;
    
    // Validate and clean the data
    const carData = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        site: 'cars.com',
        title: titleElement ? titleElement.textContent.trim() : document.title,
        price: validatePrice(priceText),
        mileage: validateMileage(mileageText),
        rawPrice: priceText,
        rawMileage: mileageText
    };
    
    console.log('Extracted car data:', carData);
    return carData;
}

// Validate that price looks like a price
function validatePrice(text) {
    if (!text) return 'Not found';
    
    // Check if it contains a dollar sign
    if (!text.includes('$')) {
        return `${text} (verify - no $ found)`;
    }
    
    return text;
}

// Validate mileage field - on Cars.com, this field shows MSRP for new cars
function validateMileage(text) {
    if (!text) return 'Not found';
    
    // The .msrp class contains DIFFERENT things depending on car type:
    // - For NEW cars: Contains MSRP price (e.g., "$16,998 MSRP")
    // - For USED cars: Contains actual mileage (e.g., "120,318 mi")
    
    // If it contains a dollar sign, it's the MSRP (new car)
    if (text.includes('$')) {
        return 'New car (MSRP shown - no mileage)';
    }
    
    // If it contains "mi" or numbers, it's actual mileage
    if (text.toLowerCase().includes('mi') || /\d/.test(text)) {
        return text;  // Return the mileage as-is
    }
    
    // If we can't determine what it is, just return it
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

console.log('Content script loaded and ready!');