class TimezoneConverter {
  constructor() {
    this.popup = null;
    this.selectedText = '';
    this.selectedElement = null;
    this.selectionRange = null;
    this.init();
  }

  init() {
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  handleTextSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    
    if (selectedText && selection.rangeCount > 0 && this.isTimeFormat(selectedText)) {
      
      // Don't recreate popup if it's the same text and popup already exists
      if (this.popup && this.selectedText === selectedText) {
        return;
      }
      
      this.selectedText = selectedText;
      this.selectedElement = this.getEditableElement(selection);
      this.selectionRange = selection.getRangeAt(0);
      
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      this.showPopup(rect.left + window.scrollX, rect.bottom + window.scrollY);
    } else if (!selectedText && !this.justShown) {
      // Only hide popup if we're not in the middle of showing it
      // and if the user actually cleared a selection (not just clicked elsewhere)
      this.hidePopup();
    }
  }

  isTimeFormat(text) {
    const timePatterns = [
      /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/,
      /^\d{1,2}\s*(AM|PM|am|pm)$/,
      /^\d{1,2}:\d{2}$/,
      /^\d{1,2}:\d{2}:\d{2}$/
    ];
    
    return timePatterns.some(pattern => pattern.test(text));
  }

  getEditableElement(selection) {
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    // Get the actual element if we have a text node
    while (element && element.nodeType !== 1) {
      element = element.parentNode;
    }
    
    // Check if the current element or any parent is editable
    let current = element;
    while (current) {
      if (current.contentEditable === 'true' || 
          current.tagName === 'INPUT' || 
          current.tagName === 'TEXTAREA') {
        return current;
      }
      current = current.parentNode;
    }
    
    // Also check if we selected text from an input/textarea directly
    if (range.startContainer && range.startContainer.nodeType === 3) {
      const parent = range.startContainer.parentNode;
      if (parent && (parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA')) {
        return parent;
      }
    }
    
    return null;
  }

  showPopup(x, y) {
    
    // Only hide if popup already exists and we're showing a new one
    if (this.popup) {
      this.hidePopup();
    }
    
    this.justShown = true;
    
    this.popup = document.createElement('div');
    this.popup.className = 'timezone-converter-popup';
    this.popup.innerHTML = `
      <div class="popup-header" style="cursor: move; background: #f0f0f0; padding: 5px; margin: -10px -10px 10px -10px; border-bottom: 1px solid #ccc;">
        <span style="font-weight: bold; font-size: 12px;">Timezone Converter</span>
        <button id="close-btn" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
      </div>
      <div class="popup-content">
        <div class="time-display">
          <div class="original-time">
            <label>From:</label>
            <span>${this.selectedText}</span>
            <select id="from-timezone">${this.getTimezoneOptions()}</select>
          </div>
          <div class="converted-time">
            <label>To:</label>
            <span id="converted-time-display">--</span>
            <select id="to-timezone">${this.getTimezoneOptions()}</select>
          </div>
        </div>
        <div class="popup-actions">
          <button id="insert-btn" ${this.selectedElement ? '' : 'disabled'}>Insert</button>
        </div>
      </div>
    `;
    
    this.popup.style.left = x + 'px';
    this.popup.style.top = y + 'px';
    this.popup.style.position = 'fixed';
    this.popup.style.zIndex = '2147483647';
    this.popup.style.backgroundColor = 'white';
    this.popup.style.border = '2px solid red';
    this.popup.style.padding = '10px';
    this.popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    this.popup.style.borderRadius = '4px';
    this.popup.style.minWidth = '300px';
    this.popup.style.pointerEvents = 'all';
    this.popup.style.userSelect = 'none';
    this.popup.style.webkitUserSelect = 'none';
    
    
    try {
      document.body.appendChild(this.popup);
      
      // Prevent clicks inside the popup from propagating to document
      this.popup.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      
      // Clear the justShown flag after a short delay
      setTimeout(() => {
        this.justShown = false;
      }, 200);
    } catch (error) {
      console.error('Error appending popup:', error);
    }
    
    this.setupPopupEvents();
    this.setDefaultTimezones();
    this.setupDragFunctionality();
    // Auto-convert with default timezones
    this.convertTime();
  }

  getTimezoneOptions() {
    const timezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
      'Australia/Sydney', 'Pacific/Auckland'
    ];
    
    return timezones.map(tz => 
      `<option value="${tz}">${tz.replace('_', ' ')}</option>`
    ).join('');
  }

  setDefaultTimezones() {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromSelect = this.popup.querySelector('#from-timezone');
    const toSelect = this.popup.querySelector('#to-timezone');
    
    fromSelect.value = userTimezone || 'America/New_York';
    toSelect.value = userTimezone === 'America/New_York' ? 'Europe/London' : 'America/New_York';
  }

