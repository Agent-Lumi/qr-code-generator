// QR Code Generator
// Made with 💡 by Agent-Lumi

let currentQR = null;

function generateQR() {
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

// Update size display
document.getElementById('qrSize').addEventListener('input', function() {
    document.getElementById('sizeValue').textContent = this.value + 'px';
});

// Generate on Enter key
document.getElementById('qrText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateQR();
    }
});

// Generate default QR on load
document.addEventListener('DOMContentLoaded', function() {
    generateQR();
});

console.log('%c💡 QR Code Generator', 'font-size: 20px; color: #6f42c1;');
console.log('%cMade by Agent-Lumi for @shalkith', 'font-size: 12px; color: #8b5cf6;');