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

// Theme Management
const ThemeManager = {
    STORAGE_KEY: 'qr-theme-preference',
    
    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        this.applyTheme(savedTheme);
        this.setupToggle();
        this.updateIcon(savedTheme);
    },
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = theme === 'light' ? 'light-theme' : '';
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem(this.STORAGE_KEY, newTheme);
        this.updateIcon(newTheme);
    },
    
    updateIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    },
    
    setupToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }
};

// Offline Indicator
const OfflineManager = {
    init() {
        const indicator = document.getElementById('offlineIndicator');
        
        const updateStatus = () => {
            if (indicator) {
                indicator.style.display = navigator.onLine ? 'none' : 'block';
            }
        };
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }
};

// Keyboard Shortcuts
const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        generateQR();
                        break;
                    case 's':
                        e.preventDefault();
                        if (currentQR) downloadQR();
                        break;
                    case 't':
                        e.preventDefault();
                        ThemeManager.toggle();
                        break;
                }
            }
        });
    }
};

function generateQR() {
    const text = document.getElementById('qrText').value;
    const fgColor = document.getElementById('fgColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const size = parseInt(document.getElementById('qrSize').value);
    
    if (!text) {
        showNotification('Please enter some text or URL', 'error');
        return;
    }
    
    // Clear previous QR
    const output = document.getElementById('qrOutput');
    output.innerHTML = '';
    
    // Show loading state
    output.innerHTML = '<div class="loading">⏳ Generating...</div>';
    
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
                output.innerHTML = '';
                output.appendChild(finalCanvas);
                
                // Store reference for download
                currentQR = finalCanvas;
                
                // Show success notification
                showNotification('QR Code generated successfully!', 'success');
            }
            
            // Clean up temp container
            document.body.removeChild(tempContainer);
            
            // Show download section
            const downloadSection = document.getElementById('downloadSection');
            if (downloadSection) {
                downloadSection.style.display = 'flex';
            }
        }, 100);
        
    } catch (error) {
        console.error('Error generating QR:', error);
        output.innerHTML = '<p class="error">Error generating QR code. Please try again.</p>';
        showNotification('Failed to generate QR code', 'error');
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
        showNotification('Generate a QR code first!', 'error');
        return;
    }
    
    const text = document.getElementById('qrText').value;
    const filename = 'qrcode-' + text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-') + '.png';
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = currentQR.toDataURL('image/png');
    link.click();
    
    showNotification('QR Code downloaded!', 'success');
}

// Share functionality
async function shareQR() {
    if (!currentQR) {
        showNotification('Generate a QR code first!', 'error');
        return;
    }
    
    try {
        const blob = await new Promise(resolve => {
            currentQR.toBlob(resolve, 'image/png');
        });
        
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'QR Code',
                text: 'Generated with QR Code Generator by Agent-Lumi',
                files: [file]
            });
            showNotification('QR Code shared!', 'success');
        } else {
            // Fallback: copy data URL to clipboard
            const dataUrl = currentQR.toDataURL('image/png');
            await navigator.clipboard.writeText(dataUrl);
            showNotification('QR Code data URL copied to clipboard!', 'success');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            showNotification('Failed to share QR code', 'error');
        }
    }
}

// Logo upload handling
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Logo image must be under 2MB', 'error');
        return;
    }
    
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

// Notification system
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    ThemeManager.init();
    OfflineManager.init();
    KeyboardShortcuts.init();
    
    // Update size display
    const sizeSlider = document.getElementById('qrSize');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', function() {
            document.getElementById('sizeValue').textContent = this.value + 'px';
        });
    }
    
    // Generate on Enter key (also in input)
    const textInput = document.getElementById('qrText');
    if (textInput) {
        textInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateQR();
            }
        });
        textInput.focus();
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
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
    
    // Generate default QR on load
    setTimeout(generateQR, 100);
});

console.log('%c💡 QR Code Generator with Logo Overlay', 'font-size: 20px; color: #6f42c1;');
console.log('%cMade by Agent-Lumi for @shalkith', 'font-size: 12px; color: #8b5cf6;');
console.log('%cKeyboard shortcuts: Ctrl+Enter = Generate, Ctrl+S = Download, Ctrl+T = Toggle Theme', 'font-size: 11px; color: #888;');
