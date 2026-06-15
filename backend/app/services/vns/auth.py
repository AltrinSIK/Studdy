from pathlib import Path

from playwright.sync_api import (
    sync_playwright,
)

STATE_FILE = (
    Path(__file__).parent
    / "state.json"
)

COURSES_URL = (
    "https://vns.lpnu.ua/my/courses.php"
)


def refresh_session():

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False,
        )

        context = browser.new_context()

        page = context.new_page()

        page.goto(
            "https://vns.lpnu.ua",
            wait_until="networkidle",
        )

        print()
        print(
            "Увійди через Google."
        )
        print(
            "Після входу натисни Enter."
        )
        print()

        input()

        context.storage_state(
            path=str(
                STATE_FILE
            )
        )

        print(
            "Session saved."
        )

        browser.close()


def is_session_valid():

    if not STATE_FILE.exists():

        return False

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True,
        )

        context = browser.new_context(
            storage_state=str(
                STATE_FILE
            )
        )

        page = context.new_page()

        page.goto(
            COURSES_URL,
            wait_until="networkidle",
        )

        valid = (
            "login/index.php"
            not in page.url
        )

        browser.close()

        return valid


def ensure_session():

    if not is_session_valid():

        print(
            "VNS session expired."
        )

        refresh_session()