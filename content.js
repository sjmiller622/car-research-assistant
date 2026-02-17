// This script runs directly on web pages
console.log('Car Research Assistant is active on this page!');

// Function to extract basic page info
function extractPageInfo() {
    const pageInfo = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };
    
    console.log('Page info extracted:', pageInfo);
    return pageInfo;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'extractData') {
        const data = extractPageInfo();
        sendResponse({success: true, data: data});
    }
});

console.log('Content script loaded and ready!');