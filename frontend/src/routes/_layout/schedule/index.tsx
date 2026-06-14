import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/_layout/schedule/')({
  component: SchedulePage,

  staticData: {
    title: 'Schedule',
  },
})

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

type Lesson = {
  id: string
  name: string
  description?: string | null
  week: number
  lesson_number: number
  time_start: string | null
  time_end: string | null
  course_id: string
  course_name: string
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']
const TIMES = ['08:30', '10:10', '11:50', '13:30', '15:10', '16:50']

function SchedulePage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentWeek = 1

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Будь ласка, увійдіть, щоб побачити свої курси.')
      setLoading(false)
      return
    }

    const fetchSchedule = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/schedule/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Не вдалося завантажити розклад')
        }

        const data = await response.json()
        setLessons(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.week === currentWeek),
    [lessons],
  )

  const courseNames = useMemo(
    () => Array.from(new Set(filteredLessons.map((lesson) => lesson.course_name))),
    [filteredLessons],
  )

  const scheduleGrid = useMemo(
    () =>
      TIMES.map((time, rowIndex) => (
        <div key={time} className="contents">
          <div className="border-t p-3 text-sm font-medium bg-background">{time}</div>

          {DAYS.map((_, colIndex) => {
            const lesson = filteredLessons.find((l) => {
              if (!l.time_start) {
                return l.lesson_number === rowIndex + 1
              }

              const start = l.time_start.slice(11, 16)
              return start === time
            })

            return (
              <div key={colIndex} className="relative h-20 border-t border-l">
                {lesson && (
                  <div className="absolute inset-1 rounded-lg bg-blue-500/20 border border-blue-400 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs font-semibold text-blue-700">
                    <span>{lesson.course_name}</span>
                    <span>{lesson.time_start?.slice(11, 16)}–{lesson.time_end?.slice(11, 16)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )),
    [filteredLessons],
  )

  if (loading) {
    return <div className="p-6">Завантаження...</div>
  }

  if (error) {
    return <div className="rounded-3xl border bg-red-100 p-6 text-red-700">{error}</div>
  }

  return (
    <main className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Розклад</p>
          <h1 className="text-4xl font-bold">Мій розклад</h1>
          <p className="max-w-2xl text-muted-foreground">
            Курси та уроки, які прив'язані до вашого профілю.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Курсів</p>
            <p className="mt-3 text-3xl font-bold">{courseNames.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Уроків</p>
            <p className="mt-3 text-3xl font-bold">{filteredLessons.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Тиждень</p>
            <p className="mt-3 text-3xl font-bold">{currentWeek}</p>
          </div>
        </div>
      </section>

      {filteredLessons.length === 0 ? (
        <div className="rounded-3xl border bg-card p-8 text-center">
          Розклад для вашого тижня ще не заповнений.
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-3xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">Тижневий розклад</h2>
                <p className="text-sm text-muted-foreground">Показано уроки поточного тижня.</p>
              </div>
            </div>

            <div className="grid grid-cols-6 border rounded-xl overflow-hidden">
              <div className="bg-muted p-3 font-bold text-sm"></div>
              {DAYS.map((d) => (
                <div key={d} className="bg-muted p-3 text-center text-sm font-bold">
                  {d}
                </div>
              ))}
              {scheduleGrid}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            {courseNames.map((courseName) => (
              <Link
                key={courseName}
                to="/courses/$courseId"
                params={{ courseId: lessons.find((lesson) => lesson.course_name === courseName)?.course_id ?? '' }}
                className="group rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{courseName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Уроків у цьому курсі: {filteredLessons.filter((l) => l.course_name === courseName).length}</p>
                  </div>
                  <span className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Переглянути</span>
                </div>
              </Link>
            ))}
          </section>
        </div>
      )}
    </main>
  )
}
