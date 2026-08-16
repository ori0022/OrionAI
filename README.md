# 🌌 Orion AI — Autonomous Intelligence Core

Orion is a **100% local, private, voice-first AI companion** with persistent SQLite long-term memory, real-time audio visualization, multimodal screen/webcam vision, and universal support for any open-source local AI model engine on your machine.

---

## ⚡ Quick Start

### 1. Launch Orion
Double-click `OrionAI.bat` or run:
```powershell
.\venv\Scripts\python.exe orion\server.py
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

---

## 💎 Features

- **🧠 Multi-Engine & Model Integrations**: Connects directly to Ollama (`http://127.0.0.1:11434`), LM Studio (`http://127.0.0.1:1234/v1`), llama.cpp, KoboldCPP, vLLM, and any OpenAI-compatible local endpoint.
- **💾 Persistent Long-Term Memory (SQLite)**: Automatically stores user instructions, facts, and conversation history so Orion remembers you across sessions and days.
- **🎙️ Voice-First Hands-Free Loop**: Spacebar Push-to-Talk and speech synthesis with custom voice selection, pitch, and speed adjustments.
- **📊 Real-Time Microphone VU Level Meter**: Live input sensitivity testing with color gradient volume indicator.
- **👁️ Multimodal Screen & Optical Vision**: One-click screen and webcam snapshots analyzed by local vision models (`llava`, `moondream`, `minicpm-v`).
- **🛡️ 100% Offline & Private**: Zero external cloud APIs, zero telemetry.
