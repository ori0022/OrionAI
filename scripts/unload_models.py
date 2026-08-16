import httpx

client = httpx.Client(timeout=10.0)

for m in ["qwen2.5-coder:14b", "llava:latest"]:
    try:
        r = client.post("http://127.0.0.1:11434/api/generate", json={"model": m, "keep_alive": 0})
        print(f"Unloaded {m}: {r.status_code}")
    except Exception as e:
        print(f"Error unloading {m}: {e}")

try:
    ps = client.get("http://127.0.0.1:11434/api/ps").json()
    print("Currently loaded in RAM:", [m["name"] for m in ps.get("models", [])])
except Exception as e:
    print(e)
