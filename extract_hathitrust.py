#!/usr/bin/env python3
"""
HathiTrust Book Text Extractor
Uses Chrome via Selenium to bypass Cloudflare and download OCR text.

Requirements:
    pip install selenium
    ChromeDriver must be installed (already present)
"""

import os
import sys
import time

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException
except ImportError:
    print("Please install selenium: pip install selenium")
    sys.exit(1)

HTID = "hvd.32044043284892"
TOTAL_PAGES = 162
OUTPUT_FILE = "hvd.32044043284892_full_text.txt"
TEXT_URL = "https://babel.hathitrust.org/cgi/imgsrv/download/plaintext"


def make_driver():
    opts = Options()
    # Run visible so Cloudflare challenge can complete
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument("--window-size=1200,800")
    driver = webdriver.Chrome(options=opts)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


def wait_for_cloudflare(driver, url, timeout=30):
    """Load URL and wait until Cloudflare challenge clears."""
    driver.get(url)
    deadline = time.time() + timeout
    while time.time() < deadline:
        title = driver.title
        if "Just a moment" in title or "Attention Required" in title:
            time.sleep(1)
            continue
        return True
    print(f"\nCloudflare challenge did not clear for: {url}")
    return False


def get_page_text(driver, seq):
    url = (
        f"{TEXT_URL}?id={HTID}&attachment=1&tracker=D2&seq={seq}"
    )
    if not wait_for_cloudflare(driver, url, timeout=20):
        return None  # Stuck on challenge

    body = driver.find_element(By.TAG_NAME, "body").text.strip()

    # If we got an HTML error page instead of text
    if "<html" in body.lower() or len(body) < 2:
        return ""
    return body


def main():
    print("=" * 60)
    print("HathiTrust Book Text Extractor (Selenium)")
    print(f"Book ID : {HTID}")
    print(f"Pages   : {TOTAL_PAGES}")
    print(f"Output  : {OUTPUT_FILE}")
    print("=" * 60)
    print("\nOpening Chrome — a browser window will appear.")
    print("Do not close it while the script runs.\n")

    driver = make_driver()

    # First visit to pass Cloudflare on the main domain
    print("Passing Cloudflare check...")
    wait_for_cloudflare(
        driver,
        f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
        timeout=30,
    )
    print("Cloudflare passed. Starting extraction...\n")

    pages_text = []
    failed_pages = []

    try:
        for seq in range(1, TOTAL_PAGES + 1):
            print(f"\rPage {seq}/{TOTAL_PAGES} — {len(pages_text)} extracted", end="", flush=True)

            result = get_page_text(driver, seq)

            if result is None:
                print(f"\nStuck on Cloudflare at page {seq}. Stopping.")
                break
            elif result == "":
                failed_pages.append(seq)
            else:
                pages_text.append((seq, result))

            time.sleep(0.5)

    finally:
        driver.quit()

    print(f"\n\nDone. Extracted text from {len(pages_text)} pages.")
    if failed_pages:
        print(f"Empty/failed pages ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    if not pages_text:
        print("\nNo text extracted.")
        sys.exit(1)

    print(f"\nWriting {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("HathiTrust Book Extraction\n")
        f.write(f"Book ID : {HTID}\n")
        f.write(
            "Title   : Catálogo etimológico de los nombres de los pueblos, "
            "haciendas y ranchos del estado de Oaxaca\n"
        )
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
