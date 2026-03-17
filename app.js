// QR Code Generator with Logo Overlay
// Made with 💡 by Agent-Lumi

let currentQR = null;
let uploadedLogo = null;
let logoSize = 'small'; // small, medium, large

// Logo size percentages (relative to QR code size)
const LOGO_SIZES = {
    small: 0.15,   // 15% of QR code
    medium: 0.25,  // 25% of QR code
    large: 0.35    // 35% of QR code
};

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
    
    try {
        // Create a temporary container for the QR code
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        
        // Generate QR code with HIGH error correction for logo overlay
        currentQR = new QRCode(tempContainer, {
            text: text,
            width: size,
            height: size,
            colorDark: fgColor,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel.H // High error correction for logo
        });
        
        // Wait for QR code to be generated
        setTimeout(() => {
            const qrCanvas = tempContainer.querySelector('canvas');
            if (qrCanvas) {
                // Create final canvas
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = size;
                finalCanvas.height = size;
                const ctx = finalCanvas.getContext('2d');
                
                // Draw QR code
                ctx.drawImage(qrCanvas, 0, 0);
                
                // Add logo if uploaded
                if (uploadedLogo) {
                    addLogoToCanvas(ctx, finalCanvas, size);
                }
                
                // Display the final QR code
                output.appendChild(finalCanvas);
                
                // Store reference for download
                currentQR = finalCanvas;
            }
            
            // Clean up temp container
            document.body.removeChild(tempContainer);
            
            // Show download button
            document.getElementById('downloadSection').style.display = 'block';
        }, 100);
        
    } catch (error) {
        console.error('Error generating QR:', error);
        output.innerHTML = '<p style="color: #ef4444;">Error generating QR code. Please try again.</p>';
    }
}

function addLogoToCanvas(ctx, canvas, qrSize) {
    const logoPercent = LOGO_SIZES[logoSize];
    const logoSizePx = Math.floor(qrSize * logoPercent);
    const logoX = (qrSize - logoSizePx) / 2;
    const logoY = (qrSize - logoSizePx) / 2;
    
    // Create a white background for the logo area (to ensure scannability)
    const padding = Math.floor(logoSizePx * 0.1);
    const bgSize = logoSizePx + (padding * 2);
    const bgX = logoX - padding;
    const bgY = logoY - padding;
    
    // Draw white background with rounded corners
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const cornerRadius = Math.floor(bgSize * 0.15);
    ctx.roundRect(bgX, bgY, bgSize, bgSize, cornerRadius);
    ctx.fill();
    ctx.restore();
    
    // Draw the logo
    ctx.drawImage(uploadedLogo, logoX, logoY, logoSizePx, logoSizePx);
}

function downloadQR() {
    if (!currentQR) {
        alert('Generate a QR code first!');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'qrcode-with-logo.png';
    link.href = currentQR.toDataURL('image/png');
    link.click();
}

// Logo upload handling
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Update file name display
    document.getElementById('logoFileName').textContent = file.name;
    
    // Read and display the image
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            uploadedLogo = img;
            
            // Show preview
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = '';
            preview.appendChild(img.cloneNode());
            
            // Show logo size controls
            document.getElementById('logoSizeControl').style.display = 'block';
            
            // Regenerate QR if one exists
            if (currentQR) {
                generateQR();
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Logo size button handling
function handleLogoSizeClick(event) {
    const btn = event.target;
    if (!btn.classList.contains('size-btn')) return;
    
    // Update active state
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update logo size
    logoSize = btn.dataset.size;
    
    // Regenerate QR if one exists
    if (currentQR) {
        generateQR();
    }
}

// Event listeners
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
    
    // Logo upload
    const logoInput = document.getElementById('logoInput');
    if (logoInput) {
        logoInput.addEventListener('change', handleLogoUpload);
    }
    
    // Logo size buttons
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', handleLogoSizeClick);
    });
    
    // Generate default QR on load
    generateQR();
});

console.log('%c💡 QR Code Generator with Logo Overlay', 'font-size: 20px; color: #6f42c1;');
console.log('%cMade by Agent-Lumi for @shalkith', 'font-size: 12px; color: #8b5cf6;');