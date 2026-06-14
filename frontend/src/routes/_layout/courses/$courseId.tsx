import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"

import {
  useEffect,
  useState,
} from "react"

import TaskTypeRenderer
  from "@/components/course/TaskTypeRenderer"

import ExamCountdownCard
  from "@/components/course/ExamCountdownCard"

import TeachersCard
  from "@/components/course/TeachersCard"

import NotesCard
  from "@/components/course/NotesCard"

function getTimeRemaining(
  targetDate: Date,
) {

  const now = new Date()

  const difference =
    targetDate.getTime() -
    now.getTime()

  if (difference <= 0) {

    return {
      months: 0,
      days: 0,
      hours: 0,
    }
  }

  const totalHours = Math.floor(
    difference / (1000 * 60 * 60),
  )

  const months = Math.floor(
    totalHours / (24 * 30),
  )

  const days = Math.floor(
    (totalHours % (24 * 30)) / 24,
  )

  const hours = totalHours % 24

  return {
    months,
    days,
    hours,
  }
}

export const Route =
  createFileRoute(
    "/_layout/courses/$courseId",
  )({
    component: CoursesPage,
  })

function CoursesPage() {

  const { courseId } =
    Route.useParams()

  const examDate = new Date(
    "2026-06-24T10:00:00",
  )

  const [timeLeft, setTimeLeft] =
    useState(
      getTimeRemaining(examDate),
    )

  const [course, setCourse] =
    useState<any | null>(null)

  const [taskTypes, setTaskTypes] =
    useState<any[]>([])

  useEffect(() => {

    const fetchCourse =
      async () => {

        try {

          const response =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/${courseId}`,
            )

          const data =
            await response.json()

          setCourse(data)

          const taskTypesResponse =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/${courseId}/task-types`,
            )

          const taskTypesData =
            await taskTypesResponse.json()

          setTaskTypes(
            taskTypesData,
          )

        } catch (error) {

          console.error(error)
        }
      }

    fetchCourse()

  }, [courseId])

  useEffect(() => {

    const interval =
      setInterval(() => {

        setTimeLeft(
          getTimeRemaining(
            examDate,
          ),
        )

      }, 1000)

    return () =>
      clearInterval(interval)

  }, [])

  if (!course) {

    return (
      <div className="p-8">
        Loading...
      </div>
    )
  }

  return (

    <main className="space-y-8">


      <section className="relative overflow-hidden rounded-3xl">

        <img
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085"
          alt="Course banner"
          className="h-[260px] w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-0 left-0 p-8 text-white">

          <div className="mb-3 flex items-center gap-3">

            <span className="rounded-full bg-primary px-3 py-1 text-sm">

              Предмет
            </span>

            <span className="text-sm opacity-80">

              2025/2026 Навчальний рік
            </span>
          </div>

          <h1 className="text-5xl font-bold">

            {course.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-white/80">

            {course.description}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-8">

          <div className="grid grid-cols-2 gap-6">

            {taskTypes.map(
              (taskType) => (

                <TaskTypeRenderer
                  key={taskType.id}
                  taskType={taskType}
                />
              ),
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-6">

          <ExamCountdownCard
            timeLeft={timeLeft}
          />

          <TeachersCard />

          <NotesCard />
        </div>
      </div>
    </main>
  )
}
