/**
 * IndusVaani — Main Application Orchestrator
 * Ties together the NLP engine, Voice engine, and UI module renderer
 * into a cohesive interactive banking assistant.
 */

class IndusVaaniApp {
  constructor() {
    // Core modules
    this.nlpEngine = new NLPEngine();
    this.voiceEngine = null;
    this.currentLanguage = 'en';
    this.conversationHistory = [];
    this.isFirstQuery = true;
    this.isMuted = false;

    // DOM references
    this.dom = {};

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the application.
   */
  init() {
    this.cacheDOMElements();
    this.initVoiceEngine();
    this.initAudioWave();
    this.bindEvents();
    this.updateSuggestions();

    // Expose methods for inline event handlers
    window.indusVaani = this;

    console.log('%c🎙️ IndusVaani Initialized', 'color:#C5A55A;font-size:14px;font-weight:bold');
  }

  /**
   * Cache frequently accessed DOM elements.
   */
  cacheDOMElements() {
    this.dom = {
      welcomePanel: document.getElementById('welcomePanel'),
      conversationArea: document.getElementById('conversationArea'),
      transcriptBody: document.getElementById('transcriptBody'),
      responseBody: document.getElementById('responseBody'),
      textInput: document.getElementById('textInput'),
      btnSend: document.getElementById('btnSend'),
      micButton: document.getElementById('micButton'),
      micLabel: document.getElementById('micLabel'),
      langSelector: document.getElementById('langSelector'),
      audioWaveContainer: document.getElementById('audioWaveContainer'),
      toastOverlay: document.getElementById('toastOverlay'),
      toastIcon: document.getElementById('toastIcon'),
      toastTitle: document.getElementById('toastTitle'),
      toastMessage: document.getElementById('toastMessage'),
      toastBtn: document.getElementById('toastBtn'),
      suggestionsContainer: document.getElementById('suggestionsContainer'),
      ttsToggle: document.getElementById('ttsToggle'),
      ttsIcon: document.getElementById('ttsIcon'),
    };
  }

  /**
   * Initialize the voice engine with callbacks.
   */
  initVoiceEngine() {
    this.voiceEngine = new VoiceEngine({
      language: 'en-IN',
      onResult: (text) => {
        this.handleInput(text);
        this.setMicState(false);
      },
      onInterim: (text) => {
        this.dom.textInput.value = text;
        this.dom.textInput.classList.add('interim');
      },
      onStart: () => {
        this.setMicState(true);
      },
      onEnd: () => {
        this.setMicState(false);
      },
      onError: (error) => {
        this.setMicState(false);
        if (error === 'not-supported') {
          this.dom.micLabel.textContent = 'Voice not supported — use text input';
        } else if (error === 'not-allowed') {
          this.dom.micLabel.textContent = 'Mic access denied — use text input';
        }
      },
      onAudioLevel: (level, dataArray) => {
        this.updateAudioWave(level, dataArray);
      }
    });

    // Check support
    const support = this.voiceEngine.checkSupport();
    if (!support.speechRecognition) {
      this.dom.micButton.style.opacity = '0.5';
      this.dom.micLabel.textContent = 'Voice not available — type below';
    }
  }

  /**
   * Initialize audio wave visualizer bars.
   */
  initAudioWave() {
    const container = this.dom.audioWaveContainer;
    if (!container) return;
    container.innerHTML = '';
    const barCount = 32;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.height = '4px';
      container.appendChild(bar);
    }
  }

  /**
   * Update audio wave bars with real audio data.
   */
  updateAudioWave(level, dataArray) {
    const container = this.dom.audioWaveContainer;
    if (!container) return;
    const bars = container.querySelectorAll('.wave-bar');
    const step = Math.floor(dataArray.length / bars.length);

    bars.forEach((bar, i) => {
      const value = dataArray[i * step] || 0;
      const height = Math.max(4, (value / 255) * 36);
      bar.style.height = `${height}px`;
    });
  }

