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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO GET YOUR BROWSER COOKIES (if you get 403 errors):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Log in to https://www.hathitrust.org in your browser
2. Navigate to the book: https://babel.hathitrust.org/cgi/pt?id=hvd.32044043284892&seq=7
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to Network tab, refresh the page
5. Click any request to babel.hathitrust.org
6. Find "Cookie:" in the Request Headers
7. Copy the entire cookie value and paste it into COOKIE_STRING below
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import json
import os
import re
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

# ─── CONFIGURATION ────────────────────────────────────────────────────────────

HTID = "hvd.32044043284892"
START_SEQ = 1
OUTPUT_FILE = "hvd.32044043284892_full_text.txt"

# Paste your browser cookie string here if you get 403 errors.
# Example: COOKIE_STRING = "shibsession_xxx=yyy; _shibstate_xxx=zzz"
COOKIE_STRING = ""

# ──────────────────────────────────────────────────────────────────────────────

# HathiTrust endpoints
CATALOG_URL = f"https://catalog.hathitrust.org/api/volumes/brief/htid/{HTID}.json"
SSD_URL = "https://babel.hathitrust.org/cgi/ssd"
IMGSRV_OCR_URL = "https://babel.hathitrust.org/cgi/imgsrv/ocr"
PT_URL = "https://babel.hathitrust.org/cgi/pt"
PAGEMETA_URL = f"https://babel.hathitrust.org/cgi/htd/volume/pagemeta/{HTID}"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
}

session = requests.Session()
session.headers.update(HEADERS)

# Load cookies if provided
if COOKIE_STRING.strip():
    for part in COOKIE_STRING.split(";"):
        part = part.strip()
        if "=" in part:
            name, _, value = part.partition("=")
            session.cookies.set(name.strip(), value.strip(), domain=".hathitrust.org")
    print("Using provided browser cookies.")


def get_catalog_info():
    """Get book metadata and page count from catalog API."""
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
                    if rights == "pdus":
                        print("Note: Public domain in US only (pdus). "
                              "Access may require a US IP or HathiTrust login.")
                    elif rights not in ("pd", "pd-pvt"):
                        print(f"Warning: Rights code '{rights}' may restrict access.")
                    return item
    except Exception as e:
        print(f"Warning: Could not fetch catalog: {e}")
    return None


