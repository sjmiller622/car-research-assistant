document.addEventListener('DOMContentLoaded', function() {
    const captureBtn = document.getElementById('captureBtn');
    const clearBtn = document.getElementById('clearBtn');
    const message = document.getElementById('message');
    const savedCarsDiv = document.getElementById('savedCars');
    const carCountSpan = document.getElementById('carCount');
    
    // Load and display saved cars when popup opens
    loadSavedCars();
    
    // Capture button click
    captureBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            chrome.tabs.sendMessage(currentTab.id, {action: 'extractData'}, function(response) {
                if (response && response.success) {
                    const data = response.data;
                    
                    // Save the car data
                    saveCarData(data);
                    
                    // Display success message
                    let displayHtml = '<strong>✅ Car Saved!</strong><br><br>';
                    
                    if (data.title) {
                        displayHtml += `<strong>Car:</strong> ${data.title}<br>`;
                    }
                    if (data.price) {
                        displayHtml += `<strong>Price:</strong> ${data.price}<br>`;
                    }
                    if (data.mileage) {
                        const mileageStyle = data.mileage.includes('New car') ? 'color: orange;' : '';
                        displayHtml += `<strong>Mileage:</strong> <span style="${mileageStyle}">${data.mileage}</span><br>`;
                    }
                    
                    displayHtml += `<br><small>Saved at ${new Date(data.timestamp).toLocaleTimeString()}</small>`;
                    
                    message.style.display = 'block';
                    message.innerHTML = displayHtml;
                    
                    // Reload the saved cars list
                    loadSavedCars();
                } else {
                    message.style.display = 'block';
                    message.innerHTML = '<strong>⚠️ Not a supported car listing site</strong>';
                }
            });
        });
    });
    
    // Clear all button click
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all saved cars?')) {
            chrome.storage.local.set({savedCars: []}, function() {
                loadSavedCars();
                message.style.display = 'block';
                message.innerHTML = '<strong>🗑️ All cars cleared!</strong>';
            });
        }
    });
    
    // Save car data to Chrome storage
    function saveCarData(carData) {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            
            // Add the new car to the beginning of the array
            cars.unshift(carData);
            
            // Save back to storage
            chrome.storage.local.set({savedCars: cars});
        });
    }
    
    // Load and display saved cars
    function loadSavedCars() {
        chrome.storage.local.get({savedCars: []}, function(result) {
            const cars = result.savedCars;
            
            // Update count
            carCountSpan.textContent = `(${cars.length})`;
            
            // Show/hide clear button
            if (cars.length > 0) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
            
            // Display cars
            if (cars.length === 0) {
                savedCarsDiv.innerHTML = '<div class="empty-state">No cars saved yet. Visit a car listing and click "Capture This Page"!</div>';
            } else {
                let html = '';
                cars.forEach(function(car, index) {
                    html += `
                        <div class="car-item">
                            <div class="car-title">${car.title || 'Unknown Car'}</div>
                            <strong>Price:</strong> ${car.price || 'N/A'}<br>
                            <strong>Mileage:</strong> ${car.mileage || 'N/A'}<br>
                            <small style="color: #666;">Saved: ${new Date(car.timestamp).toLocaleString()}</small>
                        </div>
                    `;
                });
                savedCarsDiv.innerHTML = html;
            }
        });
    }
});