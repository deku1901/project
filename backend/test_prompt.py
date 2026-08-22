import os
import requests
import json
from app import _extract_json_from_llm_response

api_key = os.getenv("OPENROUTER_API_KEY", "")
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

system_prompt = (
    "You are an elite university professor. Create an exam in valid JSON.\n"
    "Return ONLY a JSON array of objects with keys: 'q_index' (int), 'text' (str), 'marks' (int), 'image_spec' (optional object with 'code' string).\n"
    "Example:\n"
    '[{"q_index": 1, "text": "Solve $\\\\frac{dy}{dx} + 2xy = x$.", "marks": 25, "image_spec": {"code": "x = np.linspace(-3, 3, 50)\\ny = np.exp(-x**2)\\nax = fig.add_subplot(111)\\nax.plot(x,y)\\nax.set_title(\'Solution Curve\')"}}]'
)

user_prompt = "Create 2 calculus exam questions totaling 50 marks. Return ONLY the JSON array."

for model in [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "deepseek/deepseek-chat",
    "stealth/ox-alpha",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "liquid/lfm-2.5-2.6b:free"
]:
    print(f"\n--- Testing Model: {model} ---")
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 1500,
                "temperature": 0.2
            },
            timeout=25
        )
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            content = data["choices"][0]["message"].get("content") or ""
            print("Raw length:", len(content))
            print("Raw snippet:", content[:300])
            parsed = _extract_json_from_llm_response(content)
            print("Parsed successfully! Questions count:", len(parsed))
            break
        else:
            print("Error:", res.text[:200])
    except Exception as e:
        print("Exception:", e)
