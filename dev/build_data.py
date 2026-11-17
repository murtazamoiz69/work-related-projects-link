"""Rebuild the site's data and phone kit (run from the NWS workspace, not on Netlify).

  site/data/recipes.json      the 1,026 old admin panel recipes, text split into
                              ingredients / nutrition / method (from temp/old-nws-recipes)
  site/data/blog-titles.json  titles and links of the posts under
                              https://nourishwithsim.com/blogs/recipes/ (read live; titles only)
  site/kit/                   the Heal phone kit (Work/heal-phone-kit/dist)

Usage:  python dev/build_data.py [--no-titles]
"""
import html
import json
import re
import shutil
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent           # temp/recipe-prototype
NWS = ROOT.parent.parent                                 # the NWS workspace
RECIPES = NWS / "temp" / "old-nws-recipes"
KIT = NWS / "Work" / "heal-phone-kit" / "dist"
OUT = ROOT / "site"
sys.path.insert(0, str(RECIPES))
from recipe_text import split, to_text  # noqa: E402

BLOG = "https://nourishwithsim.com/blogs/recipes"


def recipes():
    out = []
    for r in json.loads((RECIPES / "old-nws-recipes.json").read_text(encoding="utf-8"))["recipes"]:
        text = to_text(r.get("description"))
        ing, nut, met = split(text)
        cats = ", ".join(c["name"] for c in (r.get("category_id") or [])) or r["_list"]["category_name"]
        out.append({
            "id": r["id"], "name": r["name"].strip(), "categories": cats,
            "diet": r["_list"]["diet_type_name"], "cuisine": r["_list"]["cuisines_name"],
            "ingredients": ing or text, "nutrition": nut, "method": met,
            "full_text": "" if met else text,       # kept only when there is no method to show
            "image": r.get("image_url") or "", "thumb": r.get("thumbnail") or "",
        })
    out.sort(key=lambda r: r["id"])
    return out


def blog_titles():
    """Titles and links from the blog's listing pages (?page=N); the Atom feed ignores ?page."""
    get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (recipe-prototype)"}), timeout=30).read().decode("utf-8", "replace")
    found, page = {}, 1
    while page <= 60:
        before = len(found)
        for href, inner in re.findall(r'<a[^>]+href="(/blogs/recipes/(?!tagged/)[^"?#]+)"[^>]*>(.*?)</a>', get(f"{BLOG}?page={page}"), re.S):
            text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", inner))).strip()
            found.setdefault(href, []).append(text)
        if len(found) == before:
            break
        page += 1
        time.sleep(0.4)
    shared = {}  # a label on several posts (a tag, "Read more") is not a title
    for texts in found.values():
        for t in set(texts):
            shared[t] = shared.get(t, 0) + 1
    out = []
    for href, texts in found.items():
        texts = [t for t in texts if t and shared[t] < 3]
        title = max(texts, key=len) if texts else href.rstrip("/").split("/")[-1].replace("-", " ").title()
        out.append({"title": title[:120], "url": "https://nourishwithsim.com" + href})
    return out


if __name__ == "__main__":
    (OUT / "data").mkdir(parents=True, exist_ok=True)
    rs = recipes()
    (OUT / "data" / "recipes.json").write_text(json.dumps(rs, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(rs), "recipes")
    if "--no-titles" not in sys.argv:
        ts = blog_titles()
        (OUT / "data" / "blog-titles.json").write_text(json.dumps(ts, ensure_ascii=False, indent=1), encoding="utf-8")
        print(len(ts), "blog titles")
    (OUT / "kit").mkdir(exist_ok=True)
    for f in ("heal-phone-kit.css", "heal-phone-kit.js"):
        shutil.copy(KIT / f, OUT / "kit" / f)
    print("kit copied from", KIT)
