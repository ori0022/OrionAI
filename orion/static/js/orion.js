/**
 * ORION AI - AUTONOMOUS INTELLIGENCE CORE
 * Standalone Client Controller
 */

(function () {
  'use strict';

  const DEFAULT_MODELS_FULL = [
    {
      name: 'llama3.2:3b',
      size_gb: 2.0,
      resource_tier: 'LOW',
      description: 'Meta Llama 3.2 (3B). Ultra-fast next-gen lightweight brain. Generates at 70+ tokens/sec with sub-second responses.',
      type: 'ollama'
    },
    {
      name: 'qwen2.5:3b',
      size_gb: 1.9,
      resource_tier: 'LOW',
      description: 'Alibaba Qwen 2.5 (3B). Lightning-fast reasoning and general intelligence with exceptional accuracy.',
      type: 'ollama'
    },
    {
      name: 'llama3:latest',
      size_gb: 4.3,
      resource_tier: 'MEDIUM',
      description: 'Meta Llama 3 (8B). High-speed general conversational intelligence with refined reasoning.',
      type: 'ollama'
    },
    {
      name: 'qwen2.5-coder:14b',
      size_gb: 8.4,
      resource_tier: 'MEDIUM',
      description: 'Alibaba Qwen 2.5 Coder (14B). Elite code generation, multi-file refactoring, and complex logic.',
      type: 'ollama'
    },
    {
      name: 'qwen3-coder:30b',
      size_gb: 18.2,
      resource_tier: 'HIGH',
      description: 'Alibaba Qwen 3 Coder (30B MoE). Heavyweight frontier programming intelligence for deep software engineering.',
      type: 'ollama'
    },
    {
      name: 'deepseek-coder:6.7b',
      size_gb: 3.8,
      resource_tier: 'LOW',
      description: 'DeepSeek Coder (6.7B). Ultra-fast, lightweight programming model optimized for quick code assistance.',
      type: 'ollama'
    }
  ];

  const DEFAULT_VISION_MODELS_FULL = [
    {
      name: 'moondream:latest',
      size_gb: 1.6,
      resource_tier: 'LOW',
      description: 'Moondream2 (1.86B). Ultra-fast, lightweight vision model for rapid screen parsing and optical recognition.',
      type: 'ollama'
    },
    {
      name: 'llava:latest',
      size_gb: 4.4,
      resource_tier: 'MEDIUM',
      description: 'LLaVA 1.5 (7B). High-precision multimodal vision analysis for complex screen and camera captures.',
      type: 'ollama'
    }
  ];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- State ---
  const state = {
    connected: false,
    activeModel: 'llama3:latest',
    activeVisionModel: 'llava:latest',
    modelsFull: [...DEFAULT_MODELS_FULL],
    visionModelsFull: [...DEFAULT_VISION_MODELS_FULL],
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    autoSpeak: true,
    audioMuted: false,
    audioLevel: 0,
    history: [],
    speechRecognition: null,
    audioCtx: null,
    analyserNode: null,
    selectedMicId: 'default',
    availableVoices: [],
    selectedVoice: null,
    voiceCategory: 'natural',
    voiceRate: 1.05,
    voicePitch: 0.95,
    voiceVolume: 1.0,
    selectedMicId: 'default',
    selectedSpeakerId: 'default',
    isTestingMic: false,
    isScreenStreaming: false,
    streamFps: 1.0,
    currentSessionId: 'default',
    leftCollapsed: false,
    rightCollapsed: false,
    currentLanguage: 'en', // 'en' or 'he'
    spacebarMode: 'toggle', // 'toggle' (default) or 'hold'
    lastInputSource: 'text', // 'text', 'voice', or 'chip'
    continuousConversation: false,
    silenceThresholdMs: 700,
    latencyMs: 0
  };

  const els = {};

  function initElements() {
    els.statusDot = document.getElementById('statusDot');
    els.statusText = document.getElementById('statusText');
    els.modelSelect = document.getElementById('modelSelect');
    els.visionModelSelect = document.getElementById('visionModelSelect');
    els.languageSelect = document.getElementById('languageSelect');
    els.systemUptime = document.getElementById('systemUptime');
    els.systemLatency = document.getElementById('systemLatency');
    els.engineNameVal = document.getElementById('engineNameVal');
    els.memoryCountBadge = document.getElementById('memoryCountBadge');

    els.interactionCore = document.getElementById('interactionCore');
    els.coreGlyph = document.getElementById('coreGlyph');
    els.coreLabel = document.getElementById('coreLabel');
    els.canvas = document.getElementById('reactorCanvas');
    
    els.transcriptFeed = document.getElementById('transcriptFeed');
    els.chatInput = document.getElementById('chatInput');
    els.sendBtn = document.getElementById('sendBtn');
    els.clearChatBtn = document.getElementById('clearChatBtn');
    
    els.snapBtn = document.getElementById('snapBtn');
    els.camBtn = document.getElementById('camBtn');
    els.shareScreenBtn = document.getElementById('shareScreenBtn');
    els.streamFpsSelect = document.getElementById('streamFpsSelect');
    els.purgeRamBtn = document.getElementById('purgeRamBtn');
    els.visionPreview = document.getElementById('visionPreview');
    els.visionLiveVideo = document.getElementById('visionLiveVideo');
    els.visionPlaceholder = document.getElementById('visionPlaceholder');
    els.visionBox = document.getElementById('visionBox');
    els.liveStreamBadge = document.getElementById('liveStreamBadge');
    els.currentFpsBadge = document.getElementById('currentFpsBadge');
    
    els.muteToggle = document.getElementById('muteToggle');
    els.speechToggle = document.getElementById('speechToggle');
    els.exitSystemBtn = document.getElementById('exitSystemBtn');
    els.shutdownOverlay = document.getElementById('shutdownOverlay');

    // Sliding Wing Panels
    els.hudMain = document.getElementById('hudMain');
    els.hudLeftWing = document.getElementById('hudLeftWing');
    els.hudRightWing = document.getElementById('hudRightWing');
    els.hudSessionsWing = document.getElementById('hudSessionsWing');
    els.toggleLeftWingBtn = document.getElementById('toggleLeftWingBtn');
    els.collapseLeftBtn = document.getElementById('collapseLeftBtn');
    els.collapseFeedBtn = document.getElementById('collapseFeedBtn');
    els.collapseSessionsBtn = document.getElementById('collapseSessionsBtn');
    els.leftDockTab = document.getElementById('leftDockTab');
    els.feedDockTab = document.getElementById('feedDockTab');
    els.sessionsDockTab = document.getElementById('sessionsDockTab');

    // Sessions Wing
    els.sessionsList = document.getElementById('sessionsList');
    els.newSessionBtn = document.getElementById('newSessionBtn');
    els.sessionSearchInput = document.getElementById('sessionSearchInput');

    // Hardware I/O Modal
    els.ioConfigBtn = document.getElementById('ioConfigBtn');
    els.ioModalBackdrop = document.getElementById('ioModalBackdrop');
    els.ioCloseBtn = document.getElementById('ioCloseBtn');
    els.saveIoBtn = document.getElementById('saveIoBtn');
    els.micSelect = document.getElementById('micSelect');
    els.scanMicsBtn = document.getElementById('scanMicsBtn');
    els.micStatusLabel = document.getElementById('micStatusLabel');
    els.toggleMicTestBtn = document.getElementById('toggleMicTestBtn');
    els.micLevelText = document.getElementById('micLevelText');
    els.micMeterFill = document.getElementById('micMeterFill');
    els.speakerSelect = document.getElementById('speakerSelect');
    els.testSpeakerBtn = document.getElementById('testSpeakerBtn');
    els.speakerStatusLabel = document.getElementById('speakerStatusLabel');
    els.voiceCategorySelect = document.getElementById('voiceCategorySelect');
    els.voiceSelect = document.getElementById('voiceSelect');
    els.voiceCountLabel = document.getElementById('voiceCountLabel');
    els.voiceVolumeSlider = document.getElementById('voiceVolumeSlider');
    els.voiceVolumeVal = document.getElementById('voiceVolumeVal');
    els.voiceRateSlider = document.getElementById('voiceRateSlider');
    els.voiceRateVal = document.getElementById('voiceRateVal');
    els.voicePitchSlider = document.getElementById('voicePitchSlider');
    els.voicePitchVal = document.getElementById('voicePitchVal');
    els.testVoiceBtn = document.getElementById('testVoiceBtn');
    els.voiceRadarBar = document.getElementById('voiceRadarBar');
    els.voiceRadarText = document.getElementById('voiceRadarText');
    els.voiceDiagBox = document.getElementById('voiceDiagBox');
    els.voiceDiagStatus = document.getElementById('voiceDiagStatus');
    els.voiceDiagTranscript = document.getElementById('voiceDiagTranscript');
    els.testVoiceInputBtn = document.getElementById('testVoiceInputBtn');

    // Memory Modal
    els.memoryModalBtn = document.getElementById('memoryModalBtn');
    els.memoryModalBackdrop = document.getElementById('memoryModalBackdrop');
    els.memoryCloseBtn = document.getElementById('memoryCloseBtn');
    els.closeMemoryModalBtn = document.getElementById('closeMemoryModalBtn');
    els.refreshMemoryBtn = document.getElementById('refreshMemoryBtn');
    els.newMemoryInput = document.getElementById('newMemoryInput');
    els.addMemoryBtn = document.getElementById('addMemoryBtn');
    els.memoryListContainer = document.getElementById('memoryListContainer');

    // Endpoint Elements
    els.endpointList = document.getElementById('endpointList');
    els.endpointNameInput = document.getElementById('endpointNameInput');
    els.endpointUrlInput = document.getElementById('endpointUrlInput');
    els.endpointTypeSelect = document.getElementById('endpointTypeSelect');
    els.addEndpointBtn = document.getElementById('addEndpointBtn');

    // Unified Tactical Settings Modal (Dropdown Category Style)
    els.openSettingsModalBtn = document.getElementById('openSettingsModalBtn');
    els.settingsModalBackdrop = document.getElementById('settingsModalBackdrop');
    els.settingsCloseBtn = document.getElementById('settingsCloseBtn');
    els.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    els.settingsCategorySelect = document.getElementById('settingsCategorySelect');
    els.settingsBrainSelect = document.getElementById('settingsBrainSelect');
    els.activeBrainBadge = document.getElementById('activeBrainBadge');
    els.brainSpecsCard = document.getElementById('brainSpecsCard');
    els.brainSpecsName = document.getElementById('brainSpecsName');
    els.brainSpecsTier = document.getElementById('brainSpecsTier');
    els.brainSpecsRam = document.getElementById('brainSpecsRam');
    els.brainSpecsDesc = document.getElementById('brainSpecsDesc');
    els.settingsVisionSelect = document.getElementById('settingsVisionSelect');
    els.activeVisionBadge = document.getElementById('activeVisionBadge');
    els.visionSpecsCard = document.getElementById('visionSpecsCard');
    els.visionSpecsName = document.getElementById('visionSpecsName');
    els.visionSpecsTier = document.getElementById('visionSpecsTier');
    els.visionSpecsRam = document.getElementById('visionSpecsRam');
    els.visionSpecsDesc = document.getElementById('visionSpecsDesc');
    els.detailedBrainList = document.getElementById('detailedBrainList');
    els.settingsMemoryCount = document.getElementById('settingsMemoryCount');
    els.speechToggleSettings = document.getElementById('speechToggleSettings');
    els.muteToggleSettings = document.getElementById('muteToggleSettings');
    els.purgeRamSettingsBtn = document.getElementById('purgeRamSettingsBtn');
    els.spacebarModeSelect = document.getElementById('spacebarModeSelect');
  }

  // ==========================================================================
  // 1. SYNTHESIZED WEB AUDIO SFX
  // ==========================================================================

  function initAudioContext() {
    if (state.audioCtx) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioCtxClass();
      state.analyserNode = state.audioCtx.createAnalyser();
      state.analyserNode.fftSize = 64;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  function playTone(freqs, duration = 0.08, type = 'sine') {
    // Disabled synthetic oscillator tones to keep keyboard typing and voice activation clean & silent
    return;
  }

  const sfx = {
    activate: () => {},
    listening: () => {},
    processing: () => {},
    ready: () => {},
    snap: () => {},
    click: () => {}
  };

  // ==========================================================================
  // 2. DYNAMIC CANVAS STELLAR REACTOR VISUALIZER
  // ==========================================================================

  let canvasCtx = null;
  let animAngle1 = 0;
  let animAngle2 = 0;
  const particles = [];

  function initCanvas() {
    if (!els.canvas) return;
    canvasCtx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < 42; i++) {
      particles.push({
        r: 100 + Math.random() * 80,
        theta: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.008 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    requestAnimationFrame(renderCoreFrame);
  }

  function resizeCanvas() {
    if (!els.canvas) return;
    const rect = els.canvas.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
  }

  function renderCoreFrame() {
    if (!canvasCtx || !els.canvas) return;
    const w = els.canvas.width;
    const h = els.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.38;

    canvasCtx.clearRect(0, 0, w, h);

    // Dynamic Audio Pulse
    let audioPulse = 0;
    if (state.analyserNode && (state.isListening || state.isSpeaking)) {
      const dataArray = new Uint8Array(state.analyserNode.frequencyBinCount);
      state.analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      audioPulse = (sum / dataArray.length) / 255;
      state.audioLevel = audioPulse;
    } else if (state.isSpeaking) {
      audioPulse = 0.25 + Math.sin(Date.now() * 0.015) * 0.15;
    } else if (state.isProcessing) {
      audioPulse = 0.15 + Math.sin(Date.now() * 0.008) * 0.1;
    } else {
      audioPulse = Math.sin(Date.now() * 0.002) * 0.04;
    }

    const currentRadius = baseRadius * (1 + audioPulse * 0.22);

    let coreColor = 'rgba(86, 204, 242, ';
    if (state.isListening) coreColor = 'rgba(242, 153, 74, ';
    if (state.isSpeaking) coreColor = 'rgba(56, 239, 125, ';
    if (state.isProcessing) coreColor = 'rgba(86, 204, 242, ';

    animAngle1 -= 0.008 + (state.isProcessing ? 0.02 : 0);
    drawSegmentedRing(cx, cy, currentRadius, animAngle1, 16, coreColor + '0.45)');

    animAngle2 += 0.012 + (state.isProcessing ? 0.025 : 0);
    drawSegmentedRing(cx, cy, currentRadius * 0.82, animAngle2, 12, coreColor + '0.65)');

    drawTickMarks(cx, cy, currentRadius * 0.92, animAngle1 * 0.5, 48, coreColor + '0.3)');

    if (state.isListening || state.isSpeaking) {
      drawAcousticWaveform(cx, cy, currentRadius * 0.65, audioPulse, coreColor);
    }

    particles.forEach(p => {
      p.theta += p.speed;
      const pr = p.r * (currentRadius / baseRadius);
      const px = cx + Math.cos(p.theta) * pr;
      const py = cy + Math.sin(p.theta) * pr;

      canvasCtx.beginPath();
      canvasCtx.arc(px, py, p.size * window.devicePixelRatio, 0, Math.PI * 2);
      canvasCtx.fillStyle = coreColor + p.alpha + ')';
      canvasCtx.fill();
    });

    requestAnimationFrame(renderCoreFrame);
  }

  function drawSegmentedRing(cx, cy, r, rotation, segments, strokeStyle) {
    const arcLen = (Math.PI * 2) / segments;
    canvasCtx.save();
    canvasCtx.strokeStyle = strokeStyle;
    canvasCtx.lineWidth = 2 * window.devicePixelRatio;

    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) continue;
      const startAngle = rotation + i * arcLen;
      const endAngle = startAngle + arcLen * 0.75;
      canvasCtx.beginPath();
      canvasCtx.arc(cx, cy, r, startAngle, endAngle);
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  }

  function drawTickMarks(cx, cy, r, rotation, count, strokeStyle) {
    canvasCtx.save();
    canvasCtx.strokeStyle = strokeStyle;
    canvasCtx.lineWidth = 1 * window.devicePixelRatio;
    const step = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = rotation + i * step;
      const len = i % 4 === 0 ? 8 : 4;
      const x1 = cx + Math.cos(angle) * (r - len);
      const y1 = cy + Math.sin(angle) * (r - len);
      const x2 = cx + Math.cos(angle) * r;
      const y2 = cy + Math.sin(angle) * r;

      canvasCtx.beginPath();
      canvasCtx.moveTo(x1, y1);
      canvasCtx.lineTo(x2, y2);
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  }

  function drawAcousticWaveform(cx, cy, r, amp, colorPrefix) {
    canvasCtx.save();
    canvasCtx.beginPath();
    const points = 32;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const offset = Math.sin(angle * 6 + Date.now() * 0.01) * (15 * amp * window.devicePixelRatio);
      const px = cx + Math.cos(angle) * (r + offset);
      const py = cy + Math.sin(angle) * (r + offset);
      if (i === 0) canvasCtx.moveTo(px, py);
      else canvasCtx.lineTo(px, py);
    }
    canvasCtx.closePath();
    canvasCtx.strokeStyle = colorPrefix + '0.75)';
    canvasCtx.lineWidth = 1.5 * window.devicePixelRatio;
    canvasCtx.stroke();
    canvasCtx.restore();
  }

  // ==========================================================================
  // 3. SPEECH-TO-SPEECH & AUDIO ENGINE
  // ==========================================================================

  let pendingVoiceTranscript = '';
  let currentInterimTranscript = '';
  let vadSilenceTimer = null;

  function updateVoiceHearingBadge(text, isActive = true) {
    if (els.voiceRadarBar) {
      if (isActive) {
        els.voiceRadarBar.style.display = 'flex';
        if (els.voiceRadarText) {
          els.voiceRadarText.textContent = text || (state.currentLanguage === 'he' ? 'מקשיב...' : 'Listening...');
        }
      } else {
        els.voiceRadarBar.style.display = 'none';
      }
    }

    if (els.acousticBar) {
      if (isActive && text) {
        els.acousticBar.innerHTML = `<span style="color: var(--ice-blue); font-weight: 700;">HEARING:</span> <span style="color: #ffffff;">"${text}"</span>`;
      } else if (isActive) {
        els.acousticBar.innerHTML = `<span style="color: var(--emerald-nominal); font-weight: 700;">LISTENING</span> <span class="hotkey-hint">| Speak now (${state.currentLanguage === 'he' ? 'עברית' : 'English'})</span>`;
      } else {
        els.acousticBar.innerHTML = `<span>Click Core or hold <kbd>Space</kbd> to transmit</span><span class="hotkey-hint">| Natural Voice Pipeline Active</span>`;
      }
    }

    if (els.voiceDiagTranscript) {
      if (text) {
        els.voiceDiagTranscript.textContent = text;
      }
    }
    if (els.voiceDiagStatus) {
      els.voiceDiagStatus.textContent = isActive ? 'LISTENING' : 'IDLE';
      els.voiceDiagStatus.style.color = isActive ? 'var(--ice-blue)' : 'var(--emerald-nominal)';
    }
  }

  function initSpeechEngine() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      state.speechRecognition = new SpeechRec();
      state.speechRecognition.continuous = true;
      state.speechRecognition.interimResults = true;
      state.speechRecognition.lang = state.currentLanguage === 'he' ? 'he-IL' : 'en-US';

      state.speechRecognition.onstart = () => {
        state.isListening = true;
        setInteractionState('listening');
        sfx.listening();
        updateVoiceHearingBadge('', true);
      };

      state.speechRecognition.onresult = (event) => {
        // Instant Barge-In: If Orion is speaking, interrupt immediately
        if (state.isSpeaking || isSpeakingQueue) {
          cancelSpeech();
          setInteractionState('listening');
        }

        // Only display interim preview if matching the selected language
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (state.currentLanguage === 'he') {
          // If Hebrew is active, only show Hebrew characters to prevent English hallucinations
          const hasHebrew = anyHebrewChar(finalChunk) || anyHebrewChar(interim);
          if (hasHebrew) {
            if (finalChunk) pendingVoiceTranscript = (pendingVoiceTranscript + ' ' + finalChunk).trim();
            currentInterimTranscript = interim.trim();
            const display = (pendingVoiceTranscript + (currentInterimTranscript ? ' ' + currentInterimTranscript : '')).trim();
            updateVoiceHearingBadge(display, true);
          }
        } else {
          if (finalChunk) pendingVoiceTranscript = (pendingVoiceTranscript + ' ' + finalChunk).trim();
          currentInterimTranscript = interim.trim();
          const display = (pendingVoiceTranscript + (currentInterimTranscript ? ' ' + currentInterimTranscript : '')).trim();
          updateVoiceHearingBadge(display, true);
        }

        // VAD Silence Detection Timer: Triggers local Whisper transcription when user pauses
        if (vadSilenceTimer) clearTimeout(vadSilenceTimer);
        vadSilenceTimer = setTimeout(() => {
          if (state.isListening) {
            finishAndDispatchVoice();
          }
        }, state.silenceThresholdMs || 750);
      };

      state.speechRecognition.onerror = (err) => {
        if (vadSilenceTimer) {
          clearTimeout(vadSilenceTimer);
          vadSilenceTimer = null;
        }
        console.warn('Speech Recognition error event:', err.error);
        if (err.error === 'no-speech' || err.error === 'aborted') {
          // Normal silence / timeout in continuous mode; do not kill listening state
          return;
        }
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          state.isListening = false;
          setInteractionState('idle');
          updateVoiceHearingBadge('', false);
          appendTranscript('assistant', '⚠️ Microphone access was blocked by your browser. Please click the permissions/lock icon in your browser address bar and allow microphone access.');
        }
      };

      state.speechRecognition.onend = () => {
        if (vadSilenceTimer) {
          clearTimeout(vadSilenceTimer);
          vadSilenceTimer = null;
        }
        const toSend = (pendingVoiceTranscript + ' ' + currentInterimTranscript).trim();
        if (toSend && !state.isProcessing && state.isListening) {
          pendingVoiceTranscript = '';
          currentInterimTranscript = '';
          if (els.chatInput && document.activeElement !== els.chatInput) els.chatInput.value = '';
          stopListening();
          sendUserMessage(toSend, 'voice');
          return;
        }

        // If user is STILL in listening mode (toggle or hold active), keep recognition running with slight delay for browser pipeline reset
        if (state.isListening && !state.isProcessing && !state.isSpeaking) {
          setTimeout(() => {
            if (state.isListening && !state.isProcessing && !state.isSpeaking && state.speechRecognition) {
              try {
                state.speechRecognition.start();
              } catch (e) {
                // If browser state is stuck, recreate
                try {
                  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (SpeechRec) {
                    initSpeechEngine();
                    if (state.isListening) state.speechRecognition.start();
                  }
                } catch (err2) {}
              }
            }
          }, 80);
          return;
        }

        if (!state.isProcessing && !state.isSpeaking) {
          setInteractionState('idle');
          updateVoiceHearingBadge('', false);
        }
      };
    }

    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        state.availableVoices = window.speechSynthesis.getVoices();
        if (els.voiceCountLabel) {
          els.voiceCountLabel.textContent = `${state.availableVoices.length} voices ready`;
        }
        
        loadSettings(); // Restore saved voice & hardware settings

        if (!state.selectedVoice && state.availableVoices.length > 0) {
          if (state.currentLanguage === 'he') {
            state.selectedVoice = state.availableVoices.find(v => {
              const l = (v.lang || '').toLowerCase();
              const n = (v.name || '').toLowerCase();
              return l.startsWith('he') || l.startsWith('iw') || n.includes('hebrew') || n.includes('asaf') || n.includes('hila') || n.includes('avri') || n.includes('carmit');
            }) || state.availableVoices[0];
          } else {
            state.selectedVoice = state.availableVoices.find(v => 
              v.name.includes('Ryan') || 
              v.name.includes('Natural') ||
              v.name.includes('Guy') ||
              v.name.includes('Daniel') || 
              v.name.includes('UK English Male') || 
              (v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('male'))
            ) || state.availableVoices.find(v => v.lang.startsWith('en-GB')) || state.availableVoices.find(v => v.lang.startsWith('en')) || state.availableVoices[0];
          }
        }
        populateVoiceSelect();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  const NEURAL_TTS_VOICES = [
    { name: 'Avri Neural (Hebrew Male)', id: 'he-IL-AvriNeural', lang: 'he-IL', category: 'hebrew', isNeural: true },
    { name: 'Hila Neural (Hebrew Female)', id: 'he-IL-HilaNeural', lang: 'he-IL', category: 'hebrew', isNeural: true },
    { name: 'Ryan Neural (British Jarvis)', id: 'en-GB-RyanNeural', lang: 'en-GB', category: 'en-gb', isNeural: true },
    { name: 'Sonia Neural (British Female)', id: 'en-GB-SoniaNeural', lang: 'en-GB', category: 'en-gb', isNeural: true },
    { name: 'Guy Neural (US Male)', id: 'en-US-GuyNeural', lang: 'en-US', category: 'en-us', isNeural: true },
    { name: 'Jenny Neural (US Female)', id: 'en-US-JennyNeural', lang: 'en-US', category: 'en-us', isNeural: true }
  ];

  function anyHebrewChar(str) {
    return /[\u0590-\u05FF]/.test(str || '');
  }

  function isHumanOrNeuralVoice(v) {
    if (v.isNeural) return true;
    const n = (v.name || '').toLowerCase();
    return n.includes('natural') || 
           n.includes('neural') || 
           n.includes('online') || 
           n.includes('ryan') || 
           n.includes('guy') || 
           n.includes('sonia') || 
           n.includes('george') || 
           n.includes('daniel') || 
           n.includes('hazel') || 
           n.includes('google') || 
           n.includes('siri') || 
           n.includes('jenny');
  }

  function populateVoiceSelect() {
    if (!els.voiceSelect) return;
    els.voiceSelect.innerHTML = '';

    const cat = state.voiceCategory || (state.currentLanguage === 'he' ? 'hebrew' : 'natural');
    let list = [];

    if (cat === 'hebrew') {
      list = NEURAL_TTS_VOICES.filter(v => v.category === 'hebrew');
      if (state.availableVoices && state.availableVoices.length > 0) {
        const sysHeb = state.availableVoices.filter(v => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return l.startsWith('he') || l.startsWith('iw') || n.includes('hebrew') || n.includes('asaf') || n.includes('hila') || n.includes('avri') || n.includes('carmit') || n.includes('עברית');
        });
        list = list.concat(sysHeb);
      }
    } else if (cat === 'natural') {
      list = NEURAL_TTS_VOICES.filter(v => v.category === 'en-gb' || v.category === 'en-us');
      if (state.availableVoices && state.availableVoices.length > 0) {
        const sysNat = state.availableVoices.filter(v => isHumanOrNeuralVoice(v) || v.lang.startsWith('en'));
        list = list.concat(sysNat);
      }
    } else if (cat === 'en-gb') {
      list = NEURAL_TTS_VOICES.filter(v => v.category === 'en-gb');
      if (state.availableVoices && state.availableVoices.length > 0) {
        const sysGb = state.availableVoices.filter(v => v.lang.toLowerCase().includes('en-gb'));
        list = list.concat(sysGb);
      }
    } else if (cat === 'en-us') {
      list = NEURAL_TTS_VOICES.filter(v => v.category === 'en-us');
      if (state.availableVoices && state.availableVoices.length > 0) {
        const sysUs = state.availableVoices.filter(v => v.lang.toLowerCase().includes('en-us'));
        list = list.concat(sysUs);
      }
    } else {
      list = [...NEURAL_TTS_VOICES];
      if (state.availableVoices && state.availableVoices.length > 0) {
        list = list.concat(state.availableVoices);
      }
    }

    list.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      const isNeural = v.isNeural || isHumanOrNeuralVoice(v);
      opt.textContent = `${isNeural ? '✨ ' : ''}${v.name} (${v.lang})${v.default ? ' [Default]' : ''}`;
      if (state.selectedVoice && (v.name === state.selectedVoice.name || (v.id && v.id === state.selectedVoice.id))) {
        opt.selected = true;
      }
      els.voiceSelect.appendChild(opt);
    });

    if (els.voiceSelect.selectedIndex === -1 && els.voiceSelect.children.length > 0) {
      els.voiceSelect.selectedIndex = 0;
      const firstVoiceName = els.voiceSelect.value;
      state.selectedVoice = list.find(v => v.name === firstVoiceName) || list[0];
    } else if (els.voiceSelect.value) {
      const curVoiceName = els.voiceSelect.value;
      state.selectedVoice = list.find(v => v.name === curVoiceName) || list[0];
    }
  }

  async function populateMicSelect(requestPermission = false) {
    if (!els.micSelect || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      if (requestPermission) {
        if (els.micStatusLabel) {
          els.micStatusLabel.textContent = 'Scanning...';
          els.micStatusLabel.style.color = 'var(--ice-blue)';
        }
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach(t => t.stop());
        } catch (permErr) {
          console.warn('Microphone permission notice:', permErr);
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      
      els.micSelect.innerHTML = '';
      const defaultOpt = document.createElement('option');
      defaultOpt.value = 'default';
      defaultOpt.textContent = 'Default System Microphone';
      els.micSelect.appendChild(defaultOpt);

      audioInputs.forEach((d, idx) => {
        if (d.deviceId !== 'default') {
          const opt = document.createElement('option');
          opt.value = d.deviceId;
          opt.textContent = d.label || `Microphone ${idx + 1} (${d.deviceId.substring(0, 8)}...)`;
          if (d.deviceId === state.selectedMicId) opt.selected = true;
          els.micSelect.appendChild(opt);
        }
      });

      if (els.micStatusLabel) {
        els.micStatusLabel.textContent = `${audioInputs.length} device(s) online`;
        els.micStatusLabel.style.color = 'var(--emerald-nominal)';
      }

      await populateSpeakerSelect();
    } catch (e) {
      console.warn('Microphone enumeration notice:', e);
    }
  }

  async function populateSpeakerSelect() {
    if (!els.speakerSelect || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

      els.speakerSelect.innerHTML = '';
      const defaultOpt = document.createElement('option');
      defaultOpt.value = 'default';
      defaultOpt.textContent = 'Default System Output (Speakers/Headset)';
      els.speakerSelect.appendChild(defaultOpt);

      audioOutputs.forEach((d, idx) => {
        if (d.deviceId !== 'default') {
          const opt = document.createElement('option');
          opt.value = d.deviceId;
          opt.textContent = d.label || `Speaker / Headset ${idx + 1} (${d.deviceId.substring(0, 8)}...)`;
          if (d.deviceId === state.selectedSpeakerId) opt.selected = true;
          els.speakerSelect.appendChild(opt);
        }
      });

      if (els.speakerStatusLabel) {
        els.speakerStatusLabel.textContent = `${audioOutputs.length > 0 ? audioOutputs.length : 1} device(s) ready`;
        els.speakerStatusLabel.style.color = 'var(--emerald-nominal)';
      }

      if (state.selectedSpeakerId) {
        els.speakerSelect.value = state.selectedSpeakerId;
        applyAudioSink(state.selectedSpeakerId);
      }
    } catch (e) {
      console.warn('Speaker enumeration notice:', e);
    }
  }

  function applyAudioSink(sinkId) {
    if (state.audioCtx && typeof state.audioCtx.setSinkId === 'function') {
      try {
        state.audioCtx.setSinkId(sinkId || 'default');
      } catch (e) {
        console.warn('AudioContext setSinkId notice:', e);
      }
    }
  }

  function testSpeakerOutput() {
    initAudioContext();
    applyAudioSink(state.selectedSpeakerId);
    playTone([523.25, 659.25, 783.99], 0.22, 'sine');
    if (els.speakerStatusLabel) {
      els.speakerStatusLabel.textContent = 'Playing Chime...';
      setTimeout(() => {
        els.speakerStatusLabel.textContent = 'Ready';
      }, 1500);
    }
  }

  function saveSettings() {
    const settings = {
      activeModel: state.activeModel,
      activeVisionModel: state.activeVisionModel,
      micId: state.selectedMicId,
      speakerId: state.selectedSpeakerId,
      voiceName: state.selectedVoice ? state.selectedVoice.name : '',
      voiceCategory: state.voiceCategory,
      language: state.currentLanguage,
      voiceRate: state.voiceRate,
      voicePitch: state.voicePitch,
      voiceVolume: state.voiceVolume,
      autoSpeak: state.autoSpeak,
      audioMuted: state.audioMuted,
      streamFps: state.streamFps,
      spacebarMode: state.spacebarMode,
      leftCollapsed: state.leftCollapsed,
      feedCollapsed: state.feedCollapsed,
      sessionsCollapsed: state.sessionsCollapsed
    };
    try {
      localStorage.setItem('orion_config_v2', JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save error:', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem('orion_config_v2');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.activeModel) {
        state.activeModel = s.activeModel;
        if (els.modelSelect) els.modelSelect.value = s.activeModel;
      }
      if (s.activeVisionModel) {
        state.activeVisionModel = s.activeVisionModel;
        if (els.visionModelSelect) els.visionModelSelect.value = s.activeVisionModel;
      }
      if (s.language) {
        state.currentLanguage = s.language;
        if (els.languageSelect) els.languageSelect.value = s.language;
      }
      if (s.micId) state.selectedMicId = s.micId;
      if (s.speakerId) {
        state.selectedSpeakerId = s.speakerId;
        applyAudioSink(s.speakerId);
      }
      if (s.voiceCategory) state.voiceCategory = s.voiceCategory;
      if (s.voiceRate !== undefined) state.voiceRate = parseFloat(s.voiceRate);
      if (s.voicePitch !== undefined) state.voicePitch = parseFloat(s.voicePitch);
      if (s.voiceVolume !== undefined) state.voiceVolume = parseFloat(s.voiceVolume);
      if (s.autoSpeak !== undefined) state.autoSpeak = Boolean(s.autoSpeak);
      if (s.audioMuted !== undefined) state.audioMuted = Boolean(s.audioMuted);
      if (s.streamFps !== undefined) state.streamFps = parseFloat(s.streamFps);
      if (s.spacebarMode) {
        state.spacebarMode = s.spacebarMode;
      } else {
        state.spacebarMode = 'toggle';
      }
      if (els.spacebarModeSelect) {
        els.spacebarModeSelect.value = state.spacebarMode;
      }
      if (s.leftCollapsed !== undefined) {
        state.leftCollapsed = Boolean(s.leftCollapsed);
        if (els.hudMain) els.hudMain.classList.toggle('left-collapsed', state.leftCollapsed);
        if (els.toggleLeftWingBtn) els.toggleLeftWingBtn.textContent = state.leftCollapsed ? 'SENSORS ▸' : '◂ SENSORS';
      }
      if (s.feedCollapsed !== undefined) {
        state.feedCollapsed = Boolean(s.feedCollapsed);
        if (els.hudMain) els.hudMain.classList.toggle('feed-collapsed', state.feedCollapsed);
      }
      if (s.sessionsCollapsed !== undefined) {
        state.sessionsCollapsed = Boolean(s.sessionsCollapsed);
        if (els.hudMain) els.hudMain.classList.toggle('sessions-collapsed', state.sessionsCollapsed);
      }

      if (s.voiceName && state.availableVoices && state.availableVoices.length > 0) {
        const found = state.availableVoices.find(v => v.name === s.voiceName);
        if (found) state.selectedVoice = found;
      }

      if (els.voiceRateSlider && els.voiceRateVal) {
        els.voiceRateSlider.value = state.voiceRate;
        els.voiceRateVal.textContent = `${state.voiceRate.toFixed(2)}x`;
      }
      if (els.voicePitchSlider && els.voicePitchVal) {
        els.voicePitchSlider.value = state.voicePitch;
        els.voicePitchVal.textContent = `${state.voicePitch.toFixed(2)}x`;
      }
      if (els.voiceVolumeSlider && els.voiceVolumeVal) {
        els.voiceVolumeSlider.value = Math.round(state.voiceVolume * 100);
        els.voiceVolumeVal.textContent = `${Math.round(state.voiceVolume * 100)}%`;
      }
      if (els.voiceCategorySelect) {
        els.voiceCategorySelect.value = state.voiceCategory;
      }
      if (els.spacebarModeSelect) {
        els.spacebarModeSelect.value = state.spacebarMode;
      }
      if (els.speechToggle) {
        els.speechToggle.textContent = state.autoSpeak ? 'VOICE: ON' : 'VOICE: OFF';
      }
      if (els.muteToggle) {
        els.muteToggle.textContent = state.audioMuted ? 'SFX: OFF' : 'SFX: ON';
      }
      if (els.streamFpsSelect) {
        els.streamFpsSelect.value = state.streamFps.toString();
      }
      if (els.modelSelect && state.activeModel) {
        els.modelSelect.value = state.activeModel;
      }
      if (els.visionModelSelect && state.activeVisionModel) {
        els.visionModelSelect.value = state.activeVisionModel;
      }
      if (els.hudMain) {
        els.hudMain.classList.toggle('left-collapsed', !!state.leftCollapsed);
        els.hudMain.classList.toggle('feed-collapsed', !!state.feedCollapsed);
        els.hudMain.classList.toggle('sessions-collapsed', !!state.sessionsCollapsed);
      }
      if (els.toggleLeftWingBtn) {
        els.toggleLeftWingBtn.textContent = state.leftCollapsed ? 'SENSORS ▸' : '◂ SENSORS';
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  }

  function toggleLeftWing(force) {
    state.leftCollapsed = force !== undefined ? force : !state.leftCollapsed;
    if (els.hudMain) {
      els.hudMain.classList.toggle('left-collapsed', state.leftCollapsed);
    }
    if (els.toggleLeftWingBtn) {
      els.toggleLeftWingBtn.textContent = state.leftCollapsed ? 'SENSORS ▸' : '◂ SENSORS';
    }
    saveSettings();
    initAudioContext();
    setTimeout(() => resizeCanvas(), 360);
  }

  function toggleFeedPanel(force) {
    state.feedCollapsed = force !== undefined ? force : !state.feedCollapsed;
    if (els.hudMain) {
      els.hudMain.classList.toggle('feed-collapsed', state.feedCollapsed);
    }
    saveSettings();
    initAudioContext();
    setTimeout(() => resizeCanvas(), 360);
  }

  function toggleSessionsPanel(force) {
    state.sessionsCollapsed = force !== undefined ? force : !state.sessionsCollapsed;
    if (els.hudMain) {
      els.hudMain.classList.toggle('sessions-collapsed', state.sessionsCollapsed);
    }
    saveSettings();
    initAudioContext();
    setTimeout(() => resizeCanvas(), 360);
  }

  let userAudioStream = null;
  let mediaRecorder = null;
  let recordedAudioChunks = [];
  let vadCheckTimer = null;
  let lastAudioActivity = 0;
  let vadSpeakingDetected = false;

  async function getActiveAudioStream() {
    if (userAudioStream && userAudioStream.active) {
      return userAudioStream;
    }
    try {
      const constraints = {
        audio: state.selectedMicId && state.selectedMicId !== 'default'
          ? { deviceId: { exact: state.selectedMicId } }
          : true
      };
      userAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
      return userAudioStream;
    } catch (e) {
      console.warn('getUserMedia audio stream error:', e);
      return null;
    }
  }

  async function sendLocalAudioForTranscription(audioBlob) {
    if (!audioBlob || audioBlob.size < 1200) {
      return null;
    }
    try {
      updateVoiceHearingBadge('⚡ Transcribing locally with Whisper...', true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'mic.webm');
      formData.append('language', state.currentLanguage || 'en');

      const res = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('STT HTTP ' + res.status);
      }
      const data = await res.json();
      return (data.text || '').trim();
    } catch (err) {
      console.warn('Local Whisper STT error:', err);
      return null;
    }
  }

  async function startListening() {
    initAudioContext();
    if (state.isSpeaking || isSpeakingQueue) {
      cancelSpeech();
    }
    if (vadSilenceTimer) {
      clearTimeout(vadSilenceTimer);
      vadSilenceTimer = null;
    }
    if (vadCheckTimer) {
      clearInterval(vadCheckTimer);
      vadCheckTimer = null;
    }

    pendingVoiceTranscript = '';
    currentInterimTranscript = '';
    state.isListening = true;
    setInteractionState('listening');
    updateVoiceHearingBadge('', true);
    sfx.listening();

    // 1. Start browser speech recognition if available (for real-time interim preview)
    if (state.speechRecognition) {
      try {
        state.speechRecognition.lang = state.currentLanguage === 'he' ? 'he-IL' : 'en-US';
        state.speechRecognition.start();
      } catch (e) {}
    }

    // 2. Start local MediaRecorder audio capture on user's verified working microphone
    try {
      const stream = await getActiveAudioStream();
      if (stream) {
        recordedAudioChunks = [];
        const recorderOptions = { audioBitsPerSecond: 128000 };
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recorderOptions.mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recorderOptions.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          recorderOptions.mimeType = 'audio/ogg';
        }

        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedAudioChunks.push(e.data);
          }
        };
        mediaRecorder.start(100);

        // Connect stream to analyser for real-time sound activity detection
        if (state.audioCtx) {
          if (state.audioCtx.state === 'suspended') await state.audioCtx.resume();
          if (!state.micSourceNode) {
            state.micSourceNode = state.audioCtx.createMediaStreamSource(stream);
            state.micSourceNode.connect(state.analyserNode);
          }
        }

        vadSpeakingDetected = false;
        lastAudioActivity = Date.now();

        // Real-time Audio VAD monitor
        const dataArray = new Uint8Array(state.analyserNode.frequencyBinCount);
        vadCheckTimer = setInterval(() => {
          if (!state.isListening) return;
          state.analyserNode.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const pct = Math.min(100, Math.round((avg / 128) * 100));

          if (pct > 3) {
            vadSpeakingDetected = true;
            lastAudioActivity = Date.now();
          }

          // If user spoke and then fell silent for 700ms, auto-dispatch briskly
          if (state.spacebarMode === 'toggle' && vadSpeakingDetected && (Date.now() - lastAudioActivity > (state.silenceThresholdMs || 700))) {
            clearInterval(vadCheckTimer);
            vadCheckTimer = null;
            finishAndDispatchVoice();
          }
        }, 80);
      }
    } catch (e) {
      console.warn('MediaRecorder audio capture exception:', e);
    }
  }

  async function stopListening() {
    state.isListening = false;
    if (vadSilenceTimer) {
      clearTimeout(vadSilenceTimer);
      vadSilenceTimer = null;
    }
    if (vadCheckTimer) {
      clearInterval(vadCheckTimer);
      vadCheckTimer = null;
    }
    if (state.speechRecognition) {
      try { state.speechRecognition.stop(); } catch (e) {}
    }
    setInteractionState('idle');
  }

  let conversationalSleepTimer = null;

  function isExitPhrase(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    const exitWords = [
      'bye', 'goodbye', 'stop', 'standby', 'sleep', 'shut up', 'cancel', 'exit', 'quit',
      'להתראות', 'ביי', 'תודה ביי', 'שתוק', 'עצור', 'לישון', 'מספיק', 'צא'
    ];
    return exitWords.some(w => lower.includes(w));
  }

  function checkConversationalTurnArm() {
    if (state.continuousConversation && state.autoSpeak && !state.isProcessing && !isSpeakingQueue && speechQueue.length === 0) {
      if (document.activeElement === els.chatInput || isEditableElement(document.activeElement)) {
        return;
      }
      setTimeout(() => {
        if (!state.isProcessing && !state.isSpeaking && !state.isListening && state.continuousConversation) {
          startListening();
          if (conversationalSleepTimer) clearTimeout(conversationalSleepTimer);
          conversationalSleepTimer = setTimeout(() => {
            if (state.isListening && !vadSpeakingDetected) {
              state.continuousConversation = false;
              stopListening();
              updateVoiceHearingBadge('', false);
            }
          }, 12000);
        }
      }, 140);
    }
  }

  async function finishAndDispatchVoice() {
    pendingVoiceTranscript = '';
    currentInterimTranscript = '';

    await stopListening();

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedAudioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        recordedAudioChunks = [];

        // 100% Local Whisper Neural Transcription (Authoritative & Offline)
        const finalText = await sendLocalAudioForTranscription(audioBlob);

        if (finalText && finalText.trim().length > 0 && !state.isProcessing) {
          if (isExitPhrase(finalText)) {
            state.continuousConversation = false;
          } else {
            state.continuousConversation = true;
          }
          updateVoiceHearingBadge(finalText, true);
          if (els.chatInput && document.activeElement !== els.chatInput) els.chatInput.value = '';
          sendUserMessage(finalText.trim(), 'voice');
        } else {
          updateVoiceHearingBadge('', false);
          if (state.continuousConversation) {
            checkConversationalTurnArm();
          }
        }
      };
      try { mediaRecorder.stop(); } catch (e) {}
    } else {
      updateVoiceHearingBadge('', false);
      if (state.continuousConversation) {
        checkConversationalTurnArm();
      }
    }
  }

  function toggleListening() {
    initAudioContext();
    if (state.isListening) {
      finishAndDispatchVoice();
    } else {
      startListening();
    }
  }

  function extractReadySpeechChunk(buffer) {
    if (!buffer || buffer.trim().length < 3) return null;
    const match = buffer.match(/^([\s\S]*?[.!?:\n])([\s\S]*)$/);
    if (match && match[1].trim().length >= 2) {
      return { chunk: match[1].trim(), remainder: match[2] || '' };
    }
    if (buffer.length > 45) {
      const clauseMatch = buffer.match(/^([\s\S]*?[,;—\u05BE])([\s\S]*)$/);
      if (clauseMatch && clauseMatch[1].trim().length >= 8) {
        return { chunk: clauseMatch[1].trim(), remainder: clauseMatch[2] || '' };
      }
    }
    return null;
  }

  let speechQueue = [];
  let isSpeakingQueue = false;
  let currentAudioSource = null;
  let currentAudioEl = null;

  function cancelSpeech() {
    speechQueue = [];
    isSpeakingQueue = false;
    if (currentAudioSource) {
      try { currentAudioSource.stop(); } catch (e) {}
      currentAudioSource = null;
    }
    if (currentAudioEl) {
      try {
        currentAudioEl.pause();
        currentAudioEl.src = '';
      } catch (e) {}
      currentAudioEl = null;
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (state.isSpeaking) {
      setInteractionState('idle');
    }
  }

  async function prefetchAudioChunk(item) {
    if (!item || item.audioBuffer || item.isFetching) return;
    item.isFetching = true;
    const text = item.text;
    const hasHebrew = anyHebrewChar(text) || state.currentLanguage === 'he';
    const isNeuralEdge = (state.selectedVoice && state.selectedVoice.isNeural) || hasHebrew;

    if (isNeuralEdge) {
      try {
        const voiceId = (state.selectedVoice && state.selectedVoice.id)
          ? state.selectedVoice.id
          : (hasHebrew ? 'he-IL-AvriNeural' : 'en-GB-RyanNeural');

        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            voice: voiceId,
            language: state.currentLanguage,
            rate: state.voiceRate,
            pitch: state.voicePitch
          })
        });

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          initAudioContext();
          if (state.audioCtx) {
            item.audioBuffer = await state.audioCtx.decodeAudioData(arrayBuf);
          }
        }
      } catch (e) {
        console.warn('TTS prefetch note:', e);
      }
    }
    item.isFetching = false;
  }

  function queueSpeechChunk(text) {
    if (!state.autoSpeak) return;
    const clean = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, '')
      .trim();
    if (!clean || clean.length < 2) return;

    const item = { text: clean, audioBuffer: null, isFetching: false };
    speechQueue.push(item);
    // Pre-fetch immediately in background for zero-gap playback
    prefetchAudioChunk(item);
    processSpeechQueue();
  }

  async function processSpeechQueue() {
    if (isSpeakingQueue || speechQueue.length === 0) return;
    if (!state.autoSpeak) return;

    const nextItem = speechQueue.shift();
    if (!nextItem) return;

    // Trigger pre-fetching for next items in queue
    if (speechQueue.length > 0) {
      prefetchAudioChunk(speechQueue[0]);
    }

    isSpeakingQueue = true;
    setInteractionState('speaking');

    // If not yet pre-fetched, wait for fetch
    if (!nextItem.audioBuffer && !nextItem.isFetching) {
      await prefetchAudioChunk(nextItem);
    } else if (nextItem.isFetching) {
      let attempts = 0;
      while (nextItem.isFetching && attempts < 25) {
        await new Promise(r => setTimeout(r, 30));
        attempts++;
      }
    }

    initAudioContext();

    if (nextItem.audioBuffer && state.audioCtx) {
      try {
        if (state.audioCtx.state === 'suspended') await state.audioCtx.resume();
        const source = state.audioCtx.createBufferSource();
        source.buffer = nextItem.audioBuffer;

        const gainNode = state.audioCtx.createGain();
        gainNode.gain.value = Math.min(1.0, Math.max(0.0, state.voiceVolume));

        if (state.analyserNode) {
          source.connect(gainNode);
          gainNode.connect(state.analyserNode);
          state.analyserNode.connect(state.audioCtx.destination);
        } else {
          source.connect(gainNode);
          gainNode.connect(state.audioCtx.destination);
        }

        currentAudioSource = source;
        source.onended = () => {
          currentAudioSource = null;
          isSpeakingQueue = false;
          if (speechQueue.length > 0) {
            processSpeechQueue(); // Gapless immediate jump to next sentence!
          } else {
            setInteractionState('idle');
            checkConversationalTurnArm();
          }
        };

        source.start(0);
        return;
      } catch (err) {
        console.warn('AudioBuffer gapless playback error:', err);
      }
    }

    // Fallback if browser speech synthesis
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(nextItem.text);
      if (state.selectedVoice && !state.selectedVoice.isNeural) {
        utterance.voice = state.selectedVoice;
      }
      utterance.rate = state.voiceRate;
      utterance.pitch = state.voicePitch;
      utterance.volume = Math.min(1.0, Math.max(0.0, state.voiceVolume));

      utterance.onstart = () => {
        setInteractionState('speaking');
      };

      utterance.onend = () => {
        isSpeakingQueue = false;
        if (speechQueue.length > 0) {
          processSpeechQueue();
        } else {
          setInteractionState('idle');
          checkConversationalTurnArm();
        }
      };

      utterance.onerror = () => {
        isSpeakingQueue = false;
        if (speechQueue.length > 0) {
          processSpeechQueue();
        } else {
          setInteractionState('idle');
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      isSpeakingQueue = false;
      if (speechQueue.length > 0) processSpeechQueue();
      else setInteractionState('idle');
    }
  }

  function speakResponse(text) {
    cancelSpeech();
    queueSpeechChunk(text);
  }

  function setInteractionState(mode) {
    state.isListening = mode === 'listening';
    state.isSpeaking = mode === 'speaking';
    state.isProcessing = mode === 'processing';

    if (!els.interactionCore || !els.coreLabel) return;
    els.interactionCore.className = 'core-interaction-node ' + (mode !== 'idle' ? mode : '');

    if (mode === 'listening') {
      els.coreLabel.textContent = 'LISTENING';
    } else if (mode === 'speaking') {
      els.coreLabel.textContent = 'TRANSMITTING';
    } else if (mode === 'processing') {
      els.coreLabel.textContent = 'PROCESSING';
    } else {
      els.coreLabel.textContent = 'STANDBY';
    }
  }

  // ==========================================================================
  // 4. LIVE MIC VU VOLUME TEST
  // ==========================================================================

  let micTestStream = null;
  let micTestCtx = null;
  let micTestAnalyser = null;
  let micTestAnimId = null;

  async function toggleMicTest() {
    if (state.isTestingMic) {
      stopMicTest();
    } else {
      await startMicTest();
    }
  }

  async function startMicTest() {
    try {
      stopMicTest();
      initAudioContext();
      
      const constraints = {
        audio: state.selectedMicId && state.selectedMicId !== 'default'
          ? { deviceId: { exact: state.selectedMicId } }
          : true
      };

      micTestStream = await navigator.mediaDevices.getUserMedia(constraints);
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      micTestCtx = new AudioCtxClass();
      const source = micTestCtx.createMediaStreamSource(micTestStream);
      micTestAnalyser = micTestCtx.createAnalyser();
      micTestAnalyser.fftSize = 256;
      micTestAnalyser.smoothingTimeConstant = 0.35;
      source.connect(micTestAnalyser);

      state.isTestingMic = true;
      if (els.toggleMicTestBtn) {
        els.toggleMicTestBtn.textContent = 'Stop Mic Test';
        els.toggleMicTestBtn.classList.add('primary');
      }

      function updateMicLevel() {
        if (!state.isTestingMic || !micTestAnalyser) return;
        const dataArray = new Uint8Array(micTestAnalyser.frequencyBinCount);
        micTestAnalyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const rawPct = Math.min(100, Math.round((avg / 110) * 100));
        
        if (els.micMeterFill) els.micMeterFill.style.width = `${rawPct}%`;
        if (els.micLevelText) {
          els.micLevelText.textContent = `${rawPct}%`;
          if (rawPct > 85) els.micLevelText.style.color = 'var(--crimson-alert)';
          else if (rawPct > 50) els.micLevelText.style.color = 'var(--amber-telemetry)';
          else els.micLevelText.style.color = 'var(--ice-blue)';
        }

        micTestAnimId = requestAnimationFrame(updateMicLevel);
      }

      micTestAnimId = requestAnimationFrame(updateMicLevel);
      sfx.activate();
    } catch (err) {
      console.warn('Microphone test access error:', err);
      if (els.micStatusLabel) {
        els.micStatusLabel.textContent = 'Permission Denied';
        els.micStatusLabel.style.color = 'var(--crimson-alert)';
      }
      stopMicTest();
    }
  }

  function stopMicTest() {
    state.isTestingMic = false;
    if (micTestAnimId) {
      cancelAnimationFrame(micTestAnimId);
      micTestAnimId = null;
    }
    if (micTestStream) {
      micTestStream.getTracks().forEach(t => t.stop());
      micTestStream = null;
    }
    if (micTestCtx && micTestCtx.state !== 'closed') {
      try { micTestCtx.close(); } catch (e) {}
      micTestCtx = null;
    }
    micTestAnalyser = null;

    if (els.toggleMicTestBtn) {
      els.toggleMicTestBtn.textContent = 'Test Mic';
      els.toggleMicTestBtn.classList.remove('primary');
    }
    if (els.micMeterFill) els.micMeterFill.style.width = '0%';
    if (els.micLevelText) {
      els.micLevelText.textContent = '0%';
      els.micLevelText.style.color = 'var(--ice-blue)';
    }
  }

  // ==========================================================================
  // 5. SCREEN & WEBCAM VISION CAPTURE & LIVE STREAMING
  // ==========================================================================

  let screenStream = null;
  let streamTimerId = null;
  let lastLiveFrameData = null;

  async function toggleScreenStream() {
    if (state.isScreenStreaming) {
      stopScreenStream();
    } else {
      await startScreenStream();
    }
  }

  async function startScreenStream() {
    initAudioContext();
    sfx.activate();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: { ideal: 15 } },
        audio: false
      });

      screenStream = stream;
      state.isScreenStreaming = true;

      if (els.visionLiveVideo) {
        els.visionLiveVideo.srcObject = stream;
        els.visionLiveVideo.style.display = 'block';
        await els.visionLiveVideo.play();
      }

      if (els.visionBox) {
        els.visionBox.classList.add('streaming');
      }

      if (els.shareScreenBtn) {
        els.shareScreenBtn.textContent = 'Stop Stream';
        els.shareScreenBtn.classList.add('streaming-active');
      }

      // Handle user stopping screen share from OS browser banner
      stream.getVideoTracks()[0].onended = () => {
        stopScreenStream();
      };

      updateStreamFps();
      appendTranscript('assistant', 'Screen stream established. Orion is now actively observing your display for continuous assistance.');
      speakResponse('Screen stream active. I am observing your display.');
    } catch (err) {
      console.warn('Screen share cancelled or failed', err);
      stopScreenStream();
    }
  }

  function stopScreenStream() {
    state.isScreenStreaming = false;
    if (streamTimerId) {
      clearInterval(streamTimerId);
      streamTimerId = null;
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStream = null;
    }
    if (els.visionLiveVideo) {
      els.visionLiveVideo.srcObject = null;
      els.visionLiveVideo.style.display = 'none';
    }
    if (els.visionBox) {
      els.visionBox.classList.remove('streaming');
    }
    if (els.shareScreenBtn) {
      els.shareScreenBtn.textContent = 'Share Screen';
      els.shareScreenBtn.classList.remove('streaming-active');
    }
    lastLiveFrameData = null;
    sfx.click();
  }

  function updateStreamFps() {
    if (streamTimerId) clearInterval(streamTimerId);
    if (!state.isScreenStreaming) return;

    state.streamFps = parseFloat(els.streamFpsSelect ? els.streamFpsSelect.value : '1.0') || 1.0;
    if (els.currentFpsBadge) {
      els.currentFpsBadge.textContent = `${state.streamFps.toFixed(1)} FPS`;
    }

    const intervalMs = Math.round(1000 / state.streamFps);
    captureLiveStreamFrame();
    streamTimerId = setInterval(captureLiveStreamFrame, intervalMs);
  }

  function captureLiveStreamFrame() {
    if (!state.isScreenStreaming || !els.visionLiveVideo || els.visionLiveVideo.videoWidth === 0) return;
    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = els.visionLiveVideo.videoWidth;
      offCanvas.height = els.visionLiveVideo.videoHeight;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(els.visionLiveVideo, 0, 0, offCanvas.width, offCanvas.height);
      lastLiveFrameData = offCanvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn('Frame capture notice', e);
    }
  }

  async function captureScreen() {
    initAudioContext();
    sfx.snap();
    try {
      setVisionScanning(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const offCanvas = document.createElement('canvas');
      offCanvas.width = video.videoWidth;
      offCanvas.height = video.videoHeight;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

      stream.getTracks().forEach(track => track.stop());

      const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
      showVisionPreview(dataUrl);

      await sendVisionAnalysis(dataUrl, 'Analyze this screen capture with crisp precision. Summarize visible windows, content, or notable anomalies.');
    } catch (err) {
      console.warn('Screen capture cancelled or failed', err);
      setVisionScanning(false);
    }
  }

  async function captureWebcam() {
    initAudioContext();
    sfx.snap();
    try {
      setVisionScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const offCanvas = document.createElement('canvas');
      offCanvas.width = video.videoWidth;
      offCanvas.height = video.videoHeight;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

      stream.getTracks().forEach(track => track.stop());

      const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
      showVisionPreview(dataUrl);

      await sendVisionAnalysis(dataUrl, 'Describe what you observe through this optical sensor.');
    } catch (err) {
      console.warn('Webcam capture cancelled or failed', err);
      setVisionScanning(false);
    }
  }

  function showVisionPreview(dataUrl) {
    if (!els.visionPreview || !els.visionPlaceholder) return;
    els.visionPreview.src = dataUrl;
    els.visionPreview.style.display = 'block';
    els.visionPlaceholder.style.display = 'none';
  }

  function setVisionScanning(isScanning) {
    if (!els.visionBox) return;
    if (isScanning) els.visionBox.classList.add('scanning');
    else els.visionBox.classList.remove('scanning');
  }

  async function sendVisionAnalysis(imageDataUrl, prompt) {
    appendTranscript('user', `[Optical Capture] ${prompt}`);
    setInteractionState('processing');
    sfx.processing();

    const t0 = performance.now();
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          prompt: prompt,
          model: state.activeVisionModel
        })
      });

      const data = await res.json();
      setVisionScanning(false);

      if (res.ok && data.response) {
        state.latencyMs = Math.round(performance.now() - t0);
        updateLatencyDisplay();
        sfx.ready();
        appendTranscript('assistant', data.response);
        speakResponse(data.response);
      } else {
        appendTranscript('assistant', `Vision analysis failure: ${data.detail || 'Unknown error'}`);
        setInteractionState('idle');
      }
    } catch (e) {
      setVisionScanning(false);
      setInteractionState('idle');
      appendTranscript('assistant', `Visual sensor offline: ${e.message}`);
    }
  }

  // ==========================================================================
  // 6. CONVERSATION DISPATCHER & TELEMETRY
  // ==========================================================================

  function updateModelSpecsUI() {
    const models = (state.modelsFull && state.modelsFull.length > 0) ? state.modelsFull : DEFAULT_MODELS_FULL;
    const visionModels = (state.visionModelsFull && state.visionModelsFull.length > 0) ? state.visionModelsFull : DEFAULT_VISION_MODELS_FULL;

    const currentBrain = models.find(m => m.name === state.activeModel) || models[0];
    if (currentBrain) {
      if (els.brainSpecsName) els.brainSpecsName.textContent = currentBrain.name;
      if (els.brainSpecsTier) {
        const tier = currentBrain.resource_tier || 'MEDIUM';
        els.brainSpecsTier.textContent = tier;
        els.brainSpecsTier.className = `tier-badge ${tier}`;
      }
      if (els.activeBrainBadge) {
        const tier = currentBrain.resource_tier || 'MEDIUM';
        els.activeBrainBadge.textContent = tier;
        els.activeBrainBadge.className = `tier-badge ${tier}`;
      }
      if (els.brainSpecsRam) {
        const sizeStr = currentBrain.size_gb ? `⚡ ~${currentBrain.size_gb} GB RAM` : (currentBrain.size ? `⚡ ~${(currentBrain.size / (1024**3)).toFixed(1)} GB RAM` : '⚡ Local Neural');
        els.brainSpecsRam.textContent = sizeStr;
      }
      if (els.brainSpecsDesc) {
        els.brainSpecsDesc.textContent = currentBrain.description || 'Local conversational reasoning intelligence.';
      }
      if (els.settingsBrainSelect) els.settingsBrainSelect.value = currentBrain.name;
      if (els.modelSelect) els.modelSelect.value = currentBrain.name;
    }

    const currentVision = visionModels.find(m => m.name === state.activeVisionModel) || visionModels[0];
    if (currentVision) {
      if (els.visionSpecsName) els.visionSpecsName.textContent = currentVision.name;
      if (els.visionSpecsTier) {
        const tier = currentVision.resource_tier || 'LOW';
        els.visionSpecsTier.textContent = tier;
        els.visionSpecsTier.className = `tier-badge ${tier}`;
      }
      if (els.activeVisionBadge) {
        const tier = currentVision.resource_tier || 'LOW';
        els.activeVisionBadge.textContent = tier;
        els.activeVisionBadge.className = `tier-badge ${tier}`;
      }
      if (els.visionSpecsRam) {
        const sizeStr = currentVision.size_gb ? `⚡ ~${currentVision.size_gb} GB RAM` : (currentVision.size ? `⚡ ~${(currentVision.size / (1024**3)).toFixed(1)} GB RAM` : '⚡ Multimodal');
        els.visionSpecsRam.textContent = sizeStr;
      }
      if (els.visionSpecsDesc) {
        els.visionSpecsDesc.textContent = currentVision.description || 'Local multimodal vision recognition model.';
      }
      if (els.settingsVisionSelect) els.settingsVisionSelect.value = currentVision.name;
      if (els.visionModelSelect) els.visionModelSelect.value = currentVision.name;
    }
  }

  async function loadTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      state.connected = data.status === 'nominal';

      if (data.models_full && data.models_full.length > 0) {
        state.modelsFull = data.models_full;
      }
      if (data.vision_models_full && data.vision_models_full.length > 0) {
        state.visionModelsFull = data.vision_models_full;
      }

      if (!state.activeModel || (data.models && !data.models.includes(state.activeModel))) {
        state.activeModel = data.default_model || (data.models && data.models[0]) || 'llama3:latest';
      }

      if (!state.activeVisionModel || (data.vision_models && !data.vision_models.includes(state.activeVisionModel))) {
        state.activeVisionModel = data.default_vision_model || (data.vision_models && data.vision_models[0]) || 'llava:latest';
      }

      if (els.statusDot && els.statusText) {
        els.statusDot.className = 'status-dot ' + (state.connected ? 'nominal' : 'degraded');
        els.statusText.textContent = state.connected ? 'ORION NOMINAL' : 'OFFLINE';
      }

      if (els.memoryCountBadge && data.database) {
        els.memoryCountBadge.textContent = data.database.total_memories;
      }
      if (els.settingsMemoryCount && data.database) {
        els.settingsMemoryCount.textContent = data.database.total_memories;
      }

      function getModelTier(mObj, name) {
        if (mObj && mObj.resource_tier) return mObj.resource_tier;
        const n = (name || '').toLowerCase();
        if (n.includes('30b') || n.includes('32b') || n.includes('70b') || n.includes('72b')) return 'HIGH';
        if (n.includes('14b') || n.includes('8b') || n.includes('7b') || n.includes('llama3') || n.includes('llava')) return 'MEDIUM';
        return 'LOW';
      }

      // Populate text model dropdowns (header and settings)
      const modelsList = (data.models && data.models.length > 0) ? data.models : state.modelsFull.map(m => m.name);
      [els.modelSelect, els.settingsBrainSelect].forEach(selectEl => {
        if (!selectEl) return;
        const currentVal = state.activeModel;
        selectEl.innerHTML = '';
        modelsList.forEach(m => {
          const mName = typeof m === 'string' ? m : m.name;
          const fullInfo = (state.modelsFull || []).find(f => f.name === mName);
          const tier = getModelTier(fullInfo, mName);
          const opt = document.createElement('option');
          opt.value = mName;
          opt.textContent = `${mName} [${tier}]`;
          if (mName === currentVal) opt.selected = true;
          selectEl.appendChild(opt);
        });
        selectEl.value = currentVal;
      });

      // Populate vision model dropdowns (header and settings)
      const visionList = (data.vision_models && data.vision_models.length > 0) ? data.vision_models : state.visionModelsFull.map(m => m.name);
      [els.visionModelSelect, els.settingsVisionSelect].forEach(selectEl => {
        if (!selectEl) return;
        const currentVal = state.activeVisionModel;
        selectEl.innerHTML = '';
        visionList.forEach(m => {
          const mName = typeof m === 'string' ? m : m.name;
          const fullInfo = (state.visionModelsFull || []).find(f => f.name === mName);
          const tier = getModelTier(fullInfo, mName);
          const opt = document.createElement('option');
          opt.value = mName;
          opt.textContent = `${mName} [${tier}]`;
          if (mName === currentVal) opt.selected = true;
          selectEl.appendChild(opt);
        });
        selectEl.value = currentVal;
      });

      try {
        updateModelSpecsUI();
        renderDetailedModelCards();
      } catch (uiErr) {
        console.warn('UI card render notice:', uiErr);
      }
    } catch (e) {
      console.warn('Telemetry load failed:', e);
      if (els.statusDot && els.statusText) {
        els.statusDot.className = 'status-dot degraded';
        els.statusText.textContent = 'DISCONNECTED';
      }
      try {
        updateModelSpecsUI();
        renderDetailedModelCards();
      } catch (uiErr) {}
    }
  }

  function renderDetailedModelCards() {
    const brainModels = (state.modelsFull && state.modelsFull.length > 0) ? state.modelsFull : DEFAULT_MODELS_FULL;
    const visionModels = (state.visionModelsFull && state.visionModelsFull.length > 0) ? state.visionModelsFull : DEFAULT_VISION_MODELS_FULL;
    const allModels = [
      ...brainModels.map(m => ({ ...m, category: 'BRAIN' })),
      ...visionModels.map(m => ({ ...m, category: 'VISION' }))
    ];

    if (!els.detailedBrainList) return;
    els.detailedBrainList.innerHTML = '';

    allModels.forEach(m => {
      const isActive = (m.category === 'BRAIN' && m.name === state.activeModel) || (m.category === 'VISION' && m.name === state.activeVisionModel);
      const card = document.createElement('div');
      card.className = `model-card ${isActive ? 'active-model' : ''}`;

      const sizeStr = m.size_gb ? `⚡ ~${m.size_gb} GB RAM` : (m.size ? `⚡ ~${(m.size / (1024**3)).toFixed(1)} GB RAM` : '⚡ Local Neural');
      const tier = m.resource_tier || 'MEDIUM';
      const desc = m.description || (m.category === 'VISION' ? 'Multimodal visual recognition model.' : 'Conversational reasoning intelligence model.');

      card.innerHTML = `
        <div class="model-card-header">
          <div class="model-card-title-group">
            <span class="model-card-name">${escapeHtml(m.name)}</span>
            <span class="tier-badge ${tier}">${tier}</span>
            <span style="font-size: 9px; font-family: var(--font-mono); color: var(--text-muted); padding: 1px 4px; border: 1px solid var(--border-subtle); border-radius: 2px;">${m.category}</span>
          </div>
          <div class="model-card-meta">
            <span class="model-footprint">${sizeStr}</span>
          </div>
        </div>
        <p class="model-card-desc">${escapeHtml(desc)}</p>
        <div class="model-card-footer">
          <button class="btn-hud ${isActive ? 'primary' : ''}" style="min-width: 140px;">
            ${isActive ? `✓ ACTIVE ${m.category}` : `SELECT ${m.category}`}
          </button>
        </div>
      `;

      const btn = card.querySelector('button');
      btn.addEventListener('click', async () => {
        if (m.category === 'BRAIN') {
          if (state.activeModel === m.name) return;
          const oldModel = state.activeModel;
          state.activeModel = m.name;
          if (els.modelSelect) els.modelSelect.value = m.name;
          if (els.settingsBrainSelect) els.settingsBrainSelect.value = m.name;
          saveSettings();
          sfx.activate();
          updateModelSpecsUI();
          renderDetailedModelCards();

          try {
            await fetch('/api/models/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ new_model: m.name, old_model: oldModel })
            });
          } catch (err) {
            console.warn('Brain switch notice:', err);
          }
        } else {
          if (state.activeVisionModel === m.name) return;
          const oldVision = state.activeVisionModel;
          state.activeVisionModel = m.name;
          if (els.visionModelSelect) els.visionModelSelect.value = m.name;
          if (els.settingsVisionSelect) els.settingsVisionSelect.value = m.name;
          saveSettings();
          sfx.activate();
          updateModelSpecsUI();
          renderDetailedModelCards();

          try {
            await fetch('/api/models/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ new_model: m.name, old_model: oldVision })
            });
          } catch (err) {
            console.warn('Vision switch notice:', err);
          }
        }
      });

      els.detailedBrainList.appendChild(card);
    });
  }

  async function sendUserMessage(msgText, source = 'text') {
    state.lastInputSource = source;
    const text = (msgText || (els.chatInput ? els.chatInput.value : '')).trim();
    if (!text) return;

    if (els.chatInput) els.chatInput.value = '';
    initAudioContext();
    sfx.click();
    cancelSpeech();

    appendTranscript('user', text);
    state.history.push({ role: 'user', content: text });

    setInteractionState('processing');
    sfx.processing();

    const t0 = performance.now();
    let firstTokenReceived = false;
    let assistantBubble = null;
    let fullResponseText = "";
    let speechSentenceBuffer = "";

    try {
      const payload = {
        message: text,
        model: state.isScreenStreaming ? (state.activeVisionModel || state.activeModel) : state.activeModel,
        session_id: state.currentSessionId || 'default',
        language: state.currentLanguage || 'en',
        stream: true
      };

      if (state.isScreenStreaming && lastLiveFrameData) {
        payload.image = lastLiveFrameData;
      }

      const res = await fetch('/api/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Inference engine HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      // Direct JSON response (e.g. from instant SQLite memory retrieval)
      if (contentType.includes('application/json')) {
        const data = await res.json();
        state.latencyMs = Math.round(performance.now() - t0);
        updateLatencyDisplay();
        sfx.ready();
        state.history.push({ role: 'assistant', content: data.response });
        appendTranscript('assistant', data.response);
        queueSpeechChunk(data.response);
        loadTelemetry();
        loadSessions();
        return;
      }

      // Create live assistant entry for token streaming
      const entry = document.createElement('div');
      entry.className = 'transcript-entry';
      const header = document.createElement('div');
      header.className = 'entry-header';
      const roleSpan = document.createElement('span');
      roleSpan.className = 'entry-role-assistant';
      roleSpan.textContent = 'ORION';
      const timeSpan = document.createElement('span');
      const now = new Date();
      timeSpan.textContent = now.toTimeString().split(' ')[0];
      header.appendChild(roleSpan);
      header.appendChild(timeSpan);

      const activeModelName = payload.model || state.activeModel || 'Orion';
      const loadingText = state.currentLanguage === 'he'
        ? `⚡ טוען את מודל ${activeModelName}...`
        : `⚡ Loading ${activeModelName} AI model...`;

      assistantBubble = document.createElement('div');
      assistantBubble.className = 'entry-bubble assistant streaming';
      assistantBubble.textContent = loadingText;

      entry.appendChild(header);
      entry.appendChild(assistantBubble);
      if (els.transcriptFeed) {
        els.transcriptFeed.appendChild(entry);
        els.transcriptFeed.scrollTop = els.transcriptFeed.scrollHeight;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              if (assistantBubble) assistantBubble.classList.remove('streaming');
              assistantBubble.textContent = `Error: ${parsed.error}`;
              setInteractionState('idle');
              return;
            }

            if (!firstTokenReceived && (parsed.chunk || parsed.ttft_ms)) {
              firstTokenReceived = true;
              state.ttftMs = parsed.ttft_ms || Math.round(performance.now() - t0);
              state.latencyMs = state.ttftMs;
              updateLatencyDisplay();
              sfx.ready();
              assistantBubble.textContent = '';
            }

            if (parsed.chunk) {
              fullResponseText += parsed.chunk;
              assistantBubble.textContent = fullResponseText;
              speechSentenceBuffer += parsed.chunk;

              if (els.transcriptFeed) {
                els.transcriptFeed.scrollTop = els.transcriptFeed.scrollHeight;
              }

              // Extract completed sentences or conversational phrases for immediate vocalization
              const extracted = extractReadySpeechChunk(speechSentenceBuffer);
              if (extracted) {
                speechSentenceBuffer = extracted.remainder;
                queueSpeechChunk(extracted.chunk);
              }
            }

            if (parsed.done) {
              if (assistantBubble) {
                assistantBubble.classList.remove('streaming');
              }
              if (speechSentenceBuffer.trim()) {
                queueSpeechChunk(speechSentenceBuffer.trim());
                speechSentenceBuffer = '';
              }
              const totalDuration = parsed.duration_ms || Math.round(performance.now() - t0);
              updateLatencyDisplay(totalDuration);
            }
          } catch (err) {
            console.warn('Stream token parse note:', err);
          }
        }
      }

      if (assistantBubble) {
        assistantBubble.classList.remove('streaming');
      }

      if (speechSentenceBuffer.trim()) {
        queueSpeechChunk(speechSentenceBuffer.trim());
      }

      if (assistantBubble && !fullResponseText.trim()) {
        assistantBubble.textContent = 'Protocol acknowledged. System operational.';
        fullResponseText = 'Protocol acknowledged. System operational.';
      }

      state.isProcessing = false;
      state.history.push({ role: 'assistant', content: fullResponseText });
      loadTelemetry();
      loadSessions();
      checkConversationalTurnArm();
    } catch (e) {
      console.warn('Talk stream error:', e);
      state.isProcessing = false;
      setInteractionState('idle');
      if (assistantBubble) {
        assistantBubble.classList.remove('streaming');
        assistantBubble.textContent = `Failed to stream Orion response: ${e.message}`;
      } else {
        appendTranscript('assistant', `Failed to reach Orion engine: ${e.message}`);
      }
    }
  }

  function appendTranscript(role, text) {
    if (!els.transcriptFeed) return;
    const entry = document.createElement('div');
    entry.className = 'transcript-entry';

    const header = document.createElement('div');
    header.className = 'entry-header';

    const roleSpan = document.createElement('span');
    roleSpan.className = role === 'user' ? 'entry-role-user' : 'entry-role-assistant';
    roleSpan.textContent = role === 'user' ? 'OPERATOR' : 'ORION';

    const timeSpan = document.createElement('span');
    const now = new Date();
    timeSpan.textContent = now.toTimeString().split(' ')[0];

    header.appendChild(roleSpan);
    header.appendChild(timeSpan);

    const bubble = document.createElement('div');
    bubble.className = `entry-bubble ${role}`;
    bubble.textContent = text;

    entry.appendChild(header);
    entry.appendChild(bubble);

    els.transcriptFeed.appendChild(entry);
    els.transcriptFeed.scrollTop = els.transcriptFeed.scrollHeight;
  }

  function updateLatencyDisplay(durationMs) {
    if (els.systemLatency) {
      if (state.ttftMs && durationMs && durationMs > state.ttftMs) {
        els.systemLatency.textContent = `${state.ttftMs}ms (${(durationMs / 1000).toFixed(1)}s)`;
      } else if (state.ttftMs) {
        els.systemLatency.textContent = `${state.ttftMs}ms`;
      } else {
        els.systemLatency.textContent = `${state.latencyMs || '--'}ms`;
      }
    }
  }

  async function loadHistory(sessionId = null) {
    const targetSession = sessionId || state.currentSessionId || 'default';
    try {
      const res = await fetch(`/api/history?session_id=${encodeURIComponent(targetSession)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (els.transcriptFeed) {
        els.transcriptFeed.innerHTML = '';
        state.history = [];
        if (data.messages && data.messages.length > 0) {
          data.messages.forEach(m => {
            appendTranscript(m.role, m.content);
            state.history.push({ role: m.role, content: m.content });
          });
        } else {
          appendTranscript('assistant', 'Orion standalone core online. Ready for tactical instructions.');
        }
      }
    } catch (e) {
      console.warn('History load notice:', e);
    }
  }

  async function clearHistory() {
    try {
      await fetch('/api/history/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: state.currentSessionId || 'default' })
      });
      if (els.transcriptFeed) els.transcriptFeed.innerHTML = '';
      appendTranscript('assistant', 'Tactical log cleared. Orion online and ready.');
      loadSessions();
    } catch (e) {
      console.warn('Clear history failed', e);
    }
  }

  // ==========================================================================
  // 7. SESSIONS & CONVERSATION LOG CONTROLLER
  // ==========================================================================

  function renderSessionsList(sessions) {
    if (!els.sessionsList) return;
    els.sessionsList.innerHTML = '';

    if (!sessions || sessions.length === 0) {
      els.sessionsList.innerHTML = '<div style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 16px 4px;">No matching conversations found.</div>';
      return;
    }

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item ' + (s.id === state.currentSessionId ? 'active' : '');
      item.dataset.id = s.id;

      const header = document.createElement('div');
      header.className = 'session-item-header';

      const title = document.createElement('div');
      title.className = 'session-item-title';
      title.textContent = s.title || 'Conversation';
      title.title = s.title || 'Conversation';

      const delBtn = document.createElement('button');
      delBtn.className = 'session-del-icon';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete Session';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSessionItem(s.id);
      });

      header.appendChild(title);
      header.appendChild(delBtn);

      const meta = document.createElement('div');
      meta.className = 'session-item-meta';
      const dateStr = new Date(s.updated_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      meta.innerHTML = `<span>${s.message_count || 0} msgs</span><span>${dateStr}</span>`;

      item.appendChild(header);
      item.appendChild(meta);

      item.addEventListener('click', () => {
        switchSession(s.id);
      });

      els.sessionsList.appendChild(item);
    });
  }

  async function loadSessions() {
    if (!els.sessionsList) return;
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) return;
      const data = await res.json();
      state.allSessions = data.sessions || [];
      const query = (els.sessionSearchInput ? els.sessionSearchInput.value : '').toLowerCase().trim();
      const filtered = query
        ? state.allSessions.filter(s => (s.title || '').toLowerCase().includes(query))
        : state.allSessions;
      renderSessionsList(filtered);
    } catch (e) {
      console.warn('Error loading sessions:', e);
    }
  }

  async function switchSession(sessionId) {
    if (state.currentSessionId === sessionId) return;
    state.currentSessionId = sessionId;
    sfx.click();
    await loadHistory(sessionId);
    await loadSessions();
  }

  async function createNewSession() {
    initAudioContext();
    sfx.activate();
    const newId = `session_${Date.now()}`;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: newId, title: 'New Conversation' })
      });
      state.currentSessionId = newId;
      if (els.transcriptFeed) {
        els.transcriptFeed.innerHTML = '';
        appendTranscript('assistant', 'New session initialized. Orion stands ready for instructions.');
      }
      state.history = [];
      await loadSessions();
    } catch (e) {
      console.warn('Failed to create session:', e);
    }
  }

  async function deleteSessionItem(sessionId) {
    sfx.click();
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (state.currentSessionId === sessionId) {
        state.currentSessionId = 'default';
        await loadHistory('default');
      }
      await loadSessions();
    } catch (e) {
      console.warn('Failed to delete session:', e);
    }
  }

  // ==========================================================================
  // 8. MEMORY MANAGER CONTROLLERS
  // ==========================================================================

  async function loadMemories() {
    if (!els.memoryListContainer) return;
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      els.memoryListContainer.innerHTML = '';

      if (!data.memories || data.memories.length === 0) {
        els.memoryListContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 11px; padding: 8px;">No persistent memories stored yet. As you talk with Orion, facts will be saved automatically.</div>';
        return;
      }

      data.memories.forEach(m => {
        const card = document.createElement('div');
        card.className = 'memory-card';

        const text = document.createElement('span');
        text.className = 'memory-text';
        text.textContent = m.fact;

        const delBtn = document.createElement('button');
        delBtn.className = 'memory-del-btn';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete Memory';
        delBtn.addEventListener('click', async () => {
          await fetch(`/api/memory/${m.id}`, { method: 'DELETE' });
          loadMemories();
          loadTelemetry();
        });

        card.appendChild(text);
        card.appendChild(delBtn);
        els.memoryListContainer.appendChild(card);
      });
    } catch (e) {
      console.warn('Failed to load memories:', e);
    }
  }

  async function addNewMemory() {
    if (!els.newMemoryInput) return;
    const fact = els.newMemoryInput.value.trim();
    if (!fact) return;

    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fact: fact, category: 'user_fact' })
    });

    els.newMemoryInput.value = '';
    loadMemories();
    loadTelemetry();
    sfx.click();
  }

  // ==========================================================================
  // 9. AI ENGINES & ENDPOINTS CONTROLLER
  // ==========================================================================

  async function loadEndpoints() {
    if (!els.endpointList) return;
    try {
      const res = await fetch('/api/endpoints');
      const data = await res.json();
      els.endpointList.innerHTML = '';

      data.endpoints.forEach(ep => {
        const item = document.createElement('div');
        item.className = 'endpoint-item';
        item.innerHTML = `
          <div>
            <strong>${ep.name}</strong> (${ep.api_type})
            <div style="font-size: 10px; color: var(--text-muted);">${ep.base_url}</div>
          </div>
          <span style="color: ${ep.is_active ? 'var(--emerald-nominal)' : 'var(--text-muted)'}; font-size: 10px;">
            ${ep.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        `;
        els.endpointList.appendChild(item);
      });
    } catch (e) {
      console.warn('Failed to load endpoints:', e);
    }
  }

  async function addNewEndpoint() {
    const name = els.endpointNameInput.value.trim();
    const url = els.endpointUrlInput.value.trim();
    const type = els.endpointTypeSelect.value;
    if (!url) return;

    await fetch('/api/endpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Local AI', base_url: url, api_type: type })
    });

    els.endpointNameInput.value = '';
    els.endpointUrlInput.value = '';
    loadEndpoints();
    loadTelemetry();
    sfx.click();
  }

  // ==========================================================================
  // 10. EVENT LISTENERS & BOOTSTRAP
  // ==========================================================================

  function bindEvents() {
    if (els.interactionCore) els.interactionCore.addEventListener('click', toggleListening);
    if (els.sendBtn) els.sendBtn.addEventListener('click', () => sendUserMessage(undefined, 'text'));
    if (els.clearChatBtn) els.clearChatBtn.addEventListener('click', clearHistory);
    if (els.newSessionBtn) els.newSessionBtn.addEventListener('click', createNewSession);

    if (els.chatInput) {
      els.chatInput.addEventListener('focus', () => {
        state.continuousConversation = false;
        if (state.isListening) {
          stopListening();
        }
      });
      els.chatInput.addEventListener('input', () => {
        state.continuousConversation = false;
        if (state.isListening) {
          stopListening();
        }
      });
      els.chatInput.addEventListener('keydown', (e) => {
        state.continuousConversation = false;
        if (state.isListening) {
          stopListening();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          sendUserMessage(undefined, 'text');
        } else if (e.code === 'Space' || e.key === ' ') {
          e.stopPropagation();
        }
      });
    }

    if (els.snapBtn) els.snapBtn.addEventListener('click', captureScreen);
    if (els.camBtn) els.camBtn.addEventListener('click', captureWebcam);
    if (els.shareScreenBtn) els.shareScreenBtn.addEventListener('click', toggleScreenStream);
    if (els.purgeRamBtn) {
      els.purgeRamBtn.addEventListener('click', async () => {
        initAudioContext();
        sfx.snap();
        els.purgeRamBtn.textContent = 'Freeing...';
        try {
          const res = await fetch('/api/models/purge', { method: 'POST' });
          const data = await res.json();
          els.purgeRamBtn.textContent = 'Freed!';
          sfx.ready();
          appendTranscript('assistant', `Memory purged. Inactive models unloaded: ${data.unloaded_models.join(', ') || 'All memory freed'}.`);
          setTimeout(() => {
            els.purgeRamBtn.textContent = 'Free RAM';
          }, 2000);
        } catch (e) {
          els.purgeRamBtn.textContent = 'Free RAM';
        }
      });
    }
    if (els.streamFpsSelect) {
      els.streamFpsSelect.addEventListener('change', () => {
        updateStreamFps();
        saveSettings();
      });
    }

    if (els.modelSelect) {
      els.modelSelect.addEventListener('change', async (e) => {
        const newModel = e.target.value;
        const oldModel = state.activeModel;
        state.activeModel = newModel;
        saveSettings();
        sfx.click();
        try {
          await fetch('/api/models/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_model: newModel, old_model: oldModel })
          });
        } catch (err) {
          console.warn('Model switch notice:', err);
        }
      });
    }

    if (els.visionModelSelect) {
      els.visionModelSelect.addEventListener('change', async (e) => {
        const newVision = e.target.value;
        const oldVision = state.activeVisionModel;
        state.activeVisionModel = newVision;
        saveSettings();
        sfx.click();
        try {
          await fetch('/api/models/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_model: newVision, old_model: oldVision })
          });
        } catch (err) {
          console.warn('Vision switch notice:', err);
        }
      });
    }

    if (els.exitSystemBtn) {
      els.exitSystemBtn.addEventListener('click', async () => {
        const confirmed = confirm("Completely shutdown Orion AI Core and terminate all llama-server background processes?");
        if (!confirmed) return;

        initAudioContext();
        sfx.snap();
        if (els.shutdownOverlay) els.shutdownOverlay.classList.add('active');

        try {
          await fetch('/api/shutdown', { method: 'POST' });
        } catch (e) {
          // Server closed
        }

        setTimeout(() => {
          try { window.close(); } catch (e) {}
        }, 1200);
      });
    }

    // Wing Slide Controls
    if (els.toggleLeftWingBtn) els.toggleLeftWingBtn.addEventListener('click', () => toggleLeftWing());
    if (els.collapseLeftBtn) els.collapseLeftBtn.addEventListener('click', () => toggleLeftWing(true));
    if (els.leftDockTab) els.leftDockTab.addEventListener('click', () => toggleLeftWing(false));

    if (els.collapseFeedBtn) els.collapseFeedBtn.addEventListener('click', () => toggleFeedPanel(true));
    if (els.feedDockTab) els.feedDockTab.addEventListener('click', () => toggleFeedPanel(false));

    if (els.collapseSessionsBtn) els.collapseSessionsBtn.addEventListener('click', () => toggleSessionsPanel(true));
    if (els.sessionsDockTab) els.sessionsDockTab.addEventListener('click', () => toggleSessionsPanel(false));

    if (els.muteToggle) {
      els.muteToggle.addEventListener('click', () => {
        state.audioMuted = !state.audioMuted;
        els.muteToggle.textContent = state.audioMuted ? 'SFX: OFF' : 'SFX: ON';
        saveSettings();
        if (!state.audioMuted) sfx.activate();
      });
    }

    if (els.speechToggle) {
      els.speechToggle.addEventListener('click', () => {
        state.autoSpeak = !state.autoSpeak;
        els.speechToggle.textContent = state.autoSpeak ? 'VOICE: ON' : 'VOICE: OFF';
        saveSettings();
        if (state.autoSpeak) sfx.click();
      });
    }

    // Unified Tactical Settings Modal Handlers
    if (els.openSettingsModalBtn) {
      els.openSettingsModalBtn.addEventListener('click', () => {
        initAudioContext();
        if (els.settingsModalBackdrop) {
          els.settingsModalBackdrop.classList.add('open');
        }
        sfx.click();

        updateModelSpecsUI();
        renderDetailedModelCards();

        if (els.speechToggleSettings) {
          els.speechToggleSettings.textContent = state.autoSpeak ? 'VOICE: ON' : 'VOICE: OFF';
        }
        if (els.muteToggleSettings) {
          els.muteToggleSettings.textContent = state.audioMuted ? 'SFX: OFF' : 'SFX: ON';
        }

        // Non-blocking background sync
        loadTelemetry().catch(() => {});
        populateMicSelect(false).catch(() => {});
        populateVoiceSelect();
        loadMemories().catch(() => {});
        loadEndpoints().catch(() => {});
      });
    }

    if (els.settingsCloseBtn) {
      els.settingsCloseBtn.addEventListener('click', () => {
        stopMicTest();
        saveSettings();
        if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.remove('open');
        sfx.click();
      });
    }

    if (els.closeSettingsModalBtn) {
      els.closeSettingsModalBtn.addEventListener('click', () => {
        stopMicTest();
        saveSettings();
        if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.remove('open');
        sfx.click();
      });
    }

    if (els.settingsModalBackdrop) {
      els.settingsModalBackdrop.addEventListener('click', (e) => {
        if (e.target === els.settingsModalBackdrop) {
          stopMicTest();
          saveSettings();
          els.settingsModalBackdrop.classList.remove('open');
        }
      });
    }

    // Settings Category Dropdown Handler
    if (els.settingsCategorySelect) {
      els.settingsCategorySelect.addEventListener('change', (e) => {
        const targetId = e.target.value;
        document.querySelectorAll('.settings-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
        }
        sfx.click();
      });
    }

    // Settings Modal Brain Dropdown Handler
    if (els.settingsBrainSelect) {
      els.settingsBrainSelect.addEventListener('change', async (e) => {
        const newModel = e.target.value;
        if (state.activeModel === newModel) return;
        const oldModel = state.activeModel;
        state.activeModel = newModel;
        if (els.modelSelect) els.modelSelect.value = newModel;
        saveSettings();
        sfx.activate();
        updateModelSpecsUI();
        renderDetailedModelCards();

        try {
          await fetch('/api/models/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_model: newModel, old_model: oldModel })
          });
        } catch (err) {
          console.warn('Brain switch notice:', err);
        }
      });
    }

    // Settings Modal Vision Dropdown Handler
    if (els.settingsVisionSelect) {
      els.settingsVisionSelect.addEventListener('change', async (e) => {
        const newVision = e.target.value;
        if (state.activeVisionModel === newVision) return;
        const oldVision = state.activeVisionModel;
        state.activeVisionModel = newVision;
        if (els.visionModelSelect) els.visionModelSelect.value = newVision;
        saveSettings();
        sfx.activate();
        updateModelSpecsUI();
        renderDetailedModelCards();

        try {
          await fetch('/api/models/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_model: newVision, old_model: oldVision })
          });
        } catch (err) {
          console.warn('Vision switch notice:', err);
        }
      });
    }

    if (els.speechToggleSettings) {
      els.speechToggleSettings.addEventListener('click', () => {
        state.autoSpeak = !state.autoSpeak;
        els.speechToggleSettings.textContent = state.autoSpeak ? 'VOICE: ON' : 'VOICE: OFF';
        saveSettings();
        if (state.autoSpeak) sfx.click();
      });
    }

    if (els.muteToggleSettings) {
      els.muteToggleSettings.addEventListener('click', () => {
        state.audioMuted = !state.audioMuted;
        els.muteToggleSettings.textContent = state.audioMuted ? 'SFX: OFF' : 'SFX: ON';
        saveSettings();
        if (!state.audioMuted) sfx.activate();
      });
    }

    if (els.purgeRamSettingsBtn) {
      els.purgeRamSettingsBtn.addEventListener('click', async () => {
        try {
          initAudioContext();
          els.purgeRamSettingsBtn.textContent = 'PURGING...';
          const res = await fetch('/api/models/purge', { method: 'POST' });
          if (res.ok) {
            sfx.activate();
            els.purgeRamSettingsBtn.textContent = 'RAM PURGED ✓';
            setTimeout(() => {
              els.purgeRamSettingsBtn.textContent = 'PURGE RAM';
            }, 1800);
          }
        } catch (e) {
          console.warn('Purge failed:', e);
        }
      });
    }

    // Hardware I/O Handlers
    if (els.scanMicsBtn) {
      els.scanMicsBtn.addEventListener('click', async () => {
        initAudioContext();
        await populateMicSelect(true);
        sfx.activate();
      });
    }

    if (els.saveIoBtn) {
      els.saveIoBtn.addEventListener('click', () => {
        stopMicTest();
        saveSettings();
        if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.remove('open');
        sfx.click();
      });
    }

    if (els.toggleMicTestBtn) els.toggleMicTestBtn.addEventListener('click', toggleMicTest);

    if (els.micSelect) {
      els.micSelect.addEventListener('change', async (e) => {
        state.selectedMicId = e.target.value;
        saveSettings();
        sfx.click();
        if (state.isTestingMic) await startMicTest();
      });
    }

    if (els.speakerSelect) {
      els.speakerSelect.addEventListener('change', (e) => {
        state.selectedSpeakerId = e.target.value;
        applyAudioSink(state.selectedSpeakerId);
        saveSettings();
        sfx.click();
      });
    }

    if (els.testSpeakerBtn) {
      els.testSpeakerBtn.addEventListener('click', testSpeakerOutput);
    }

    if (els.voiceCategorySelect) {
      els.voiceCategorySelect.addEventListener('change', (e) => {
        state.voiceCategory = e.target.value;
        populateVoiceSelect();
        saveSettings();
        sfx.click();
      });
    }

    if (els.voiceSelect) {
      els.voiceSelect.addEventListener('change', (e) => {
        const vName = e.target.value;
        const voice = NEURAL_TTS_VOICES.find(v => v.name === vName) ||
          (state.availableVoices && state.availableVoices.find(v => v.name === vName));
        if (voice) {
          state.selectedVoice = voice;
          saveSettings();
          sfx.click();
        }
      });
    }

    if (els.voiceVolumeSlider && els.voiceVolumeVal) {
      els.voiceVolumeSlider.addEventListener('input', (e) => {
        state.voiceVolume = parseInt(e.target.value, 10) / 100;
        els.voiceVolumeVal.textContent = `${e.target.value}%`;
        saveSettings();
      });
    }

    if (els.voiceRateSlider && els.voiceRateVal) {
      els.voiceRateSlider.addEventListener('input', (e) => {
        state.voiceRate = parseFloat(e.target.value);
        els.voiceRateVal.textContent = `${state.voiceRate.toFixed(2)}x`;
        saveSettings();
      });
    }

    if (els.voicePitchSlider && els.voicePitchVal) {
      els.voicePitchSlider.addEventListener('input', (e) => {
        state.voicePitch = parseFloat(e.target.value);
        els.voicePitchVal.textContent = `${state.voicePitch.toFixed(2)}x`;
        saveSettings();
      });
    }

    if (els.testVoiceBtn) {
      els.testVoiceBtn.addEventListener('click', () => {
        const testPhrase = (state.currentLanguage === 'he' || (state.selectedVoice && state.selectedVoice.lang && state.selectedVoice.lang.startsWith('he')))
          ? 'בדיקת קול אוריון. תדרי שמע תקינים, מערכת סינתזת דיבור פעילה ומכוילת.'
          : 'Orion vocal transmission test. Frequency nominal, speech synthesis operational.';
        speakResponse(testPhrase);
      });
    }

    // Real-time Chat Search Filter
    if (els.sessionSearchInput) {
      els.sessionSearchInput.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
          e.stopPropagation();
        }
      });
      els.sessionSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = query
          ? (state.allSessions || []).filter(s => (s.title || '').toLowerCase().includes(query))
          : (state.allSessions || []);
        renderSessionsList(filtered);
      });
    }

    // Auto-refresh microphones on hardware change
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = () => {
        populateMicSelect(false);
      };
    }

    // Memory Handlers
    if (els.refreshMemoryBtn) els.refreshMemoryBtn.addEventListener('click', loadMemories);
    if (els.addMemoryBtn) els.addMemoryBtn.addEventListener('click', addNewMemory);

    // AI Engine Handlers
    if (els.addEndpointBtn) els.addEndpointBtn.addEventListener('click', addNewEndpoint);

    // Quick Command Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd === 'screen') captureScreen();
        else if (cmd) sendUserMessage(cmd);
      });
    });

    // Language Switcher in Header
    if (els.languageSelect) {
      els.languageSelect.addEventListener('change', (e) => {
        state.currentLanguage = e.target.value;
        if (state.speechRecognition) {
          state.speechRecognition.lang = state.currentLanguage === 'he' ? 'he-IL' : 'en-US';
        }
        if (state.currentLanguage === 'he') {
          state.voiceCategory = 'hebrew';
          if (els.voiceCategorySelect) els.voiceCategorySelect.value = 'hebrew';
          state.selectedVoice = NEURAL_TTS_VOICES.find(v => v.id === 'he-IL-AvriNeural');
        } else {
          state.voiceCategory = 'natural';
          if (els.voiceCategorySelect) els.voiceCategorySelect.value = 'natural';
          state.selectedVoice = NEURAL_TTS_VOICES.find(v => v.id === 'en-GB-RyanNeural');
        }
        populateVoiceSelect();
        saveSettings();
        sfx.activate();
      });
    }

    // Spacebar Mode Selector in Quick Controls
    if (els.spacebarModeSelect) {
      els.spacebarModeSelect.addEventListener('change', (e) => {
        state.spacebarMode = e.target.value;
        saveSettings();
      });
    }

    function isEditableElement(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || !!el.isContentEditable;
    }

    // Spacebar Activation (Hold vs Press/Toggle Mode)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        state.continuousConversation = false;
        if (conversationalSleepTimer) clearTimeout(conversationalSleepTimer);
        cancelSpeech();
        stopListening();
        setInteractionState('idle');
        updateVoiceHearingBadge('', false);
        if (els.settingsModalBackdrop) els.settingsModalBackdrop.classList.remove('open');
        stopMicTest();
        return;
      }

      // If user is currently typing in an input/textarea, do NOT hijack Spacebar
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        // Blur any focused buttons or dropdowns so Space doesn't re-click them
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        if (state.spacebarMode === 'toggle') {
          if (e.repeat) return; // Prevent key repeat firing repeatedly
          toggleListening();
        } else {
          // Push-to-Talk Hold mode
          if (!state.isListening) startListening();
        }
      }
    });

    if (els.testVoiceInputBtn) {
      els.testVoiceInputBtn.addEventListener('click', async () => {
        initAudioContext();
        if (els.voiceDiagTranscript) {
          els.voiceDiagTranscript.textContent = 'Listening for speech (5 seconds)... Speak into your microphone now!';
        }
        if (els.voiceDiagStatus) {
          els.voiceDiagStatus.textContent = 'RECORDING (5s)...';
          els.voiceDiagStatus.style.color = 'var(--ice-blue)';
        }
        await startListening();
        setTimeout(async () => {
          if (state.isListening) {
            const webSpeechResult = (pendingVoiceTranscript + ' ' + currentInterimTranscript).trim();
            pendingVoiceTranscript = '';
            currentInterimTranscript = '';
            await stopListening();

            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedAudioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                recordedAudioChunks = [];
                let result = webSpeechResult;
                if (!result || result.length < 2) {
                  result = await sendLocalAudioForTranscription(audioBlob);
                }
                if (els.voiceDiagTranscript) {
                  els.voiceDiagTranscript.textContent = result
                    ? `✓ 100% Local Whisper Decoded: "${result}"`
                    : '⚠️ No speech detected. Please verify microphone selection and speak louder.';
                }
                if (els.voiceDiagStatus) {
                  els.voiceDiagStatus.textContent = result ? 'WHISPER VERIFIED ✓' : 'NO SPEECH';
                  els.voiceDiagStatus.style.color = result ? 'var(--emerald-nominal)' : 'var(--crimson-alert)';
                }
              };
              try { mediaRecorder.stop(); } catch (e) {}
            }
          }
        }, 5000);
      });
    }

    window.addEventListener('keyup', (e) => {
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (state.spacebarMode === 'hold') {
          finishAndDispatchVoice();
        }
      }
    });

    // Clock
    setInterval(() => {
      if (els.systemUptime) {
        const now = new Date();
        els.systemUptime.textContent = now.toLocaleTimeString();
      }
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initElements();
    loadSettings();
    initCanvas();
    initSpeechEngine();
    bindEvents();
    loadTelemetry();
    loadSessions();
    populateMicSelect();

    // Start with a clean, fresh conversation session on startup
    state.currentSessionId = 'session_' + Date.now();
    state.history = [];
    if (els.transcriptFeed) els.transcriptFeed.innerHTML = '';
    const initialGreeting = state.currentLanguage === 'he'
      ? 'ליבת אוריון מקוונת ומוכנה. ממתין להוראות.'
      : 'Orion standalone core online. Ready for tactical instructions.';
    appendTranscript('assistant', initialGreeting);
  });

})();
