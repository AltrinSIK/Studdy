import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"

import {
  useEffect,
  useState,
} from "react"

import { askAI }
  from "@/lib/ai"

export const Route =
  createFileRoute(
    "/_layout/tasks/$taskId",
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
    taskId,
  } = Route.useParams()

  const {
    courseId,
    taskTypeId,
  } = Route.useSearch()

  const [task, setTask] =
    useState<any | null>(null)

  const [message, setMessage] =
    useState("")

  const [response, setResponse] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(false)

  const [
    taskLoading,
    setTaskLoading,
  ] = useState(true)

  useEffect(() => {

    const fetchTask =
      async () => {

        try {

          const response =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/tasks/${taskId}`,
            )

          if (!response.ok) {

            throw new Error(
              "Failed to fetch task",
            )
          }

          const data =
            await response.json()

          setTask(data)

        } catch (error) {

          console.error(error)

        } finally {

          setTaskLoading(false)
        }
      }

    fetchTask()

  }, [taskId])

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [uploading, setUploading] =
    useState(false)

  const [uploadResult, setUploadResult] =
    useState<string | null>(null)

  async function handleUpload() {

    if (!selectedFile) {

      return
    }

    setUploading(true)

    try {

      const formData = new FormData()

      formData.append(
        "file",
        selectedFile,
      )

      const token =
        localStorage.getItem("access_token")

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/courses/tasks/${taskId}/upload`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        },
      )

      if (!res.ok) {

        const errText = await res.text()

        console.log("UPLOAD ERROR:", errText)

        throw new Error("Upload failed")
      }

      const data =
        await res.json()

      setUploadResult(
        `Файл ${data.filename} успішно завантажений`,
      )

    } catch (e) {

      console.error(e)

      setUploadResult(
        "Помилка завантаження",
      )

    } finally {

      setUploading(false)
    }
  }
  async function handleAskAI(
    text?: string,
  ) {

    const query =
      text || message

    if (!query) {

      return
    }

    setLoading(true)

    try {

      const data =
        await askAI(query)

      setResponse(data)

    } catch (e) {

      console.error(e)

    } finally {

      setLoading(false)
    }
  }

  if (taskLoading) {

    return (

      <div className="p-8">

        Loading...
      </div>
    )
  }

  if (!task) {

    return (

      <div className="p-8">

        Task not found
      </div>
    )
  }

  return (

    <main className="flex gap-6">

      <div className="flex-[2] flex flex-col gap-6">

        <section className="rounded-xl border bg-card p-8 shadow-sm">

          <div className="mb-4 flex items-center gap-3">

            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">

              Завдання
            </span>

            <span className="text-muted-foreground">

              ID:
              {" "}
              {task.id}
            </span>
          </div>

          <h1 className="mb-6 text-3xl font-bold">

            {task.name}
          </h1>

          <div className="space-y-4 text-muted-foreground">

            <p>

              {task.description
                || "Опис відсутній"}
            </p>

            <ul className="list-disc space-y-2 pl-6">

              <li>
                Аналіз вимог
              </li>

              <li>
                Створення структури
              </li>

              <li>
                Реалізація функціоналу
              </li>

              <li>
                Підготовка звіту
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-8 shadow-sm">

          <h2 className="mb-6 text-2xl font-semibold">

            Матеріали до завдання
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="flex items-center justify-between rounded-lg border p-4 transition hover:border-primary">

              <div>

                <p className="font-medium">

                  Методичні_вказівки.pdf
                </p>

                <p className="text-sm text-muted-foreground">

                  2.4 MB
                </p>
              </div>

              <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">

                Download
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 transition hover:border-primary">

              <div>

                <p className="font-medium">

                  Шаблон_звіту.docx
                </p>

                <p className="text-sm text-muted-foreground">

                  1.1 MB
                </p>
              </div>

              <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">

                Download
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dashed bg-card p-8 shadow-sm">

          <div className="flex flex-col items-center justify-center py-10 text-center">

            <h2 className="mb-3 text-2xl font-semibold">

              Завантажити звіт
            </h2>

            <p className="mb-6 text-muted-foreground">

              PDF, DOCX, ZIP до 50MB
            </p>

            <input
              type="file"
              onChange={(e) => {

                const file =
                  e.target.files?.[0]

                if (file) {

                  setSelectedFile(file)
                }
              }}
              className="mb-4"
            />

            {selectedFile && (

              <p className="mb-4 text-sm">

                {selectedFile.name}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                uploading
              }
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >

              {uploading
                ? "Завантаження..."
                : "Завантажити"}
            </button>

            {uploadResult && (

              <p className="mt-4 text-sm">

                {uploadResult}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-8 shadow-sm">

          <h2 className="mb-4 text-2xl font-semibold">

            Особисті нотатки
          </h2>

          <textarea
            placeholder="Ваші нотатки..."
            className="min-h-[140px] w-full rounded-lg border bg-background p-4 outline-none transition focus:border-primary"
          />

          <div className="mt-4 flex justify-end">

            <button className="rounded-lg border px-4 py-2 hover:bg-muted">

              Зберегти
            </button>
          </div>
        </section>
      </div>

      <aside className="w-[340px] shrink-0 space-y-6">

        <section className="rounded-xl border bg-card p-6 shadow-sm">

          <div className="space-y-6">

            <div>

              <p className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">

                Статус
              </p>

              <div className="flex items-center gap-2">

                <div className="h-3 w-3 rounded-full bg-green-500" />

                <span className="text-xl font-semibold">

                  У процесі
                </span>
              </div>
            </div>

            <div>

              <p className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">

                Дедлайн
              </p>

              <p className="text-xl font-semibold text-red-500">

                15 Жовтня, 23:59
              </p>
            </div>

            <div>

              <p className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">

                Навігація
              </p>

              <div className="space-y-2">

                <Link
                  to="/courses/$courseId"
                  params={{
                    courseId,
                  }}
                  className="block rounded-lg border p-3 hover:bg-muted"
                >

                  Перейти до курсу
                </Link>

                <Link
                  to="/tasks"
                  search={{
                    courseId,
                    taskTypeId,
                  }}
                  className="block rounded-lg border p-3 hover:bg-muted"
                >

                  Назад до списку
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-primary p-6 text-primary-foreground shadow-sm">

          <h2 className="mb-4 text-2xl font-semibold">

            AI Асистент
          </h2>

          <p className="mb-6 text-sm opacity-90">

            Я можу допомогти із виконанням завдання або поясненням матеріалу.
          </p>

          <div className="space-y-3">

            <button
              onClick={() =>
                handleAskAI(
                  "Поясни це завдання",
                )
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20"
            >

              Поясни це завдання
            </button>

            <button
              onClick={() =>
                handleAskAI(
                  "Допоможи написати звіт",
                )
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20"
            >

              Допоможи написати звіт
            </button>
          </div>

          <div className="mt-6 flex gap-2">

            <input
              type="text"
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value,
                )
              }
              placeholder="Запитати AI..."
              className="flex-1 rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder:text-white/60 outline-none"
            />

            <button
              onClick={() =>
                handleAskAI()
              }
              className="rounded-lg bg-white/20 px-4 hover:bg-white/30"
            >

              →
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-white/10 p-4 text-sm whitespace-pre-wrap">

            {loading &&
              "AI думає..."}

            {response?.type === "text" && (

              <div>

                {response.content}
              </div>
            )}

            {response?.type === "file" && (

              <div>

                <p>
                  📄 DOCX готовий
                </p>

                <a
                  href={`http://localhost:8000${response.download_url}`}
                  target="_blank"
                  rel="noreferrer"
                >

                  Download file
                </a>
              </div>
            )}

            {response?.type === "image" && (

              <img
                src={response.url}
                className="rounded-lg"
              />
            )}
          </div>
        </section>
      </aside>
    </main>
  )
}
