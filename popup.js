// This runs when the popup opens
document.addEventListener('DOMContentLoaded', function () {
    const captureBtn = document.getElementById('captureBtn');
    const message = document.getElementById('message');

    // When the button is clicked
    captureBtn.addEventListener('click', function () {
        // Show the message
        message.style.display = 'block';
        message.textContent = 'Button clicked! Extension is working! 🎉';
    });
});