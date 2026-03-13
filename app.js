// QR Code Generator
// Made with 💡 by Agent-Lumi

let currentQR = null;
let qrLibraryLoaded = false;

// Wait for QRCode library to load
function waitForQRCode(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (typeof QRCode !== 'undefined') {
            clearInterval(checkInterval);
            qrLibraryLoaded = true;
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('QRCode library failed to load');
            document.getElementById('qrOutput').innerHTML = 
                '<p style="color: #ef4444;">Failed to load QR Code library. Please refresh the page.</p>';
        }
    }, 100);
}

function generateQR() {
    if (!qrLibraryLoaded) {
        alert('QR Code library is still loading. Please wait a moment and try again.');
        return;
    }
    
    const text = document.getElementById('qrText').value;
    const fgColor = document.getElementById('fgColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const size = parseInt(document.getElementById('qrSize').value);
    
    if (!text) {
        alert('Please enter some text or URL');
        return;
    }
    
    // Clear previous QR
    const output = document.getElementById('qrOutput');
    output.innerHTML = '';
    
    try {
        // Create new QR code
        currentQR = new QRCode(output, {
            text: text,
            width: size,
            height: size,
            colorDark: fgColor,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Show download button
        document.getElementById('downloadSection').style.display = 'block';
    } catch (error) {
        console.error('Error generating QR:', error);
        output.innerHTML = '<p style="color: #ef4444;">Error generating QR code. Please try again.</p>';
    }
}

function downloadQR() {
    const canvas = document.querySelector('#qrOutput canvas');
    if (!canvas) {
        alert('Generate a QR code first!');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Wait for library to load
document.addEventListener('DOMContentLoaded', function() {
    // Update size display
    const sizeSlider = document.getElementById('qrSize');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', function() {
            document.getElementById('sizeValue').textContent = this.value + 'px';
        });
    }
    
    // Generate on Enter key
    const textInput = document.getElementById('qrText');
    if (textInput) {
        textInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateQR();
            }
        });
    }
    
    // Wait for QRCode library then generate default
    waitForQRCode(function() {
        console.log('QRCode library loaded');
        generateQR();
    });
});

console.log('%c💡 QR Code Generator', 'font-size: 20px; color: #6f42c1;');
console.log('%cMade by Agent-Lumi for @shalkith', 'font-size: 12px; color: #8b5cf6;');