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

        # 3. Long-Term Facts & Memories table (Remember user preferences, facts, lore)
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

# ==============================================================================
# PROMPT ARCHITECTURE & MEMORY INJECTION
# ==============================================================================

ORION_CORE_PERSONA = (
    "You are Orion, an ultra-competent, calm, razor-sharp, and sophisticated local AI companion. "
    "You communicate with razor-sharp intellect, crisp precision, and refined politeness. "
    "Keep your spoken responses natural, articulate, and concise (typically 1 to 3 direct sentences) "
    "unless the user explicitly requests an in-depth breakdown, code implementation, or technical walkthrough. "
    "You operate with absolute independence on local hardware. Never mention fictional franchises. "
    "Speak with authority as the user's primary intelligence and tactical workstation interface."
)

def retrieve_relevant_memories(user_query: str) -> List[str]:
    """Retrieve long-term facts stored in SQLite memory matching user context."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, fact FROM memories ORDER BY last_accessed DESC LIMIT 30")
        rows = cursor.fetchall()
        
        if not rows:
            return []

        query_words = set(user_query.lower().split())
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

# ==============================================================================
# MULTI-ENGINE LOCAL MODEL DISCOVERY & INFERENCE
# ==============================================================================

async def discover_local_models():
    """Scan all active endpoints (Ollama, LM Studio, llama.cpp, etc.) for models."""
    models = []
    vision_models = []
    engine_status = []

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM endpoints WHERE is_active = 1")
        endpoints = cursor.fetchall()

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
                            if any(v in name.lower() for v in ["llava", "vision", "moondream", "bakllava", "minicpm", "vl"]):
                                vision_models.append({"name": name, "endpoint": base_url, "type": "ollama"})
                            else:
                                models.append({"name": name, "endpoint": base_url, "type": "ollama"})
                
                elif api_type == "openai":
                    models_url = f"{base_url}/models" if not base_url.endswith("/v1") else f"{base_url}/models"
                    res = await client.get(models_url)
                    if res.status_code == 200:
                        engine_status.append({"name": ep_name, "url": base_url, "status": "online", "type": "openai"})
                        data = res.json()
                        for m in data.get("data", []):
                            name = m.get("id", "")
                            if any(v in name.lower() for v in ["vision", "vl", "llava", "moondream"]):
                                vision_models.append({"name": name, "endpoint": base_url, "type": "openai"})
                            else:
                                models.append({"name": name, "endpoint": base_url, "type": "openai"})
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
    default_text = models[0]["name"] if models else "llama3:latest"
    default_vis = vision_models[0]["name"] if vision_models else "llava:latest"

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

    # Retrieve relevant memories from database
    relevant_memories = retrieve_relevant_memories(message)
    memory_context = ""
    if relevant_memories:
        memory_context = "\n[Persistent Long-Term Memory]:\n" + "\n".join(f"- {m}" for m in relevant_memories)

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

    # Save user message to database
    with get_db() as conn:
        cursor = conn.cursor()
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
    except httpx.HTTPError as ex:
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

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "http://127.0.0.1:11434/api/generate",
                json={
                    "model": model,
                    "prompt": f"[System: Respond in your crisp, calm Orion companion persona]\n{prompt}",
                    "images": [image_data],
                    "stream": False
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
    except httpx.HTTPError as ex:
        raise HTTPException(502, f"Local vision engine error: {ex}")

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
