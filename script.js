class Base64Converter {
    constructor() {
        this.inputField = document.getElementById('input-field');
        this.outputField = document.getElementById('output-field');
        this.outputPreview = document.getElementById('output-preview');
        this.outputContainer = document.getElementById('output-container');
        this.copyBtn = document.getElementById('copy-btn');
        this.swapBtn = document.getElementById('swap-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.inputCount = document.getElementById('input-count');
        this.outputCount = document.getElementById('output-count');

        this.init();
    }

    init() {
        // Prevent autocomplete and history
        this.inputField.setAttribute('autocomplete', 'off');
        this.inputField.setAttribute('spellcheck', 'false');
        
        // Event listeners
        this.inputField.addEventListener('input', () => this.handleInput());
        this.outputField.addEventListener('input', () => this.handleOutput());
        this.copyBtn.addEventListener('click', () => this.copyOutput());
        this.swapBtn.addEventListener('click', () => this.swapFields());
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Prevent form submission and history saving
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
            }
        });
    }

    isBase64(str) {
        if (!str || typeof str !== 'string') return false;
        
        // Trim whitespace
        str = str.trim();
        
        // Base64 regex pattern
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        
        // Check if matches pattern and length is multiple of 4
        if (!base64Regex.test(str)) return false;
        if (str.length % 4 !== 0) return false;
        if (str.length === 0) return false;
        
        // Try to decode to verify it's valid
        try {
            const decoded = atob(str);
            // Check if decoded content is valid UTF-8
            return this.isValidUtf8(decoded);
        } catch (e) {
            return false;
        }
    }

    isValidUtf8(str) {
        try {
            // Check if the string contains only valid characters
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i);
                // Allow most characters, high unicode might be okay too
                if (code === 0) {
                    // Null character might be okay
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    encode(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return '';
        }
    }

    decode(str) {
        try {
            return decodeURIComponent(escape(atob(str.trim())));
        } catch (e) {
            return '';
        }
    }

    isHTML(str) {
        const htmlRegex = /^\s*<[^>]+>/;
        return htmlRegex.test(str.trim());
    }

    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    linkifyText(text) {
        // Create a temporary container with proper whitespace preservation
        const tempDiv = document.createElement('div');
        tempDiv.style.whiteSpace = 'pre-wrap';
        tempDiv.style.wordWrap = 'break-word';
        
        // URL regex pattern for splitting
        const urlRegexForSplit = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        // URL regex pattern for testing
        const urlRegexForTest = /^(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
        
        const parts = text.split(urlRegexForSplit);
        
        parts.forEach(part => {
            if (part && urlRegexForTest.test(part)) {
                const link = document.createElement('a');
                
                // Handle email
                if (part.includes('@') && !part.startsWith('http')) {
                    link.href = `mailto:${part}`;
                    link.textContent = part;
                } else {
                    // Handle URL
                    const url = part.startsWith('http') ? part : `https://${part}`;
                    link.href = url;
                    link.textContent = part;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
                
                tempDiv.appendChild(link);
            } else if (part) {
                tempDiv.appendChild(document.createTextNode(part));
            }
        });
        
        return tempDiv.innerHTML;
    }

    renderOutput(content, isHTML) {
        if (isHTML) {
            // Render as HTML preview
            this.outputPreview.innerHTML = content;
            this.outputField.classList.add('hidden');
            this.outputPreview.classList.remove('hidden');
        } else {
            // Check if content contains URLs
            const hasUrls = /(https?:\/\/|www\.|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(content);
            
            if (hasUrls) {
                // Render as linkified text
                this.outputPreview.innerHTML = this.linkifyText(content);
                this.outputField.classList.add('hidden');
                this.outputPreview.classList.remove('hidden');
            } else {
                // Show as plain text
                this.outputField.value = content;
                this.outputField.classList.remove('hidden');
                this.outputPreview.classList.add('hidden');
            }
        }
    }

    handleInput() {
        const input = this.inputField.value;
        this.inputCount.textContent = input.length;

        if (!input) {
            this.outputField.value = '';
            this.outputPreview.innerHTML = '';
            this.outputCount.textContent = '0';
            this.modeIndicator.textContent = '';
            this.copyBtn.disabled = true;
            this.swapBtn.disabled = true;
            return;
        }

        let output = '';
        let mode = '';

        if (this.isBase64(input)) {
            // Input is base64, decode it
            output = this.decode(input);
            mode = 'Decoding from Base64';
        } else {
            // Input is text, encode it
            output = this.encode(input);
            mode = 'Encoding to Base64';
        }

        this.outputCount.textContent = output.length;
        this.modeIndicator.textContent = mode;

        // Render output
        if (this.isBase64(input)) {
            // We're decoding, so check if output is HTML
            const isHTML = this.isHTML(output);
            this.renderOutput(output, isHTML);
        } else {
            // We're encoding, so just show as text
            this.outputField.value = output;
            this.outputField.classList.remove('hidden');
            this.outputPreview.classList.add('hidden');
        }

        this.copyBtn.disabled = !output;
        this.swapBtn.disabled = !output;
    }

    handleOutput() {
        const output = this.outputField.value;
        this.outputCount.textContent = output.length;

        if (!output) {
            this.inputField.value = '';
            this.inputCount.textContent = '0';
            this.modeIndicator.textContent = '';
            this.copyBtn.disabled = true;
            this.swapBtn.disabled = true;
            return;
        }

        let input = '';
        let mode = '';

        if (this.isBase64(output)) {
            // Output is base64, decode it to show in input
            input = this.decode(output);
            mode = 'Decoding from Base64';
        } else {
            // Output is text, encode it
            input = this.encode(output);
            mode = 'Encoding to Base64';
        }

        this.inputField.value = input;
        this.inputCount.textContent = input.length;
        this.modeIndicator.textContent = mode;

        this.copyBtn.disabled = !output;
        this.swapBtn.disabled = !output;
    }

    copyOutput() {
        const text = this.outputField.value || this.outputPreview.textContent;
        
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    swapFields() {
        const inputValue = this.inputField.value;
        // Get output value from either textarea or preview
        const outputValue = this.outputField.value || this.outputPreview.textContent;

        this.inputField.value = outputValue;
        this.inputCount.textContent = outputValue.length;

        this.outputField.value = '';
        this.outputPreview.innerHTML = '';
        this.outputCount.textContent = '0';

        this.outputField.classList.remove('hidden');
        this.outputPreview.classList.add('hidden');

        // Re-trigger conversion
        this.handleInput();
    }

    clearAll() {
        this.inputField.value = '';
        this.outputField.value = '';
        this.outputPreview.innerHTML = '';
        this.inputCount.textContent = '0';
        this.outputCount.textContent = '0';
        this.modeIndicator.textContent = '';
        this.copyBtn.disabled = true;
        this.swapBtn.disabled = true;
        this.inputField.focus();
    }
}

// Initialize the converter when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Base64Converter();
});
