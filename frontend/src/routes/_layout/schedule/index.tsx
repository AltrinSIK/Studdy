import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/_layout/schedule/')({
  component: SchedulePage,
  staticData: {
    title: 'Schedule',
  },
})

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

// Оновлена типізація під дані з парсера
type Lesson = {
  id: string
  course_name: string
  room: string
  day_index: number    // 0 = Пн, 1 = Вт ...
  lesson_number: number // 1 = 1-а пара, 2 = 2-а пара ...
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']
// Твої часові слоти для відображення зліва
const TIMES = ['08:30-09:50', '10:05-11:25', '11:40-13:00', '13:15-14:35', '14:50-16:10', '16:25-17:45', '18:00-19:20', '19:30-20:50']

function SchedulePage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Стейт для тексту всередині інпуту
  const [inputGroup, setInputGroup] = useState('ПЗ-21')
  // Стейт для активної групи, розклад якої ми завантажуємо з бекенду
  const [activeGroup, setActiveGroup] = useState('ПЗ-21')

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        // Робимо запит до нашого нового Python-парсеру
        const response = await fetch(`${API_BASE}/api/v1/schedule?group=${encodeURIComponent(activeGroup)}`)

        if (!response.ok) {
          throw new Error('Не вдалося завантажити розклад з сервера')
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        
        setLessons(data.lessons)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [activeGroup])

  // Унікальні назви предметів для статистики знизу
  const courseNames = useMemo(
    () => Array.from(new Set(lessons.map((lesson) => lesson.course_name))),
    [lessons],
  )

  // Рендеринг сітки розкладу
  const scheduleGrid = useMemo(
    () =>
      TIMES.map((time, rowIndex) => (
        <div key={time} className="contents">
          {/* Ліва колонка з часом */}
          <div className="border-t p-3 text-sm font-medium bg-background">{time}</div>

          {/* Колонки з днями тижня */}
          {DAYS.map((_, colIndex) => {
            // Шукаємо пару, де збігається індекс дня (colIndex) та номер пари (rowIndex + 1)
            const lesson = lessons.find(
              (l) => l.day_index === colIndex && l.lesson_number === rowIndex + 1
            )

            return (
              <div key={lesson?.id ?? `cell-${rowIndex}-${colIndex}`} className="relative h-24 border-t border-l bg-card/50">
                {lesson && (
                  <div className="absolute inset-1 rounded-lg bg-blue-500/10 border border-blue-400/50 flex flex-col items-center justify-center gap-1 p-1 text-center text-[11px] font-semibold text-blue-700 dark:text-blue-400 overflow-hidden">
                    {/* Виводимо назву предмету та аудиторію */}
                    <span className="line-clamp-2 leading-tight">{lesson.course_name}</span>
                    {lesson.room && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {lesson.room}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )),
    [lessons],
  )

  if (loading) {
    return <div className="p-6 text-center">Завантаження розкладу для групи {activeGroup}...</div>
  }

  if (error) {
    return <div className="rounded-3xl border bg-red-100 p-6 text-red-700 m-6">{error}</div>
  }

  return (
    <main className="space-y-8 p-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Політехніка</p>
          <h1 className="text-4xl font-bold">Розклад групи {activeGroup}</h1>
          <p className="max-w-2xl text-muted-foreground">
            Актуальний розклад пар, що імпортується безпосередньо в реальному часі.
          </p>
          
          {/* Інпут для вибору групи */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={inputGroup}
              onChange={(e) => setInputGroup(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveGroup(inputGroup)
                }
              }}
              placeholder="Введіть назву групи (наприклад: ПЗ-21)"
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setActiveGroup(inputGroup)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Завантажити
            </button>
          </div>
        </div>

        {/* Панель статистики */}
        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto">
          <div className="rounded-2xl border bg-card p-4 text-center min-w-30">
            <p className="text-sm text-muted-foreground">Предметів</p>
            <p className="mt-1 text-2xl font-bold">{courseNames.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 text-center min-w-30">
            <p className="text-sm text-muted-foreground">Пар на тиждень</p>
            <p className="mt-1 text-2xl font-bold">{lessons.length}</p>
          </div>
        </div>
      </section>

      {lessons.length === 0 ? (
        <div className="rounded-3xl border bg-card p-8 text-center text-muted-foreground">
          На цей тиждень занять не знайдено або виникла помилка зчитування структури.
        </div>
      ) : (
        <section className="rounded-3xl border bg-card p-6 shadow-sm overflow-x-auto">
          <div className="min-w-200"> {/* Запобігає стисканню сітки на мобільних */}
            <div className="grid grid-cols-6 border rounded-xl overflow-hidden">
              {/* Кутовий пустий квадрат */}
              <div className="bg-muted p-3 font-bold text-sm">Пара</div>
              
              {/* Шапка з днями */}
              {DAYS.map((d) => (
                <div key={d} className="bg-muted p-3 text-center text-sm font-bold">
                  {d}
                </div>
              ))}
              
              {/* Сама сітка з парами */}
              {scheduleGrid}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}