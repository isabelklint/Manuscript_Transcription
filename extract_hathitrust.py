#!/usr/bin/env python3
"""
HathiTrust Book Text Extractor
Uses Chrome via Selenium to bypass Cloudflare and download OCR text.

Requirements:
    pip install selenium
    ChromeDriver must be installed (already present)
"""

import os
import random
import re
import sys
import time

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException, NoSuchWindowException
except ImportError:
    print("Please install selenium: pip install selenium")
    sys.exit(1)

HTID = "hvd.32044043284892"
TOTAL_PAGES = 162
OUTPUT_FILE = "hvd.32044043284892_full_text.txt"
TEXT_URL = "https://babel.hathitrust.org/cgi/imgsrv/download/plaintext"
VIEWER_URL = f"https://babel.hathitrust.org/cgi/pt?id={HTID}"

# Seconds between pages (random in this range)
DELAY_MIN = 8
DELAY_MAX = 15

# After this many pages, visit the viewer page to reset session state
RESET_EVERY = 10


def make_driver():
    opts = Options()
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


def is_rate_limited(driver, body):
    """Return True if the current page is a 429 rate-limit error."""
    body_lower = body.lower()
    return (
        "429" in driver.title
        or "error: 429" in body_lower
        or ("try again later" in body_lower and "application error" in body_lower)
    )


def reset_session(driver, seq):
    """Navigate to the viewer to let HathiTrust 'cool down', then come back."""
    viewer = f"{VIEWER_URL}&seq={seq}"
    wait_for_cloudflare(driver, viewer, timeout=30)
    time.sleep(random.uniform(3, 6))


def get_page_text(driver, seq):
    # attachment=0 renders text inline; attachment=1 triggers a file download
    # which Chrome handles silently and Selenium ends up reading the wrong page.
    url = f"{TEXT_URL}?id={HTID}&attachment=0&seq={seq}"
    if not wait_for_cloudflare(driver, url, timeout=20):
        return None  # Stuck on Cloudflare

    # If we were redirected to the viewer (no text for this page), skip it.
    if "/cgi/pt" in driver.current_url:
        return ""

    body = driver.find_element(By.TAG_NAME, "body").text.strip()

    if is_rate_limited(driver, body):
        return "RATE_LIMITED"

    # HTML error page or empty
    if "<html" in body.lower() or len(body) < 2:
        return ""

    return body


def load_already_extracted(output_file):
    """Return the set of page numbers already saved to the output file."""
    done = set()
    if not os.path.exists(output_file):
        return done
    with open(output_file, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r"\[ Page (\d+) \]", line.strip())
            if m:
                done.add(int(m.group(1)))
    return done


def restart_driver(driver):
    """Quit the crashed driver and return a fresh one with Cloudflare cleared."""
    try:
        driver.quit()
    except Exception:
        pass
    time.sleep(3)
    new_driver = make_driver()
    print("\nChrome restarted. Re-passing Cloudflare...")
    wait_for_cloudflare(new_driver, f"{VIEWER_URL}&seq=1", timeout=30)
    print("Cloudflare passed. Resuming...\n")
    return new_driver


def main():
    print("=" * 60)
    print("HathiTrust Book Text Extractor (Selenium)")
    print(f"Book ID : {HTID}")
    print(f"Pages   : {TOTAL_PAGES}")
    print(f"Output  : {OUTPUT_FILE}")
    print("=" * 60)

    already_done = load_already_extracted(OUTPUT_FILE)
    if already_done:
        print(f"\nResuming — {len(already_done)} pages already saved.")
    else:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write("HathiTrust Book Extraction\n")
            f.write(f"Book ID : {HTID}\n")
            f.write(
                "Title   : Catálogo etimológico de los nombres de los pueblos, "
                "haciendas y ranchos del estado de Oaxaca\n"
            )
            f.write("=" * 80 + "\n\n")

    print("\nOpening Chrome — a browser window will appear.")
    print("Do not close it while the script runs.\n")

    driver = make_driver()

    print("Passing Cloudflare check...")
    wait_for_cloudflare(driver, f"{VIEWER_URL}&seq=1", timeout=30)
    print("Cloudflare passed. Starting extraction...\n")

    extracted = 0
    failed_pages = []
    pages_since_reset = 0

    try:
        for seq in range(1, TOTAL_PAGES + 1):
            if seq in already_done:
                continue

            total_done = len(already_done) + extracted
            print(f"\rPage {seq}/{TOTAL_PAGES} — {total_done} saved total", end="", flush=True)

            # Periodically visit the viewer to reset session state
            if pages_since_reset >= RESET_EVERY:
                reset_session(driver, seq)
                pages_since_reset = 0

            # Fetch with rate-limit backoff
            backoff = 120  # start with 2 min on first 429
            gave_up = False
            for attempt in range(5):
                try:
                    result = get_page_text(driver, seq)
                except (NoSuchWindowException, WebDriverException) as e:
                    if attempt == 4:
                        print(f"\nChrome unrecoverable at page {seq}: {e}")
                        raise
                    print(f"\nChrome crashed, restarting...")
                    driver = restart_driver(driver)
                    continue

                if result != "RATE_LIMITED":
                    break

                print(f"\nRate limited at page {seq}. Navigating away, waiting {backoff}s...")
                # Navigate to viewer (not the download URL) to reset the session
                reset_session(driver, seq)
                time.sleep(backoff)
                backoff = min(backoff * 2, 600)
            else:
                print(f"\nGave up on page {seq} after repeated rate limiting.")
                failed_pages.append(seq)
                gave_up = True
                result = ""

            if gave_up:
                pass
            elif result is None:
                print(f"\nStuck on Cloudflare at page {seq}. Stopping.")
                break
            elif result == "":
                failed_pages.append(seq)
            else:
                with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                    f.write(f"\n{'─' * 40}\n")
                    f.write(f"[ Page {seq} ]\n")
                    f.write(f"{'─' * 40}\n\n")
                    f.write(result)
                    f.write("\n")
                extracted += 1
                pages_since_reset += 1

            delay = random.uniform(DELAY_MIN, DELAY_MAX)
            time.sleep(delay)

    finally:
        try:
            driver.quit()
        except Exception:
            pass

    total_done = len(already_done) + extracted
    print(f"\n\nDone. {extracted} new pages extracted ({total_done} total saved).")
    if failed_pages:
        print(f"Empty/failed pages ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Saved {size_kb:.1f} KB → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
