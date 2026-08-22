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
    "CRITICAL OUTPUT FORMATTING RULES:\n"
    "- Begin your response IMMEDIATELY with the character '[' and end with ']'.\n"
    "- DO NOT write any conversational preamble, planning notes, thinking text, or explanations outside the JSON array.\n"
    "- Inside JSON strings, ALL backslashes MUST be double-escaped: write \\\\frac, \\\\int, \\\\partial.\n"
    "- Schema: [{\"q_index\": 1, \"text\": \"Find \\\\frac{dy}{dx}\", \"marks\": 20}]"
)

user_prompt = "Create 4 calculus exam questions totaling 100 marks. Begin directly with '['. Return ONLY the JSON array."

models_to_test = [
    "deepseek/deepseek-chat",
    "openai/gpt-4o-mini",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "stealth/ox-alpha"
]

for m in models_to_test:
    print(f"\n================ Testing Model: {m} ================")
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 3000,
                "temperature": 0.2
            },
            timeout=25
        )
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            raw = data["choices"][0]["message"].get("content") or ""
            print("Raw Length:", len(raw))
            print("Raw Snippet (First 200 chars):\n", repr(raw[:200]))
            print("Raw Snippet (Last 200 chars):\n", repr(raw[-200:]))
            parsed = _extract_json_from_llm_response(raw)
            print(f"✅ SUCCESS! Extracted {len(parsed)} questions!")
            break
        else:
            print("Error:", res.text[:300])
    except Exception as e:
        print("Exception:", e)