  setupPopupEvents() {
    const insertBtn = this.popup.querySelector('#insert-btn');
    const closeBtn = this.popup.querySelector('#close-btn');
    const fromSelect = this.popup.querySelector('#from-timezone');
    const toSelect = this.popup.querySelector('#to-timezone');
    
    // Auto-convert when dropdown values change
    fromSelect.addEventListener('change', this.convertTime.bind(this));
    toSelect.addEventListener('change', this.convertTime.bind(this));
    
    insertBtn.addEventListener('click', this.insertConvertedTime.bind(this));
    closeBtn.addEventListener('click', this.hidePopup.bind(this));
  }

  setupDragFunctionality() {
    const header = this.popup.querySelector('.popup-header');
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = this.popup.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      // Prevent text selection during drag
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep popup within viewport bounds
        const maxX = window.innerWidth - this.popup.offsetWidth;
        const maxY = window.innerHeight - this.popup.offsetHeight;
        
        this.popup.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        this.popup.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  convertTime() {
    const fromTz = this.popup.querySelector('#from-timezone').value;
    const toTz = this.popup.querySelector('#to-timezone').value;
    const display = this.popup.querySelector('#converted-time-display');
    
    try {
      const convertedTime = this.performTimeConversion(this.selectedText, fromTz, toTz);
      display.textContent = convertedTime;
    } catch (error) {
      display.textContent = 'Invalid time format';
    }
  }

  performTimeConversion(timeString, fromTz, toTz) {
    const today = new Date().toISOString().split('T')[0];
    const normalizedTime = this.normalizeTimeString(timeString);
    const dateTimeString = `${today}T${normalizedTime}`;
    
    const date = new Date(dateTimeString);
    
    const fromTime = new Date(date.toLocaleString('en-US', { timeZone: fromTz }));
    const toTime = new Date(date.toLocaleString('en-US', { timeZone: toTz }));
    
    const offset = toTime.getTime() - fromTime.getTime();
    const convertedDate = new Date(date.getTime() + offset);
    
    return this.formatTime(convertedDate, timeString);
  }

  normalizeTimeString(timeString) {
    let normalized = timeString.toLowerCase().replace(/\s+/g, '');
    
    if (normalized.includes('am') || normalized.includes('pm')) {
      const isPM = normalized.includes('pm');
      normalized = normalized.replace(/[ap]m/, '');
      
      if (!normalized.includes(':')) {
        normalized += ':00';
      }
      
      let [hours, minutes] = normalized.split(':');
      hours = parseInt(hours);
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    if (!normalized.includes(':')) {
      normalized += ':00';
    }
    
    if (normalized.split(':').length === 2) {
      normalized += ':00';
    }
    
    return normalized;
  }

  formatTime(date, originalFormat) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    if (originalFormat.toLowerCase().includes('am') || originalFormat.toLowerCase().includes('pm')) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  insertConvertedTime() {
    const convertedTime = this.popup.querySelector('#converted-time-display').textContent;
    
    if (convertedTime === '--' || convertedTime === 'Invalid time format') {
      return;
    }
    
    if (this.selectedElement) {
      this.replaceSelectedText(convertedTime);
      this.hidePopup();
    }
  }

  replaceSelectedText(newText) {
    if (!this.selectedElement) {
      return;
    }
    
    if (this.selectedElement.tagName === 'INPUT' || this.selectedElement.tagName === 'TEXTAREA') {
      // For input/textarea, we need to find the original selection positions
      const currentValue = this.selectedElement.value;
      const originalText = this.selectedText;
      const startIndex = currentValue.indexOf(originalText);
      
      if (startIndex !== -1) {
        const endIndex = startIndex + originalText.length;
        this.selectedElement.value = currentValue.substring(0, startIndex) + newText + currentValue.substring(endIndex);
        this.selectedElement.focus();
        this.selectedElement.setSelectionRange(startIndex, startIndex + newText.length);
      }
    } else if (this.selectedElement.contentEditable === 'true' && this.selectionRange) {
      this.selectionRange.deleteContents();
      this.selectionRange.insertNode(document.createTextNode(newText));
      this.selectedElement.focus();
    }
  }

  handleDocumentClick(event) {
    // Use setTimeout to ensure this runs after the selection event
    setTimeout(() => {
      if (!this.popup) {
        return;
      }
      
      const isInsidePopup = this.popup.contains(event.target) || event.target === this.popup;
      
      if (!isInsidePopup && !this.justShown) {
        this.hidePopup();
      }
    }, 50);
  }

  hidePopup() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }
}

new TimezoneConverter();