import json
import os
import sys

# Ensure UTF-8 output encoding for Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, SessionLocal
from app.models.chat import Conversation, Message

# Initialize DB
init_db()

client = TestClient(app)

print("--- 1. Testing Health Endpoint ---")
r = client.get("/api/health")
assert r.status_code == 200, f"Health check failed: {r.status_code}"
print("Health status:", r.json())

print("\n--- 2. Testing Models Endpoint ---")
r = client.get("/api/models")
assert r.status_code == 200, f"Models check failed: {r.status_code}"
models = r.json()
print(f"Available models count: {len(models)}")
for m in models:
    print(f" - {m['name']} ({m['id']})")

print("\n--- 3. Testing Conversation Creation ---")
r = client.post("/api/conversations", json={"title": "Test Chat", "model": "llama-3.3-70b-versatile"})
assert r.status_code == 201, f"Create conversation failed: {r.status_code}"
conv_data = r.json()
conv_id = conv_data["id"]
print(f"Created conversation ID: {conv_id}, Title: {conv_data['title']}")

print("\n--- 4. Testing SSE Message Streaming ---")
with client.stream(
    "POST",
    f"/api/conversations/{conv_id}/messages",
    json={"content": "Explain quantum computing briefly", "model": "llama-3.3-70b-versatile"}
) as response:
    assert response.status_code == 200, f"Stream message failed: {response.status_code}"
    print("Content-Type:", response.headers.get("content-type"))
    
    events = []
    stream_content = []
    for line in response.iter_lines():
        if line.startswith("data: "):
            payload = json.loads(line[6:])
            events.append(payload.get("type"))
            if payload.get("type") == "token":
                stream_content.append(payload.get("content", ""))
            elif payload.get("type") == "done":
                print(f"Stream done event received: message_id={payload.get('message_id')}")

    print(f"Received {len(events)} SSE events.")
    print("Unique event types:", set(events))
    preview = "".join(stream_content)[:120]
    print(f"Streaming text preview: {repr(preview)}...")

print("\n--- 5. Testing Permanent SQLite Persistence ---")
r = client.get(f"/api/conversations/{conv_id}")
assert r.status_code == 200
conv_detail = r.json()
print(f"Retrieved conversation with {len(conv_detail['messages'])} saved messages in DB:")
for msg in conv_detail['messages']:
    print(f" - [{msg['role']}]: {repr(msg['content'][:50])}...")

print("\n--- 6. Testing Conversation Search & Auto-titling ---")
r = client.get("/api/conversations?search=quantum")
assert r.status_code == 200
search_results = r.json()
print(f"Search results for 'quantum': {len(search_results)} conversation(s) found.")

print("\n--- 7. Testing Conversation Title Update ---")
r = client.patch(f"/api/conversations/{conv_id}", json={"title": "Quantum Computing 101"})
assert r.status_code == 200
assert r.json()["title"] == "Quantum Computing 101"
print(f"Updated title: {r.json()['title']}")

print("\n--- 8. Testing Conversation Deletion ---")
r = client.delete(f"/api/conversations/{conv_id}")
assert r.status_code == 204
r_check = client.get(f"/api/conversations/{conv_id}")
assert r_check.status_code == 404
print("Conversation successfully deleted from SQLite and confirmed 404.")

print("\n>>> ALL PHASE 1-4 INTEGRATION TESTS PASSED PERFECTLY! <<<")
