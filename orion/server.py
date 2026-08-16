"""
ORION AI - STANDALONE AUTONOMOUS INTELLIGENCE CORE
100% Local, Private, Voice-First AI Companion with Persistent Long-Term Memory
"""

import os
import sys
import time
import json
import sqlite3
import logging
import platform
import asyncio
import threading
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("orion")

# Paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "orion_memory.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# App Setup
app = FastAPI(title="Orion Autonomous AI Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# DATABASE & PERSISTENT MEMORY LAYER (SQLite)
# ==============================================================================

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        # 1. Endpoints table (Ollama, LM Studio, llama.cpp, LocalAI, etc.)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS endpoints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                base_url TEXT NOT NULL UNIQUE,
                api_type TEXT NOT NULL DEFAULT 'ollama', -- 'ollama' or 'openai'
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at REAL NOT NULL
            )
        """)

        # 2. Conversation Messages table (Persistent across days/weeks)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL DEFAULT 'default',
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model TEXT,
                timestamp REAL NOT NULL
            )
        """)

        # 3. Conversation Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)

        # 4. Long-Term Facts & Memories table (Remember user preferences, facts, lore)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL DEFAULT 'general',
                fact TEXT NOT NULL UNIQUE,
                confidence REAL NOT NULL DEFAULT 1.0,
                created_at REAL NOT NULL,
                last_accessed REAL NOT NULL
            )
        """)

        # 5. Core Configuration & Last-Used Settings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # Seed default Ollama endpoint if empty
        cursor.execute("SELECT COUNT(*) as count FROM endpoints")
        if cursor.fetchone()["count"] == 0:
            now = time.time()
            cursor.execute(
                "INSERT INTO endpoints (name, base_url, api_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
                ("Local Ollama Engine", "http://127.0.0.1:11434", "ollama", 1, now)
            )
            cursor.execute(
                "INSERT INTO endpoints (name, base_url, api_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
                ("LM Studio / Local OpenAI", "http://127.0.0.1:1234/v1", "openai", 0, now)
            )
        conn.commit()

init_db()

def get_config(key: str, default: str = "") -> str:
    """Read a persistent configuration key from SQLite."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM config WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row["value"] if row else default
    except Exception:
        return default

def set_config(key: str, value: str):
    """Write a persistent configuration key to SQLite."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", (key, value))
            conn.commit()
    except Exception as ex:
        logger.warning(f"Failed setting config {key}: {ex}")

# ==============================================================================
# PROMPT ARCHITECTURE & MEMORY INJECTION
# ==============================================================================

ORION_CORE_PERSONA = (
    "You are Orion, an ultra-competent, calm, razor-sharp, and sophisticated local AI companion running directly on the operator's local workstation. "
    "You communicate with razor-sharp intellect, crisp precision, and refined politeness. "
    "You possess a persistent local SQLite memory core where you store long-term facts, preferences, and tactical notes about the operator across sessions. "
    "When asked about memories, stored facts, or what you know about the operator, always consult and recite the facts from your [Persistent Long-Term Memory Core]. "
    "NEVER produce canned AI disclaimers claiming you cannot remember or store personal data. "
    "Keep your spoken responses natural, articulate, and concise (typically 1 to 3 direct sentences) "
    "unless the user explicitly requests an in-depth breakdown, code implementation, or technical walkthrough. "
    "You operate with absolute independence on local hardware. Never mention fictional franchises. "
    "Speak with authority as the user's primary intelligence and tactical workstation interface."
)

def retrieve_relevant_memories(user_query: str) -> List[str]:
    """Retrieve long-term facts stored in SQLite memory matching user context."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, fact FROM memories ORDER BY last_accessed DESC LIMIT 50")
        rows = cursor.fetchall()
        
        if not rows:
            return []

        q_lower = user_query.lower()
        # If user explicitly asks about memories, recall, or facts, return all stored memories
        is_memory_query = any(k in q_lower for k in ["memory", "memories", "remember", "stored", "recall", "about me", "know about"])
        if is_memory_query:
            return [r["fact"] for r in rows[:15]]

        query_words = set(q_lower.split())
        matched = []
        for r in rows:
            fact_words = set(r["fact"].lower().split())
            if query_words & fact_words or len(rows) <= 5:
                matched.append(r["fact"])
                cursor.execute("UPDATE memories SET last_accessed = ? WHERE id = ?", (time.time(), r["id"]))
        conn.commit()
        return matched[:10]

