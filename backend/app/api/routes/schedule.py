import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/schedule", tags=["schedule"])

DAYS_MAP = {
    "понеділок": 0, "пн": 0,
    "вівторок": 1, "вт": 1,
    "середа": 2, "ср": 2,
    "четвер": 3, "чт": 3,
    "п'ятниця": 4, "пт": 4
}

@router.get("")
def get_official_schedule(group: str = Query(..., description="Назва групи, наприклад ПЗ-21 або АВ-21сп")):
    group_upper = group.upper().strip()

    base_url = "https://student.lpnu.ua/students_schedule"
    params = {
        "studygroup_abbrname": group_upper,
        "semestr": "2",
        "semestrduration": "1"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9"
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            html_content = response.read().decode('utf-8')
    except Exception:
        raise HTTPException(status_code=503, detail="Не вдалося зв'язатися з сервером Політехніки")

    soup = BeautifulSoup(html_content, "lxml")
    lessons_list = []

    content_area = (
        soup.find("div", class_="view-content")
        or soup.find("div", id="block-system-main")
        or soup.body
        or soup
    )

    current_day_index = 0
    current_lesson_number = 1

    # Йдемо абсолютно по всіх тегах лінійно
    for element in content_area.find_all(True):
        
        # Якщо ми всередині картки, ігноруємо її внутрішні теги, щоб не збивати лічильники
        if element.find_parent(class_="stud_schedule"):
            continue

        text_stripped = element.text.strip()
        if not text_stripped:
            continue

        # Отримуємо класи тегу
        element_classes = element.get("class") or []

        # 1. СУВОРА ПЕРЕВІРКА НА ДЕНЬ ТИЖНЯ
        text_lower = text_stripped.lower()
        is_day = False
        for day_name, d_idx in DAYS_MAP.items():
            # Якщо текст дорівнює дню тижня або містить його як окреме слово
            if day_name == text_lower or f" {day_name} " in f" {text_lower} ":
                current_day_index = d_idx
                is_day = True
                break
        
        if is_day:
            continue  # Переходимо до наступного тегу

        # 2. СУВОРА ПЕРЕВІРКА НА НОМЕР ПАРИ
        # Очищаємо текст від можливих невидимих пробілів та перевіряємо, чи це поодинока цифра
        if text_stripped.isdigit() and len(text_stripped) == 1:
            val = int(text_stripped)
            if 1 <= val <= 8:  # пари бувають від 1 до 8
                current_lesson_number = val
                continue  # Зберегли номер пари, йдемо далі

        # 3. ПЕРЕВІРКА НА КАРТКУ ЗАНЯТТЯ
        if "stud_schedule" in element_classes:
            if current_day_index > 4:
                continue

            # Назва предмету
            title_tag = element.find(class_="c-title")
            if title_tag:
                course_name = " ".join(title_tag.text.split()).strip()
            else:
                course_name = " ".join(element.text.split()).strip()

            if not course_name:
                continue

            # Аудиторія
            info_tag = element.find(class_="c-info")
            room = " ".join(info_tag.text.split()).strip() if info_tag else ""

            if not room and "н.к." in course_name:
                parts = course_name.split(",")
                for part in parts:
                    if "н.к." in part:
                        room = part.strip()
                        break

            lessons_list.append({
                "id": f"{current_day_index}-{current_lesson_number}-{len(lessons_list)}",
                "course_name": course_name,
                "room": room,
                "day_index": current_day_index,
                "lesson_number": current_lesson_number
            })

    return {"lessons": lessons_list}