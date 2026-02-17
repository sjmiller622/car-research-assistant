document.addEventListener('DOMContentLoaded', function() {
    const captureBtn = document.getElementById('captureBtn');
    const clearBtn = document.getElementById('clearBtn');
    const message = document.getElementById('message');
    const savedCarsDiv = document.getElementById('savedCars');
    const carCountSpan = document.getElementById('carCount');
    
    loadSavedCars();
    
    captureBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            chrome.tabs.sendMessage(currentTab.id, {action: 'extractData'}, function(response) {
                if (response && response.success) {
                    const data = response.data;
                    
                    // Check for duplicates before saving
                    checkAndSaveCarData(data);
                } else {
                    message.style.display = 'block';
                    message.innerHTML = '<strong>⚠️ Not a supported car listing site</strong>';
                }
            });
        });
    });
    
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all saved cars?')) {
            chrome.storage.local.set({savedCars: []}, function() {
                loadSavedCars();
                message.style.display = 'block';
                message.innerHTML = '<strong>🗑️ All cars cleared!</strong>';
            });
        }
    });
    
    // Check for duplicates and save
    function checkAndSaveCarData(carData) {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            
            // Check for duplicate by VIN or URL
            const duplicate = cars.find(car => {
                // If both have VIN and they match, it's a duplicate
                if (car.vin && carData.vin && car.vin === carData.vin) {
                    return true;
                }
                // If no VIN, check URL
                if (car.url === carData.url) {
                    return true;
                }
                return false;
            });
            
            if (duplicate) {
                // Show duplicate warning
                message.style.display = 'block';
                message.innerHTML = `
                    <strong>⚠️ Already Saved!</strong><br><br>
                    This car was already captured on ${new Date(duplicate.timestamp).toLocaleDateString()} 
                    at ${new Date(duplicate.timestamp).toLocaleTimeString()}.<br><br>
                    <small>Not adding duplicate entry.</small>
                `;
            } else {
                // Add the new car
                cars.unshift(carData);
                chrome.storage.local.set({savedCars: cars}, function() {
                    displaySuccessMessage(carData);
                    loadSavedCars();
                });
            }
        });
    }
    
// Display success message
function displaySuccessMessage(data) {
    let displayHtml = '<strong>✅ Car Saved!</strong><br><br>';
    
    if (data.title) {
        displayHtml += `<strong>Car:</strong> ${data.title}<br>`;
    }
    if (data.vin) {
        displayHtml += `<strong>VIN:</strong> ${data.vin}<br>`;
    }
    if (data.stockNumber) {
        displayHtml += `<strong>Stock #:</strong> ${data.stockNumber}<br>`;
    }
    if (data.price) {
        displayHtml += `<strong>Price:</strong> ${data.price}<br>`;
    }
    if (data.mileage) {
        const mileageStyle = data.mileage.includes('New car') ? 'color: orange;' : '';
        displayHtml += `<strong>Mileage:</strong> <span style="${mileageStyle}">${data.mileage}</span><br>`;
    }
    if (data.dealer && data.dealer !== 'Unknown') {
        displayHtml += `<strong>Dealer:</strong> ${data.dealer}<br>`;
    }
    if (data.features && data.features.length > 0) {
        displayHtml += `<strong>Features found:</strong> ${data.features.length}<br>`;
    }
    
    displayHtml += `<br><small>Saved at ${new Date(data.timestamp).toLocaleTimeString()}</small>`;
    
    message.style.display = 'block';
    message.innerHTML = displayHtml;
}

    // Load and display saved cars
    function loadSavedCars() {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            
            carCountSpan.textContent = `(${cars.length})`;
            
            if (cars.length > 0) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
            
            if (cars.length === 0) {
                savedCarsDiv.innerHTML = '<div class="empty-state">No cars saved yet. Visit a car listing and click "Capture This Page"!</div>';
            } else {
                let html = '';
                cars.forEach(function(car, index) {
                    let featuresHtml = '';
                    if (car.features && car.features.length > 0) {
                        featuresHtml = `<strong>Features:</strong> ${car.features.join(', ')}<br>`;
                    }
                    
                    let dealerHtml = '';
                    if (car.dealer && car.dealer !== 'Unknown') {
                        dealerHtml = `<strong>Dealer:</strong> ${car.dealer}<br>`;
                    }
                    
                    html += `
                    <div class="car-item">
                        <div class="car-title">${car.title || 'Unknown Car'}</div>
                        ${car.vin ? `<strong>VIN:</strong> ${car.vin}<br>` : ''}
                        ${car.stockNumber ? `<strong>Stock #:</strong> ${car.stockNumber}<br>` : ''}
                        <strong>Price:</strong> ${car.price || 'N/A'}<br>
                        <strong>Mileage:</strong> ${car.mileage || 'N/A'}<br>
                        ${dealerHtml}
                        ${featuresHtml}
                        <small style="color: #666;">Saved: ${new Date(car.timestamp).toLocaleString()}</small>
                    </div>                    `;
                });
                savedCarsDiv.innerHTML = html;
            }
        });
    }
});