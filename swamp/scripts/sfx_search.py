#!/usr/bin/env python3
"""Search free sound sources for candidate recordings. Read-only; prints candidates.

  sfx_search.py fs "query" [min_s max_s]   freesound.org, CC0 only
  sfx_search.py wc "query"                 Wikimedia Commons audio (any licence, shown)
  sfx_search.py page USER ID               freesound sound page: licence, description, tags
"""
import html
import json
import re
import subprocess
import sys
import urllib.parse

UA = "raea-asset-fetch/0.1"


def get(url):
    return subprocess.run(
        ["curl", "-sL", "--max-time", "40", "-A", UA, url], capture_output=True, check=True
    ).stdout.decode("utf-8", "replace")


def fs(query, lo=None, hi=None):
    f = 'license:"Creative Commons 0"'
    if lo is not None:
        f += f" duration:[{lo} TO {hi}]"
    url = "https://freesound.org/search/?" + urllib.parse.urlencode({"q": query, "f": f})
    page = get(url)
    for block in page.split('class="bw-search__result"')[1:]:
        def attr(name):
            m = re.search(rf'data-{name}="([^"]*)"', block)
            return html.unescape(m.group(1)) if m else ""
        desc = re.search(r'class="[^"]*bw-search__result-description[^"]*"[^>]*>(.*?)</', block, re.S)
        print(
            f"{attr('sound-id'):>7} {attr('username'):<22} {float(attr('duration') or 0):7.1f}s "
            f"sr={attr('samplerate'):<8} dl={attr('num-downloads'):<6} {attr('title')}"
        )


def page(user, sid):
    p = get(f"https://freesound.org/people/{user}/sounds/{sid}/")
    lic = sorted(set(re.findall(r'https?://creativecommons\.org/[a-z]+/[a-z0-9\-]+/[0-9.]+/?', p)))
    title = re.search(r"<title>(.*?)</title>", p, re.S)
    desc = re.search(r'id="soundDescriptionSection"[^>]*>(.*?)</div>', p, re.S)
    text = re.sub(r"<[^>]+>", " ", desc.group(1)) if desc else ""
    text = re.sub(r"\s+", " ", html.unescape(text)).strip()
    tags = re.findall(r'/browse/tags/([^/"]+)/', p)
    info = dict(re.findall(r'<dt[^>]*>\s*(.*?)\s*</dt>\s*<dd[^>]*>\s*(.*?)\s*</dd>', p, re.S))
    mp3 = re.search(r'data-mp3="([^"]*)"', p)
    print("title  :", html.unescape(title.group(1)).strip() if title else "?")
    print("licence:", lic)
    print("info   :", {k: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", v)) for k, v in info.items()})
    print("tags   :", sorted(set(tags))[:25])
    print("desc   :", text[:600])
    print("preview:", mp3.group(1) if mp3 else "?")


def wc(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": "filetype:audio " + query, "gsrlimit": 30, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiextmetadatafilter": "LicenseShortName|Artist",
    })
    pages = json.loads(get(url)).get("query", {}).get("pages", {})
    for pg in sorted(pages.values(), key=lambda x: x.get("index", 0)):
        ii = pg["imageinfo"][0]
        em = ii.get("extmetadata", {})
        artist = re.sub(r"<[^>]+>", "", em.get("Artist", {}).get("value", "?"))[:30]
        print(f"{em.get('LicenseShortName', {}).get('value', '?'):<14} {ii.get('duration', 0):7.1f}s "
              f"{ii.get('mime', ''):<16} {artist:<30} {pg['title']}")


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "fs":
        a = sys.argv[2:]
        fs(a[0], *(a[1:3] if len(a) >= 3 else []))
    elif mode == "wc":
        wc(sys.argv[2])
    elif mode == "page":
        page(sys.argv[2], sys.argv[3])
