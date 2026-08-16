import httpx
import base64
import io
from PIL import Image, ImageDraw

def test_local_vision():
    print("Testing local Ollama vision endpoint with llava & moondream...")
    img = Image.new('RGB', (120, 120), color='black')
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 100, 100], fill='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    b64_str = base64.b64encode(buf.getvalue()).decode('utf-8')

    with httpx.Client(timeout=45.0) as client:
        payload = {
            "model": "llava:latest",
            "prompt": "What shape and color is in this image?",
            "images": [b64_str],
            "stream": False
        }
        try:
            resp = client.post("http://localhost:11434/api/generate", json=payload)
            print(f"Llava response status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Llava result:\n{resp.json().get('response')}")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Llava test failed: {e}")

if __name__ == "__main__":
    test_local_vision()
