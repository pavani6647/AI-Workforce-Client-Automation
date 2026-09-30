import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  addNotification,
  getStore,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "In Progress",
  "Submitted",
  "Completed",
  "Overdue",
];

const PRIORITY_OPTIONS = ["All", "High", "Medium", "Low"];

const EMPTY_TASK = {
  title: "",
  description: "",
  project: "",
  intern: "",
  status: "Pending",
  priority: "Medium",
  dueDate: "",
  progress: 0,
};

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

function getDisplayStatus(task) {
  if (task.status === "Completed") return "Completed";
  if (task.status === "Submitted") return "Submitted";

  if (
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "Completed"
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

function isAIgenerated(task) {
  return Boolean(
    task.aiGenerated ||
      task.generatedFromRequirement ||
      task.skills?.length ||
      task.acceptanceCriteria?.length ||
      task.estimatedDays
  );
}

function recalculateProjects(tasks, projects) {
  return (projects || []).map((project) => {
    const projectTasks = (tasks || []).filter(
      (task) =>
        task.projectId === project.id ||
        task.project === project.name
    );

    if (!projectTasks.length) {
      return project;
    }

    const progress = Math.round(
      projectTasks.reduce(
        (sum, task) => sum + Number(task.progress || 0),
        0
      ) / projectTasks.length
    );

    let status = project.status;

    if (project.status !== "On Hold") {
      if (progress >= 100) {
        status = "Completed";
      } else if (progress > 0) {
        status = "In Progress";
      } else {
        status = "Planning";
      }
    }

    return {
      ...project,
      progress,
      status,
    };
  });
}

export default function Tasks() {
  const [store, setStore] = useState(() => getStore());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [internFilter, setInternFilter] = useState("All");

  const [selectedTask, setSelectedTask] = useState(null);

  const [feedback, setFeedback] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskForm, setTaskForm] = useState(EMPTY_TASK);

  useEffect(() => {
    const unsubscribe = subscribeToStore((nextStore) => {
      setStore(nextStore);

      if (selectedTask) {
        const updated = nextStore.tasks?.find(
          (task) =>
            String(task.id) === String(selectedTask.id)
        );

        if (updated) {
          setSelectedTask(updated);
        }
      }
    });

    return unsubscribe;
  }, [selectedTask]);

  const tasks = store.tasks || [];
  const projects = store.projects || [];
  const interns = store.interns || [];

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (!query) return true;

        return [
          task.title,
          task.description,
          task.project,
          task.client,
          task.intern,
          task.status,
          task.priority,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );
      })
      .filter((task) => {
        if (statusFilter === "All") return true;
        return getDisplayStatus(task) === statusFilter;
      })
      .filter((task) => {
        if (priorityFilter === "All") return true;
        return task.priority === priorityFilter;
      })
      .filter((task) => {
        if (projectFilter === "All") return true;
        return task.project === projectFilter;
      })
      .filter((task) => {
        if (internFilter === "All") return true;
        return task.intern === internFilter;
      })
      .sort((a, b) => {
        const statusOrder = {
          Submitted: 0,
          Overdue: 1,
          "In Progress": 2,
          Pending: 3,
          Completed: 4,
        };

        return (
          (statusOrder[getDisplayStatus(a)] ?? 5) -
          (statusOrder[getDisplayStatus(b)] ?? 5)
        );
      });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    internFilter,
  ]);

  const submittedCount = tasks.filter(
    (task) => task.status === "Submitted"
  ).length;

  const activeCount = tasks.filter(
    (task) =>
      task.status === "Pending" ||
      task.status === "In Progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const overdueCount = tasks.filter(
    (task) => getDisplayStatus(task) === "Overdue"
  ).length;

  const openTask = (task) => {
    setSelectedTask(task);
    setFeedback(task.feedback || "");
    setReviewMessage("");
    setReviewError("");
  };

  const closeTask = () => {
    setSelectedTask(null);
    setFeedback("");
    setReviewMessage("");
    setReviewError("");
    setReviewLoading(false);
  };

  const updateTaskFeedback = () => {
    if (!selectedTask) return;

    setReviewError("");
    setReviewMessage("");

    updateStore((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) =>
        String(task.id) === String(selectedTask.id)
          ? {
              ...task,
              feedback: feedback.trim(),
              updatedDate: new Date().toISOString(),
            }
          : task
      ),
    }));

    if (selectedTask.intern) {
      addNotification({
        recipientRole: "intern",
        recipient: selectedTask.intern,
        type: "feedback",
        title: "Task feedback received",
        message: `Admin added feedback to "${selectedTask.title}".`,
      });
    }

    setReviewMessage("Feedback saved successfully.");
  };

  const approveTask = () => {
    if (!selectedTask) return;

    setReviewError("");
    setReviewMessage("");
    setReviewLoading(true);

    try {
      updateStore((current) => {
        const updatedTasks = (current.tasks || []).map(
          (task) =>
            String(task.id) === String(selectedTask.id)
              ? {
                  ...task,
                  status: "Completed",
                  progress: 100,
                  feedback: feedback.trim(),
                  reviewedBy: "Admin",
                  reviewedDate: new Date().toISOString(),
                  updatedDate: new Date().toISOString(),
                }
              : task
        );

        return {
          ...current,
          tasks: updatedTasks,
          projects: recalculateProjects(
            updatedTasks,
            current.projects
          ),
        };
      });

      if (selectedTask.intern) {
        addNotification({
          recipientRole: "intern",
          recipient: selectedTask.intern,
          type: "task",
          title: "Task approved",
          message: `Your task "${selectedTask.title}" has been approved and marked as completed.`,
        });
      }

      setSelectedTask((current) =>
        current
          ? {
              ...current,
              status: "Completed",
              progress: 100,
              feedback: feedback.trim(),
              reviewedBy: "Admin",
            }
          : current
      );

      setReviewMessage(
        "Task approved and marked as completed."
      );
    } catch (error) {
      setReviewError(
        error?.message ||
          "Unable to approve the task. Please try again."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const requestChanges = () => {
    if (!selectedTask) return;

    if (!feedback.trim()) {
      setReviewError(
        "Please provide feedback before requesting changes."
      );
      return;
    }

    setReviewError("");
    setReviewMessage("");
    setReviewLoading(true);

    try {
      updateStore((current) => {
        const updatedTasks = (current.tasks || []).map(
          (task) =>
            String(task.id) === String(selectedTask.id)
              ? {
                  ...task,
                  status: "In Progress",
                  feedback: feedback.trim(),
                  reviewedBy: "Admin",
                  reviewedDate: new Date().toISOString(),
                  updatedDate: new Date().toISOString(),
                }
              : task
        );

        return {
          ...current,
          tasks: updatedTasks,
          projects: recalculateProjects(
            updatedTasks,
            current.projects
          ),
        };
      });

      if (selectedTask.intern) {
        addNotification({
          recipientRole: "intern",
          recipient: selectedTask.intern,
          type: "feedback",
          title: "Changes requested",
          message: `Admin requested changes for "${selectedTask.title}".`,
        });
      }

      setSelectedTask((current) =>
        current
          ? {
              ...current,
              status: "In Progress",
              feedback: feedback.trim(),
              reviewedBy: "Admin",
            }
          : current
      );

      setReviewMessage(
        "Changes requested. The task is back in progress."
      );
    } catch (error) {
      setReviewError(
        error?.message ||
          "Unable to request changes. Please try again."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const deleteTask = (task) => {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    updateStore((current) => ({
      ...current,
      tasks: (current.tasks || []).filter(
        (item) => String(item.id) !== String(task.id)
      ),
    }));

    if (
      selectedTask &&
      String(selectedTask.id) === String(task.id)
    ) {
      closeTask();
    }
  };

  const startAddTask = () => {
    setEditingTask(null);
    setTaskForm(EMPTY_TASK);
    setShowAddModal(true);
  };

  const startEditTask = (task) => {
    setEditingTask(task);

    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      project: task.project || "",
      intern: task.intern || "",
      status: task.status || "Pending",
      priority: task.priority || "Medium",
      dueDate: task.dueDate || "",
      progress: Number(task.progress || 0),
    });

    setShowAddModal(true);
  };

  const closeTaskForm = () => {
    setShowAddModal(false);
    setEditingTask(null);
    setTaskForm(EMPTY_TASK);
  };

  const handleFormChange = (field, value) => {
    setTaskForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveTaskForm = (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) return;

    const selectedProject = projects.find(
      (project) => project.name === taskForm.project
    );

    updateStore((current) => {
      if (editingTask) {
        return {
          ...current,
          tasks: (current.tasks || []).map((task) =>
            String(task.id) === String(editingTask.id)
              ? {
                  ...task,
                  ...taskForm,
                  title: taskForm.title.trim(),
                  description: taskForm.description.trim(),
                  client:
                    selectedProject?.client ||
                    task.client ||
                    "",
                  progress: Number(taskForm.progress || 0),
                  updatedDate: new Date().toISOString(),
                }
              : task
          ),
        };
      }

      const newTask = {
        id: Date.now(),
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        client: selectedProject?.client || "",
        progress: Number(taskForm.progress || 0),
        createdDate: new Date().toISOString(),
        submission: "",
        feedback: "",
      };

      return {
        ...current,
        tasks: [newTask, ...(current.tasks || [])],
      };
    });

    if (taskForm.intern) {
      addNotification({
        recipientRole: "intern",
        recipient: taskForm.intern,
        type: "task",
        title: editingTask
          ? "Task updated"
          : "New task assigned",
        message: editingTask
          ? `The task "${taskForm.title}" was updated by Admin.`
          : `You have been assigned a new task: "${taskForm.title}".`,
      });
    }

    closeTaskForm();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-5 sm:p-7 lg:p-8">
      <button
  type="button"
  onClick={() => window.history.back()}
  className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
>
  ← Back
</button>  

        {/* Header */}
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                <ClipboardIcon />
              </div>

              <span className="text-sm font-semibold text-blue-600">
                Workforce Management
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Task Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Assign tasks, track progress, review submissions,
              provide feedback and complete intern work.
            </p>
          </div>

          <button
            type="button"
            onClick={startAddTask}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            Add Task
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={<Clock3 size={20} />}
            label="Active"
            value={activeCount}
            description="Pending / in progress"
          />

          <SummaryCard
            icon={<Send size={20} />}
            label="Submitted"
            value={submittedCount}
            description="Awaiting review"
            highlight={submittedCount > 0}
          />

          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Completed"
            value={completedCount}
            description="Approved tasks"
          />

          <SummaryCard
            icon={<AlertCircle size={20} />}
            label="Overdue"
            value={overdueCount}
            description="Needs attention"
          />
        </div>

        {/* Submitted alert */}
        {submittedCount > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                <MessageSquare size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-blue-900">
                  {submittedCount} task
                  {submittedCount === 1 ? "" : "s"} waiting
                  for review
                </h3>

                <p className="mt-1 text-sm text-blue-700">
                  Review the intern submission and either approve
                  it or request changes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter("Submitted")}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Submissions
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_repeat(4,180px)]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tasks, projects or interns..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />

            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={PRIORITY_OPTIONS}
            />

            <FilterSelect
              value={projectFilter}
              onChange={setProjectFilter}
              options={[
                "All",
                ...projects.map((project) => project.name),
              ]}
            />

            <FilterSelect
              value={internFilter}
              onChange={setInternFilter}
              options={[
                "All",
                ...interns.map((intern) => intern.name),
              ]}
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Task
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Intern
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    onView={() => openTask(task)}
                    onEdit={() => startEditTask(task)}
                    onDelete={() => deleteTask(task)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredTasks.map((task) => (
              <TaskMobileCard
                key={task.id}
                task={task}
                onView={() => openTask(task)}
                onEdit={() => startEditTask(task)}
                onDelete={() => deleteTask(task)}
              />
            ))}
          </div>

          {!filteredTasks.length && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No tasks found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or search term.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {selectedTask && (
        <TaskReviewModal
          task={selectedTask}
          feedback={feedback}
          setFeedback={setFeedback}
          onClose={closeTask}
          onSaveFeedback={updateTaskFeedback}
          onApprove={approveTask}
          onRequestChanges={requestChanges}
          reviewMessage={reviewMessage}
          reviewError={reviewError}
          loading={reviewLoading}
        />
      )}

      {/* Add/Edit modal */}
      {showAddModal && (
        <TaskFormModal
          form={taskForm}
          editing={Boolean(editingTask)}
          projects={projects}
          interns={interns}
          onChange={handleFormChange}
          onClose={closeTaskForm}
          onSubmit={saveTaskForm}
        />
      )}
    </div>
  );
}

function ClipboardIcon() {
  return <FileText size={19} />;
}

function SummaryCard({
  icon,
  label,
  value,
  description,
  highlight,
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        highlight
          ? "border-blue-200 ring-1 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? "All" : option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function TaskTableRow({
  task,
  onView,
  onEdit,
  onDelete,
}) {
  const status = getDisplayStatus(task);
  const progress = Number(task.progress || 0);
  const ai = isAIgenerated(task);

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="max-w-[310px]">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {task.title}
            </p>

            {ai && (
              <Sparkles
                size={14}
                className="shrink-0 text-violet-600"
              />
            )}
          </div>

          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {task.description || "No description"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[190px] truncate text-sm text-slate-700">
          {task.project || "Not assigned"}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
            {(task.intern || "?")
              .charAt(0)
              .toUpperCase()}
          </div>

          <span className="text-sm text-slate-700">
            {task.intern || "Unassigned"}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            status
          )}`}
        >
          {status}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="w-28">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-400">
              Progress
            </span>

            <span className="font-semibold text-slate-700">
              {progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(100, progress)}%`,
              }}
            />
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarDays size={14} />
          {formatDate(task.dueDate)}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <ActionButton
            icon={<Eye size={16} />}
            label={
              status === "Submitted"
                ? "Review"
                : "View"
            }
            onClick={onView}
            primary={status === "Submitted"}
          />

          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            title="Edit task"
          >
            <FileText size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TaskMobileCard({
  task,
  onView,
  onEdit,
  onDelete,
}) {
  const status = getDisplayStatus(task);
  const progress = Number(task.progress || 0);

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                status
              )}`}
            >
              {status}
            </span>

            {isAIgenerated(task) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                <Sparkles size={11} />
                AI
              </span>
            )}
          </div>

          <h3 className="mt-2 font-bold text-slate-900">
            {task.title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {task.project || "No project"}
          </p>
        </div>

        <button
          type="button"
          onClick={onView}
          className="rounded-xl bg-blue-50 p-2.5 text-blue-700"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Intern</p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
            {task.intern || "Unassigned"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Due Date</p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(task.dueDate)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-slate-500">
            Progress
          </span>

          <span className="font-semibold">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{
              width: `${Math.min(100, progress)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {status === "Submitted"
            ? "Review Submission"
            : "View Task"}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 text-slate-600"
        >
          <FileText size={17} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-100 px-3 text-red-500"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  primary,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-slate-200 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TaskReviewModal({
  task,
  feedback,
  setFeedback,
  onClose,
  onSaveFeedback,
  onApprove,
  onRequestChanges,
  reviewMessage,
  reviewError,
  loading,
}) {
  const ai = isAIgenerated(task);

  const skills = Array.isArray(task.skills)
    ? task.skills
    : [];

  const criteria = Array.isArray(task.acceptanceCriteria)
    ? task.acceptanceCriteria
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                  task.status
                )}`}
              >
                {task.status}
              </span>

              {ai && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  <Sparkles size={12} />
                  AI Generated
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {task.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assigned to {task.intern || "Unassigned"}
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

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            {/* Submission banner */}
            {task.status === "Submitted" && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <Send
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="font-semibold text-blue-900">
                    Submission awaiting review
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    The intern has submitted this task. Review
                    the work below and either approve it or
                    request changes.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <section>
              <SectionTitle
                icon={<FileText size={17} />}
                title="Task Description"
              />

              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {task.description ||
                  "No task description available."}
              </p>
            </section>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReviewMeta
                label="Project"
                value={task.project || "Not assigned"}
              />

              <ReviewMeta
                label="Priority"
                value={task.priority || "Medium"}
              />

              <ReviewMeta
                label="Due Date"
                value={formatDate(task.dueDate)}
              />

              <ReviewMeta
                label="Progress"
                value={`${Number(task.progress || 0)}%`}
              />
            </div>

            {/* AI details */}
            {ai && (
              <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
                <SectionTitle
                  icon={<Sparkles size={17} />}
                  title="AI Task Information"
                />

                {task.estimatedDays && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-violet-800">
                    <Clock3 size={16} />

                    <span>
                      Estimated duration:{" "}
                      <strong>
                        {task.estimatedDays} day
                        {Number(task.estimatedDays) === 1
                          ? ""
                          : "s"}
                      </strong>
                    </span>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Required Skills
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {criteria.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Acceptance Criteria
                    </p>

                    <div className="space-y-2">
                      {criteria.map(
                        (criterion, index) => (
                          <div
                            key={`${criterion}-${index}`}
                            className="flex items-start gap-2 rounded-lg bg-white p-3 text-sm text-slate-600 shadow-sm"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-emerald-600"
                            />

                            <span>{criterion}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Submission */}
            <section>
              <SectionTitle
                icon={<Send size={17} />}
                title="Intern Submission"
              />

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                {task.submission ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {task.submission}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-400">
                    No submission details provided yet.
                  </p>
                )}
              </div>
            </section>

            {/* Feedback */}
            <section>
              <SectionTitle
                icon={<MessageSquare size={17} />}
                title="Admin Feedback"
              />

              <textarea
                value={feedback}
                onChange={(event) =>
                  setFeedback(event.target.value)
                }
                rows={5}
                placeholder="Write feedback for the intern..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={onSaveFeedback}
                className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Save Feedback
              </button>
            </section>

            {/* Messages */}
            {reviewError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{reviewError}</span>
              </div>
            )}

            {reviewMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{reviewMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {task.status === "Submitted" && (
              <>
                <button
                  type="button"
                  onClick={onRequestChanges}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Request Changes
                </button>

                <button
                  type="button"
                  onClick={onApprove}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />

                  {loading
                    ? "Processing..."
                    : "Approve & Complete"}
                </button>
              </>
            )}

            {task.status !== "Submitted" &&
              task.status !== "Completed" && (
                <button
                  type="button"
                  onClick={onSaveFeedback}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <MessageSquare size={16} />
                  Save Feedback
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-slate-500">{icon}</span>

      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>
    </div>
  );
}

function ReviewMeta({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function TaskFormModal({
  form,
  editing,
  projects,
  interns,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Task" : "Create Task"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure task assignment and tracking details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <FormField label="Task Title" required>
            <input
              value={form.title}
              onChange={(event) =>
                onChange("title", event.target.value)
              }
              required
              placeholder="Enter task title"
              className="form-input"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange("description", event.target.value)
              }
              rows={4}
              placeholder="Describe the task..."
              className="form-input resize-none"
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Project">
              <select
                value={form.project}
                onChange={(event) =>
                  onChange("project", event.target.value)
                }
                className="form-input"
              >
                <option value="">Select project</option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.name}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assign Intern">
              <select
                value={form.intern}
                onChange={(event) =>
                  onChange("intern", event.target.value)
                }
                className="form-input"
              >
                <option value="">Unassigned</option>

                {interns.map((intern) => (
                  <option
                    key={intern.id}
                    value={intern.name}
                  >
                    {intern.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  onChange("status", event.target.value)
                }
                className="form-input"
              >
                {STATUS_OPTIONS.filter(
                  (option) => option !== "All" && option !== "Overdue"
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority">
              <select
                value={form.priority}
                onChange={(event) =>
                  onChange("priority", event.target.value)
                }
                className="form-input"
              >
                {PRIORITY_OPTIONS.filter(
                  (option) => option !== "All"
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Due Date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  onChange("dueDate", event.target.value)
                }
                className="form-input"
              />
            </FormField>

            <FormField label="Progress">
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(event) =>
                  onChange(
                    "progress",
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Number(event.target.value)
                      )
                    )
                  )
                }
                className="form-input"
              />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}