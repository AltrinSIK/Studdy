
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import requests
import os
import re


BASE_URL = "https://vns.lpnu.ua"

MY_COURSES_URL = (
    "https://vns.lpnu.ua/my/courses.php"
)

STATE_FILE = "state.json"

DOWNLOAD_FOLDER = "downloads"

os.makedirs(
    DOWNLOAD_FOLDER,
    exist_ok=True
)


# ==========================================
# LOGIN
# ==========================================

def save_session():

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )

        context = browser.new_context()

        page = context.new_page()

        page.goto(BASE_URL)

        print("\n==========================")
        print("1. Увійди у ВНС")
        print("2. Після входу натисни ENTER")
        print("==========================\n")

        input()

        context.storage_state(
            path=STATE_FILE
        )

        print("\n[SUCCESS] Session saved")

        browser.close()


# ==========================================
# GET COURSES
# ==========================================

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


# ==========================================
# SELECT COURSE
# ==========================================

def select_course(courses):

    print("\n==========================")
    print("ДОСТУПНІ КУРСИ")
    print("==========================\n")

    for i, course in enumerate(
        courses,
        start=1
    ):

        print(
            f"{i}. "
            f"{course['title']}"
        )

    while True:

        try:

            choice = int(
                input(
                    "\nВведи номер курсу: "
                )
            )

            if (
                1
                <= choice
                <= len(courses)
            ):

                return courses[
                    choice - 1
                ]

            print(
                "Неправильний номер"
            )

        except ValueError:

            print(
                "Введи число"
            )


# ==========================================
# GET HTML + COOKIES
# ==========================================

def get_html_and_cookies(
    course_url
):

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        context = browser.new_context(
            storage_state=STATE_FILE
        )

        page = context.new_page()

        page.goto(
            course_url,
            wait_until="networkidle"
        )

        html = page.content()

        cookies = context.cookies()

        browser.close()

        return html, cookies


# ==========================================
# PARSE LINKS
# ==========================================

def get_resource_links(html):

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    links = []

    for a in soup.find_all(
        "a",
        href=True
    ):

        href = a["href"]

        if (
            "/mod/resource/view.php?id="
            in href
        ):

            if href not in links:

                links.append(href)

    return links


# ==========================================
# DOWNLOAD
# ==========================================

def download_files(
    resource_links,
    cookies,
    course_name
):

    course_folder = re.sub(
        r'[\\/*?:"<>|]',
        "_",
        course_name
    )

    course_path = os.path.join(
        DOWNLOAD_FOLDER,
        course_folder
    )

    os.makedirs(
        course_path,
        exist_ok=True
    )

    session = requests.Session()

    for cookie in cookies:

        session.cookies.set(
            cookie["name"],
            cookie["value"]
        )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 "
            "(Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/136.0 Safari/537.36"
        )
    }

    downloaded = 0

    for url in resource_links:

        try:

            print("\n====================")
            print(f"[INFO] {url}")

            response = session.get(
                url,
                headers=headers,
                allow_redirects=True,
                stream=True
            )

            print(
                f"[INFO] STATUS: "
                f"{response.status_code}"
            )

            if (
                response.status_code
                != 200
            ):

                print(
                    "[ERROR] Bad status"
                )

                continue

            content_type = (
                response.headers.get(
                    "Content-Type",
                    ""
                )
            )

            if (
                "text/html"
                in content_type
            ):

                print(
                    "[WARNING] "
                    "HTML instead of file"
                )

                continue

            filename = None

            disposition = (
                response.headers.get(
                    "Content-Disposition"
                )
            )

            if disposition:

                match = re.findall(
                    r'filename="?([^"]+)"?',
                    disposition
                )

                if match:

                    filename = match[0]

            if not filename:

                filename = (
                    response.url
                    .split("/")[-1]
                )

            filename = re.sub(
                r'[\\/*?:"<>|]',
                "_",
                filename
            )

            filepath = os.path.join(
                course_path,
                filename
            )

            # skip existing
            if os.path.exists(
                filepath
            ):

                print(
                    "[SKIP] "
                    "Already exists"
                )

                continue

            with open(
                filepath,
                "wb"
            ) as f:

                for chunk in (
                    response.iter_content(
                        chunk_size=8192
                    )
                ):

                    if chunk:

                        f.write(chunk)

            print(
                f"[SUCCESS] "
                f"{filename}"
            )

            downloaded += 1

        except Exception as e:

            print(f"[ERROR] {e}")

    print("\n====================")
    print(
        f"Downloaded: "
        f"{downloaded}"
    )
    print(
        f"Folder: "
        f"{course_path}"
    )
    print("====================")


# ==========================================
# MAIN
# ==========================================

if not os.path.exists(
    STATE_FILE
):

    save_session()

courses = get_courses()

if not courses:

    print(
        "Курси не знайдено "
        "або session expired"
    )

    exit()

selected_course = select_course(
    courses
)

print("\n====================")
print(
    f"SELECTED:\n"
    f"{selected_course['title']}"
)
print("====================")

html, cookies = get_html_and_cookies(
    selected_course["url"]
)

links = get_resource_links(
    html
)

print(
    f"\n[INFO] Found files: "
    f"{len(links)}"
)

download_files(
    links,
    cookies,
    selected_course["title"]
)