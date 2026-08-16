import time
import base64
import httpx

BASE_URL = "http://127.0.0.1:8000"

def test_orion():
    print("=== Testing Orion Standalone Application ===")
    
    with httpx.Client(timeout=45.0) as client:
        # 1. Telemetry & Engine Discovery
        print("\n[1] Testing GET /api/telemetry...")
        res = client.get(f"{BASE_URL}/api/telemetry")
        print(f"    Status: {res.status_code}")
        telem = res.json()
        print(f"    Engine: {telem.get('engine')} (Status: {telem.get('status')})")
        print(f"    Discovered Models: {telem.get('models')}")
        print(f"    Discovered Vision: {telem.get('vision_models')}")
        print(f"    SQLite Database Stats: {telem.get('database')}")
        assert res.status_code == 200

        # 2. Store Persistent Memory Fact
        print("\n[2] Testing Persistent Memory Storage (POST /api/memory)...")
        mem_res = client.post(f"{BASE_URL}/api/memory", json={
            "fact": "Operator prefers razor-sharp concise Python code and terminal commands.",
            "category": "user_preference"
        })
        print(f"    Memory Status: {mem_res.json()}")
        assert mem_res.status_code == 200

        # 3. Conversational Inference & Memory Recall
        print("\n[3] Testing POST /api/talk with Orion Persona & Memory Recall...")
        t0 = time.time()
        talk_res = client.post(f"{BASE_URL}/api/talk", json={
            "message": "Orion, confirm your status and state what coding preference you have on record for me.",
            "model": "llama3:latest",
            "session_id": "test_session"
        })
        elapsed = time.time() - t0
        print(f"    Talk Status: {talk_res.status_code} (Elapsed: {elapsed:.2f}s)")
        talk_data = talk_res.json()
        print(f"    Orion Reply: {talk_data.get('response')}")
        print(f"    Memories Recalled: {talk_data.get('memories_recalled')}")
        assert talk_res.status_code == 200

        # 4. Multimodal Vision Test
        print("\n[4] Testing POST /api/vision with local llava:latest...")
        # 1x1 blue PNG
        blue_dot = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAEeAGVwW0tYwAAAABJRU5ErkJggg=="
        vis_res = client.post(f"{BASE_URL}/api/vision", json={
            "image": blue_dot,
            "prompt": "Identify the primary color in this visual frame.",
            "model": "llava:latest"
        })
        print(f"    Vision Status: {vis_res.status_code}")
        print(f"    Vision Analysis: {vis_res.json().get('response')}")
        assert vis_res.status_code == 200

        # 5. Standalone HUD UI page
        print("\n[5] Testing GET / (Orion Standalone HUD UI)...")
        ui_res = client.get(f"{BASE_URL}/")
        print(f"    UI Status: {ui_res.status_code}")
        assert "Orion Core" in ui_res.text
        assert ui_res.status_code == 200

        print("\n>>> ALL ORION STANDALONE TESTS PASSED NOMINALLY! <<<")

if __name__ == "__main__":
    test_orion()
