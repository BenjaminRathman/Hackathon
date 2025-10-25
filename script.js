/**
 * Drawing Whiteboard with AI Analysis
 * Main application logic
 */

class DrawingWhiteboard {
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentStrokeWidth = 3;
        this.history = [];
        this.historyIndex = -1;
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.apiKey = localStorage.getItem('openai-api-key');
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupToolbar();
    }
    
    /**
     * Initialize canvas with proper sizing and settings
     */
    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set initial canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentStrokeWidth;
        
        // Save initial empty state
        this.saveState();
    }
    
    /**
     * Resize canvas to fill available space
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Redraw from history if we have content
        if (this.history.length > 0) {
            this.redrawFromHistory();
        }
    }
    
    /**
     * Setup all event listeners for drawing and interaction
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Selection events
        this.canvas.addEventListener('mousedown', (e) => this.handleSelectionStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleSelectionMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleSelectionEnd(e));
    }
    
    /**
     * Setup toolbar controls and their event listeners
     */
    setupToolbar() {
        // Tool selection
        document.getElementById('pen-tool').addEventListener('click', () => this.setTool('pen'));
        document.getElementById('eraser-tool').addEventListener('click', () => this.setTool('eraser'));
        
        // Stroke width
        const strokeSlider = document.getElementById('stroke-width');
        const strokeValue = document.getElementById('stroke-value');
        strokeSlider.addEventListener('input', (e) => {
            this.currentStrokeWidth = parseInt(e.target.value);
            strokeValue.textContent = this.currentStrokeWidth + 'px';
            this.ctx.lineWidth = this.currentStrokeWidth;
        });
        
        // Color picker
        document.getElementById('color-picker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.ctx.strokeStyle = this.currentColor;
        });
        
        // Action buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('ai-analyze-btn').addEventListener('click', () => this.startAiAnalysis());
    }
    
    
    /**
     * Set the current drawing tool
     */
    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + '-tool').classList.add('active');
        
        // Update cursor
        this.canvas.style.cursor = tool === 'eraser' ? 'grab' : 'crosshair';
        
        // Update context settings
        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
        }
    }
    
    /**
     * Start drawing operation
     */
    startDrawing(e) {
        if (this.isSelecting) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }
    
    /**
     * Continue drawing operation
     */
    draw(e) {
        if (!this.isDrawing || this.isSelecting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    /**
     * Stop drawing operation
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    /**
     * Handle touch events for mobile support
     */
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    /**
     * Save current canvas state to history
     */
    saveState() {
        this.historyIndex++;
        if (this.historyIndex < this.history.length) {
            this.history.length = this.historyIndex;
        }
        this.history.push(this.canvas.toDataURL());
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateUndoRedoButtons();
    }
    
    /**
     * Undo last drawing operation
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.redrawFromHistory();
            this.updateUndoRedoButtons();
        }
    }
    
    /**
     * Redo last undone operation
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.redrawFromHistory();
            this.updateUndoRedoButtons();
        }
    }
    
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
        document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
    }
    
    /**
     * Redraw canvas from history
     */
    redrawFromHistory() {
        if (this.history[this.historyIndex]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.history[this.historyIndex];
        }
    }
    
    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }
    }
    
    /**
     * Start AI analysis mode
     */
    startAiAnalysis() {
        this.isSelecting = true;
        this.canvas.classList.add('selecting');
        document.getElementById('ai-analyze-btn').disabled = true;
        document.getElementById('ai-analyze-btn').textContent = 'Click and drag to select area';
    }
    
    /**
     * Handle start of selection
     */
    handleSelectionStart(e) {
        if (!this.isSelecting) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        document.getElementById('selection-overlay').classList.remove('hidden');
    }
    
    /**
     * Handle selection movement
     */
    handleSelectionMove(e) {
        if (!this.isSelecting || !this.selectionStart) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        const selectionBox = document.getElementById('selection-box');
        const left = Math.min(this.selectionStart.x, currentPos.x);
        const top = Math.min(this.selectionStart.y, currentPos.y);
        const width = Math.abs(currentPos.x - this.selectionStart.x);
        const height = Math.abs(currentPos.y - this.selectionStart.y);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    }
    
    /**
     * Handle end of selection
     */
    handleSelectionEnd(e) {
        if (!this.isSelecting || !this.selectionStart) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.selectionEnd = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Calculate selection bounds
        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        if (width > 10 && height > 10) {
            this.analyzeSelection(left, top, width, height);
        }
        
        this.resetSelection();
    }
    
    /**
     * Reset selection state
     */
    resetSelection() {
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.canvas.classList.remove('selecting');
        document.getElementById('selection-overlay').classList.add('hidden');
        document.getElementById('ai-analyze-btn').disabled = false;
        document.getElementById('ai-analyze-btn').innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                <path d="M20.2 20.2L16 16m-8 0l-4.2 4.2M20.2 3.8L16 8m-8 0L3.8 3.8"/>
            </svg>
            AI Analyze
        `;
    }
    
    /**
     * Analyze selected area with AI
     */
    async analyzeSelection(x, y, width, height) {
        try {
            // Show loading indicator
            document.getElementById('loading-indicator').classList.remove('hidden');
            
            // Extract selected area as image
            const imageData = this.ctx.getImageData(x, y, width, height);
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempCtx.putImageData(imageData, 0, 0);
            
            const imageBase64 = tempCanvas.toDataURL('image/png');
            
            // Call OpenAI Vision API
            const analysis = await this.callOpenAI(imageBase64);
            
            // Hide loading indicator
            document.getElementById('loading-indicator').classList.add('hidden');
            
            // Create and display result card
            this.createResultCard(x, y, width, height, analysis);
            
        } catch (error) {
            console.error('AI Analysis Error:', error);
            document.getElementById('loading-indicator').classList.add('hidden');
            alert('Error analyzing image: ' + error.message);
        }
    }
    
    /**
     * Call OpenAI Vision API
     */
    async callOpenAI(imageBase64) {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64
            })
        });
    
        const data = await response.json();
    
        // If the server told us there was an issue, surface it
        if (!response.ok || data.error) {
            console.error("Server / OpenAI error:", data);
    
            // Try to surface a human-readable message
            let msg = "AI request failed";
    
            if (typeof data.error === 'string') {
                msg = data.error;
            } else if (data.error && data.error.message) {
                msg = data.error.message;
            } else if (data.raw) {
                msg = JSON.stringify(data.raw);
            } else {
                msg = JSON.stringify(data);
            }
    
            throw new Error(msg);
        }
    
        // data.content should be the model's reply (a string)
        const text = data.content || "";
    
        // 1. Try to parse it exactly as JSON first
        try {
            return JSON.parse(text);
        } catch (_) {
            // 2. If that fails, try to extract JSON out of a ```json ... ``` block
            const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
            if (fencedMatch && fencedMatch[1]) {
                try {
                    return JSON.parse(fencedMatch[1]);
                } catch (_) {
                    // fall through
                }
            }
    
            // 3. Last resort: return as a summary string with no links
            return {
                summary: text,
                links: []
            };
        }
    }
    
    
    /**
     * Create and display result card
     */
    createResultCard(x, y, width, height, analysis) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.left = (x + width + 20) + 'px';
        card.style.top = y + 'px';
        
        card.innerHTML = `
            <div class="result-card-header">
                <div class="result-card-title">AI Analysis</div>
                <button class="result-card-close">&times;</button>
            </div>
            <div class="result-card-content">
                <div class="result-card-summary">${analysis.summary || 'No analysis available'}</div>
                ${analysis.links && analysis.links.length > 0 ? `
                    <ul class="result-card-links">
                        ${analysis.links.map(link => `<li><a href="${link.url}" target="_blank">${link.title || link.url}</a></li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
        
        // Add close functionality
        card.querySelector('.result-card-close').addEventListener('click', () => {
            card.remove();
        });
        
        // Make card draggable
        this.makeDraggable(card);
        
        // Add to canvas container
        document.querySelector('.canvas-container').appendChild(card);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (card.parentNode) {
                card.remove();
            }
        }, 30000);
    }
    
    /**
     * Make element draggable
     */
    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('result-card-close')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            element.style.zIndex = '200';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = (startLeft + deltaX) + 'px';
            element.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = '150';
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingWhiteboard();
});
