from pathlib import Path

from playwright.sync_api import (
    sync_playwright,
)

from app.services.vns.auth import (
    ensure_session,
)

MY_COURSES_URL = (
    "https://vns.lpnu.ua/my/courses.php"
)

STATE_FILE = (
    Path(__file__).parent
    / "state.json"
)


def get_vns_courses_html():

    ensure_session()

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
            MY_COURSES_URL,
            wait_until="networkidle",
        )

        html = page.content()

        browser.close()

        return html