def store_memory_fact(fact: str, category: str = "general") -> bool:
    """Store a persistent fact in SQLite."""
    clean_fact = fact.strip()
    if not clean_fact or len(clean_fact) < 4:
        return False
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO memories (category, fact, confidence, created_at, last_accessed) VALUES (?, ?, ?, ?, ?)",
                (category, clean_fact, 1.0, time.time(), time.time())
            )
            conn.commit()
            return True
    except Exception as e:
        logger.warning(f"Failed to store memory: {e}")
        return False

def ensure_local_ollama_running():
    """Ensure local Ollama service is running on the system; auto-launch if offline."""
    try:
        with httpx.Client(timeout=1.0) as client:
            res = client.get("http://127.0.0.1:11434/api/tags")
            if res.status_code == 200:
                return True
    except Exception:
        pass

    logger.info("Local Ollama service unreachable. Attempting auto-launch in background...")
    ollama_paths = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe",
        Path(os.environ.get("PROGRAMFILES", "")) / "Ollama" / "ollama.exe",
        Path("ollama")
    ]
    for p in ollama_paths:
        try:
            if str(p) == "ollama" or p.exists():
                subprocess.Popen(
                    [str(p), "serve"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" else 0
                )
                time.sleep(2.0)
                return True
        except Exception as ex:
            logger.debug(f"Failed starting {p}: {ex}")
    return False

# ==============================================================================
# MULTI-ENGINE LOCAL MODEL DISCOVERY & INFERENCE
# ==============================================================================

def compute_resource_tier(size_bytes: int = 0, name: str = "") -> str:
    """Compute resource demand level (LOW / MEDIUM / HIGH) based on model size or parameter scale."""
    gb = (size_bytes / (1024 ** 3)) if size_bytes > 0 else 0
    name_lower = name.lower()
    
    if gb > 0:
        if gb >= 10.0:
            return "HIGH"
        elif gb >= 4.0:
            return "MEDIUM"
        else:
            return "LOW"
            
    # Fallback heuristics based on parameter indicators in name
    if any(k in name_lower for k in ["30b", "32b", "33b", "70b", "72b", "mixtral", "command-r"]):
        return "HIGH"
    elif any(k in name_lower for k in ["7b", "8b", "13b", "14b", "llama3", "llava", "mistral", "gemma:7b", "qwen2.5"]):
        return "MEDIUM"
    else:
        return "LOW"

MODEL_DESCRIPTIONS = {
    "llama3:latest": "Meta Llama 3 (8B). High-speed general conversational intelligence with refined reasoning.",
    "llama3:8b": "Meta Llama 3 (8B). High-speed general conversational intelligence with refined reasoning.",
    "qwen2.5-coder:14b": "Alibaba Qwen 2.5 Coder (14B). Elite code generation, multi-file refactoring, and complex logic.",
    "qwen3-coder:30b": "Alibaba Qwen 3 Coder (30B MoE). Heavyweight frontier programming intelligence for deep software engineering.",
    "deepseek-coder:6.7b": "DeepSeek Coder (6.7B). Ultra-fast, lightweight programming model optimized for quick code assistance.",
    "moondream:latest": "Moondream2 (1.86B). Ultra-fast, lightweight vision model for rapid screen parsing and optical recognition.",
    "llava:latest": "LLaVA 1.5 (7B). High-precision multimodal vision analysis for complex screen and camera captures."
}

def get_model_description(name: str) -> str:
    """Return an articulate tactical description for a local model."""
    name_lower = name.lower()
    for k, v in MODEL_DESCRIPTIONS.items():
        if k in name_lower or name_lower in k:
            return v
    if "coder" in name_lower:
        return "Specialized programming and syntax intelligence model."
    if any(v in name_lower for v in ["vision", "llava", "moondream", "vl"]):
        return "Multimodal visual recognition model for screen and optical sensor parsing."
    return "Local neural inference model operating directly on workstation hardware."

async def discover_local_models():
    """Scan all active endpoints (Ollama, LM Studio, llama.cpp, etc.) for models."""
    models = []
    vision_models = []
    engine_status = []

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM endpoints WHERE is_active = 1")
        endpoints = cursor.fetchall()

    # If local Ollama endpoint exists, ensure service is alive
    if any(ep["api_type"] == "ollama" for ep in endpoints):
        ensure_local_ollama_running()

    async with httpx.AsyncClient(timeout=4.0) as client:
        for ep in endpoints:
            base_url = ep["base_url"].rstrip("/")
            api_type = ep["api_type"]
            ep_name = ep["name"]
            
            try:
                if api_type == "ollama":
                    tags_url = f"{base_url}/api/tags"
                    res = await client.get(tags_url)
                    if res.status_code == 200:
                        engine_status.append({"name": ep_name, "url": base_url, "status": "online", "type": "ollama"})
                        data = res.json()
                        for m in data.get("models", []):
                            name = m.get("name", "")
                            size = m.get("size", 0)
                            tier = compute_resource_tier(size, name)
                            desc = get_model_description(name)
                            model_entry = {
                                "name": name,
                                "size": size,
                                "size_gb": round(size / (1024 ** 3), 1) if size else None,
                                "resource_tier": tier,
                                "description": desc,
                                "label": f"{name} [{tier}]",
                                "endpoint": base_url,
                                "type": "ollama"
                            }
                            if any(v in name.lower() for v in ["llava", "vision", "moondream", "bakllava", "minicpm", "vl"]):
                                vision_models.append(model_entry)
                            else:
                                models.append(model_entry)
                
                elif api_type == "openai":
                    models_url = f"{base_url}/models" if not base_url.endswith("/v1") else f"{base_url}/models"
                    res = await client.get(models_url)
                    if res.status_code == 200:
                        engine_status.append({"name": ep_name, "url": base_url, "status": "online", "type": "openai"})
                        data = res.json()
                        for m in data.get("data", []):
                            name = m.get("id", "")
                            tier = compute_resource_tier(0, name)
                            desc = get_model_description(name)
                            model_entry = {
                                "name": name,
                                "size": 0,
                                "size_gb": None,
                                "resource_tier": tier,
                                "description": desc,
                                "label": f"{name} [{tier}]",
                                "endpoint": base_url,
                                "type": "openai"
                            }
                            if any(v in name.lower() for v in ["vision", "vl", "llava", "moondream"]):
                                vision_models.append(model_entry)
                            else:
                                models.append(model_entry)
            except Exception as ex:
                engine_status.append({"name": ep_name, "url": base_url, "status": "offline", "error": str(ex)})

    return models, vision_models, engine_status

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/api/telemetry")
async def get_telemetry():
    """Return system telemetry, hardware stats, memory stats, and discovered local models."""
    models, vision_models, engine_status = await discover_local_models()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM messages")
        msg_count = cursor.fetchone()["count"]
        cursor.execute("SELECT COUNT(*) as count FROM memories")
        memory_count = cursor.fetchone()["count"]

    is_any_online = any(e["status"] == "online" for e in engine_status)
    saved_model = get_config("active_model", "")
    saved_vision = get_config("active_vision_model", "")

    default_text = saved_model if (saved_model and any(m["name"] == saved_model for m in models)) else (models[0]["name"] if models else "llama3:latest")
    default_vis = saved_vision if (saved_vision and any(m["name"] == saved_vision for m in vision_models)) else (vision_models[0]["name"] if vision_models else "llava:latest")

    return {
        "status": "nominal" if is_any_online else "offline",
        "engine": "Orion Standalone Core",
        "version": "2.0.0",
        "platform": platform.system(),
        "engines": engine_status,
        "models": [m["name"] for m in models],
        "models_full": models,
        "vision_models": [m["name"] for m in vision_models],
        "vision_models_full": vision_models,
        "default_model": default_text,
        "default_vision_model": default_vis,
        "database": {
            "total_messages": msg_count,
            "total_memories": memory_count,
            "db_path": str(DB_PATH)
        },
        "timestamp": time.time()
    }

def is_direct_memory_query(msg: str) -> bool:
    """Check if the user is explicitly requesting a recall/listing of stored long-term memories."""
    m = msg.strip().lower().rstrip("?.! ")
    direct_patterns = [
        "what memories do you have stored about me",
        "what memories do you have stored",
        "what memories do you have",
        "what do you remember about me",
        "what do you remember",
        "what is in your memory",
        "what's in your memory",
        "show memories",
        "show stored memories",
        "recall memory",
        "recall memories",
        "list memories",
        "list stored memories",
        "what facts do you know about me",
        "what facts do you have about me",
        "what do you know about me"
    ]
    return any(p in m for p in direct_patterns)

@app.post("/api/talk")
async def orion_talk(request: Request):
    """High-speed voice conversation endpoint with memory injection and database persistence."""
    data = await request.json()
    message = (data.get("message") or "").strip()
    if not message:
        raise HTTPException(400, "Message cannot be empty")

    model = data.get("model") or "llama3:latest"
    session_id = data.get("session_id") or "default"
    custom_system_prompt = data.get("system_prompt") or ORION_CORE_PERSONA
    stream = bool(data.get("stream", False))

    # Fast direct response for explicit memory recall requests (bypassing model disclaimer RLHF)
    if is_direct_memory_query(message):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT fact FROM memories ORDER BY last_accessed DESC")
            all_mems = [r["fact"] for r in cursor.fetchall()]

        if all_mems:
            mem_list = "\n".join(f"• {m}" for m in all_mems)
            reply = (
                f"Memory core accessed. I currently have {len(all_mems)} persistent record{'s' if len(all_mems) > 1 else ''} stored about you:\n\n"
                f"{mem_list}\n\n"
                "You can add, edit, or clear facts anytime in Settings > Persistent Memory."
            )
        else:
            reply = (
                "My persistent memory core is active and operational, but no custom facts are currently stored in SQLite.\n\n"
                "You can record facts anytime in Settings > Persistent Memory or tell me directly (e.g. 'Remember that I prefer dark mode and Python 3.12')."
            )

        # Store session and messages in SQLite
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated_at = ?",
                (session_id, "Memory Recall", time.time(), time.time(), time.time())
            )
            cursor.execute(
                "INSERT INTO messages (session_id, role, content, model, timestamp) VALUES (?, ?, ?, ?, ?)",
                (session_id, "user", message, model, time.time())
            )
            cursor.execute(
                "INSERT INTO messages (session_id, role, content, model, timestamp) VALUES (?, ?, ?, ?, ?)",
                (session_id, "assistant", reply, "sqlite_memory_core", time.time())
            )
            conn.commit()

        return JSONResponse({
            "response": reply,
            "latency_ms": 12.0,
            "model": "sqlite_memory_core",
            "memories_recalled": len(all_mems),
            "session_id": session_id
        })

    # Retrieve relevant memories from database
    relevant_memories = retrieve_relevant_memories(message)
    memory_context = ""
    if relevant_memories:
        memory_context = (
            "\n\n[PERSISTENT LONG-TERM MEMORY CORE]:\n"
            + "\n".join(f"• {m}" for m in relevant_memories)
            + "\n\nCRITICAL MEMORY DIRECTIVE: The above facts are stored in your persistent local memory database. "
            "When the operator asks what you remember, what memories you have stored, or asks about these facts, "
            "confidently state and summarize these stored points. NEVER deny having memory or give generic AI disclaimers."
        )
    else:
        q_lower = message.lower()
        if any(k in q_lower for k in ["memory", "memories", "remember", "stored", "recall", "about me"]):
            memory_context = (
                "\n\n[PERSISTENT LONG-TERM MEMORY CORE]:\n"
                "No custom facts are currently stored in your memory database. "
                "Inform the operator that your local memory core is active and ready, and they can add memories in Settings > Persistent Memory or tell you facts to remember."
            )

    system_content = f"{custom_system_prompt}{memory_context}"

    # Fetch last 8 messages from SQLite for session context
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 8",
            (session_id,)
        )
        recent_history = cursor.fetchall()
        recent_history.reverse()

    image_data = data.get("image") or ""
    if image_data and "," in image_data:
        image_data = image_data.split(",", 1)[1]

    messages_payload = [{"role": "system", "content": system_content}]
    for h in recent_history:
        messages_payload.append({"role": h["role"], "content": h["content"]})
    
    user_msg = {"role": "user", "content": message}
    if image_data:
        user_msg["images"] = [image_data]
    messages_payload.append(user_msg)

    # Ensure session exists and update timestamp
    title_snippet = message[:35] + ("..." if len(message) > 35 else "")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated_at = ?",
            (session_id, title_snippet, time.time(), time.time(), time.time())
        )
        cursor.execute(
            "INSERT INTO messages (session_id, role, content, model, timestamp) VALUES (?, ?, ?, ?, ?)",
            (session_id, "user", message, model, time.time())
        )
        conn.commit()

    start_time = time.time()

    # Determine endpoint to use (default to local Ollama 127.0.0.1:11434)
    target_endpoint = "http://127.0.0.1:11434"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT base_url, api_type FROM endpoints WHERE is_active = 1 LIMIT 1")
        ep_row = cursor.fetchone()
        if ep_row:
            target_endpoint = ep_row["base_url"].rstrip("/")

    # Stream Response
    if stream:
        async def stream_generator():
            full_response = []
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        f"{target_endpoint}/api/chat",
                        json={"model": model, "messages": messages_payload, "stream": True}
                    ) as response:
                        if response.status_code != 200:
                            yield f"data: {{\"error\": \"Local engine error {response.status_code}\", \"done\": true}}\n\n"
                            return
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("message", {}).get("content", "")
                                full_response.append(token)
                                yield f"data: {json.dumps({'chunk': token, 'done': chunk.get('done', False)})}\n\n"
                            except Exception:
                                pass
                # Save assistant response in background
                complete_text = "".join(full_response).strip()
                if complete_text:
                    with get_db() as conn:
                        cursor = conn.cursor()
                        cursor.execute(
                            "INSERT INTO messages (session_id, role, content, model, timestamp) VALUES (?, ?, ?, ?, ?)",
                            (session_id, "assistant", complete_text, model, time.time())
                        )
                        conn.commit()
            except Exception as ex:
                yield f"data: {json.dumps({'error': str(ex), 'done': True})}\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    # Fast JSON Non-Streaming
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    f"{target_endpoint}/api/chat",
                    json={"model": model, "messages": messages_payload, "stream": False}
                )
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Inference engine error: {res.text}")
                
                res_json = res.json()
                reply_text = res_json.get("message", {}).get("content", "").strip()
                duration_ms = int((time.time() - start_time) * 1000)

                # Persist assistant reply to database
                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO messages (session_id, role, content, model, timestamp) VALUES (?, ?, ?, ?, ?)",
                        (session_id, "assistant", reply_text, model, time.time())
                    )
                    conn.commit()

                # Automatic fact extraction check (e.g. "my name is ...", "remember that ...", "i prefer ...")
                lower_msg = message.lower()
                if any(trigger in lower_msg for trigger in ["my name is", "i prefer", "remember that", "remember:", "i am ", "my favorite"]):
                    store_memory_fact(message, category="user_preference")

                return {
                    "response": reply_text,
                    "model": model,
                    "duration_ms": duration_ms,
                    "memories_recalled": len(relevant_memories),
                    "status": "success"
                }
        except (httpx.ConnectError, httpx.HTTPError) as ex:
            if attempt == 0 and "11434" in target_endpoint:
                logger.warning(f"Connection failed to Ollama. Attempting auto-heal restart: {ex}")
                ensure_local_ollama_running()
                await asyncio.sleep(2.0)
                continue
            raise HTTPException(502, f"Failed to communicate with local AI engine: {ex}")

