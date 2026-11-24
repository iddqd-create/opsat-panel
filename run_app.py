"""
OSPAT Clinical Control Center Launcher
Starts local FastAPI server and automatically opens the browser.
"""

import sys
import os
import time
import webbrowser
import threading
import uvicorn

PORT = 8000
HOST = "127.0.0.1"
URL = f"http://{HOST}:{PORT}"

def open_browser():
    time.sleep(1.5)
    print(f"\n[OSPAT] Opening web browser at {URL}...")
    webbrowser.open(URL)

if __name__ == "__main__":
    print("=" * 65)
    print("  OSPAT | Open Source Psychedelic-Assisted Therapy")
    print("  Clinical Control Center for Therapist & Facilitator")
    print("=" * 65)
    print(f"\n[INFO] Starting local server at {URL}...")
    print("[INFO] Press Ctrl+C in this console to stop the application.\n")

    # Open browser automatically in background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Start uvicorn server
    uvicorn.run("app.main:app", host=HOST, port=PORT, log_level="info")
