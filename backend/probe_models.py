import os
import requests

api_key = os.getenv("OPENROUTER_API_KEY", "")
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

models = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "liquid/lfm-2.5-2.6b:free",
    "stealth/ox-alpha",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "deepseek/deepseek-chat",
    "openai/gpt-4o-mini"
]

print("Probing OpenRouter models...")
working_models = []
for m in models:
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={"model": m, "messages": [{"role": "user", "content": "Respond with OK."}], "max_tokens": 10},
            timeout=8
        )
        print(f"[{m}] Status: {res.status_code}, Response: {res.text[:120]}")
        if res.status_code == 200:
            working_models.append(m)
    except Exception as e:
        print(f"[{m}] Exception: {e}")

print("\n--- WORKING MODELS ---")
print(working_models)
