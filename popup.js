// This runs when the popup opens
document.addEventListener('DOMContentLoaded', function() {
    const captureBtn = document.getElementById('captureBtn');
    const message = document.getElementById('message');
    
    captureBtn.addEventListener('click', function() {
        // Get the current active tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            // Send a message to the content script
            chrome.tabs.sendMessage(currentTab.id, {action: 'extractData'}, function(response) {
                if (response && response.success) {
                    const data = response.data;
                    
                    message.style.display = 'block';
                    message.innerHTML = `
                        <strong>✅ Data Extracted!</strong><br>
                        <strong>Title:</strong> ${data.title}<br>
                        <strong>URL:</strong> ${data.url}<br>
                        <strong>Time:</strong> ${new Date(data.timestamp).toLocaleTimeString()}
                    `;
                } else {
                    message.style.display = 'block';
                    message.innerHTML = `
                        <strong>⚠️ Note:</strong><br>
                        This page is not a supported car listing site.<br>
                        Try visiting cars.com, autotrader.com, or cargurus.com
                    `;
                }
            });
        });
    });
});