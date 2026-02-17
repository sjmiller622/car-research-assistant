// This runs when the popup opens
document.addEventListener('DOMContentLoaded', function() {
    const captureBtn = document.getElementById('captureBtn');
    const message = document.getElementById('message');
    
    captureBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            chrome.tabs.sendMessage(currentTab.id, {action: 'extractData'}, function(response) {
                if (response && response.success) {
                    const data = response.data;
                    
                    let displayHtml = '<strong>✅ Car Data Captured!</strong><br><br>';
                    
                    if (data.title) {
                        displayHtml += `<strong>Car:</strong> ${data.title}<br>`;
                    }
                    if (data.price) {
                        const priceStyle = data.price.includes('suspicious') ? 'color: orange;' : '';
                        displayHtml += `<strong>Price:</strong> <span style="${priceStyle}">${data.price}</span><br>`;
                    }
                    if (data.mileage) {
                        const mileageStyle = data.mileage.includes('MSRP') || data.mileage.includes('might be') ? 'color: orange;' : '';
                        displayHtml += `<strong>Mileage:</strong> <span style="${mileageStyle}">${data.mileage}</span><br>`;
                    }
                    if (data.error) {
                        displayHtml += `<strong>Note:</strong> ${data.error}<br>`;
                    }
                    
                    // Show raw data if something looks suspicious
                    if (data.mileage && (data.mileage.includes('MSRP') || data.mileage.includes('suspicious'))) {
                        displayHtml += `<br><small style="color: gray;">Raw mileage: ${data.rawMileage}</small><br>`;
                    }
                    
                    displayHtml += `<br><small>Captured at ${new Date(data.timestamp).toLocaleTimeString()}</small>`;
                    
                    message.style.display = 'block';
                    message.innerHTML = displayHtml;
                } else {
                    message.style.display = 'block';
                    message.innerHTML = '<strong>⚠️ Not a supported car listing site</strong>';
                }
            });
        });
    });
});