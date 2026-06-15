from bs4 import BeautifulSoup
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "https://vns.lpnu.ua"

MY_COURSES_URL = (
    "https://vns.lpnu.ua/my/courses.php"
)

STATE_FILE = Path(__file__).resolve().parent / "state.json"

DOWNLOAD_FOLDER = "downloads"
def get_courses():

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        context = browser.new_context(
            storage_state=STATE_FILE
        )
        

        page = context.new_page()

        page.goto(
            MY_COURSES_URL,
            wait_until="networkidle"
        )
        if page.url != MY_COURSES_URL:
            print("стара сесія")
            return None

        html = page.content()

        browser.close()

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    courses = []

    for a in soup.find_all(
        "a",
        href=True
    ):

        href = a["href"]

        title = a.get_text(
            strip=True
        )

        if (
            "/course/view.php?id="
            in href
            and title
        ):

            full_url = href

            if not any(
                c["url"] == full_url
                for c in courses
            ):

                courses.append({
                    "title": title,
                    "url": full_url
                })

    return courses