def get_page_count_from_catalog():
    """Try to get page count from the catalog API response."""
    try:
        resp = session.get(CATALOG_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        records = data.get("records", {})
        if records:
            first_record = next(iter(records.values()))
            items = first_record.get("items", [])
            for item in items:
                if item.get("htid") == HTID:
                    # Some items have a "lastUpdate" or page count fields
                    count = item.get("itemURL", "")
                    # Try enumerationChronology or other fields
                    for field in ("enumerationChronology", "fromRecord"):
                        val = item.get(field, "")
                        if val:
                            nums = re.findall(r'\d+', str(val))
                            if nums:
                                candidate = max(int(n) for n in nums)
                                if 10 < candidate < 5000:
                                    return candidate
    except Exception:
        pass
    return None


def get_page_count_from_pagemeta():
    """Try the pagemeta API endpoint for page count."""
    try:
        resp = session.get(PAGEMETA_URL, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                return len(data)
            elif isinstance(data, dict):
                pages = data.get("page", data.get("pages", []))
                if isinstance(pages, list):
                    return len(pages)
    except Exception:
        pass
    return None


def get_page_count_from_pt():
    """Try to get total page count from the page viewer HTML."""
    try:
        resp = session.get(PT_URL, params={"id": HTID, "seq": 1}, timeout=30)
        resp.raise_for_status()
        if HAS_BS4:
            soup = BeautifulSoup(resp.text, "html.parser")
            for selector in ["#mdPage", ".page-of", "#totalPages", "input[name='total']"]:
                el = soup.select_one(selector)
                if el:
                    text = el.get("value") or el.get_text(strip=True)
                    try:
                        return int("".join(c for c in text if c.isdigit()))
                    except ValueError:
                        pass
            matches = re.findall(r'of\s+(\d+)', resp.text)
            if matches:
                return max(int(m) for m in matches)
    except Exception as e:
        print(f"  (Could not get page count from viewer: {e})")
    return None


def get_page_text_ssd(seq):
    """
    Fetch OCR text for a single page via the SSD endpoint.
    Returns: text string | "" if empty | None if access denied | False if page missing
    """
    params = {"id": HTID, "seq": seq}
    try:
        resp = session.get(SSD_URL, params=params, timeout=30)

        if resp.status_code == 403:
            return None
        if resp.status_code in (404, 400):
            return False

        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "json" in content_type or resp.text.strip().startswith("{"):
            try:
                data = resp.json()
                if isinstance(data, dict):
                    for key in ("text", "content", "OCR", "body", "page"):
                        if key in data and data[key]:
                            return str(data[key])
                    text_parts = [v for v in data.values() if isinstance(v, str) and len(v) > 5]
                    return "\n".join(text_parts) if text_parts else ""
                elif isinstance(data, str):
                    return data
            except json.JSONDecodeError:
                pass

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


def get_page_text_imgsrv(seq):
    """
    Fetch OCR text via the imgsrv/ocr endpoint (plain text response).
    Returns: text string | "" if empty | None if access denied | False if page missing
    """
    params = {"id": HTID, "seq": seq}
    try:
        resp = session.get(IMGSRV_OCR_URL, params=params, timeout=30)

        if resp.status_code == 403:
            return None
        if resp.status_code in (404, 400):
            return False

        resp.raise_for_status()
        text = resp.text.strip()
        return text if text else ""

    except requests.exceptions.ConnectionError:
        return ""
    except requests.exceptions.Timeout:
        print(f"\n  Page {seq}: Timeout, retrying...")
        time.sleep(2)
        return get_page_text_imgsrv(seq)
    except Exception as e:
        print(f"\n  Page {seq}: Error - {e}")
        return ""


def get_page_text(seq):
    """Try SSD endpoint first, fall back to imgsrv/ocr."""
    result = get_page_text_ssd(seq)
    if result is None:
        # SSD denied — try imgsrv/ocr
        result = get_page_text_imgsrv(seq)
    return result


def detect_last_page(known_max=2000):
    """Find the last valid page using multiple strategies."""
    print("Detecting number of pages...")

    # Strategy 1: pagemeta API
    total = get_page_count_from_pagemeta()
    if total and total > 1:
        print(f"Page count from pagemeta API: {total}")
        return total

    # Strategy 2: HTML viewer
    total = get_page_count_from_pt()
    if total and total > 1:
        print(f"Page count from viewer: {total}")
        return total

    # Strategy 3: Binary search via whichever OCR endpoint works
    print("Scanning for last page (binary search)...")
    lo, hi = START_SEQ, known_max
    last_valid = START_SEQ

    for seq in range(START_SEQ, known_max, 100):
        try:
            # Use imgsrv/ocr for probing — faster and less likely to be blocked
            resp = session.get(IMGSRV_OCR_URL, params={"id": HTID, "seq": seq}, timeout=10)
            if resp.status_code == 200:
                last_valid = seq
                hi = min(seq + 200, known_max)
            elif resp.status_code in (404, 400):
                hi = seq
                break
            elif resp.status_code == 403:
                # Fall back to SSD for probing
                resp2 = session.get(SSD_URL, params={"id": HTID, "seq": seq}, timeout=10)
                if resp2.status_code == 200:
                    last_valid = seq
                    hi = min(seq + 200, known_max)
                elif resp2.status_code in (404, 400):
                    hi = seq
                    break
        except Exception:
            break
        time.sleep(0.3)

    # Fine scan from last_valid
    for seq in range(last_valid, hi + 1):
        try:
            resp = session.get(IMGSRV_OCR_URL, params={"id": HTID, "seq": seq}, timeout=10)
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

    get_catalog_info()
    print()

    last_page = detect_last_page()
    print(f"\nExtracting text from pages {START_SEQ} to {last_page}...\n")

    pages_text = []
    failed_pages = []
    consecutive_failures = 0
    MAX_CONSECUTIVE_FAILURES = 10
    access_denied_count = 0

    for seq in range(START_SEQ, last_page + 1):
        print(f"\rPage {seq}/{last_page} — {len(pages_text)} extracted", end="", flush=True)

        result = get_page_text(seq)

        if result is None:
            access_denied_count += 1
            if access_denied_count >= 3:
                print(f"\n\nAccess denied on multiple pages (including page {seq}).")
                print("\nThis book is 'pdus' — public domain in the US, but geo-restricted.")
                print("To fix this, you need to provide your HathiTrust browser cookies.")
                print("\nSteps:")
                print("  1. Log in at https://www.hathitrust.org")
                print("  2. Open the book in your browser")
                print("  3. Open DevTools → Network tab → refresh")
                print("  4. Click any babel.hathitrust.org request")
                print("  5. Copy the 'Cookie:' header value")
                print("  6. Paste it into COOKIE_STRING at the top of this script")
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
            access_denied_count = 0
            consecutive_failures = 0
            pages_text.append((seq, result))

        time.sleep(0.5)

    print(f"\n\nDone. Extracted text from {len(pages_text)} pages.")
    if failed_pages:
        print(f"Pages with no text ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    if not pages_text:
        print("\nNo text extracted. Possible reasons:")
        print("  1. Book requires HathiTrust login (pdus = US-only access)")
        print("  2. See COOKIE_STRING instructions at the top of this script")
        sys.exit(1)

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
