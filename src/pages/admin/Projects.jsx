import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  Edit3,
  Eye,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import BackButton from "../../components/common/BackButton";
import {
  addNotification,
  getStore,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const emptyProject = {
  name: "",
  client: "",
  description: "",
  priority: "Medium",
  status: "Planning",
  startDate: "",
  deadline: "",
};

const statusOptions = [
  "All",
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
];

const priorityOptions = ["All", "High", "Medium", "Low"];

function calculateProjectProgress(project, tasks) {
  const projectTasks = tasks.filter(
    (task) =>
      task.projectId === project.id ||
      task.project === project.name
  );

  if (!projectTasks.length) {
    return Number(project.progress || 0);
  }

  const total = projectTasks.reduce(
    (sum, task) => sum + Number(task.progress || 0),
    0
  );

  return Math.round(total / projectTasks.length);
}

function getProjectStatus(progress, currentStatus) {
  if (currentStatus === "On Hold") {
    return "On Hold";
  }

  if (progress >= 100) {
    return "Completed";
  }

  if (progress > 0) {
    return "In Progress";
  }

  return "Planning";
}

function Projects() {
  const [store, setStore] = useState(() => getStore());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [modal, setModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    return subscribeToStore((updatedStore) => {
      setStore(updatedStore);
    });
  }, []);

  const projects = store.projects || [];
  const clients = store.clients || [];
  const tasks = store.tasks || [];

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) =>
          task.projectId === project.id ||
          task.project === project.name
      );

      const progress = calculateProjectProgress(
        project,
        tasks
      );

      const assignedInterns = [
        ...new Set(
          projectTasks
            .map(
              (task) =>
                task.assignedTo ||
                task.intern
            )
            .filter(Boolean)
        ),
      ];

      return {
        ...project,
        progress,
        status: getProjectStatus(
          progress,
          project.status
        ),
        taskCount: projectTasks.length,
        assignedInterns,
      };
    });
  }, [projects, tasks]);

  const filteredProjects = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    return enrichedProjects.filter((project) => {
      const matchesSearch =
        !searchValue ||
        project.name
          ?.toLowerCase()
          .includes(searchValue) ||
        project.client
          ?.toLowerCase()
          .includes(searchValue) ||
        project.description
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        project.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    enrichedProjects,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const totalProjects = enrichedProjects.length;

  const activeProjects =
    enrichedProjects.filter(
      (project) =>
        project.status === "In Progress"
    ).length;

  const completedProjects =
    enrichedProjects.filter(
      (project) =>
        project.status === "Completed"
    ).length;

  const averageProgress = totalProjects
    ? Math.round(
        enrichedProjects.reduce(
          (sum, project) =>
            sum + project.progress,
          0
        ) / totalProjects
      )
    : 0;

  const openAddModal = () => {
    setSelectedProject(null);
    setForm(emptyProject);
    setModal("add");
  };

  const openEditModal = (project) => {
    setSelectedProject(project);

    setForm({
      name: project.name || "",
      client: project.client || "",
      description: project.description || "",
      priority: project.priority || "Medium",
      status: project.status || "Planning",
      startDate: project.startDate || "",
      deadline: project.deadline || "",
    });

    setModal("edit");
  };

  const openViewModal = (project) => {
    setSelectedProject(project);
    setModal("view");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedProject(null);
    setForm(emptyProject);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const projectName = form.name.trim();
    const clientName = form.client.trim();

    if (!projectName || !clientName) {
      return;
    }

    const clientExists = clients.some(
      (client) =>
        client.name.toLowerCase() ===
        clientName.toLowerCase()
    );

    if (!clientExists) {
      window.alert(
        "Please select a client from the existing client list."
      );
      return;
    }

    if (modal === "add") {
      const newProject = {
        id: `project-${Date.now()}`,
        name: projectName,
        client: clientName,
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        startDate: form.startDate,
        deadline: form.deadline,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      updateStore((current) => ({
        ...current,
        projects: [
          ...(current.projects || []),
          newProject,
      ],
      }));

      addNotification({
        recipientRole: "admin",
        recipient: "Admin",
        type: "project",
        title: "Project created",
        message: `"${projectName}" has been created for ${clientName}.`,
      });
    }

    if (
      modal === "edit" &&
      selectedProject
    ) {
      updateStore((current) => ({
        ...current,
        projects: (current.projects || []).map(
          (project) =>
            project.id === selectedProject.id
              ? {
                  ...project,
                  name: projectName,
                  client: clientName,
                  description:
                    form.description.trim(),
                  priority: form.priority,
                  status: form.status,
                  startDate: form.startDate,
                  deadline: form.deadline,
                }
              : project
        ),
      }));

      addNotification({
        recipientRole: "admin",
        recipient: "Admin",
        type: "project",
        title: "Project updated",
        message: `"${projectName}" has been updated.`,
      });
    }

    closeModal();
  };

  const handleDelete = () => {
    if (!deleteId) {
      return;
    }

    const projectToDelete = projects.find(
      (project) =>
        project.id === deleteId
    );

    if (!projectToDelete) {
      setDeleteId(null);
      return;
    }

    updateStore((current) => ({
      ...current,

      projects: (current.projects || []).filter(
        (project) =>
          project.id !== deleteId
      ),

      tasks: (current.tasks || []).map(
        (task) => {
          if (
            task.projectId ===
              projectToDelete.id ||
            task.project ===
              projectToDelete.name
          ) {
            return {
              ...task,
              projectId: "",
              project: "",
            };
          }

          return task;
        }
      ),
    }));

    addNotification({
      recipientRole: "admin",
      recipient: "Admin",
      type: "project",
      title: "Project deleted",
      message: `"${projectToDelete.name}" has been deleted.`,
    });

    setDeleteId(null);
  };

  const getPriorityClasses = (
    priority
  ) => {
    if (priority === "High") {
      return "bg-red-50 text-red-700";
    }

    if (priority === "Low") {
      return "bg-slate-100 text-slate-600";
    }

    return "bg-amber-50 text-amber-700";
  };

  const getStatusClasses = (status) => {
    if (status === "Completed") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "In Progress") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "On Hold") {
      return "bg-orange-50 text-orange-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <BackButton />

        {/* HEADER */}

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Projects
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage projects and track live workforce
              progress.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Project
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={
              <FolderKanban size={20} />
            }
            label="Total Projects"
            value={totalProjects}
          />

          <SummaryCard
            icon={
              <ClipboardList size={20} />
            }
            label="Active Projects"
            value={activeProjects}
          />

          <SummaryCard
            icon={
              <ClipboardList size={20} />
            }
            label="Completed"
            value={completedProjects}
          />

          <SummaryCard
            icon={
              <FolderKanban size={20} />
            }
            label="Average Progress"
            value={`${averageProgress}%`}
          />
        </div>

        {/* FILTERS */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search projects or clients..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />

            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* PROJECT TABLE */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deadline
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(
                  (project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {project.name}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {project.description ||
                              "No description"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {project.client}
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">
                              {project.progress}%
                            </span>

                            <span className="text-slate-400">
                              {project.taskCount} tasks
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${project.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                            project.priority
                          )}`}
                        >
                          {project.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {project.deadline ||
                          "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            title="View"
                            onClick={() =>
                              openViewModal(
                                project
                              )
                            }
                          >
                            <Eye size={17} />
                          </ActionButton>

                          <ActionButton
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                project
                              )
                            }
                          >
                            <Edit3 size={17} />
                          </ActionButton>

                          <ActionButton
                            title="Delete"
                            danger
                            onClick={() =>
                              setDeleteId(
                                project.id
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredProjects.map(
              (project) => (
                <div
                  key={project.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {project.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {project.client}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">
                        Progress
                      </span>

                      <span className="font-semibold text-slate-700">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${project.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">
                        Priority
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {project.priority}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Deadline
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {project.deadline ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-1">
                    <ActionButton
                      title="View"
                      onClick={() =>
                        openViewModal(
                          project
                        )
                      }
                    >
                      <Eye size={17} />
                    </ActionButton>

                    <ActionButton
                      title="Edit"
                      onClick={() =>
                        openEditModal(
                          project
                        )
                      }
                    >
                      <Edit3 size={17} />
                    </ActionButton>

                    <ActionButton
                      title="Delete"
                      danger
                      onClick={() =>
                        setDeleteId(
                          project.id
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </ActionButton>
                  </div>
                </div>
              )
            )}
          </div>

          {!filteredProjects.length && (
            <div className="px-6 py-16 text-center">
              <FolderKanban
                size={40}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-700">
                No projects found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {(modal === "add" ||
        modal === "edit") && (
        <Modal
          title={
            modal === "add"
              ? "Add Project"
              : "Edit Project"
          }
          onClose={closeModal}
        >
          <form
            onSubmit={handleSave}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Project Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  className="form-input"
                  required
                />
              </FormField>

              <FormField label="Client">
                <select
                  name="client"
                  value={form.client}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">
                    Select client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={client.id}
                        value={client.name}
                      >
                        {client.name}
                      </option>
                    )
                  )}
                </select>
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the project..."
                rows="4"
                className="form-input resize-none"
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Priority">
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="form-input"
                >
                  {priorityOptions
                    .filter(
                      (option) =>
                        option !== "All"
                    )
                    .map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  {statusOptions
                    .filter(
                      (option) =>
                        option !== "All"
                    )
                    .map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Start Date">
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </FormField>

              <FormField label="Deadline">
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {modal === "add"
                  ? "Create Project"
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW MODAL */}

      {modal === "view" &&
        selectedProject && (
          <Modal
            title="Project Details"
            onClose={closeModal}
          >
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedProject.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedProject.client}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      selectedProject.status
                    )}`}
                  >
                    {selectedProject.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {selectedProject.description ||
                    "No project description available."}
                </p>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Project Progress
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {selectedProject.progress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${selectedProject.progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DetailItem
                  label="Priority"
                  value={
                    selectedProject.priority
                  }
                />

                <DetailItem
                  label="Tasks"
                  value={
                    selectedProject.taskCount
                  }
                />

                <DetailItem
                  label="Start"
                  value={
                    selectedProject.startDate ||
                    "—"
                  }
                />

                <DetailItem
                  label="Deadline"
                  value={
                    selectedProject.deadline ||
                    "—"
                  }
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Users
                    size={18}
                    className="text-slate-500"
                  />

                  <p className="text-sm font-semibold text-slate-800">
                    Assigned Interns
                  </p>
                </div>

                {selectedProject
                  .assignedInterns?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProject.assignedInterns.map(
                      (intern) => (
                        <span
                          key={intern}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
                        >
                          {intern}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No interns assigned yet.
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  onClick={closeModal}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

      {/* DELETE MODAL */}

      {deleteId && (
        <Modal
          title="Delete Project"
          onClose={() =>
            setDeleteId(null)
          }
        >
          <div>
            <p className="text-sm leading-6 text-slate-600">
              Are you sure you want to delete
              this project? Tasks linked to this
              project will become unassigned.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteId(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:min-w-[160px]"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
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

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <div>
      <label className="form-label">
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Projects;