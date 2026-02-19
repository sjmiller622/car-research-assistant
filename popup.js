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
            
            const duplicate = cars.find(car => {
                if (car.vin && carData.vin && car.vin === carData.vin) {
                    return true;
                }
                if (car.url === carData.url) {
                    return true;
                }
                return false;
            });
            
            if (duplicate) {
                message.style.display = 'block';
                message.innerHTML = `
                    <strong>⚠️ Already Saved!</strong><br><br>
                    This car was already captured on ${new Date(duplicate.timestamp).toLocaleDateString()} 
                    at ${new Date(duplicate.timestamp).toLocaleTimeString()}.<br><br>
                    <small>Not adding duplicate entry.</small>
                `;
            } else {
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
        if (data.site) {
            displayHtml += `<strong>Source:</strong> ${data.site}<br>`;
        }
        if (data.vin) {
            displayHtml += `<strong>VIN:</strong> ${data.vin}<br>`;
        }
        if (data.price) {
            displayHtml += `<strong>Price:</strong> ${data.price}<br>`;
        }
        if (data.mileage) {
            const mileageStyle = data.mileage.includes('New car') ? 'color: orange;' : '';
            displayHtml += `<strong>Mileage:</strong> <span style="${mileageStyle}">${data.mileage}</span><br>`;
        }
        if (data.titleStatus && data.titleStatus !== 'clean' && data.titleStatus !== 'unknown') {
            displayHtml += `<strong style="color: red;">⚠️ Title Status:</strong> ${data.titleStatus.toUpperCase()}<br>`;
        }
        if (data.dealer && data.dealer !== 'Unknown') {
            displayHtml += `<strong>Dealer:</strong> ${data.dealer}`;
            if (data.knownSalvageDealer) {
                displayHtml += ` <span style="color: red; font-weight: bold;">⚠️ KNOWN SALVAGE DEALER</span>`;
            }
            displayHtml += '<br>';
        }
        if (data.features && data.features.length > 0) {
            displayHtml += `<strong>Features found:</strong> ${data.features.length}<br>`;
        }
        
        displayHtml += `<br><small>Saved at ${new Date(data.timestamp).toLocaleTimeString()}</small>`;
        
        message.style.display = 'block';
        message.innerHTML = displayHtml;
    }
    
    // Delete individual car
    function deleteCar(index) {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            const deletedCar = cars[index];
            
            if (confirm(`Delete ${deletedCar.title || 'this car'}?`)) {
                cars.splice(index, 1);
                chrome.storage.local.set({savedCars: cars}, function() {
                    loadSavedCars();
                    message.style.display = 'block';
                    message.innerHTML = '<strong>🗑️ Car deleted!</strong>';
                });
            }
        });
    }
    
    // Override title status for a car
    function overrideTitleStatus(index, newStatus) {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            
            if (cars[index]) {
                const oldStatus = cars[index].titleStatus;
                cars[index].titleStatus = newStatus;
                cars[index].manualOverride = true;
                
                chrome.storage.local.set({savedCars: cars}, function() {
                    loadSavedCars();
                    message.style.display = 'block';
                    message.innerHTML = `<strong>✏️ Title status updated!</strong><br>Changed from "${oldStatus}" to "${newStatus}"`;
                });
            }
        });
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
                savedCarsDiv.innerHTML = '<div class="empty-state">No cars saved yet.<br>Visit a car listing and click "Capture This Page"!</div>';
            } else {
                let html = '';
                cars.forEach(function(car, index) {
                    // Determine if salvage
                    const isSalvage = car.titleStatus && 
                                     car.titleStatus !== 'clean' && 
                                     car.titleStatus !== 'unknown';
                    
                    const salvageClass = isSalvage ? 'salvage' : '';
                    
                    // Build salvage badge with override option
                    let salvageBadge = '';
                    if (isSalvage) {
                        salvageBadge = `<span class="warning-badge">SALVAGE${car.manualOverride ? ' (Manual)' : ''}</span>
                            <button class="override-btn" data-index="${index}" data-action="clean" title="Mark as clean title">Mark Clean</button>`;
                    } else if (car.titleStatus === 'clean' && car.manualOverride) {
                        salvageBadge = `<span style="color: green; font-size: 11px; font-weight: bold;">✓ CLEAN (Manual)</span>
                            <button class="override-btn" data-index="${index}" data-action="salvage" title="Mark as salvage">Mark Salvage</button>`;
                    }
                    
                    // Build dealer info with salvage warning
                    let dealerHtml = '';
                    if (car.dealer && car.dealer !== 'Unknown') {
                        dealerHtml = `<strong>Dealer:</strong> ${car.dealer}`;
                        if (car.knownSalvageDealer) {
                            dealerHtml += ` <span class="warning-badge">SALVAGE DEALER</span>`;
                        }
                        dealerHtml += '<br>';
                    }
                    
                    // Build features tags
                    let featuresHtml = '';
                    if (car.features && car.features.length > 0) {
                        featuresHtml = '<div class="feature-tags">';
                        car.features.forEach(feature => {
                            featuresHtml += `<span class="feature-tag">${feature}</span>`;
                        });
                        featuresHtml += '</div>';
                    }
                    
                    // Build source badge
                    let sourceBadge = '';
                    if (car.site) {
                        sourceBadge = `<a href="${car.url}" target="_blank" class="source-badge" title="View original listing">${car.site}</a>`;
                    }
                    
                    html += `
                        <div class="car-item ${salvageClass}">
                            <div class="car-item-header">
                                <div class="car-title">
                                    ${car.title || 'Unknown Car'}
                                    ${sourceBadge}
                                    ${salvageBadge}
                                </div>
                                <button class="delete-btn" data-index="${index}" title="Delete this car">×</button>
                            </div>
                            <div class="car-details">
                                ${car.vin ? `<strong>VIN:</strong> ${car.vin}<br>` : ''}
                                <strong>Price:</strong> ${car.price || 'N/A'}<br>
                                <strong>Mileage:</strong> ${car.mileage || 'N/A'}<br>
                                ${dealerHtml}
                                ${featuresHtml}
                                <div class="timestamp">Saved: ${new Date(car.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                    `;
                });
                savedCarsDiv.innerHTML = html;
                
                // Add click handlers to all delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        deleteCar(index);
                    });
                });
                
                // Add click handlers to all override buttons
                document.querySelectorAll('.override-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        const action = this.getAttribute('data-action');
                        
                        if (action === 'clean') {
                            overrideTitleStatus(index, 'clean');
                        } else if (action === 'salvage') {
                            overrideTitleStatus(index, 'salvage/rebuilt');
                        }
                    });
                });
            }
        });
    }
});