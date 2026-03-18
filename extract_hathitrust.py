#!/usr/bin/env python3
"""
HathiTrust Book Text Extractor
Uses Chrome via Selenium to bypass Cloudflare and download OCR text.

Requirements:
    pip install selenium
    ChromeDriver must be installed (already present)
"""

import os
import re
import sys
import time

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException, NoSuchWindowException
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


def load_already_extracted(output_file):
    """Read which pages have already been saved to the output file."""
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
    """Quit the crashed driver (best-effort) and return a fresh one."""
    try:
        driver.quit()
    except Exception:
        pass
    time.sleep(2)
    new_driver = make_driver()
    print("\nChrome restarted. Re-passing Cloudflare...")
    wait_for_cloudflare(
        new_driver,
        f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
        timeout=30,
    )
    print("Cloudflare passed. Resuming extraction...\n")
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
        # Write file header
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
    wait_for_cloudflare(
        driver,
        f"https://babel.hathitrust.org/cgi/pt?id={HTID}&seq=1",
        timeout=30,
    )
    print("Cloudflare passed. Starting extraction...\n")

    extracted = 0
    failed_pages = []

    try:
        for seq in range(1, TOTAL_PAGES + 1):
            if seq in already_done:
                continue

            print(f"\rPage {seq}/{TOTAL_PAGES} — {extracted} new this run", end="", flush=True)

            retries = 0
            while retries <= 2:
                try:
                    result = get_page_text(driver, seq)
                    break
                except (NoSuchWindowException, WebDriverException) as e:
                    if retries == 2:
                        print(f"\nChrome unrecoverable at page {seq}: {e}")
                        raise
                    print(f"\nChrome crashed at page {seq}, restarting (attempt {retries+1})...")
                    driver = restart_driver(driver)
                    retries += 1

            if result is None:
                print(f"\nStuck on Cloudflare at page {seq}. Stopping.")
                break
            elif result == "":
                failed_pages.append(seq)
            else:
                # Append immediately so progress is never lost
                with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                    f.write(f"\n{'─' * 40}\n")
                    f.write(f"[ Page {seq} ]\n")
                    f.write(f"{'─' * 40}\n\n")
                    f.write(result)
                    f.write("\n")
                extracted += 1

            time.sleep(0.5)

    finally:
        try:
            driver.quit()
        except Exception:
            pass

    total_done = len(already_done) + extracted
    print(f"\n\nDone. {extracted} new pages extracted ({total_done} total).")
    if failed_pages:
        print(f"Empty/failed pages ({len(failed_pages)}): {failed_pages[:30]}"
              f"{'...' if len(failed_pages) > 30 else ''}")

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Saved {size_kb:.1f} KB → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
