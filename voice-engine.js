/**
 * IndusVaani — Voice Engine
 * Web Speech API wrapper with multi-language support,
 * audio visualization hooks, and graceful fallback.
 */

class VoiceEngine {
  constructor(options = {}) {
    this.isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    this.recognition = null;
    this.isListening = false;
    this.currentLanguage = options.language || 'en-IN';
    this.onResult = options.onResult || (() => {});
    this.onInterim = options.onInterim || (() => {});
    this.onStart = options.onStart || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});
    this.onAudioLevel = options.onAudioLevel || (() => {});

    // Audio context for visualization
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.animationFrame = null;

    // Language code mapping
    this.langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      hinglish: 'hi-IN',
      ta: 'ta-IN'
    };

    if (this.isSupported) {
      this._initRecognition();
    }
  }

  /**
   * Initialize the SpeechRecognition instance.
   */
  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        this.onInterim(interimTranscript);
      }

      if (finalTranscript) {
        this.onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      this.onError(event.error);
      this._stopAudioVisualization();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
      this._stopAudioVisualization();
    };
  }

  /**
   * Start listening for speech input.
   */
  async start() {
    if (!this.isSupported) {
      this.onError('not-supported');
      return false;
    }

    if (this.isListening) {
      this.stop();
      return false;
    }

    try {
      // Start audio visualization
      await this._startAudioVisualization();

      // Update language before starting
      this.recognition.lang = this.currentLanguage;
      this.recognition.start();
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      this.onError('start-failed');
      return false;
    }
  }

  /**
   * Stop listening.
   */
  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors on stop
      }
    }
    this.isListening = false;
    this._stopAudioVisualization();
  }

  /**
   * Set the active recognition language.
   * @param {string} langCode - Language key (en, hi, hinglish, ta)
   */
  setLanguage(langCode) {
    this.currentLanguage = this.langMap[langCode] || 'en-IN';
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  /**
   * Start microphone audio visualization.
   */
  async _startAudioVisualization() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const tick = () => {
        if (!this.isListening) return;
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average volume level (0-1)
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        const level = Math.min(avg / 128, 1);
        this.onAudioLevel(level, dataArray);

        this.animationFrame = requestAnimationFrame(tick);
      };

      tick();
    } catch (err) {
      // Audio visualization is optional — fail silently
      console.warn('Audio visualization not available:', err.message);
    }
  }

  /**
   * Stop audio visualization and release resources.
   */
  _stopAudioVisualization() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  /**
   * Check if speech recognition is available.
   */
  checkSupport() {
    return {
      speechRecognition: this.isSupported,
      audioContext: !!(window.AudioContext || window.webkitAudioContext),
      mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
  }

  /**
   * Speak text out loud using Web Speech Synthesis.
   * @param {string} text - The text to speak.
   * @param {string} langCode - Language key (en, hi, hinglish, ta)
   */
  speak(text, langCode) {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Map language code to standard SpeechSynthesis lang tag
    const synthLangMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      hinglish: 'hi-IN', // Hinglish reads best with Hindi voice synthesizer
      ta: 'ta-IN'
    };

    const targetLang = synthLangMap[langCode] || 'en-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;

    // Optional: Select matching voice if loaded
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(targetLang));
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any active Speech Synthesis.
   */
  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Destroy the engine and release all resources.
   */
  destroy() {
    this.stop();
    this.stopSpeaking();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
  }
}
