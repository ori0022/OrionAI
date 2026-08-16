import httpx
import base64
import io
from PIL import Image, ImageDraw

BASE_URL = "http://127.0.0.1:7000"

def test_companion():
    print("=== Testing Odysseus Companion API Endpoints ===")
    with httpx.Client(timeout=30.0) as client:
        # 1. Telemetry
        tel_resp = client.get(f"{BASE_URL}/api/companion/telemetry")
        print(f"[1] Telemetry Status: {tel_resp.status_code}")
        print(f"    Data: {tel_resp.json()}")

        # 2. Companion Talk (Odysseus Persona)
        talk_resp = client.post(
            f"{BASE_URL}/api/companion/talk",
            json={
                "message": "Odysseus, report status and confirm core operational readiness.",
                "model": "llama3:latest"
            }
        )
        print(f"[2] Talk Status: {talk_resp.status_code}")
        print(f"    Response: {talk_resp.json().get('response')}")
        print(f"    Duration: {talk_resp.json().get('duration_ms')} ms")

        # 3. Companion Vision
        img = Image.new('RGB', (100, 100), color='teal')
        draw = ImageDraw.Draw(img)
        draw.ellipse([25, 25, 75, 75], fill='white')
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        vis_resp = client.post(
            f"{BASE_URL}/api/companion/vision",
            json={
                "image": b64,
                "prompt": "Identify the geometry and color in this optical feed.",
                "model": "llava:latest"
            }
        )
        print(f"[3] Vision Status: {vis_resp.status_code}")
        print(f"    Vision Response: {vis_resp.json().get('response')}")

        # 4. Companion HTML Route
        hud_resp = client.get(f"{BASE_URL}/companion")
        print(f"[4] HUD Page Status: {hud_resp.status_code}")

if __name__ == "__main__":
    test_companion()
