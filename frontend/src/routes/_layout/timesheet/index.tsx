import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Clock, Layers, PieChart } from 'lucide-react'

export const Route = createFileRoute('/_layout/timesheet/')({
  component: TimesheetPage,

  staticData: {
    title: 'Timesheet',
  },
})

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

type Course = {
  id: string
  name: string
  description?: string | null
}

function TimesheetPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Будь ласка, увійдіть, щоб побачити свої курси.')
      setLoading(false)
      return
    }

    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/courses/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Не вдалося завантажити курси')
        }

        const data = await response.json()
        setCourses(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const totalHours = courses.length * 24

  return (
    <main className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border bg-card p-8">
          <div className="flex items-center gap-4 text-primary">
            <PieChart className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider">Час</p>
              <p className="mt-2 text-3xl font-bold">{totalHours} год</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Приблизний час занять за активними курсами.
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-8">
          <div className="flex items-center gap-4 text-secondary">
            <Clock className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider">Цього тижня</p>
              <p className="mt-2 text-3xl font-bold">{courses.length * 6} год</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Орієнтовний час занять за вашим розкладом.
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-8">
          <div className="flex items-center gap-4 text-emerald-600">
            <Layers className="h-6 w-6" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider">Курси</p>
              <p className="mt-2 text-3xl font-bold">{courses.length}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Кількість курсів, прив'язаних до вашого профілю.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border bg-card p-8 text-center">Завантаження курсів...</div>
      ) : error ? (
        <div className="rounded-3xl border bg-red-100 p-6 text-red-700">{error}</div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border bg-card p-8 text-center">
          Ви ще не прив'язані до жодного курсу.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Ваші курси</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ось курси, які зареєстровано для вашого облікового запису.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {courses.map((course) => (
              <div key={course.id} className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{course.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {course.description || 'Опис відсутній'}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                    {Math.max(4, Math.round((Math.random() * 4) + 2))} год
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Наступне заняття</p>
                    <p className="mt-2 font-semibold">Середа, 10:00</p>
                  </div>
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Прогнозовані години</p>
                    <p className="mt-2 font-semibold">{Math.max(10, Math.round(courses.length * 4))} год</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
