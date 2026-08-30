#!/usr/bin/env python3
"""Generate a start/end-frame interpolated video via Kie.ai's Kling 3.0 model.

Usage:
    python3 scripts/generate_kling_video.py <start_image_url> <end_image_url> <prompt_text> <output.mp4> [duration] [aspect_ratio]
"""
import json
import os
import sys
import time
import urllib.request

API_BASE = "https://api.kie.ai/api/v1/jobs"


def load_api_key():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("KIE_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("KIE_API_KEY not found in .env")


def api_request(method, path, api_key, body=None):
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def create_task(start_url, end_url, prompt, api_key, duration, aspect_ratio):
    resp = api_request("POST", "/createTask", api_key, {
        "model": "kling-3.0/video",
        "input": {
            "prompt": prompt,
            "image_urls": [start_url, end_url],
            "sound": False,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "mode": "pro",
            "multi_shots": False,
            "multi_prompt": [],
        },
    })
    if resp.get("code") != 200:
        raise RuntimeError(f"createTask failed: {resp}")
    return resp["data"]["taskId"]


def poll_task(task_id, api_key, timeout=900, interval=10):
    elapsed = 0
    while elapsed < timeout:
        resp = api_request("GET", f"/recordInfo?taskId={task_id}", api_key)
        data = resp.get("data", {})
        state = data.get("state")
        print(f"  [{elapsed}s] state={state}")
        if state == "success":
            result = json.loads(data["resultJson"])
            return result["resultUrls"][0]
        if state == "fail":
            raise RuntimeError(f"Task failed: {data}")
        time.sleep(interval)
        elapsed += interval
    raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")


def download(url, out_path):
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    })
    with urllib.request.urlopen(req) as resp, open(out_path, "wb") as f:
        f.write(resp.read())


def main():
    if len(sys.argv) < 5:
        print("Usage: generate_kling_video.py <start_url> <end_url> <prompt> <out.mp4> [duration] [aspect_ratio]")
        sys.exit(1)

    start_url, end_url, prompt, out_path = sys.argv[1:5]
    duration = sys.argv[5] if len(sys.argv) > 5 else "5"
    aspect_ratio = sys.argv[6] if len(sys.argv) > 6 else "16:9"

    api_key = load_api_key()

    print("Creating Kling video task...")
    task_id = create_task(start_url, end_url, prompt, api_key, duration, aspect_ratio)
    print(f"  taskId={task_id}")

    video_url = poll_task(task_id, api_key)
    print(f"  result: {video_url}")

    download(video_url, out_path)
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
