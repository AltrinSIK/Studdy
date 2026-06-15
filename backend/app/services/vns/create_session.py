from pathlib import Path
from playwright.sync_api import sync_playwright

STATE_FILE = (
    Path(__file__).parent
    / "state.json"
)
BASE_URL = "https://vns.lpnu.ua"
def save_session():

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )

        context = browser.new_context()

        page = context.new_page()

        page.goto(BASE_URL)
        print("вхід у ВНС ")
        page.wait_for_url(
            "https://vns.lpnu.ua/my/",
            timeout=30000,
        )


        context.storage_state(
            path=STATE_FILE
        )

        print("\n[SUCCESS] Session saved")

        browser.close()
        
        return True