  /**
   * Bind all event listeners.
   */
  bindEvents() {
    // Text input submission
    this.dom.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitTextInput();
      }
    });

    this.dom.btnSend.addEventListener('click', () => this.submitTextInput());

    // Mic button
    this.dom.micButton.addEventListener('click', () => this.toggleMic());

    // Language selector
    this.dom.langSelector.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      this.voiceEngine.setLanguage(this.currentLanguage);
      this.updateSuggestions();
      this.updatePlaceholder();
    });
  }

  /**
   * Submit text from the input box.
   */
  submitTextInput() {
    const text = this.dom.textInput.value.trim();
    if (!text) return;
    this.dom.textInput.value = '';
    this.dom.textInput.classList.remove('interim');
    this.handleInput(text);
  }

  /**
   * Toggle microphone on/off.
   */
  toggleMic() {
    if (this.voiceEngine.isListening) {
      this.voiceEngine.stop();
    } else {
      this.voiceEngine.start();
    }
  }

  /**
   * Set mic button visual state.
   */
  setMicState(isListening) {
    const mic = this.dom.micButton;
    const label = this.dom.micLabel;
    const wave = this.dom.audioWaveContainer;

    if (isListening) {
      mic.classList.add('listening');
      label.textContent = 'Listening...';
      label.classList.add('listening-label');
      wave.classList.add('active');
    } else {
      mic.classList.remove('listening');
      label.textContent = 'Tap & Speak';
      label.classList.remove('listening-label');
      wave.classList.remove('active');

      // Reset wave bars
      const bars = wave.querySelectorAll('.wave-bar');
      bars.forEach(b => b.style.height = '4px');
    }
  }

  /**
   * Handle user input (from text or voice).
   * @param {string} text - User's query
   */
  handleInput(text) {
    // Transition from welcome to conversation view
    if (this.isFirstQuery) {
      this.dom.welcomePanel.style.display = 'none';
      this.dom.conversationArea.classList.add('active');
      this.isFirstQuery = false;
    }

    // Resolve intent
    const result = this.nlpEngine.resolve(text, this.currentLanguage);

    // Add to conversation history
    this.conversationHistory.push({
      type: 'user',
      text: text,
      timestamp: new Date()
    });
    this.conversationHistory.push({
      type: 'bot',
      text: result.response,
      intent: result.intentKey,
      timestamp: new Date()
    });

    // Update UI
    this.renderTranscript(text, result);
    this.renderResponse(result);

    // Speak the response out loud
    if (!this.isMuted) {
      this.voiceEngine.speak(result.response, this.currentLanguage);
    }
  }

  /**
   * Render transcript entry in the left pane.
   */
  renderTranscript(userText, result) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const userEntry = document.createElement('div');
    userEntry.className = 'transcript-entry';
    userEntry.innerHTML = `
      <div class="transcript-avatar user">
        <span class="material-symbols-outlined" style="font-size:20px;color:white">person</span>
      </div>
      <div>
        <div class="transcript-bubble user">${this.escapeHTML(userText)}</div>
        <div class="transcript-timestamp">${timeStr}</div>
      </div>
    `;

    const botEntry = document.createElement('div');
    botEntry.className = 'transcript-entry';
    botEntry.innerHTML = `
      <div class="transcript-avatar bot">
        <span class="material-symbols-outlined" style="font-size:20px;color:white">smart_toy</span>
      </div>
      <div>
        <div class="transcript-bubble bot">${result.response}</div>
        <div class="transcript-timestamp">${timeStr} · ${result.matched ? result.intentKey : 'No Match'}</div>
      </div>
    `;

    this.dom.transcriptBody.appendChild(userEntry);
    this.dom.transcriptBody.appendChild(botEntry);

    // Scroll to bottom
    this.dom.transcriptBody.scrollTop = this.dom.transcriptBody.scrollHeight;
  }

  /**
   * Render the dynamic response module in the right pane.
   */
  renderResponse(result) {
    const html = UIModuleRenderer.render(result.uiAction, result.uiData, this.currentLanguage);

    this.dom.responseBody.innerHTML = `
      <div class="response-content">
        ${html}
      </div>
    `;

    // Scroll to top of response
    this.dom.responseBody.scrollTop = 0;

    // Animate limit progress bar if applicable
    if (result.uiAction === 'SHOW_CARD_LIMIT') {
      requestAnimationFrame(() => {
        const fill = this.dom.responseBody.querySelector('.limit-progress-fill');
        if (fill) {
          fill.style.width = '0%';
          requestAnimationFrame(() => {
            fill.style.width = `${result.uiData.utilizationPercent}%`;
          });
        }
      });
    }
  }

  /**
   * Update the suggestion chips on the welcome screen.
   */
  updateSuggestions() {
    const suggestions = this.nlpEngine.getSuggestions(this.currentLanguage);
    const icons = ['account_balance_wallet', 'credit_card_off', 'savings', 'add_card', 'home', 'location_on'];
    const container = this.dom.suggestionsContainer;
    if (!container) return;

    container.innerHTML = suggestions.map((s, i) => `
      <div class="suggestion-chip" onclick="window.indusVaani?.handleSuggestion('${s.replace(/'/g, "\\'")}')">
        <span class="material-symbols-outlined">${icons[i]}</span>
        ${s}
      </div>
    `).join('');
  }

  /**
   * Handle suggestion chip click.
   */
  handleSuggestion(text) {
    this.dom.textInput.value = text;
    this.handleInput(text);
  }

  /**
   * Update input placeholder based on language.
   */
  updatePlaceholder() {
    const placeholders = {
      en: 'Type your question here...',
      hi: 'अपना सवाल यहाँ लिखें...',
      hinglish: 'Apna sawal yahan likho...',
      ta: 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யுங்கள்...'
    };
    this.dom.textInput.placeholder = placeholders[this.currentLanguage] || placeholders.en;
  }

  /**
   * Select card to block (called from inline handler).
   */
  selectCardToBlock(element) {
    const items = document.querySelectorAll('.card-select-item');
    items.forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
  }

  /**
   * Confirm block card action.
   */
  confirmBlockCard() {
    const selected = document.querySelector('.card-select-item.selected');
    const freezeToggle = document.querySelector('.toggle-switch');
    const isFreeze = freezeToggle && freezeToggle.classList.contains('active');

    if (!selected) {
      this.showToast('Select a Card', 'Please select a card to proceed with blocking.', 'warning');
      return;
    }

    const cardName = selected.querySelector('.card-name').textContent;
    const last4 = selected.querySelector('.card-digits').textContent;

    if (isFreeze) {
      this.showToast('Card Frozen', `Your ${cardName} (${last4}) has been temporarily frozen. You can unfreeze it anytime from IndusMobile app.`, 'success');
    } else {
      this.showToast('Card Blocked', `Your ${cardName} (${last4}) has been permanently blocked. A replacement card will be shipped within 5-7 business days.`, 'success');
    }
  }

  /**
   * Select FD calculator option.
   */
  selectFDOption(element, type) {
    const parent = element.parentElement;
    parent.querySelectorAll('.fd-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    // Recalculate mock maturity
    const amountEl = document.querySelector('.fd-amount-options .fd-option.selected');
    const tenureEl = document.querySelector('.fd-tenure-options .fd-option.selected');

    if (amountEl && tenureEl) {
      const amountStr = amountEl.textContent.replace(/[₹,\s]/g, '');
      const amount = parseInt(amountStr);
      const tenureText = tenureEl.textContent.toLowerCase();

      let years = 1;
      if (tenureText.includes('6 month')) years = 0.5;
      else if (tenureText.includes('18 month')) years = 1.5;
      else if (tenureText.includes('1 year')) years = 1;
      else if (tenureText.includes('2 year')) years = 2;
      else if (tenureText.includes('3 year')) years = 3;

      const rate = years >= 1.5 ? 7.25 : years >= 1 ? 7.0 : 6.5;
      const maturity = Math.round(amount * Math.pow(1 + rate / 400, 4 * years));

      const maturityEl = document.querySelector('.maturity-value');
      if (maturityEl) {
        maturityEl.textContent = '₹' + maturity.toLocaleString('en-IN');
      }
    }
  }

  /**
   * Show confirmation/toast dialog.
   */
  showToast(title, message, type = 'success') {
    this.dom.toastIcon.className = 'toast-icon ' + type;
    this.dom.toastIcon.querySelector('.material-symbols-outlined').textContent =
      type === 'success' ? 'check_circle' : 'warning';
    this.dom.toastTitle.textContent = title;
    this.dom.toastMessage.textContent = message;
    this.dom.toastOverlay.classList.add('active');
  }

  /**
   * Close toast dialog.
   */
  closeToast() {
    this.dom.toastOverlay.classList.remove('active');
  }

  /**
   * Toggle Text-to-Speech active/inactive state.
   */
  toggleVoice() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.voiceEngine.stopSpeaking();
      this.dom.ttsIcon.textContent = 'volume_off';
      this.dom.ttsIcon.style.color = 'var(--text-muted)';
    } else {
      this.dom.ttsIcon.textContent = 'volume_up';
      this.dom.ttsIcon.style.color = 'var(--brand-gold)';
    }
  }

  /**
   * Escape HTML to prevent XSS.
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ─── Boot ──────────────────────────────────────────────────
const app = new IndusVaaniApp();
