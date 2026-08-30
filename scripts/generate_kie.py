#!/usr/bin/env python3
"""Generate an image via Kie.ai's nano-banana-2 model.

Usage:
    python3 scripts/generate_kie.py prompts/hero_start.json images/hero_start.jpg [aspect_ratio]
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


def create_task(prompt_data, api_key, aspect_ratio):
    input_body = {
        "prompt": prompt_data["prompt"],
        "image_input": prompt_data.get("image_input", []),
        "aspect_ratio": aspect_ratio,
        "resolution": prompt_data.get("api_parameters", {}).get("resolution", "2K"),
        "output_format": prompt_data.get("api_parameters", {}).get("output_format", "jpg"),
    }
    if prompt_data.get("negative_prompt"):
        input_body["negative_prompt"] = prompt_data["negative_prompt"]

    resp = api_request("POST", "/createTask", api_key, {
        "model": "nano-banana-2",
        "input": input_body,
    })
    if resp.get("code") != 200:
        raise RuntimeError(f"createTask failed: {resp}")
    return resp["data"]["taskId"]


def poll_task(task_id, api_key, timeout=300, interval=5):
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
    if len(sys.argv) < 3:
        print("Usage: generate_kie.py <prompt.json> <output_path> [aspect_ratio]")
        sys.exit(1)

    prompt_path, out_path = sys.argv[1], sys.argv[2]
    aspect_ratio = sys.argv[3] if len(sys.argv) > 3 else "auto"

    api_key = load_api_key()
    with open(prompt_path) as f:
        prompt_data = json.load(f)

    print(f"Creating task for {prompt_path} ...")
    task_id = create_task(prompt_data, api_key, aspect_ratio)
    print(f"  taskId={task_id}")

    image_url = poll_task(task_id, api_key)
    print(f"  result: {image_url}")

    download(image_url, out_path)
    print(f"Saved to {out_path}")

    with open(out_path + ".url", "w") as f:
        f.write(image_url)


if __name__ == "__main__":
    main()
