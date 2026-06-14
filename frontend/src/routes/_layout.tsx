import {
  createFileRoute,
  Outlet,
  redirect,
  useMatches,
  Link,
} from "@tanstack/react-router"

import {
  useEffect,
  useState,
} from "react"

import { Footer }
  from "@/components/Common/Footer"

import AppSidebar
  from "@/components/Sidebar/AppSidebar"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { isLoggedIn }
  from "@/hooks/useAuth"

export const Route =
  createFileRoute("/_layout")({
    component: Layout,

    beforeLoad: async () => {

      if (!isLoggedIn()) {

        throw redirect({
          to: "/login",
        })
      }
    },
  })

function Layout() {

  const matches = useMatches()

  const currentSearch =
    matches[
      matches.length - 1
    ]?.search as {
      courseId?: string
      taskTypeId?: string
      taskId?: string
    }

  const courseMatch =
    matches.find(
      (match) =>
        "courseId" in match.params,
    )

  const courseId =
    (
      courseMatch?.params as {
        courseId?: string
      }
    )?.courseId
    ||
    currentSearch.courseId

  const taskTypeId =
    currentSearch.taskTypeId

  const taskId =
    (
      matches.find(
        (match) =>
          "taskId" in match.params,
      )?.params as {
        taskId?: string
      }
    )?.taskId
    ||
    currentSearch.taskId

  const [
    courseTitles,
    setCourseTitles,
  ] = useState<
    Record<string, string>
  >({})

  const [
    taskTypeTitles,
    setTaskTypeTitles,
  ] = useState<
    Record<string, string>
  >({})

  const [
    taskTitles,
    setTaskTitles,
  ] = useState<
    Record<string, string>
  >({})

  useEffect(() => {

    const fetchCourseTitle =
      async () => {

        if (
          !courseId ||
          courseTitles[courseId]
        ) {

          return
        }

        try {

          const response =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/${courseId}`,
            )

          const data =
            await response.json()

          setCourseTitles(
            (prev) => ({
              ...prev,
              [courseId]:
                data.name,
            }),
          )

        } catch (error) {

          console.error(error)
        }
      }

    fetchCourseTitle()

  }, [courseId])

  useEffect(() => {

    const fetchTaskTypeTitle =
      async () => {

        if (
          !taskTypeId ||
          taskTypeTitles[
            taskTypeId
          ]
        ) {

          return
        }

        try {

          const response =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/task-types/${taskTypeId}`,
            )

          const data =
            await response.json()

          setTaskTypeTitles(
            (prev) => ({
              ...prev,
              [taskTypeId]:
                data.name,
            }),
          )

        } catch (error) {

          console.error(error)
        }
      }

    fetchTaskTypeTitle()

  }, [taskTypeId])

  useEffect(() => {

    const fetchTaskTitle =
      async () => {

        if (
          !taskId ||
          taskTitles[taskId]
        ) {

          return
        }

        try {

          const response =
            await fetch(
              `http://127.0.0.1:8000/api/v1/courses/tasks/${taskId}`,
            )

          const data =
            await response.json()

          setTaskTitles(
            (prev) => ({
              ...prev,
              [taskId]:
                data.name,
            }),
          )

        } catch (error) {

          console.error(error)
        }
      }

    fetchTaskTitle()

  }, [taskId])

  type Breadcrumb = {
    label: string
    href?: string
  }

  const breadcrumbs:
    Breadcrumb[] = []

  breadcrumbs.push({
    label: "Courses",
    href: "/courses",
  })

  if (courseId) {

    const courseTitle =
      courseTitles[
        courseId
      ]

    if (courseTitle) {

      breadcrumbs.push({
        label: courseTitle,
        href:
          `/courses/${courseId}`,
      })
    }
  }

  if (taskTypeId) {

    const taskTypeTitle =
      taskTypeTitles[
        taskTypeId
      ]

    if (taskTypeTitle) {

      breadcrumbs.push({
        label: taskTypeTitle,
        href:
          `/tasks?courseId=${courseId}&taskTypeId=${taskTypeId}`,
      })
    }
  }

  if (taskId) {

    const taskTitle =
      taskTitles[
        taskId
      ]

    if (taskTitle) {

      breadcrumbs.push({
        label: taskTitle,
      })
    }
  }

  return (

    <SidebarProvider>

      <AppSidebar />

      <SidebarInset>

        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6 shadow-sm">

          <div className="flex items-center gap-4">

            <SidebarTrigger className="text-muted-foreground" />

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2 text-sm">

              {breadcrumbs.map(
                (
                  item,
                  index,
                ) => (

                  <div
                    key={item.label}
                    className="flex items-center gap-2"
                  >

                    {index === breadcrumbs.length - 1 ? (

                      <span className="font-semibold text-foreground">

                        {item.label}
                      </span>

                    ) : (

                      <Link
                        to={item.href || "/"}
                        className="
                          text-muted-foreground
                          hover:text-primary
                        "
                      >
                        {item.label}
                      </Link>
                    )}

                    {index !== breadcrumbs.length - 1 && (

                      <span className="text-muted-foreground">
                        /
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button className="rounded-full transition hover:opacity-80">

              <img
                src="https://i.pravatar.cc/100"
                alt="User avatar"
                className="h-10 w-10 rounded-full border object-cover"
              />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">

          <div className="mx-auto max-w-7xl">

            <Outlet />
          </div>
        </main>

        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
