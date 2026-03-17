#!/usr/bin/env python3
"""
HathiTrust Book Text Extractor
Extracts OCR text from a HathiTrust book and saves it to a file.

Usage:
    python3 extract_hathitrust.py

Requirements:
    pip install requests beautifulsoup4

Book: hvd.32044043284892
URL: https://babel.hathitrust.org/cgi/pt?id=hvd.32044043284892&seq=7
"""

import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("Note: beautifulsoup4 not installed. Install with: pip install beautifulsoup4")
    print("Continuing without HTML parsing...\n")

HTID = "hvd.32044043284892"
START_SEQ = 1
OUTPUT_FILE = "hvd.32044043284892_full_text.txt"

# HathiTrust endpoints
CATALOG_URL = f"https://catalog.hathitrust.org/api/volumes/brief/htid/{HTID}.json"
SSD_URL = "https://babel.hathitrust.org/cgi/ssd"          # OCR text (JSON)
PT_URL = "https://babel.hathitrust.org/cgi/pt"             # Page viewer (HTML)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
}

session = requests.Session()
session.headers.update(HEADERS)


def get_catalog_info():
    """Get book metadata from catalog API."""
    print(f"Fetching catalog metadata for {HTID}...")
    try:
        resp = session.get(CATALOG_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        records = data.get("records", {})
        if records:
            first_record = next(iter(records.values()))
            titles = first_record.get("titles", ["Unknown"])
            print(f"Title: {titles[0] if titles else 'Unknown'}")
            items = first_record.get("items", [])
            for item in items:
                if item.get("htid") == HTID:
                    rights = item.get("rightsCode", "unknown")
                    print(f"Rights: {rights}")
                    if rights not in ("pd", "pdus", "pd-pvt"):
                        print("Warning: This item may not be public domain in your region.")
                    return item
    except Exception as e:
        print(f"Warning: Could not fetch catalog: {e}")
    return None


def get_page_count_from_pt(seq=1):
    """Try to get total page count from the page viewer HTML."""
    try:
        resp = session.get(PT_URL, params={"id": HTID, "seq": seq}, timeout=30)
        resp.raise_for_status()
        if HAS_BS4:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Look for page count in various elements
            for selector in [
                "#mdPage", ".page-of", "#totalPages", "input[name='total']"
            ]:
                el = soup.select_one(selector)
                if el:
                    text = el.get("value") or el.get_text(strip=True)
                    try:
                        return int("".join(c for c in text if c.isdigit()))
                    except ValueError:
                        pass
            # Try finding "of NNN" pattern in text
            import re
            matches = re.findall(r'of\s+(\d+)', resp.text)
            if matches:
                return max(int(m) for m in matches)
    except Exception as e:
        print(f"Warning: Could not get page count from viewer: {e}")
    return None


def get_page_text_ssd(seq):
    """
    Fetch OCR text for a single page via the SSD (Snippet Service Download) endpoint.
    Returns: text string, "" if empty/error, None if access denied
    """
    params = {"id": HTID, "seq": seq}
    try:
        resp = session.get(SSD_URL, params=params, timeout=30)

        if resp.status_code == 403:
            return None  # Access denied

        if resp.status_code == 404:
            return False  # Page doesn't exist (signals end of book)

        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")

        # Try JSON first
        if "json" in content_type or resp.text.strip().startswith("{"):
            try:
                data = resp.json()
                if isinstance(data, dict):
                    # Various possible keys HathiTrust uses
                    for key in ("text", "content", "OCR", "body", "page"):
                        if key in data and data[key]:
                            return str(data[key])
                    # If dict but no known key, join all string values
                    text_parts = [v for v in data.values() if isinstance(v, str) and len(v) > 5]
                    return "\n".join(text_parts) if text_parts else ""
                elif isinstance(data, str):
                    return data
            except json.JSONDecodeError:
                pass

        # Plain text response
        text = resp.text.strip()
        return text if text else ""

    except requests.exceptions.ConnectionError:
        return ""
    except requests.exceptions.Timeout:
        print(f"\n  Page {seq}: Timeout, retrying...")
        time.sleep(2)
        return get_page_text_ssd(seq)
    except Exception as e:
        print(f"\n  Page {seq}: Error - {e}")
        return ""


def detect_last_page(known_max=2000):
    """Find the last valid page by binary search approach."""
    print("Detecting number of pages...")

    # First check if we can get it from the HTML viewer
    total = get_page_count_from_pt()
    if total:
        print(f"Page count from viewer: {total}")
        return total

    # Binary search: find a page that 404s
    lo, hi = START_SEQ, known_max
    last_valid = START_SEQ

    # Quick scan at large steps
    for seq in range(START_SEQ, known_max, 100):
        params = {"id": HTID, "seq": seq}
        try:
            resp = session.get(SSD_URL, params=params, timeout=10)
            if resp.status_code == 200:
                last_valid = seq
                hi = min(seq + 200, known_max)
            elif resp.status_code in (404, 400):
                hi = seq
                break
        except Exception:
            break
        time.sleep(0.3)

    # Fine-grained linear scan from last_valid
    for seq in range(last_valid, hi + 1):
        params = {"id": HTID, "seq": seq}
        try:
            resp = session.get(SSD_URL, params=params, timeout=10)
            if resp.status_code == 200:
                last_valid = seq
            elif resp.status_code in (404, 400):
                break
        except Exception:
            break
        time.sleep(0.2)

    print(f"Last page detected: {last_valid}")
    return last_valid


def main():
    print("=" * 60)
    print("HathiTrust Book Text Extractor")
    print(f"Book ID  : {HTID}")
    print(f"Viewer   : https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=7")
    print(f"Output   : {OUTPUT_FILE}")
    print("=" * 60)
    print()

    # Get catalog info
    catalog_item = get_catalog_info()
    print()

    # Detect last page
    last_page = detect_last_page()

    print(f"\nExtracting text from pages {START_SEQ} to {last_page}...\n")

    pages_text = []
    failed_pages = []
    consecutive_failures = 0
    MAX_CONSECUTIVE_FAILURES = 10

    for seq in range(START_SEQ, last_page + 1):
        print(f"\rPage {seq}/{last_page} — {len(pages_text)} extracted", end="", flush=True)

        result = get_page_text_ssd(seq)

        if result is None:
            print(f"\n\nAccess denied at page {seq}.")
            print("This book may require a HathiTrust login.")
            print("Try: log into hathitrust.org in your browser, then rerun this script.")
            break
        elif result is False:
            print(f"\nPage {seq} not found — end of book.")
            break
        elif result == "":
            failed_pages.append(seq)
            consecutive_failures += 1
            if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                print(f"\nToo many consecutive empty pages at {seq}. Stopping.")
                break
        else:
            consecutive_failures = 0
            pages_text.append((seq, result))

        time.sleep(0.5)  # Be polite

    print(f"\n\nDone. Extracted text from {len(pages_text)} pages.")
    if failed_pages:
        print(f"Pages with no text ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    if not pages_text:
        print("\nNo text extracted. Possible reasons:")
        print("  1. Book requires HathiTrust login (public domain in US, but geo-restricted)")
        print("  2. Network blocked HathiTrust")
        print("  3. Book ID is incorrect")
        sys.exit(1)

    # Write output file
    print(f"\nWriting {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(f"HathiTrust Book Extraction\n")
        f.write(f"Book ID : {HTID}\n")
        f.write(f"URL     : https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=7\n")
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