@app.post("/api/vision")
async def orion_vision(request: Request):
    """Analyze screen or camera frame using local vision model (llava/moondream/minicpm)."""
    data = await request.json()
    image_data = data.get("image") or ""
    if not image_data:
        raise HTTPException(400, "Base64 image is required")

    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        prompt = "Analyze this visual capture with crisp tactical precision. Summarize key elements, text, or notable status."

    model = data.get("model") or "llava:latest"
    start_time = time.time()

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    "http://127.0.0.1:11434/api/generate",
                    json={
                        "model": model,
                        "prompt": f"[System: Respond in your crisp, calm Orion companion persona]\n{prompt}",
                        "images": [image_data],
                        "stream": False,
                        "keep_alive": "30s"
                    }
                )
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Vision model error: {res.text}")
                
                res_json = res.json()
                response_text = res_json.get("response", "").strip()
                duration_ms = int((time.time() - start_time) * 1000)

                return {
                    "response": response_text,
                    "model": model,
                    "duration_ms": duration_ms,
                    "status": "success"
                }
        except (httpx.ConnectError, httpx.HTTPError) as ex:
            if attempt == 0:
                ensure_local_ollama_running()
                await asyncio.sleep(2.0)
                continue
            raise HTTPException(502, f"Failed to communicate with vision model: {ex}")

