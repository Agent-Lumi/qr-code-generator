// QR Code Generator with Logo Overlay & Templates
// Made with 💡 by Agent-Lumi

let currentQR = null;
let uploadedLogo = null;
let logoSize = 'small'; // small, medium, large

// QR History Manager
const QRHistoryManager = {
    STORAGE_KEY: 'qr-code-history',
    MAX_HISTORY: 10,
    
    getHistory() {
        const history = localStorage.getItem(this.STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    },
    
    saveToHistory(qrData) {
        const history = this.getHistory();
        const newEntry = {
            ...qrData,
            timestamp: Date.now()
        };
        
        // Remove duplicate (by text content)
        const filtered = history.filter(h => h.text !== qrData.text);
        
        // Add to beginning
        filtered.unshift(newEntry);
        
        // Keep only MAX_HISTORY items
        const trimmed = filtered.slice(0, this.MAX_HISTORY);
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
        return trimmed;
    },
    
    deleteFromHistory(timestamp) {
        const history = this.getHistory();
        const filtered = history.filter(h => h.timestamp !== timestamp);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
    },
    
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
    }
};

// Template Manager
const TemplateManager = {
    currentTemplate: 'url',
    
    // Template definitions
    templates: {
        url: {
            name: 'URL',
            icon: '🔗',
            fields: [
                { name: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true }
            ],
            generate(data) {
                return data.url;
            }
        },
        wifi: {
            name: 'WiFi',
            icon: '📶',
            fields: [
                { name: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWiFi', required: true },
                { name: 'password', label: 'Password', type: 'password', placeholder: 'WiFi password', required: false },
                { name: 'security', label: 'Security Type', type: 'select', options: ['WPA', 'WEP', 'nopass'], required: true }
            ],
            generate(data) {
                const security = data.security || 'WPA';
                return `WIFI:T:${security};S:${data.ssid};P:${data.password || ''};;`;
            }
        },
        vcard: {
            name: 'vCard',
            icon: '👤',
            fields: [
                { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
                { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe', required: true },
                { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-123-4567', required: false },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: false },
                { name: 'org', label: 'Organization', type: 'text', placeholder: 'Company Name', required: false }
            ],
            generate(data) {
                return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.firstName} ${data.lastName}\nN:${data.lastName};${data.firstName};;;\n${data.phone ? `TEL:${data.phone}\n` : ''}${data.email ? `EMAIL:${data.email}\n` : ''}${data.org ? `ORG:${data.org}\n` : ''}END:VCARD`;
            }
        },
        email: {
            name: 'Email',
            icon: '📧',
            fields: [
                { name: 'to', label: 'To', type: 'email', placeholder: 'recipient@example.com', required: true },
                { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject', required: false },
                { name: 'body', label: 'Message', type: 'textarea', placeholder: 'Your message...', required: false }
            ],
            generate(data) {
                let mailto = `mailto:${data.to}`;
                const params = [];
                if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
                if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
                if (params.length > 0) {
                    mailto += '?' + params.join('&');
                }
                return mailto;
            }
        },
        sms: {
            name: 'SMS',
            icon: '💬',
            fields: [
                { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-123-4567', required: true },
                { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Your message...', required: false }
            ],
            generate(data) {
                let sms = `sms:${data.phone}`;
                if (data.message) {
                    sms += `?body=${encodeURIComponent(data.message)}`;
                }
                return sms;
            }
        },
        phone: {
            name: 'Phone',
            icon: '📞',
            fields: [
                { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-123-4567', required: true }
            ],
            generate(data) {
                return `tel:${data.phone}`;
            }
        }
    },
    
    init() {
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Template button clicks
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                this.selectTemplate(template);
            });
        });
        
        // Templates toggle
        const templatesToggle = document.getElementById('templatesToggle');
        const templatesSection = document.querySelector('.qr-templates');
        if (templatesToggle && templatesSection) {
            templatesToggle.addEventListener('click', () => {
                templatesSection.classList.toggle('hidden');
            });
        }
    },
    
    selectTemplate(templateKey) {
        this.currentTemplate = templateKey;
        const template = this.templates[templateKey];
        
        // Update active button
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.template === templateKey) {
                btn.classList.add('active');
            }
        });
        
        // Render configuration panel
        this.renderConfigPanel(template);
    },
    
    renderConfigPanel(template) {
        const panel = document.getElementById('templateConfigPanel');
        const title = document.getElementById('templateTitle');
        const fields = document.getElementById('templateFields');
        
        if (!panel || !title || !fields) return;
        
        title.textContent = `${template.icon} ${template.name} QR Code`;
        
        // Build form fields
        let html = '';
        template.fields.forEach(field => {
            const requiredAttr = field.required ? 'required' : '';
            const requiredLabel = field.required ? ' *' : '';
            
            if (field.type === 'select') {
                html += `
                    <div class="template-field">
                        <label for="field-${field.name}">${field.label}${requiredLabel}</label>
                        <select id="field-${field.name}" ${requiredAttr}>
                            ${field.options.map(opt => `<option value="${opt.toLowerCase()}">${opt}</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (field.type === 'textarea') {
                html += `
                    <div class="template-field">
                        <label for="field-${field.name}">${field.label}${requiredLabel}</label>
                        <textarea id="field-${field.name}" rows="3" placeholder="${field.placeholder || ''}" ${requiredAttr}></textarea>
                    </div>
                `;
            } else {
                html += `
                    <div class="template-field">
                        <label for="field-${field.name}">${field.label}${requiredLabel}</label>
                        <input type="${field.type}" id="field-${field.name}" placeholder="${field.placeholder || ''}" ${requiredAttr}>
                    </div>
                `;
            }
        });
        
        html += '<button type="button" class="template-apply" onclick="TemplateManager.applyTemplate()">Generate QR Code</button>';
        
        fields.innerHTML = html;
        panel.classList.remove('hidden');
    },
    
    applyTemplate() {
        const template = this.templates[this.currentTemplate];
        const data = {};
        
        // Collect field values
        let hasError = false;
        template.fields.forEach(field => {
            const input = document.getElementById(`field-${field.name}`);
            if (input) {
                data[field.name] = input.value.trim();
                if (field.required && !data[field.name]) {
                    input.style.borderColor = 'var(--error)';
                    hasError = true;
                } else {
                    input.style.borderColor = '';
                }
            }
        });
        
        if (hasError) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Generate QR code content
        const qrContent = template.generate(data);
        
        // Update main input
        document.getElementById('qrText').value = qrContent;
        
        // Generate QR
        generateQR();
        
        // Close panel
        document.getElementById('templateConfigPanel').classList.add('hidden');
        
        showNotification(`${template.name} QR code generated!`, 'success');
    }
};

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
                    case 'h':
                        e.preventDefault();
                        document.getElementById('historyPanel')?.classList.toggle('hidden');
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
                
                // Save to history
                const qrData = {
                    text: text,
                    dataUrl: finalCanvas.toDataURL('image/png'),
                    fgColor: fgColor,
                    bgColor: bgColor,
                    size: size
                };
                QRHistoryManager.saveToHistory(qrData);
                renderQRHistory();
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

// Render QR History panel
function renderQRHistory() {
    const history = QRHistoryManager.getHistory();
    const container = document.getElementById('qrHistory');
    const panel = document.getElementById('historyPanel');
    
    if (!container) return;
    
    if (history.length === 0) {
        container.innerHTML = '<p class="history-empty">No saved QR codes yet. Generate one to save it here!</p>';
        panel?.classList.add('hidden');
        return;
    }
    
    panel?.classList.remove('hidden');
    
    const items = history.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const shortText = item.text.substring(0, 30) + (item.text.length > 30 ? '...' : '');
        
        return `
            <div class="history-item" data-timestamp="${item.timestamp}">
                <img src="${item.dataUrl}" alt="QR" class="history-thumb">
                <div class="history-info">
                    <p class="history-text" title="${item.text.replace(/"/g, '&quot;')}">${shortText}</p>
                    <span class="history-date">${dateStr} ${timeStr}</span>
                </div>
                <div class="history-actions">
                    <button class="history-load" title="Load this QR code">↩️</button>
                    <button class="history-delete" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = items;
    
    // Add event listeners
    container.querySelectorAll('.history-item').forEach(item => {
        const timestamp = parseInt(item.dataset.timestamp);
        
        item.querySelector('.history-load').addEventListener('click', () => {
            const entry = history.find(h => h.timestamp === timestamp);
            if (entry) {
                loadQRFromHistory(entry);
            }
        });
        
        item.querySelector('.history-delete').addEventListener('click', () => {
            QRHistoryManager.deleteFromHistory(timestamp);
            renderQRHistory();
            showNotification('Removed from history', 'info');
        });
    });
}

// Load QR code from history
function loadQRFromHistory(entry) {
    document.getElementById('qrText').value = entry.text;
    document.getElementById('fgColor').value = entry.fgColor || '#6f42c1';
    document.getElementById('bgColor').value = entry.bgColor || '#ffffff';
    document.getElementById('qrSize').value = entry.size || 256;
    document.getElementById('sizeValue').textContent = (entry.size || 256) + 'px';
    
    // Clear logo
    uploadedLogo = null;
    document.getElementById('logoPreview').innerHTML = '';
    document.getElementById('logoFileName').textContent = 'No file selected';
    document.getElementById('logoSizeControl').style.display = 'none';
    
    generateQR();
    showNotification('Loaded from history', 'success');
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

// Close template config panel
function closeTemplateConfig() {
    const panel = document.getElementById('templateConfigPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
    
    // Deselect active template button
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    ThemeManager.init();
    OfflineManager.init();
    KeyboardShortcuts.init();
    TemplateManager.init();
    
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
    
    // History toggle button
    const historyToggle = document.getElementById('historyToggle');
    const historyPanel = document.getElementById('historyPanel');
    if (historyToggle && historyPanel) {
        historyToggle.addEventListener('click', () => {
            historyPanel.classList.toggle('hidden');
        });
    }
    
    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Clear all QR code history?')) {
                QRHistoryManager.clearHistory();
                renderQRHistory();
                showNotification('History cleared', 'info');
            }
        });
    }
    
    // Render any existing history
    renderQRHistory();
    
    // Generate default QR on load
    setTimeout(generateQR, 100);
});

console.log('%c💡 QR Code Generator with Logo Overlay & Templates', 'font-size: 20px; color: #6f42c1;');
console.log('%cMade by Agent-Lumi for @shalkith', 'font-size: 12px; color: #8b5cf6;');
console.log('%cKeyboard shortcuts: Ctrl+Enter = Generate, Ctrl+S = Download, Ctrl+T = Toggle Theme, Ctrl+H = Toggle History', 'font-size: 11px; color: #888;');
