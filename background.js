importScripts('utils.js');

// Background service worker for automated complaint fetching
console.log('Background service worker loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchComplaints') {
        console.log('Received fetchComplaints request for:', request.car.title);
        
        fetchComplaintsForCar(request.car)
            .then(complaintData => {
                console.log('Successfully fetched complaint data');
                sendResponse({success: true, data: complaintData});
            })
            .catch(error => {
                console.error('Error fetching complaints:', error);
                sendResponse({success: false, error: error.message});
            });
        
        return true; // Keep channel open for async response
    }
});

async function fetchComplaintsForCar(car) {
    console.log('Starting complaint fetch for:', car.title);
    
    // Extract make/model/year from car title
    const { urlPath, model, year } = parseCarTitle(car.title);   
    
    if (!urlPath || !model || !year) {
        throw new Error(`Could not parse make/model/year from: ${car.title}`);
    }
    
    // Construct CarComplaints URL
    const overviewUrl = getCarComplaintsUrl(urlPath, model, year);
    
    console.log('Opening CarComplaints URL:', overviewUrl);
    
    // Create a new tab in background
    const tab = await chrome.tabs.create({
        url: overviewUrl,
        active: false // Open in background
    });
    
    console.log('Created tab:', tab.id);
    
    // Wait for page to load and content script to extract data
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.log('Timeout - closing tab');
            chrome.tabs.remove(tab.id);
            reject(new Error('Timeout waiting for complaint data (15s)'));
        }, 15000); // 15 second timeout
        
        // Listen for message from content script with extracted data
        const messageListener = (message, sender) => {
            if (sender.tab && sender.tab.id === tab.id && message.action === 'complaintDataExtracted') {
                console.log('Received complaint data from content script');
                clearTimeout(timeout);
                chrome.runtime.onMessage.removeListener(messageListener);
                
                // Close the tab
                chrome.tabs.remove(tab.id);
                
                resolve(message.data);
            }
        };
        
        chrome.runtime.onMessage.addListener(messageListener);
        
        // Wait for tab to finish loading
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                console.log('Tab loaded, triggering extraction');
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Give content script a moment to initialize
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {action: 'extractData'})
                        .catch(err => {
                            console.error('Error sending message to content script:', err);
                            clearTimeout(timeout);
                            chrome.tabs.remove(tab.id);
                            reject(err);
                        });
                }, 1000);
            }
        });
    });
}