@app.post("/api/models/purge")
async def purge_models():
    """Unload all models from RAM/VRAM immediately."""
    unloaded = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            ps_res = await client.get("http://127.0.0.1:11434/api/ps")
            if ps_res.status_code == 200:
                running_models = ps_res.json().get("models", [])
                for m in running_models:
                    m_name = m.get("name", "")
                    await client.post("http://127.0.0.1:11434/api/generate", json={"model": m_name, "keep_alive": 0})
                    unloaded.append(m_name)
    except Exception as ex:
        pass
    return {"status": "purged", "unloaded_models": unloaded}

@app.post("/api/models/switch")
async def switch_model(request: Request):
    """Terminate previous/inactive model processes when switching to a new model."""
    data = await request.json()
    new_model = (data.get("new_model") or "").strip()
    if new_model:
        if any(v in new_model.lower() for v in ["llava", "vision", "moondream", "bakllava", "minicpm", "vl"]):
            set_config("active_vision_model", new_model)
        else:
            set_config("active_model", new_model)

    unloaded = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            ps_res = await client.get("http://127.0.0.1:11434/api/ps")
            if ps_res.status_code == 200:
                running_models = ps_res.json().get("models", [])
                for m in running_models:
                    m_name = m.get("name", "")
                    # Terminate all models that aren't the newly selected one
                    if m_name and m_name != new_model:
                        await client.post("http://127.0.0.1:11434/api/generate", json={"model": m_name, "keep_alive": 0})
                        unloaded.append(m_name)
    except Exception as ex:
        logger.warning(f"Model switch unload error: {ex}")
    return {"status": "switched", "new_model": new_model, "unloaded": unloaded}

