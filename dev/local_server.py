"""Local stand-in for the Netlify site: serves site/ and answers /api/llm and /api/page
the same way the edge functions do. Reads NVIDIA_API_KEY (and NIM_MODEL) from .env.

Run:  python dev/local_server.py   then open http://localhost:8830
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for line in (ROOT / ".env").read_text().splitlines() if (ROOT / ".env").exists() else []:
    if "=" in line and not line.lstrip().startswith("#"):
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())
KEY = os.environ.get("NVIDIA_API_KEY", "")
MODEL = os.environ.get("NIM_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")
NIM = os.environ.get("NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
PREFIX = "https://nourishwithsim.com/blogs/recipes/"
PORT = int(os.environ.get("PORT", "8830"))


def to_text(page):
    page = re.sub(r"<(script|style|nav|header|footer|svg|noscript)[^>]*>.*?</\1>", "", page, flags=re.S | re.I)
    page = re.sub(r"<br\s*/?>", "\n", page, flags=re.I)
    page = re.sub(r"<li[^>]*>", "\n- ", page, flags=re.I)
    page = re.sub(r"</(p|div|li|h[1-6]|tr|ul|ol)>", "\n", page, flags=re.I)
    text = html.unescape(re.sub(r"<[^>]+>", "", page))
    lines = [re.sub(r"[ \t ]+", " ", l).strip() for l in text.split("\n")]
    return "\n".join(l for l in lines if l and l != "-")


class H(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript; charset=utf-8",
                      ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8"}

    def send_json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/llm":
            return self.send_json({"model": MODEL})
        return super().do_GET()

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if self.path == "/api/llm":
            if not KEY:
                return self.send_json({"error": "NVIDIA_API_KEY is not set in .env."}, 500)
            req = urllib.request.Request(f"{NIM}/chat/completions", json.dumps({
                "model": MODEL, "messages": body.get("messages", []), "tools": body.get("tools"),
                "temperature": 0.3, "max_tokens": 1500}).encode(),
                {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return self.send_json({"message": json.load(r)["choices"][0]["message"], "model": MODEL})
            except urllib.error.HTTPError as e:
                return self.send_json({"error": f"Model error {e.code}: {e.read()[:300].decode('utf-8', 'replace')}"}, 502)
        if self.path == "/api/page":
            url = str(body.get("url") or "").split("#")[0].split("?")[0]
            if not url.startswith(PREFIX) or ".." in url:
                return self.send_json({"error": f"Refused: only pages under {PREFIX} may be opened."})
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (recipe-prototype)"}), timeout=30) as r:
                    page = r.read().decode("utf-8", "replace")
            except Exception as e:  # noqa: BLE001
                return self.send_json({"error": f"Could not open the page: {e}"})
            m = re.search(r'<div[^>]+class="[^"]*(?:article__content|article-template__content|rte)[^"]*"[^>]*>(.*?)</article>', page, re.S | re.I)
            t = re.search(r"<title>(.*?)</title>", page, re.S | re.I)
            return self.send_json({"url": url, "title": html.unescape(t.group(1).strip()) if t else "", "text": to_text(m.group(1) if m else page)[:6000]})
        self.send_json({"error": "not found"}, 404)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    print(f"model {MODEL}, key {'set' if KEY else 'MISSING'}; http://localhost:{PORT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), partial(H, directory=str(ROOT / "site"))).serve_forever()
