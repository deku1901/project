import json
import os
import requests
from typing import List, Dict, Any, Optional

# Leave blank as required; can be overridden via environment variables or per-request parameters
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Verified reliable fast generative models on OpenRouter
FALLBACK_MODELS = [
    "deepseek/deepseek-chat",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "stealth/ox-alpha",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free"
]

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "")
if not OPENROUTER_MODEL or OPENROUTER_MODEL in ["anthropic/claude-3.5-sonnet", "nvidia/nemotron-3.5-lightning:free", "openai/gpt-oss-20b:free"]:
    OPENROUTER_MODEL = FALLBACK_MODELS[0]

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"


def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    max_tokens: int = 4000,
    temperature: float = 0.3,
    timeout: int = 40
) -> str:
    """
    Call OpenRouter API with provided messages.
    Supports model fallbacks if the primary model hits rate limits (429) or provider errors.
    """
    selected_key = (api_key if isinstance(api_key, str) and api_key.strip() else OPENROUTER_API_KEY) or ""
    selected_key = selected_key.strip()

    raw_model = (model if isinstance(model, str) and model.strip() else OPENROUTER_MODEL) or ""
    raw_model = raw_model.strip() if raw_model else FALLBACK_MODELS[0]

    # Guard: if user entered a non-generative rerank or embedding model, auto-substitute
    if any(non_gen in raw_model.lower() for non_gen in ("rerank", "embed", "embedding")):
        print(f"[ExamGen LLM] Rerank/Embedding model '{raw_model}' is not generative. Using '{FALLBACK_MODELS[0]}' instead.", flush=True)
        primary_model = FALLBACK_MODELS[0]
    else:
        primary_model = raw_model

    if not selected_key:
        raise ValueError(
            "OpenRouter API Key is missing. Please set OPENROUTER_API_KEY in your environment or pass api_key in the request."
        )

    if not primary_model:
        primary_model = FALLBACK_MODELS[0]

    models_to_try = [primary_model]
    for fb in FALLBACK_MODELS:
        if fb not in models_to_try:
            models_to_try.append(fb)

    headers = {
        "Authorization": f"Bearer {selected_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "ExamGen App"
    }

    last_error = ""

    for target_model in models_to_try:
        print(f"[ExamGen LLM] Querying model: {target_model}...", flush=True)
        payload = {
            "model": target_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=timeout)
        except requests.exceptions.RequestException as e:
            last_error = f"Failed to connect to OpenRouter API with {target_model}: {str(e)}"
            print(f"[ExamGen LLM] Error with {target_model}: {last_error}", flush=True)
            continue

        if response.status_code != 200:
            error_detail = response.text
            try:
                err_json = response.json()
                if "error" in err_json:
                    error_detail = err_json["error"].get("message", error_detail)
            except Exception:
                pass
            last_error = f"OpenRouter API error with {target_model} (status {response.status_code}): {error_detail}"
            # If rate limited (429) or server error (5xx), try next fallback model
            if response.status_code in (429, 500, 502, 503, 504) and target_model != models_to_try[-1]:
                continue
            elif len(models_to_try) > 1 and target_model != models_to_try[-1]:
                continue
            else:
                raise RuntimeError(last_error)

        try:
            data = response.json()
            choice = data["choices"][0]
            msg = choice.get("message", {})
            content = msg.get("content")

            # Handle case where reasoning exists instead of direct content
            if not content and "reasoning" in msg:
                content = msg.get("reasoning", "")
            if not content and "text" in choice:
                content = choice.get("text", "")

            if content and content.strip():
                return content
            else:
                last_error = f"OpenRouter returned empty content for model {target_model}."
                continue
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            last_error = f"Unexpected response structure from OpenRouter with {target_model}: {response.text[:200]}"
            continue

    raise RuntimeError(last_error or "All OpenRouter models failed to return a response.")

