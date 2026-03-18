#!/usr/bin/env python3
"""
HathiTrust Book Text Extractor
Extracts OCR text from a HathiTrust book using the plaintext download endpoint.

Usage:
    python3 extract_hathitrust.py

Requirements:
    pip install requests
"""

import os
import sys
import time

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

HTID = "hvd.32044043284892"
TOTAL_PAGES = 162
OUTPUT_FILE = "hvd.32044043284892_full_text.txt"

TEXT_URL = "https://babel.hathitrust.org/cgi/imgsrv/download/plaintext"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/26.3 Safari/605.1.15"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
    "Sec-Fetch-Dest": "iframe",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
}

session = requests.Session()
session.headers.update(HEADERS)


def get_page_text(seq):
    """Download plain text for a single page."""
    params = {
        "id": HTID,
        "attachment": "1",
        "tracker": "D2",
        "seq": seq,
    }
    try:
        resp = session.get(TEXT_URL, params=params, timeout=30)

        if resp.status_code == 403:
            return None  # Access denied
        if resp.status_code in (404, 400):
            return False  # Page doesn't exist

        resp.raise_for_status()
        text = resp.text.strip()
        return text if text else ""

    except requests.exceptions.Timeout:
        print(f"\n  Page {seq}: Timeout, retrying...")
        time.sleep(3)
        return get_page_text(seq)
    except Exception as e:
        print(f"\n  Page {seq}: Error — {e}")
        return ""


def main():
    print("=" * 60)
    print("HathiTrust Book Text Extractor")
    print(f"Book ID  : {HTID}")
    print(f"Pages    : {TOTAL_PAGES}")
    print(f"Output   : {OUTPUT_FILE}")
    print("=" * 60)
    print()

    pages_text = []
    failed_pages = []

    for seq in range(1, TOTAL_PAGES + 1):
        print(f"\rPage {seq}/{TOTAL_PAGES} — {len(pages_text)} extracted", end="", flush=True)

        result = get_page_text(seq)

        if result is None:
            print(f"\n\nAccess denied at page {seq}. Stopping.")
            break
        elif result is False:
            print(f"\nPage {seq} not found — stopping.")
            break
        elif result == "":
            failed_pages.append(seq)
        else:
            pages_text.append((seq, result))

        time.sleep(0.4)  # Be polite

    print(f"\n\nDone. Extracted text from {len(pages_text)} pages.")
    if failed_pages:
        print(f"Empty pages ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    if not pages_text:
        print("\nNo text extracted.")
        sys.exit(1)

    print(f"\nWriting {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("HathiTrust Book Extraction\n")
        f.write(f"Book ID : {HTID}\n")
        f.write(f"Title   : Catálogo etimológico de los nombres de los pueblos, "
                f"haciendas y ranchos del estado de Oaxaca\n")
        f.write(f"Pages   : {len(pages_text)} extracted\n")
        f.write("=" * 80 + "\n\n")

        for seq, text in pages_text:
            f.write(f"\n{'─' * 40}\n")
            f.write(f"[ Page {seq} ]\n")
            f.write(f"{'─' * 40}\n\n")
            f.write(text)
            f.write("\n")

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Saved {size_kb:.1f} KB → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
