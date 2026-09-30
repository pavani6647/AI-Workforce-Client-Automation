import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Code2,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlayCircle,
  Send,
  Sparkles,
  Target,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import {
  addNotification,
  getStore,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const CURRENT_INTERN_KEY = "shuroq_current_intern";

const STATUS_OPTIONS = ["Pending", "In Progress"];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(date) {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNotificationTime(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = now.getTime() - parsed.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) {
    return "Just now";
  }

  if (difference < hour) {
    const minutes = Math.floor(difference / minute);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (difference < day) {
    const hours = Math.floor(difference / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (difference < 7 * day) {
    const days = Math.floor(difference / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskStatus(task) {
  if (task.status === "Completed") return "Completed";
  if (task.status === "Submitted") return "Submitted";

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  if (
    dueDate &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate < new Date() &&
    task.status !== "Completed" &&
    task.status !== "Submitted"
  ) {
    return "Overdue";
  }

  return task.status || "Pending";
}

function getStatusClasses(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "In Progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Overdue":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getPriorityClasses(priority) {
  switch (priority) {
    case "High":
      return "bg-red-50 text-red-700";

    case "Medium":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

function isTaskAssignedTo(task, intern) {
  const currentName = normalize(intern?.name);

  return (
    normalize(task.intern) === currentName ||
    normalize(task.assignedTo) === currentName ||
    String(task.internId || "") === String(intern?.id || "") ||
    String(task.assignedToId || "") === String(intern?.id || "")
  );
}

function isNotificationForIntern(notification, intern) {
  if (!notification || !intern) return false;

  const recipient = normalize(notification.recipient);
  const internName = normalize(intern.name);

  return (
    notification.recipientRole === "intern" &&
    recipient === internName
  );
}

export default function InternDashboard() {
  const [store, setStore] = useState(() => getStore());

  const [selectedInternId, setSelectedInternId] = useState(() => {
    try {
      return localStorage.getItem(CURRENT_INTERN_KEY) || "";
    } catch {
      return "";
    }
  });

  const [selectedTask, setSelectedTask] = useState(null);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [submission, setSubmission] = useState("");

  const [taskError, setTaskError] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStore((nextStore) => {
      setStore(nextStore);

      if (selectedTask) {
        const updatedTask = nextStore.tasks?.find(
          (task) =>
            String(task.id) === String(selectedTask.id)
        );

        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    });

    return unsubscribe;
  }, [selectedTask]);

  const interns = store.interns || [];

  const selectedIntern = useMemo(() => {
    if (!interns.length) return null;

    const savedIntern = interns.find(
      (intern) =>
        String(intern.id) === String(selectedInternId)
    );

    if (savedIntern) return savedIntern;

    const pavani = interns.find(
      (intern) => normalize(intern.name) === "pavani"
    );

    return pavani || interns[0];
  }, [interns, selectedInternId]);

  useEffect(() => {
    if (!selectedIntern) return;

    const currentId = String(selectedIntern.id);

    if (String(selectedInternId) !== currentId) {
      setSelectedInternId(currentId);
    }

    try {
      localStorage.setItem(
        CURRENT_INTERN_KEY,
        currentId
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [selectedIntern, selectedInternId]);

  const currentInternName =
    selectedIntern?.name || "Intern";

  const myTasks = useMemo(() => {
    if (!selectedIntern) return [];

    return (store.tasks || [])
      .filter((task) =>
        isTaskAssignedTo(task, selectedIntern)
      )
      .map((task) => ({
        ...task,
        displayStatus: getTaskStatus(task),
      }))
      .sort((a, b) => {
        const statusOrder = {
          Overdue: 0,
          "In Progress": 1,
          Pending: 2,
          Submitted: 3,
          Completed: 4,
        };

        const statusDifference =
          (statusOrder[a.displayStatus] ?? 5) -
          (statusOrder[b.displayStatus] ?? 5);

        if (statusDifference !== 0) {
          return statusDifference;
        }

        return (
          new Date(a.dueDate || "9999-12-31") -
          new Date(b.dueDate || "9999-12-31")
        );
      });
  }, [store.tasks, selectedIntern]);

  const myNotifications = useMemo(() => {
    if (!selectedIntern) return [];

    return (store.notifications || [])
      .filter((notification) =>
        isNotificationForIntern(
          notification,
          selectedIntern
        )
      )
      .sort((a, b) => {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });
  }, [store.notifications, selectedIntern]);

  const unreadNotifications = useMemo(() => {
    return myNotifications.filter(
      (notification) => !notification.read
    );
  }, [myNotifications]);

  const stats = useMemo(() => {
    const total = myTasks.length;

    const completed = myTasks.filter(
      (task) =>
        task.status === "Completed" ||
        Number(task.progress || 0) >= 100
    ).length;

    const submitted = myTasks.filter(
      (task) => task.status === "Submitted"
    ).length;

    const active = myTasks.filter(
      (task) =>
        task.status === "Pending" ||
        task.status === "In Progress"
    ).length;

    const overdue = myTasks.filter(
      (task) => task.displayStatus === "Overdue"
    ).length;

    const averageProgress =
      total > 0
        ? Math.round(
            myTasks.reduce(
              (sum, task) =>
                sum + Number(task.progress || 0),
              0
            ) / total
          )
        : 0;

    return {
      total,
      completed,
      submitted,
      active,
      overdue,
      averageProgress,
    };
  }, [myTasks]);

  const handleInternChange = (event) => {
    const nextId = event.target.value;

    setSelectedInternId(nextId);

    try {
      localStorage.setItem(
        CURRENT_INTERN_KEY,
        nextId
      );
    } catch {
      // Ignore localStorage errors.
    }

    setSelectedTask(null);
    setTaskError("");
    setTaskMessage("");
    setNotificationsOpen(false);
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setProgress(Number(task.progress || 0));

    setStatus(
      task.status === "In Progress"
        ? "In Progress"
        : "Pending"
    );

    setSubmission(task.submission || "");
    setTaskError("");
    setTaskMessage("");
  };

  const closeTask = () => {
    setSelectedTask(null);
    setTaskError("");
    setTaskMessage("");
    setLoading(false);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    setNotificationsOpen(false);

    if (
      notification.type === "task" &&
      notification.message
    ) {
      const matchingTask = myTasks.find((task) =>
        notification.message.includes(task.title)
      );

      if (matchingTask) {
        openTask(matchingTask);
      }
    }
  };

  const handleMarkAllNotificationsRead = () => {
    if (!selectedIntern) return;

    markAllNotificationsAsRead(
      "intern",
      selectedIntern.name
    );
  };

  const saveTaskUpdate = async (submit = false) => {
    if (!selectedTask || !selectedIntern) return;

    setTaskError("");
    setTaskMessage("");

    const locked =
      selectedTask.status === "Submitted" ||
      selectedTask.status === "Completed";

    if (locked) {
      setTaskError(
        "This task has already been submitted and is locked for editing."
      );
      return;
    }

    const numericProgress = Math.min(
      100,
      Math.max(0, Number(progress) || 0)
    );

    if (submit && !submission.trim()) {
      setTaskError(
        "Please add your submission details before submitting the task."
      );
      return;
    }

    setLoading(true);

    try {
      const finalStatus = submit
        ? "Submitted"
        : numericProgress >= 100
        ? "Completed"
        : status;

      const finalProgress = numericProgress;

      let hasPreviousFeedback = false;

      updateStore((current) => {
        const currentTask = (current.tasks || []).find(
          (task) =>
            String(task.id) === String(selectedTask.id)
        );

        hasPreviousFeedback = Boolean(
          currentTask?.feedback
        );

        const updatedTasks = (current.tasks || []).map(
          (task) =>
            String(task.id) === String(selectedTask.id)
              ? {
                  ...task,
                  progress: finalProgress,
                  status: finalStatus,
                  submission: submit
                    ? submission.trim()
                    : task.submission || "",
                  updatedDate: new Date().toISOString(),
                }
              : task
        );

        const projectNames = [
          ...new Set(
            updatedTasks
              .filter(
                (task) =>
                  task.projectId ===
                    selectedTask.projectId ||
                  task.project === selectedTask.project
              )
              .map((task) => task.project)
              .filter(Boolean)
          ),
        ];

        let updatedProjects = current.projects || [];

        if (projectNames.length > 0) {
          updatedProjects = updatedProjects.map(
            (project) => {
              const projectTasks = updatedTasks.filter(
                (task) =>
                  task.projectId === project.id ||
                  task.project === project.name
              );

              if (!projectTasks.length) {
                return project;
              }

              const projectProgress = Math.round(
                projectTasks.reduce(
                  (sum, task) =>
                    sum + Number(task.progress || 0),
                  0
                ) / projectTasks.length
              );

              let projectStatus = project.status;

              if (project.status !== "On Hold") {
                if (projectProgress >= 100) {
                  projectStatus = "Completed";
                } else if (projectProgress > 0) {
                  projectStatus = "In Progress";
                } else {
                  projectStatus = "Planning";
                }
              }

              return {
                ...project,
                progress: projectProgress,
                status: projectStatus,
              };
            }
          );
        }

        return {
          ...current,
          tasks: updatedTasks,
          projects: updatedProjects,
        };
      });

      if (submit) {
        addNotification({
          recipientRole: "admin",
          recipient: "Admin",
          type: "task",
          title: hasPreviousFeedback
            ? "Task resubmitted"
            : "Task submitted",
          message: hasPreviousFeedback
            ? `${currentInternName} resubmitted "${selectedTask.title}" after addressing admin feedback.`
            : `${currentInternName} submitted "${selectedTask.title}" for review.`,
        });
      }

      if (submit) {
        setTaskMessage(
          hasPreviousFeedback
            ? "Task resubmitted successfully. Admin has been notified."
            : "Task submitted successfully. Admin has been notified."
        );
      } else {
        setTaskMessage(
          "Task progress updated successfully."
        );
      }

      setSelectedTask((current) =>
        current
          ? {
              ...current,
              progress: finalProgress,
              status: finalStatus,
              submission: submit
                ? submission.trim()
                : current.submission || "",
            }
          : current
      );

      if (submit) {
        setTimeout(() => {
          closeTask();
        }, 900);
      }
    } catch (error) {
      setTaskError(
        error?.message ||
          "Unable to update the task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const profileInitial = currentInternName
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Zap size={21} />
              </div>

              <div>
                <h1 className="text-lg font-bold">
                  Shuroq
                </h1>

                <p className="text-xs text-slate-500">
                  Workforce Platform
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active
            />

            <SidebarItem
              icon={<ClipboardCheck size={18} />}
              label="My Tasks"
              onClick={() =>
                document
                  .getElementById("my-tasks")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            />

            <SidebarItem
              icon={<Target size={18} />}
              label="Performance"
              onClick={() =>
                document
                  .getElementById("performance")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            />

            <SidebarItem
              icon={<Bell size={18} />}
              label="Notifications"
              onClick={() => {
                setNotificationsOpen(true);
              }}
            />

            <SidebarItem
              icon={<MessageSquare size={18} />}
              label="AI Assistant"
              onClick={() =>
                document
                  .getElementById("ai-guidance")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            />
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                {profileInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {currentInternName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {selectedIntern?.role || "Intern"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 py-4 sm:px-7 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div>
                <p className="text-sm text-slate-500">
                  Intern Workspace
                </p>

                <h2 className="text-xl font-bold sm:text-2xl">
                  Welcome, {currentInternName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      (current) => !current
                    )
                  }
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  {unreadNotifications.length > 0 ? (
                    <BellRing size={19} />
                  ) : (
                    <Bell size={19} />
                  )}

                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadNotifications.length > 9
                        ? "9+"
                        : unreadNotifications.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <NotificationDropdown
                    notifications={myNotifications}
                    unreadCount={
                      unreadNotifications.length
                    }
                    onClose={() =>
                      setNotificationsOpen(false)
                    }
                    onNotificationClick={
                      handleNotificationClick
                    }
                    onMarkAllRead={
                      handleMarkAllNotificationsRead
                    }
                  />
                )}
              </div>

              {/* Intern selector */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <UserRound
                    size={17}
                    className="text-slate-500"
                  />

                  <select
                    value={selectedIntern?.id || ""}
                    onChange={handleInternChange}
                    className="max-w-32 cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium outline-none sm:max-w-44"
                    aria-label="Select intern"
                  >
                    {interns.map((intern) => (
                      <option
                        key={intern.id}
                        value={intern.id}
                      >
                        {intern.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none -ml-5 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-7 lg:p-8">
          {/* Identity notice */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-blue-100 p-2 text-blue-700">
                  <UserRound size={19} />
                </div>

                <div>
                  <h3 className="font-semibold text-blue-900">
                    Viewing {currentInternName}'s
                    workspace
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    Tasks assigned to this intern appear
                    automatically in the My Tasks section.
                  </p>
                </div>
              </div>

              <div className="text-sm text-blue-700">
                {stats.total} assigned task
                {stats.total === 1 ? "" : "s"}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={<ClipboardCheck size={20} />}
              label="Total Tasks"
              value={stats.total}
              description="Assigned to you"
            />

            <StatCard
              icon={<PlayCircle size={20} />}
              label="Active"
              value={stats.active}
              description="Pending or in progress"
            />

            <StatCard
              icon={<Send size={20} />}
              label="Submitted"
              value={stats.submitted}
              description="Waiting for review"
            />

            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Completed"
              value={stats.completed}
              description="Completed tasks"
            />

            <StatCard
              icon={<Target size={20} />}
              label="Progress"
              value={`${stats.averageProgress}%`}
              description={
                stats.overdue > 0
                  ? `${stats.overdue} overdue`
                  : "Average task progress"
              }
            />
          </section>

          {/* My Tasks */}
          <section
            id="my-tasks"
            className="space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  My Tasks
                </h2>

                <p className="text-sm text-slate-500">
                  Tasks assigned to {currentInternName}
                </p>
              </div>

              <div className="text-sm font-medium text-slate-500">
                {myTasks.length} task
                {myTasks.length === 1 ? "" : "s"}
              </div>
            </div>

            {myTasks.length === 0 ? (
              <EmptyTasks
                internName={currentInternName}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {myTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => openTask(task)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Performance */}
          <section
            id="performance"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <Target size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  My Performance
                </h2>

                <p className="text-sm text-slate-500">
                  Current task progress overview
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
              <div className="flex justify-center">
                <ProgressCircle
                  value={stats.averageProgress}
                />
              </div>

              <div className="space-y-4">
                <ProgressRow
                  label="Active Tasks"
                  value={stats.active}
                  total={stats.total}
                />

                <ProgressRow
                  label="Submitted"
                  value={stats.submitted}
                  total={stats.total}
                />

                <ProgressRow
                  label="Completed"
                  value={stats.completed}
                  total={stats.total}
                />

                <ProgressRow
                  label="Overdue"
                  value={stats.overdue}
                  total={stats.total}
                />
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section
            id="notifications"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Bell size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Notifications
                  </h2>

                  <p className="text-sm text-slate-500">
                    Updates from the admin and your workspace.
                  </p>
                </div>
              </div>

              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={
                    handleMarkAllNotificationsRead
                  }
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {myNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <Bell
                  size={28}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-3 font-semibold text-slate-800">
                  No notifications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  New task assignments, reviews and admin
                  updates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myNotifications
                  .slice(0, 8)
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    />
                  ))}
              </div>
            )}
          </section>

          {/* AI Guidance */}
          <section
            id="ai-guidance"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Sparkles size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  AI Work Guidance
                </h2>

                <p className="text-sm text-slate-500">
                  Guidance based on your assigned tasks and
                  workload.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <GuidanceCard
                icon={<Clock3 size={19} />}
                title="Prioritize deadlines"
                text={
                  stats.overdue > 0
                    ? `You currently have ${stats.overdue} overdue task${
                        stats.overdue === 1
                          ? ""
                          : "s"
                      }. Review these first.`
                    : "Focus on tasks with the nearest deadlines first."
                }
              />

              <GuidanceCard
                icon={<Code2 size={19} />}
                title="Use your skills"
                text={
                  selectedIntern?.skills?.length
                    ? `Your profile includes ${selectedIntern.skills
                        .slice(0, 4)
                        .join(", ")}.`
                    : "Keep your skills updated so task recommendations can improve."
                }
              />

              <GuidanceCard
                icon={<Sparkles size={19} />}
                title="AI-generated tasks"
                text="Open an AI-generated task to view its skills, estimated duration and acceptance criteria."
              />
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="absolute inset-0 bg-slate-950/40"
          />

          <aside className="relative h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Zap size={21} />
                </div>

                <div>
                  <h1 className="font-bold">Shuroq</h1>

                  <p className="text-xs text-slate-500">
                    Intern Workspace
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1 p-4">
              <MobileMenuItem
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              />

              <MobileMenuItem
                icon={<ClipboardCheck size={18} />}
                label="My Tasks"
                onClick={() => {
                  setMobileMenuOpen(false);

                  setTimeout(() => {
                    document
                      .getElementById("my-tasks")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 100);
                }}
              />

              <MobileMenuItem
                icon={<Target size={18} />}
                label="Performance"
                onClick={() => {
                  setMobileMenuOpen(false);

                  setTimeout(() => {
                    document
                      .getElementById("performance")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 100);
                }}
              />

              <MobileMenuItem
                icon={<Bell size={18} />}
                label="Notifications"
                onClick={() => {
                  setMobileMenuOpen(false);

                  setTimeout(() => {
                    document
                      .getElementById("notifications")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 100);
                }}
              />

              <MobileMenuItem
                icon={<MessageSquare size={18} />}
                label="AI Assistant"
                onClick={() => {
                  setMobileMenuOpen(false);

                  setTimeout(() => {
                    document
                      .getElementById("ai-guidance")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 100);
                }}
              />
            </nav>
          </aside>
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          progress={progress}
          status={status}
          submission={submission}
          setProgress={setProgress}
          setStatus={setStatus}
          setSubmission={setSubmission}
          onClose={closeTask}
          onSave={() => saveTaskUpdate(false)}
          onSubmit={() => saveTaskUpdate(true)}
          loading={loading}
          error={taskError}
          message={taskMessage}
        />
      )}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileMenuItem({
  icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function TaskCard({ task, onOpen }) {
  const isAI =
    task.aiGenerated ||
    task.generatedFromRequirement ||
    task.skills?.length ||
    task.acceptanceCriteria?.length ||
    task.estimatedDays;

  const progress = Math.min(
    100,
    Math.max(0, Number(task.progress || 0))
  );

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                task.displayStatus ||
                  task.status
              )}`}
            >
              {task.displayStatus ||
                task.status ||
                "Pending"}
            </span>

            {isAI && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                <Sparkles size={12} />
                AI Generated
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-base font-bold text-slate-900">
            {task.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {task.description ||
              "No task description available."}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <InfoItem
          icon={<FileText size={15} />}
          label="Project"
          value={
            task.project || "Not assigned"
          }
        />

        <InfoItem
          icon={<CalendarDays size={15} />}
          label="Due"
          value={formatDate(task.dueDate)}
        />

        <InfoItem
          icon={<Target size={15} />}
          label="Priority"
          value={task.priority || "Medium"}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">
            Progress
          </span>

          <span className="font-semibold text-slate-700">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function EmptyTasks({ internName }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ClipboardCheck size={26} />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        No tasks assigned
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        There are currently no tasks assigned to{" "}
        {internName}. When an admin assigns a task,
        it will appear here.
      </p>
    </div>
  );
}

function ProgressCircle({ value }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-slate-100"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          className="text-blue-600 transition-all"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">
          {value}%
        </span>

        <span className="text-xs text-slate-400">
          average
        </span>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">
          {label}
        </span>

        <span className="font-semibold text-slate-800">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function GuidanceCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        {icon}
      </div>

      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function NotificationDropdown({
  notifications,
  unreadCount,
  onClose,
  onNotificationClick,
  onMarkAllRead,
}) {
  return (
    <div className="absolute right-0 top-14 z-50 w-[min(92vw,400px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div>
          <h3 className="font-bold text-slate-900">
            Notifications
          </h3>

          <p className="text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You're all caught up"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={17} />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Bell
            size={28}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No notifications
          </p>

          <p className="mt-1 text-xs text-slate-400">
            New workspace updates will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications
              .slice(0, 10)
              .map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    onNotificationClick(
                      notification
                    )
                  }
                />
              ))}
          </div>

          {unreadCount > 0 && (
            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={onMarkAllRead}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                Mark all as read
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}) {
  const isUnread = !notification.read;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
        isUnread ? "bg-blue-50/50" : "bg-white"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUnread
            ? "bg-blue-100 text-blue-600"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {notification.type === "task" ? (
          <ClipboardCheck size={17} />
        ) : notification.type ===
          "deliverable" ? (
          <CheckCircle2 size={17} />
        ) : (
          <Bell size={17} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${
              isUnread
                ? "font-bold text-slate-900"
                : "font-semibold text-slate-700"
            }`}
          >
            {notification.title ||
              "Notification"}
          </p>

          {isUnread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {notification.message}
        </p>

        <p className="mt-2 text-[11px] text-slate-400">
          {formatNotificationTime(
            notification.createdAt
          )}
        </p>
      </div>
    </button>
  );
}

function TaskModal({
  task,
  progress,
  status,
  submission,
  setProgress,
  setStatus,
  setSubmission,
  onClose,
  onSave,
  onSubmit,
  loading,
  error,
  message,
}) {
  const locked =
    task.status === "Submitted" ||
    task.status === "Completed";

  const isAI =
    task.aiGenerated ||
    task.generatedFromRequirement ||
    task.skills?.length ||
    task.acceptanceCriteria?.length ||
    task.estimatedDays;

  const skills = Array.isArray(task.skills)
    ? task.skills
    : [];

  const acceptanceCriteria = Array.isArray(
    task.acceptanceCriteria
  )
    ? task.acceptanceCriteria
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {isAI && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  <Sparkles size={13} />
                  AI Generated Task
                </span>
              )}

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                  task.status
                )}`}
              >
                {task.status || "Pending"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {task.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {task.project ||
                "No project assigned"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            {/* Description */}
            <section>
              <div className="mb-2 flex items-center gap-2">
                <FileText
                  size={17}
                  className="text-slate-500"
                />

                <h3 className="font-semibold">
                  Task Description
                </h3>
              </div>

              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {task.description ||
                  "No task description available."}
              </p>
            </section>

            {/* Task metadata */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetaCard
                label="Priority"
                value={
                  task.priority || "Medium"
                }
                valueClass={getPriorityClasses(
                  task.priority
                )}
              />

              <MetaCard
                label="Due Date"
                value={formatDate(
                  task.dueDate
                )}
              />

              <MetaCard
                label="Estimated Time"
                value={
                  task.estimatedDays
                    ? `${task.estimatedDays} day${
                        Number(
                          task.estimatedDays
                        ) === 1
                          ? ""
                          : "s"
                      }`
                    : "Not specified"
                }
              />

              <MetaCard
                label="Progress"
                value={`${Number(
                  progress || 0
                )}%`}
              />
            </section>

            {/* AI Details */}
            {isAI && (
              <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <h3 className="font-bold text-violet-900">
                      AI Task Details
                    </h3>

                    <p className="mt-1 text-sm text-violet-700">
                      Additional information generated
                      from the project requirements.
                    </p>
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Code2 size={16} />
                      Required Skills
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skills.map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {acceptanceCriteria.length >
                  0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <ClipboardCheck
                        size={16}
                      />
                      Acceptance Criteria
                    </div>

                    <div className="space-y-2">
                      {acceptanceCriteria.map(
                        (
                          criterion,
                          index
                        ) => (
                          <div
                            key={`${criterion}-${index}`}
                            className="flex items-start gap-2 rounded-lg bg-white p-3 text-sm text-slate-600 shadow-sm"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-emerald-600"
                            />

                            <span>
                              {criterion}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Project / assignment */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Project
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {task.project ||
                    "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Client
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {task.client ||
                    "Not specified"}
                </p>
              </div>
            </section>

            {/* Locked state */}
            {locked && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="font-semibold text-blue-900">
                    Task locked for review
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    This task has been submitted or
                    completed. Further changes must
                    be handled by the admin.
                  </p>
                </div>
              </div>
            )}

            {/* Progress */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target
                    size={17}
                    className="text-slate-500"
                  />

                  <h3 className="font-semibold">
                    Task Progress
                  </h3>
                </div>

                <span className="text-sm font-bold text-blue-600">
                  {progress}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) =>
                  setProgress(
                    Number(event.target.value)
                  )
                }
                disabled={locked}
                className="w-full accent-blue-600 disabled:opacity-50"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </section>

            {/* Status */}
            {!locked && (
              <section>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  Completed status is controlled
                  through task progress and admin
                  review.
                </p>
              </section>
            )}

            {/* Submission */}
            <section>
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare
                  size={17}
                  className="text-slate-500"
                />

                <label className="font-semibold">
                  Work Submission
                </label>
              </div>

              <textarea
                value={submission}
                onChange={(event) =>
                  setSubmission(
                    event.target.value
                  )
                }
                disabled={locked}
                rows={5}
                placeholder="Describe the work you completed, implementation details, GitHub link, deliverables, or other relevant information..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
              />

              {!locked && (
                <p className="mt-2 text-xs text-slate-400">
                  Add enough information for the
                  admin to review your work.
                </p>
              )}
            </section>

            {/* Admin feedback */}
            {task.feedback && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare
                    size={18}
                    className="mt-0.5 text-amber-700"
                  />

                  <div>
                    <h3 className="font-semibold text-amber-900">
                      Admin Feedback
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      {task.feedback}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>

          {!locked && (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={loading}
                className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : "Save Progress"}
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />

                {loading
                  ? "Submitting..."
                  : "Submit for Review"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  valueClass = "",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 inline-block text-sm font-semibold ${
          valueClass || "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}