@app.post("/api/shutdown")
async def shutdown_system():
    """Completely close Orion AI and terminate all active llama-server.exe processes."""
    # 1. Gracefully tell Ollama to unload all models
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            ps_res = await client.get("http://127.0.0.1:11434/api/ps")
            if ps_res.status_code == 200:
                running_models = ps_res.json().get("models", [])
                for m in running_models:
                    m_name = m.get("name", "")
                    await client.post("http://127.0.0.1:11434/api/generate", json={"model": m_name, "keep_alive": 0})
    except Exception:
        pass

    # 2. Hard kill any lingering llama-server processes on Windows and exit
    def kill_and_exit():
        time.sleep(0.6)
        try:
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/F", "/IM", "llama-server.exe"], capture_output=True, check=False)
        except Exception:
            pass
        time.sleep(0.4)
        logger.info("Orion Core shutdown complete. Exiting process.")
        os._exit(0)

    threading.Thread(target=kill_and_exit, daemon=True).start()
    return {"status": "shutdown_initiated", "message": "Orion AI and all llama-server processes terminated."}

# ==============================================================================
# MEMORY & ENDPOINT MANAGEMENT ENDPOINTS
# ==============================================================================

@app.get("/api/memory")
def get_memories():
    """List all stored long-term memories."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM memories ORDER BY last_accessed DESC")
        memories = [dict(r) for r in cursor.fetchall()]
        return {"memories": memories, "count": len(memories)}

@app.post("/api/memory")
async def add_memory(request: Request):
    """Manually add a memory or fact."""
    data = await request.json()
    fact = (data.get("fact") or "").strip()
    category = (data.get("category") or "general").strip()
    if not fact:
        raise HTTPException(400, "Fact content is required")
    success = store_memory_fact(fact, category)
    return {"status": "saved" if success else "failed"}

@app.delete("/api/memory/{memory_id}")
def delete_memory(memory_id: int):
    """Delete a memory entry."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        conn.commit()
    return {"status": "deleted"}

