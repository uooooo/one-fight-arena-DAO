#!/usr/bin/env python3
import datetime
import pathlib
import queue
import sys
from typing import Set

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from urllib.parse import urljoin, urlparse

BASE_URL = "https://sdk.mystenlabs.com/typescript"
ALLOWED_DOMAIN = "sdk.mystenlabs.com"
PATH_PREFIX = "/typescript"
OUTPUT_ROOT = pathlib.Path("docs/scraped/sdk-typescript")
MAX_PAGES = 200  # safety cap


def log(msg: str) -> None:
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def clean_markdown(markdown_text: str) -> str:
    lines = markdown_text.splitlines()
    cleaned = []
    last_blank = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if not last_blank:
                cleaned.append("")
                last_blank = True
            continue
        cleaned.append(line.rstrip())
        last_blank = False
    return "\n".join(cleaned).strip() + "\n"


def path_to_output(path: str) -> pathlib.Path:
    """Map a URL path like /typescript/guide/intro to a markdown file path under OUTPUT_ROOT.

    Examples:
      /typescript -> OUTPUT_ROOT / "index.md"
      /typescript/ -> OUTPUT_ROOT / "index.md"
      /typescript/guide -> OUTPUT_ROOT / "guide.md"
      /typescript/guide/intro -> OUTPUT_ROOT / "guide" / "intro.md"
    """
    if path in {"", "/", PATH_PREFIX} or path.rstrip("/") == PATH_PREFIX:
        return OUTPUT_ROOT / "index.md"

    # strip leading and trailing slashes
    stripped = path.lstrip("/").rstrip("/")
    parts = stripped.split("/")

    # remove leading "typescript" segment if present
    if parts and parts[0] == PATH_PREFIX.lstrip("/"):
        parts = parts[1:]

    if not parts:
        return OUTPUT_ROOT / "index.md"

    if len(parts) == 1:
        return OUTPUT_ROOT / f"{parts[0]}.md"

    *dirs, leaf = parts
    return OUTPUT_ROOT.joinpath(*dirs, f"{leaf}.md")


def should_visit(url: str, visited: Set[str]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.netloc != ALLOWED_DOMAIN:
        return False
    if not parsed.path.startswith(PATH_PREFIX):
        return False
    norm = parsed._replace(fragment="", query="").geturl()
    if norm in visited:
        return False
    return True


def crawl() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    to_visit: "queue.Queue[str]" = queue.Queue()
    visited: Set[str] = set()

    start_url = BASE_URL
    to_visit.put(start_url)

    pages_processed = 0

    session = requests.Session()
    session.headers.update({"User-Agent": "one-fight-arena-DAO-doc-crawler/1.0"})

    while not to_visit.empty() and pages_processed < MAX_PAGES:
        url = to_visit.get()
        parsed = urlparse(url)
        norm = parsed._replace(fragment="", query="").geturl()
        if norm in visited:
            continue
        visited.add(norm)

        log(f"Fetching {norm} ...")
        try:
            resp = session.get(norm, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            log(f"  ! Failed to fetch {norm}: {e}")
            continue

        content_type = resp.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            log(f"  ! Skipping non-HTML content: {content_type}")
            continue

        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else norm

        markdown_body = md(html, heading_style="ATX")
        markdown_body = clean_markdown(markdown_body)

        header = (
            f"# {title}\n\n"
            f"- Source: [{norm}]({norm})\n"
            f"- Retrieved: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
            "---\n\n"
        )

        out_path = path_to_output(parsed.path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(header + markdown_body, encoding="utf-8")
        log(f"  -> Saved to {out_path}")

        pages_processed += 1

        # enqueue internal links under /typescript
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith("#"):
                continue
            abs_url = urljoin(norm, href)
            if should_visit(abs_url, visited):
                to_visit.put(abs_url)

    log(f"Done. Processed {pages_processed} pages. Visited {len(visited)} URLs.")


if __name__ == "__main__":
    crawl()
