import httpx
import json

BASE_URL = "http://127.0.0.1:7000"

def test_chat():
    print("\n--- Testing Odysseus Local Chat with Ollama ---")
    with httpx.Client(timeout=60.0) as client:
        # 1. Fetch models to get endpoint_id
        models_resp = client.get(f"{BASE_URL}/api/models")
        items = models_resp.json().get("items", [])
        if not items:
            print("No model endpoints available!")
            return
        ep = items[0]
        ep_id = ep.get("endpoint_id")
        ep_url = ep.get("url")
        model = "llama3:latest" if "llama3:latest" in ep.get("models", []) else ep.get("models", [])[0]
        print(f"Using Endpoint ID: {ep_id}, URL: {ep_url}, Model: {model}")

        # 2. Create a session
        sess_resp = client.post(
            f"{BASE_URL}/api/session",
            data={
                "name": "Jarvis Test Session",
                "endpoint_id": ep_id,
                "model": model,
                "skip_validation": "true"
            }
        )
        print(f"Create session status: {sess_resp.status_code}")
        sess_data = sess_resp.json()
        session_id = sess_data.get("id")
        print(f"Session ID created: {session_id}")

        # 3. Send a test message
        print("Sending test message: 'Hello Jarvis, give a 1-sentence status report.'")
        chat_resp = client.post(
            f"{BASE_URL}/api/chat",
            json={
                "session": session_id,
                "message": "Hello Jarvis, give a 1-sentence status report.",
                "use_web": False,
                "use_research": False
            }
        )
        print(f"Chat response status: {chat_resp.status_code}")
        chat_data = chat_resp.json()
        print(f"Assistant Response:\n{chat_data.get('response')}")

if __name__ == "__main__":
    test_chat()
