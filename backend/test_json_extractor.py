import json
import re

def _pre_fix_latex_backslashes(json_str: str) -> str:
    _LATEX_CMD_REGEX = re.compile(
        r'(?<!\\)\\'
        r'(?='
        r'frac|dfrac|tfrac|forall|fbox|flat|flushbottom|flushleft|flushright|fontsize|footnote|'
        r'theta|vartheta|tau|text|textbf|textit|textrm|texttt|textsf|tilde|times|to|top|triangle|'
        r'nabla|neg|neq|newcommand|newline|noindent|nonumber|not|nu|'
        r'rangle|rfloor|rceil|right|rightarrow|Rightarrow|rho|varrho|rm|rule|'
        r'bar|begin|beta|bf|big|binom|bmod|boldsymbol|Box|'
        r'alpha|approx|arccos|arcsin|arctan|ast|atop|'
        r'partial|int|iint|iiint|oint|sum|prod|lim|sqrt|infty|pm|mp|cdot|'
        r'leq|geq|equiv|sim|propto|leftarrow|Leftarrow|Leftrightarrow|iff|implies|'
        r'exists|in|notin|subset|subseteq|cup|cap|perp|parallel|angle|degree|circ|'
        r'sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|ln|log|exp|det|dim|ker|deg|'
        r'mathbf|mathbb|mathrm|left|right|limits|end|'
        r'Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega'
        r')'
    )
    return _LATEX_CMD_REGEX.sub(r'\\\\', json_str)


def _sanitize_json_latex_escapes(json_str: str) -> str:
    result = []
    in_string = False
    i = 0
    length = len(json_str)

    while i < length:
        c = json_str[i]
        if c == '"':
            num_preceding_backslashes = 0
            j = len(result) - 1
            while j >= 0 and result[j] == '\\':
                num_preceding_backslashes += 1
                j -= 1
            if num_preceding_backslashes % 2 == 0:
                in_string = not in_string
            result.append(c)
            i += 1
            continue

        if not in_string:
            result.append(c)
            i += 1
            continue

        if c == '\\':
            if i + 1 >= length:
                result.append('\\\\')
                i += 1
                continue

            next_c = json_str[i + 1]
            if next_c == '\\':
                result.append('\\\\')
                i += 2
                continue

            if next_c in ('"', '/'):
                result.append('\\')
                result.append(next_c)
                i += 2
                continue

            if next_c in ('b', 'f', 'n', 'r', 't'):
                if i + 2 < length and json_str[i + 2].isalpha():
                    result.append('\\\\')
                    result.append(next_c)
                    i += 2
                else:
                    result.append('\\')
                    result.append(next_c)
                    i += 2
                continue

            if next_c == 'u' and i + 5 < length:
                hex_chars = json_str[i + 2:i + 6]
                if len(hex_chars) == 4 and all(h in '0123456789abcdefABCDEF' for h in hex_chars):
                    result.append('\\u')
                    result.append(hex_chars)
                    i += 6
                    continue

            result.append('\\\\')
            result.append(next_c)
            i += 2
        else:
            result.append(c)
            i += 1

    return "".join(result)


def _repair_unclosed_json(json_str: str) -> str:
    """Closes unclosed braces and brackets if LLM output was truncated."""
    s = json_str.rstrip().rstrip(",")
    if s.endswith('"') and s.count('"') % 2 != 0:
        s += '"'
    
    open_brackets = s.count("[") - s.count("]")
    open_braces = s.count("{") - s.count("}")
    
    if open_braces > 0:
        s += "}" * open_braces
    if open_brackets > 0:
        s += "]" * open_brackets
    return s


def _extract_objects_iteratively(text: str) -> list:
    """
    Parses nested question objects from text with full balanced bracket matching.
    """
    objects = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] == '{':
            depth = 0
            start = i
            in_str = False
            escape = False
            while i < n:
                ch = text[i]
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_str = not in_str
                elif not in_str:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            obj_str = text[start:i+1]
                            for fixer in (_sanitize_json_latex_escapes, _pre_fix_latex_backslashes):
                                try:
                                    clean = fixer(obj_str)
                                    clean = re.sub(r",\s*([\]}])", r"\1", clean)
                                    parsed = json.loads(clean)
                                    if isinstance(parsed, dict) and ("text" in parsed or "q_index" in parsed):
                                        objects.append(parsed)
                                        break
                                except Exception:
                                    pass
                            break
                i += 1
        i += 1
    return objects


def extract_json_from_llm_response(raw_text: str):
    if not raw_text or not raw_text.strip():
        raise ValueError("LLM returned an empty response. Please retry or switch models.")

    text = raw_text.strip()
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<thought>[\s\S]*?</thought>", "", text, flags=re.IGNORECASE)

    # Strip markdown code blocks
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)(?:```|$)", text, flags=re.IGNORECASE)
    candidate_str = fence_match.group(1).strip() if fence_match else text

    # Discard any leading preamble before '[' or '{'
    start_bracket = candidate_str.find("[")
    start_brace = candidate_str.find("{")

    if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
        candidate_str = candidate_str[start_bracket:]
    elif start_brace != -1:
        candidate_str = candidate_str[start_brace:]

    end_bracket = candidate_str.rfind("]")
    end_brace = candidate_str.rfind("}")

    if candidate_str.startswith("[") and end_bracket != -1:
        json_candidate = candidate_str[:end_bracket + 1]
    elif candidate_str.startswith("{") and end_brace != -1:
        json_candidate = candidate_str[:end_brace + 1]
    else:
        json_candidate = candidate_str

    # Strategy 1: Direct Parse
    for attempt in (
        json_candidate,
        _pre_fix_latex_backslashes(json_candidate),
        _sanitize_json_latex_escapes(json_candidate),
        re.sub(r",\s*([\]}])", r"\1", _sanitize_json_latex_escapes(json_candidate)),
        _repair_unclosed_json(_sanitize_json_latex_escapes(json_candidate))
    ):
        try:
            parsed = json.loads(attempt)
            return [parsed] if isinstance(parsed, dict) else parsed
        except Exception:
            pass

    # Strategy 2: Iterative Object Extraction
    extracted = _extract_objects_iteratively(raw_text)
    if extracted:
        return extracted

    raise ValueError(f"Could not parse valid JSON from LLM output. Raw snippet: {raw_text[:250]}")


# Test on user's exact error case:
user_error_case = """We need to produce JSON array of 15 question objects, each with q_index, text, marks, image_spec (maybe null if not needed). Must ensure total marks = 100. Balanced across syllabus: topics likely include multivariable calculus (partial derivatives, gradient, maxima/minima, multiple integrals, vector calculus, differential equations).

[
  {
    "q_index": 1,
    "text": "Find \\frac{\\partial z}{\\partial x} for $z = x^2 y + \\sin(xy)$.",
    "marks": 6
  },
  {
    "q_index": 2,
    "text": "Evaluate $\\int_0^1 \\int_0^x (x+y) dy dx$.",
    "marks": 7,
    "image_spec": {
      "code": "x = np.linspace(0, 1, 50)\\ny = x\\nax.plot(x, y)"
    }
  }
"""

res = extract_json_from_llm_response(user_error_case)
print(f"✅ Extracted {len(res)} questions successfully from prompt with conversational preamble and unclosed array!")
assert len(res) == 2
print("Sample Q1:", res[0])