@app.get("/api/endpoints")
def get_endpoints():
    """List all configured AI endpoints."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM endpoints ORDER BY id ASC")
        endpoints = [dict(r) for r in cursor.fetchall()]
        return {"endpoints": endpoints}

@app.post("/api/endpoints")
async def add_endpoint(request: Request):
    """Add a new open-source AI endpoint."""
    data = await request.json()
    name = (data.get("name") or "Local AI").strip()
    base_url = (data.get("base_url") or "").strip().rstrip("/")
    api_type = (data.get("api_type") or "ollama").strip()
    if not base_url:
        raise HTTPException(400, "base_url is required")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO endpoints (name, base_url, api_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
            (name, base_url, api_type, 1, time.time())
        )
        conn.commit()
    return {"status": "registered", "base_url": base_url}

@app.get("/api/sessions")
def get_sessions():
    """List all saved conversation sessions with message count and preview."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id, s.title, s.created_at, s.updated_at, COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON s.id = m.session_id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        """)
        sessions = [dict(r) for r in cursor.fetchall()]
        return {"sessions": sessions}

@app.post("/api/sessions")
async def create_session(request: Request):
    """Create a new conversation session."""
    data = await request.json()
    title = (data.get("title") or "New Session").strip()
    session_id = data.get("session_id") or f"session_{int(time.time()*1000)}"
    now = time.time()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at",
            (session_id, title, now, now)
        )
        conn.commit()
    return {"id": session_id, "title": title, "created_at": now}

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete a conversation session and all its messages."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.commit()
    return {"status": "deleted", "session_id": session_id}

@app.get("/api/history")
def get_history(session_id: str = "default"):
    """Get chronological conversation history for a session."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
        messages = [dict(r) for r in cursor.fetchall()]
        return {"session_id": session_id, "messages": messages}

@app.post("/api/history/clear")
async def clear_history(request: Request):
    """Clear conversation history for a session."""
    data = await request.json()
    session_id = data.get("session_id") or "default"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
    return {"status": "cleared", "session_id": session_id}

# Mount static directory and root handler
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
def serve_index():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return HTMLResponse(index_path.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>Orion AI Core Initializing... Please refresh in a moment.</h1>")

if __name__ == "__main__":
    port = int(os.getenv("ORION_PORT", "8000"))
    print("=" * 60)
    print(f"  ORION AI - STANDALONE AUTONOMOUS INTELLIGENCE CORE")
    print(f"  Live at: http://127.0.0.1:{port}")
    print(f"  Database: {DB_PATH}")
    print("=" * 60)
    uvicorn.run("server:app", host="127.0.0.1", port=port, log_level="info", reload=False)
