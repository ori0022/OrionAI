/**
 * ORION AI - AUTONOMOUS INTELLIGENCE CORE
 * Standalone Client Controller
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    connected: false,
    activeModel: 'llama3:latest',
    activeVisionModel: 'llava:latest',
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
    latencyMs: 0
  };

  const els = {};

  function initElements() {
    els.statusDot = document.getElementById('statusDot');
    els.statusText = document.getElementById('statusText');
    els.modelSelect = document.getElementById('modelSelect');
    els.visionModelSelect = document.getElementById('visionModelSelect');
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
    els.toggleLeftWingBtn = document.getElementById('toggleLeftWingBtn');
    els.toggleRightWingBtn = document.getElementById('toggleRightWingBtn');
    els.collapseLeftBtn = document.getElementById('collapseLeftBtn');
    els.collapseRightBtn = document.getElementById('collapseRightBtn');
    els.leftDockTab = document.getElementById('leftDockTab');
    els.rightDockTab = document.getElementById('rightDockTab');

    // Sessions Wing
    els.hudSessionsWing = document.getElementById('hudSessionsWing');
    els.sessionsList = document.getElementById('sessionsList');
    els.newSessionBtn = document.getElementById('newSessionBtn');

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

    // Memory Modal
    els.memoryModalBtn = document.getElementById('memoryModalBtn');
    els.memoryModalBackdrop = document.getElementById('memoryModalBackdrop');
    els.memoryCloseBtn = document.getElementById('memoryCloseBtn');
    els.closeMemoryModalBtn = document.getElementById('closeMemoryModalBtn');
    els.refreshMemoryBtn = document.getElementById('refreshMemoryBtn');
    els.newMemoryInput = document.getElementById('newMemoryInput');
    els.addMemoryBtn = document.getElementById('addMemoryBtn');
    els.memoryListContainer = document.getElementById('memoryListContainer');

    // Endpoint Modal
    els.endpointModalBtn = document.getElementById('endpointModalBtn');
    els.endpointModalBackdrop = document.getElementById('endpointModalBackdrop');
    els.endpointCloseBtn = document.getElementById('endpointCloseBtn');
    els.closeEndpointModalBtn = document.getElementById('closeEndpointModalBtn');
    els.endpointList = document.getElementById('endpointList');
    els.endpointNameInput = document.getElementById('endpointNameInput');
    els.endpointUrlInput = document.getElementById('endpointUrlInput');
    els.endpointTypeSelect = document.getElementById('endpointTypeSelect');
    els.addEndpointBtn = document.getElementById('addEndpointBtn');
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
    if (state.audioMuted || !state.audioCtx) return;
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    const now = state.audioCtx.currentTime;
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    osc.type = type;
    if (Array.isArray(freqs)) {
      osc.frequency.setValueAtTime(freqs[0], now);
      freqs.forEach((f, idx) => {
        osc.frequency.exponentialRampToValueAtTime(f, now + (duration * (idx + 1)) / freqs.length);
      });
    } else {
      osc.frequency.setValueAtTime(freqs, now);
    }

    const peakVol = 0.08 * (state.voiceVolume !== undefined ? state.voiceVolume : 1.0);
    gain.gain.setValueAtTime(0.005, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(state.audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  const sfx = {
    activate: () => playTone([520, 880], 0.12, 'sine'),
    listening: () => playTone([660, 440], 0.08, 'triangle'),
    processing: () => playTone([440, 550, 660], 0.14, 'sine'),
    ready: () => playTone([523, 659, 784], 0.16, 'sine'),
    snap: () => playTone([900, 300], 0.1, 'sawtooth'),
    click: () => playTone(1200, 0.02, 'triangle')
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

  function initSpeechEngine() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      state.speechRecognition = new SpeechRec();
      state.speechRecognition.continuous = false;
      state.speechRecognition.interimResults = true;
      state.speechRecognition.lang = 'en-US';

      state.speechRecognition.onstart = () => {
        setInteractionState('listening');
        sfx.listening();
      };

      state.speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (els.chatInput) els.chatInput.value = transcript;
        if (event.results[0].isFinal) {
          sendUserMessage(transcript);
        }
      };

      state.speechRecognition.onerror = (err) => {
        console.warn('Speech Recognition error:', err);
        setInteractionState('idle');
      };

      state.speechRecognition.onend = () => {
        if (!state.isProcessing && !state.isSpeaking) {
          setInteractionState('idle');
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
          state.selectedVoice = state.availableVoices.find(v => 
            v.name.includes('Ryan') || 
            v.name.includes('Natural') ||
            v.name.includes('Guy') ||
            v.name.includes('Daniel') || 
            v.name.includes('UK English Male') || 
            (v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('male'))
          ) || state.availableVoices.find(v => v.lang.startsWith('en-GB')) || state.availableVoices.find(v => v.lang.startsWith('en')) || state.availableVoices[0];
        }
        populateVoiceSelect();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function isHumanOrNeuralVoice(v) {
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
    if (!els.voiceSelect || !state.availableVoices || state.availableVoices.length === 0) return;
    els.voiceSelect.innerHTML = '';

    const cat = state.voiceCategory || 'natural';
    let filtered = state.availableVoices;

    if (cat === 'natural') {
      filtered = state.availableVoices.filter(v => isHumanOrNeuralVoice(v) || v.lang.startsWith('en'));
      if (filtered.length === 0) filtered = state.availableVoices;
    } else if (cat === 'en-gb') {
      filtered = state.availableVoices.filter(v => v.lang.toLowerCase().includes('en-gb'));
      if (filtered.length === 0) filtered = state.availableVoices;
    } else if (cat === 'en-us') {
      filtered = state.availableVoices.filter(v => v.lang.toLowerCase().includes('en-us'));
      if (filtered.length === 0) filtered = state.availableVoices;
    }

    filtered.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      const isNeural = isHumanOrNeuralVoice(v);
      opt.textContent = `${isNeural ? '✨ ' : ''}${v.name} (${v.lang})${v.default ? ' [Default]' : ''}`;
      if (state.selectedVoice && v.name === state.selectedVoice.name) {
        opt.selected = true;
      }
      els.voiceSelect.appendChild(opt);
    });

    if (els.voiceSelect.selectedIndex === -1 && els.voiceSelect.children.length > 0) {
      els.voiceSelect.selectedIndex = 0;
      const firstVoiceName = els.voiceSelect.value;
      state.selectedVoice = state.availableVoices.find(v => v.name === firstVoiceName);
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
      voiceRate: state.voiceRate,
      voicePitch: state.voicePitch,
      voiceVolume: state.voiceVolume,
      autoSpeak: state.autoSpeak,
      audioMuted: state.audioMuted,
      streamFps: state.streamFps,
      leftCollapsed: state.leftCollapsed,
      rightCollapsed: state.rightCollapsed
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
      if (s.leftCollapsed !== undefined) {
        state.leftCollapsed = Boolean(s.leftCollapsed);
        if (els.hudMain) els.hudMain.classList.toggle('left-collapsed', state.leftCollapsed);
        if (els.toggleLeftWingBtn) els.toggleLeftWingBtn.textContent = state.leftCollapsed ? 'SENSORS ▸' : '◂ SENSORS';
      }
      if (s.rightCollapsed !== undefined) {
        state.rightCollapsed = Boolean(s.rightCollapsed);
        if (els.hudMain) els.hudMain.classList.toggle('right-collapsed', state.rightCollapsed);
        if (els.toggleRightWingBtn) els.toggleRightWingBtn.textContent = state.rightCollapsed ? '◂ FEED & CHATS' : 'FEED & CHATS ▸';
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
    sfx.click();
    setTimeout(() => resizeCanvas(), 360);
  }

  function toggleRightWing(force) {
    state.rightCollapsed = force !== undefined ? force : !state.rightCollapsed;
    if (els.hudMain) {
      els.hudMain.classList.toggle('right-collapsed', state.rightCollapsed);
    }
    if (els.toggleRightWingBtn) {
      els.toggleRightWingBtn.textContent = state.rightCollapsed ? '◂ FEED & CHATS' : 'FEED & CHATS ▸';
    }
    saveSettings();
    initAudioContext();
    sfx.click();
    setTimeout(() => resizeCanvas(), 360);
  }

  function toggleListening() {
    initAudioContext();
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (!state.speechRecognition) {
      alert('Speech Recognition is not available in this browser. Please use Chrome or Edge.');
      return;
    }
    if (state.isSpeaking) {
      window.speechSynthesis.cancel();
      state.isSpeaking = false;
    }
    try {
      state.speechRecognition.start();
    } catch (e) {
      console.warn('Recognition start exception', e);
    }
  }

  function stopListening() {
    if (state.speechRecognition && state.isListening) {
      state.speechRecognition.stop();
    }
    setInteractionState('idle');
  }

  function speakResponse(text) {
    if (!state.autoSpeak || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const speechText = text
      .replace(/\*+/g, '')
      .replace(/#+/g, '')
      .replace(/`+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();

    if (!speechText) return;

    const utterance = new SpeechSynthesisUtterance(speechText);
    if (state.selectedVoice) utterance.voice = state.selectedVoice;
    utterance.rate = state.voiceRate;
    utterance.pitch = state.voicePitch;
    utterance.volume = Math.min(1.0, Math.max(0.0, state.voiceVolume));

    utterance.onstart = () => {
      setInteractionState('speaking');
    };

    utterance.onend = () => {
      setInteractionState('idle');
    };

    utterance.onerror = () => {
      setInteractionState('idle');
    };

    window.speechSynthesis.speak(utterance);
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

  async function loadTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      state.connected = data.status === 'nominal';

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

      // Populate text models without resetting selection
      if (els.modelSelect && data.models && data.models.length > 0) {
        const currentModel = state.activeModel;
        els.modelSelect.innerHTML = '';
        data.models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          if (m === currentModel) opt.selected = true;
          els.modelSelect.appendChild(opt);
        });
        els.modelSelect.value = currentModel;
      }

      // Populate vision models without resetting selection
      if (els.visionModelSelect && data.vision_models && data.vision_models.length > 0) {
        const currentVision = state.activeVisionModel;
        els.visionModelSelect.innerHTML = '';
        data.vision_models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          if (m === currentVision) opt.selected = true;
          els.visionModelSelect.appendChild(opt);
        });
        els.visionModelSelect.value = currentVision;
      }
    } catch (e) {
      console.warn('Telemetry load failed:', e);
      if (els.statusDot && els.statusText) {
        els.statusDot.className = 'status-dot degraded';
        els.statusText.textContent = 'DISCONNECTED';
      }
    }
  }

  async function sendUserMessage(msgText) {
    const text = (msgText || (els.chatInput ? els.chatInput.value : '')).trim();
    if (!text) return;

    if (els.chatInput) els.chatInput.value = '';
    initAudioContext();
    sfx.click();

    appendTranscript('user', text);
    state.history.push({ role: 'user', content: text });

    setInteractionState('processing');
    sfx.processing();

    const t0 = performance.now();
    try {
      const payload = {
        message: text,
        model: state.isScreenStreaming ? (state.activeVisionModel || state.activeModel) : state.activeModel,
        session_id: state.currentSessionId || 'default',
        stream: false
      };

      if (state.isScreenStreaming && lastLiveFrameData) {
        payload.image = lastLiveFrameData;
      }

      const res = await fetch('/api/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      state.latencyMs = Math.round(performance.now() - t0);
      updateLatencyDisplay();

      if (res.ok && typeof data.response === 'string' && data.response.trim().length > 0) {
        sfx.ready();
        state.history.push({ role: 'assistant', content: data.response });
        appendTranscript('assistant', data.response);
        speakResponse(data.response);
        loadTelemetry(); // refresh memory count
        loadSessions();  // refresh saved chats titles & timestamps
      } else if (res.ok) {
        const fallbackText = "Protocol received. System operational.";
        sfx.ready();
        state.history.push({ role: 'assistant', content: fallbackText });
        appendTranscript('assistant', fallbackText);
        speakResponse(fallbackText);
        loadSessions();
      } else {
        appendTranscript('assistant', `Communication error: ${data.detail || data.error || 'Inference engine error'}`);
        setInteractionState('idle');
      }
    } catch (e) {
      setInteractionState('idle');
      appendTranscript('assistant', `Failed to reach Orion engine: ${e.message}`);
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

  function updateLatencyDisplay() {
    if (els.systemLatency) {
      els.systemLatency.textContent = `${state.latencyMs}ms`;
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

  async function loadSessions() {
    if (!els.sessionsList) return;
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) return;
      const data = await res.json();
      els.sessionsList.innerHTML = '';

      if (!data.sessions || data.sessions.length === 0) {
        els.sessionsList.innerHTML = '<div style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 16px 4px;">No saved conversations yet.</div>';
        return;
      }

      data.sessions.forEach(s => {
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
    if (els.sendBtn) els.sendBtn.addEventListener('click', () => sendUserMessage());
    if (els.clearChatBtn) els.clearChatBtn.addEventListener('click', clearHistory);
    if (els.newSessionBtn) els.newSessionBtn.addEventListener('click', createNewSession);

    if (els.chatInput) {
      els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendUserMessage();
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

    if (els.toggleRightWingBtn) els.toggleRightWingBtn.addEventListener('click', () => toggleRightWing());
    if (els.collapseRightBtn) els.collapseRightBtn.addEventListener('click', () => toggleRightWing(true));
    if (els.rightDockTab) els.rightDockTab.addEventListener('click', () => toggleRightWing(false));

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

    // Hardware I/O Modal Handlers
    if (els.ioConfigBtn) {
      els.ioConfigBtn.addEventListener('click', async () => {
        initAudioContext();
        await populateMicSelect(false);
        populateVoiceSelect();
        els.ioModalBackdrop.classList.add('open');
        sfx.click();
      });
    }

    if (els.scanMicsBtn) {
      els.scanMicsBtn.addEventListener('click', async () => {
        initAudioContext();
        await populateMicSelect(true);
        sfx.activate();
      });
    }

    if (els.ioCloseBtn) {
      els.ioCloseBtn.addEventListener('click', () => {
        stopMicTest();
        saveSettings();
        els.ioModalBackdrop.classList.remove('open');
      });
    }

    if (els.saveIoBtn) {
      els.saveIoBtn.addEventListener('click', () => {
        stopMicTest();
        saveSettings();
        els.ioModalBackdrop.classList.remove('open');
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
        const voice = state.availableVoices.find(v => v.name === vName);
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
        speakResponse('Orion vocal transmission test. Frequency nominal, speech synthesis operational.');
      });
    }

    // Auto-refresh microphones on hardware change
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = () => {
        populateMicSelect(false);
      };
    }

    // Memory Modal Handlers
    if (els.memoryModalBtn) {
      els.memoryModalBtn.addEventListener('click', () => {
        loadMemories();
        els.memoryModalBackdrop.classList.add('open');
        sfx.click();
      });
    }

    if (els.memoryCloseBtn) {
      els.memoryCloseBtn.addEventListener('click', () => {
        els.memoryModalBackdrop.classList.remove('open');
      });
    }

    if (els.closeMemoryModalBtn) {
      els.closeMemoryModalBtn.addEventListener('click', () => {
        els.memoryModalBackdrop.classList.remove('open');
      });
    }

    if (els.refreshMemoryBtn) els.refreshMemoryBtn.addEventListener('click', loadMemories);
    if (els.addMemoryBtn) els.addMemoryBtn.addEventListener('click', addNewMemory);

    // AI Engine Modal Handlers
    if (els.endpointModalBtn) {
      els.endpointModalBtn.addEventListener('click', () => {
        loadEndpoints();
        els.endpointModalBackdrop.classList.add('open');
        sfx.click();
      });
    }

    if (els.endpointCloseBtn) {
      els.endpointCloseBtn.addEventListener('click', () => {
        els.endpointModalBackdrop.classList.remove('open');
      });
    }

    if (els.closeEndpointModalBtn) {
      els.closeEndpointModalBtn.addEventListener('click', () => {
        els.endpointModalBackdrop.classList.remove('open');
      });
    }

    if (els.addEndpointBtn) els.addEndpointBtn.addEventListener('click', addNewEndpoint);

    // Quick Command Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd === 'screen') captureScreen();
        else if (cmd) sendUserMessage(cmd);
      });
    });

    // Spacebar Push-to-Talk
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (els.ioModalBackdrop) els.ioModalBackdrop.classList.remove('open');
        if (els.memoryModalBackdrop) els.memoryModalBackdrop.classList.remove('open');
        if (els.endpointModalBackdrop) els.endpointModalBackdrop.classList.remove('open');
        stopMicTest();
        return;
      }
      if (e.code === 'Space' && document.activeElement !== els.chatInput && document.activeElement !== els.newMemoryInput) {
        e.preventDefault();
        if (!state.isListening) startListening();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && document.activeElement !== els.chatInput && document.activeElement !== els.newMemoryInput) {
        e.preventDefault();
        if (state.isListening) stopListening();
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
    appendTranscript('assistant', 'Orion standalone core online. Ready for tactical instructions.');
  });

})();
