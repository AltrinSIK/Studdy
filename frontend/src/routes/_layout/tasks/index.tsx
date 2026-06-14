import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"

import {
  useEffect,
  useState,
} from "react"

export const Route =
  createFileRoute(
    "/_layout/tasks/",
  )({

    validateSearch: (
      search: Record<string, unknown>,
    ) => {

      return {

        courseId:
          typeof search.courseId === "string"
            ? search.courseId
            : "",

        taskTypeId:
          typeof search.taskTypeId === "string"
            ? search.taskTypeId
            : "",
      }
    },

    component: TaskPage,
  })

function TaskPage() {

  const {
    courseId,
    taskTypeId,
  } = Route.useSearch()

  const [tasks, setTasks] =
    useState<any[]>([])

  const [taskType, setTaskType] =
    useState<any | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    if (!taskTypeId) {

      setLoading(false)

      return
    }

    const fetchData =
      async () => {

        try {

          const tasksResponse =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/tasks?task_type_id=${taskTypeId}`,
            )

          if (!tasksResponse.ok) {

            throw new Error(
              "Failed to fetch tasks",
            )
          }

          const tasksData =
            await tasksResponse.json()

          setTasks(tasksData)

          const taskTypeResponse =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/task-types/${taskTypeId}`,
            )

          if (!taskTypeResponse.ok) {

            throw new Error(
              "Failed to fetch task type",
            )
          }

          const taskTypeData =
            await taskTypeResponse.json()

          setTaskType(
            taskTypeData,
          )

        } catch (error) {

          console.error(error)

        } finally {

          setLoading(false)
        }
      }

    fetchData()

  }, [taskTypeId])

  if (loading) {

    return (

      <div className="p-8">

        Loading...
      </div>
    )
  }

  if (!taskTypeId) {

    return (

      <div className="p-8">

        Task type not found
      </div>
    )
  }

  return (

    <main className="grid grid-cols-12 gap-6">

      <section className="col-span-8 space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold">

              {taskType?.name || "Tasks"}
            </h1>

            <p className="mt-2 text-muted-foreground">

              Перелік завдань
            </p>
          </div>

          <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">

            {tasks.length} Завдань
          </div>
        </div>

        <div className="space-y-4">

          {tasks.map((task, index) => (

            <Link
              key={task.id}
              to="/tasks/$taskId"

              params={{
                taskId:
                  String(task.id),
              }}

              search={{
                courseId,
                taskTypeId,
              }}

              className={`block rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md ${
                index === 0
                  ? "border-primary"
                  : ""
              }`}
            >

              <div className="mb-4 flex items-start justify-between">

                <div>

                  <h2 className="text-2xl font-semibold">

                    {task.name}
                  </h2>

                  <p className="mt-1 text-muted-foreground">

                    {task.description
                      || "Опис відсутній"}
                  </p>
                </div>

                {index === 0 && (

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">

                    В процесі
                  </span>
                )}

                {index !== 0 && (

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">

                    Завдання
                  </span>
                )}
              </div>

              {index === 0 && (

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">

                  <div className="h-full w-2/3 bg-primary" />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">

                <span>

                  ID: {task.id}
                </span>

                <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">

                  Відкрити
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <aside className="col-span-4 space-y-6">

        <div className="rounded-xl border bg-card p-6 shadow-sm">

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">

            Інформація
          </h3>

          <div className="space-y-3">

            <div className="rounded-lg border p-3">

              Тип:
              {" "}
              {taskType?.name || "Невідомо"}
            </div>

            <div className="rounded-lg border p-3">

              Кількість:
              {" "}
              {tasks.length}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">

              Загальні файли
            </h3>

            <button className="text-primary">

              Upload
            </button>
          </div>

          <div className="space-y-3">

            <div className="rounded-lg border p-3 hover:bg-muted">

              Силабус_курсу.pdf
            </div>

            <div className="rounded-lg border p-3 hover:bg-muted">

              Підручник_Алгоритми.pdf
            </div>

            <div className="rounded-lg border p-3 hover:bg-muted">

              Шаблон_звіту.docx
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-primary p-6 text-primary-foreground">

          <h3 className="mb-4 text-xl font-semibold">

            Нотатки до курсу
          </h3>

          <div className="rounded-lg bg-white/10 p-4">

            Тут у майбутньому буде
            можливість додавати
            власні нотатки.
          </div>

          <button className="mt-4 w-full rounded-lg bg-white/10 py-3 hover:bg-white/20">

            Функція скоро буде доступна
          </button>
        </div>
      </aside>
    </main>
  )
}
