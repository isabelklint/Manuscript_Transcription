#!/usr/bin/env python3
"""
HathiTrust Page Image Downloader
Uses Selenium to pass Cloudflare, then downloads each page as a JPEG image
using requests with the session cookies.

Requirements:
    pip install selenium requests
    ChromeDriver must be installed
"""

import os
import random
import sys
import time

try:
    import requests
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException, NoSuchWindowException
except ImportError:
    print("Please install dependencies: pip install selenium requests")
    sys.exit(1)

HTID = "hvd.32044043284892"
TOTAL_PAGES = 162
OUTPUT_DIR = "hvd_images"
IMAGE_URL = "https://babel.hathitrust.org/cgi/imgsrv/image"
VIEWER_URL = f"https://babel.hathitrust.org/cgi/pt?id={HTID}"

# Delay between downloads (seconds, random in range)
DELAY_MIN = 5
DELAY_MAX = 10

# Re-sync cookies from Selenium every N pages
REFRESH_COOKIES_EVERY = 20


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


def get_session_from_driver(driver):
    """Build a requests.Session using cookies from the Selenium driver."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": driver.execute_script("return navigator.userAgent"),
        "Referer": VIEWER_URL,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    })
    for cookie in driver.get_cookies():
        session.cookies.set(cookie["name"], cookie["value"], domain=cookie.get("domain"))
    return session


def already_downloaded():
    """Return set of seq numbers that already have a saved image file."""
    done = set()
    if not os.path.isdir(OUTPUT_DIR):
        return done
    for fname in os.listdir(OUTPUT_DIR):
        if fname.startswith("page_") and (fname.endswith(".jpg") or fname.endswith(".jpeg") or fname.endswith(".png")):
            try:
                seq = int(fname.split("_")[1].split(".")[0])
                done.add(seq)
            except (ValueError, IndexError):
                pass
    return done


def download_image(session, seq):
    """
    Download one page image. Returns:
      True   — saved successfully
      "RATE_LIMITED" — 429 response
      False  — other error / empty
    """
    params = {"id": HTID, "seq": seq, "size": "full"}
    try:
        resp = session.get(IMAGE_URL, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"\nRequest error on page {seq}: {e}")
        return False

    if resp.status_code == 429:
        return "RATE_LIMITED"
    if resp.status_code != 200:
        print(f"\nHTTP {resp.status_code} on page {seq}")
        return False

    content_type = resp.headers.get("Content-Type", "")
    if "image" not in content_type:
        # Might have been redirected to an HTML error page
        if "429" in resp.text or "try again later" in resp.text.lower():
            return "RATE_LIMITED"
        print(f"\nUnexpected content-type '{content_type}' on page {seq}")
        return False

    # Pick extension from content-type
    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "jpeg" in content_type or "jpg" in content_type:
        ext = "jpg"

    out_path = os.path.join(OUTPUT_DIR, f"page_{seq:03d}.{ext}")
    with open(out_path, "wb") as f:
        f.write(resp.content)
    return True


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("HathiTrust Page Image Downloader")
    print(f"Book ID : {HTID}")
    print(f"Pages   : {TOTAL_PAGES}")
    print(f"Output  : {OUTPUT_DIR}/")
    print("=" * 60)

    done = already_downloaded()
    if done:
        print(f"\nResuming — {len(done)} pages already downloaded.")

    print("\nOpening Chrome to pass Cloudflare...")
    driver = make_driver()
    wait_for_cloudflare(driver, f"{VIEWER_URL}&seq=1", timeout=30)
    print("Cloudflare passed. Starting downloads...\n")

    session = get_session_from_driver(driver)
    downloaded = 0
    failed = []
    pages_since_refresh = 0

    try:
        for seq in range(1, TOTAL_PAGES + 1):
            if seq in done:
                continue

            total = len(done) + downloaded
            print(f"\rPage {seq}/{TOTAL_PAGES} — {total} saved total", end="", flush=True)

            # Periodically refresh cookies from the live browser session
            if pages_since_refresh >= REFRESH_COOKIES_EVERY:
                wait_for_cloudflare(driver, f"{VIEWER_URL}&seq={seq}", timeout=20)
                session = get_session_from_driver(driver)
                pages_since_refresh = 0

            backoff = 120
            success = False
            for attempt in range(5):
                result = download_image(session, seq)
                if result is True:
                    downloaded += 1
                    pages_since_refresh += 1
                    success = True
                    break
                elif result == "RATE_LIMITED":
                    print(f"\nRate limited at page {seq}. Refreshing session, waiting {backoff}s...")
                    wait_for_cloudflare(driver, f"{VIEWER_URL}&seq={seq}", timeout=20)
                    session = get_session_from_driver(driver)
                    pages_since_refresh = 0
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 600)
                else:
                    failed.append(seq)
                    break

            if not success and result == "RATE_LIMITED":
                print(f"\nGave up on page {seq} after repeated rate limiting.")
                failed.append(seq)

            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    finally:
        try:
            driver.quit()
        except Exception:
            pass

    total = len(done) + downloaded
    print(f"\n\nDone. {downloaded} new images saved ({total} total).")
    if failed:
        print(f"Failed pages ({len(failed)}): {failed[:30]}"
              f"{'...' if len(failed) > 30 else ''}")
    print(f"Images saved to: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
