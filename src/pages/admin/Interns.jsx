import {
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BackButton from "../../components/common/BackButton";
import {
  addNotification,
  getStore,
  subscribeToStore,
  updateStore,
} from "../../data/store";

const emptyForm = {
  name: "",
  email: "",
  role: "",
  skills: "",
  status: "Active",
};

function Interns() {
  const [store, setStore] = useState(() => getStore());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    return subscribeToStore((nextStore) => {
      setStore(nextStore);
    });
  }, []);

  const interns = store.interns || [];
  const tasks = store.tasks || [];
  const projects = store.projects || [];

  const enrichedInterns = useMemo(() => {
    return interns.map((intern) => {
      const internName = intern.name || "";
      const internId = intern.id;

      const internTasks = tasks.filter((task) => {
        return (
          task.intern === internName ||
          task.assignedTo === internName ||
          task.internId === internId ||
          task.assignedToId === internId
        );
      });

      const completedTasks = internTasks.filter(
        (task) =>
          task.status === "Completed" ||
          Number(task.progress || 0) >= 100
      ).length;

      const submittedTasks = internTasks.filter(
        (task) => task.status === "Submitted"
      ).length;

      const totalTasks = internTasks.length;

      const taskCompletion =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

      const storedPerformance =
        typeof intern.performance === "number"
          ? intern.performance
          : null;

      const performance =
        storedPerformance !== null
          ? storedPerformance
          : taskCompletion;

      const assignedProjectNames = [
        ...new Set(
          internTasks
            .map((task) => {
              if (task.project) {
                return task.project;
              }

              if (task.projectId) {
                const project = projects.find(
                  (item) => item.id === task.projectId
                );

                return project?.name || "";
              }

              return "";
            })
            .filter(Boolean)
        ),
      ];

      const assignedProjects = assignedProjectNames
        .map((projectName) =>
          projects.find((project) => project.name === projectName)
        )
        .filter(Boolean);

      return {
        ...intern,
        skills: Array.isArray(intern.skills) ? intern.skills : [],
        tasks: totalTasks,
        completed: completedTasks,
        submitted: submittedTasks,
        performance,
        assignedProjectNames,
        assignedProjects,
      };
    });
  }, [interns, tasks, projects]);

  const roles = useMemo(() => {
    return [
      "All",
      ...new Set(
        enrichedInterns
          .map((intern) => intern.role)
          .filter(Boolean)
      ),
    ];
  }, [enrichedInterns]);

  const filteredInterns = useMemo(() => {
    return enrichedInterns.filter((intern) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        (intern.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        (intern.email || "")
          .toLowerCase()
          .includes(searchValue) ||
        intern.skills.some((skill) =>
          skill.toLowerCase().includes(searchValue)
        );

      const matchesStatus =
        statusFilter === "All" ||
        intern.status === statusFilter;

      const matchesRole =
        roleFilter === "All" ||
        intern.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [
    enrichedInterns,
    search,
    statusFilter,
    roleFilter,
  ]);

  const activeCount = enrichedInterns.filter(
    (intern) => intern.status === "Active"
  ).length;

  const onLeaveCount = enrichedInterns.filter(
    (intern) => intern.status === "On Leave"
  ).length;

  const totalTasks = enrichedInterns.reduce(
    (sum, intern) => sum + intern.tasks,
    0
  );

  const completedTasks = enrichedInterns.reduce(
    (sum, intern) => sum + intern.completed,
    0
  );

  const openAddModal = () => {
    setEditingIntern(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (intern) => {
    setEditingIntern(intern);

    setForm({
      name: intern.name || "",
      email: intern.email || "",
      role: intern.role || "",
      skills: (intern.skills || []).join(", "),
      status: intern.status || "Active",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIntern(null);
    setForm({ ...emptyForm });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.role.trim()
    ) {
      return;
    }

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (editingIntern) {
      const oldName = editingIntern.name;
      const newName = form.name.trim();

      updateStore((current) => ({
        ...current,

        interns: (current.interns || []).map((intern) =>
          intern.id === editingIntern.id
            ? {
                ...intern,
                name: newName,
                email: form.email.trim(),
                role: form.role.trim(),
                skills,
                status: form.status,
              }
            : intern
        ),

        tasks: (current.tasks || []).map((task) => ({
          ...task,

          intern:
            task.intern === oldName
              ? newName
              : task.intern,

          assignedTo:
            task.assignedTo === oldName
              ? newName
              : task.assignedTo,
        })),
      }));

      addNotification({
        recipientRole: "admin",
        recipient: "Admin",
        type: "system",
        title: "Intern updated",
        message: `${newName}'s workforce profile has been updated.`,
      });
    } else {
      const newIntern = {
        id: Date.now(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        skills,
        status: form.status,
        performance: 0,
        joined: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
      };

      updateStore((current) => ({
        ...current,
        interns: [
          newIntern,
          ...(current.interns || []),
        ],
      }));

      addNotification({
        recipientRole: "admin",
        recipient: "Admin",
        type: "system",
        title: "Intern added",
        message: `${newIntern.name} has been added to the workforce.`,
      });
    }

    closeModal();
  };

  const deleteIntern = (intern) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${intern.name}?`
    );

    if (!confirmed) {
      return;
    }

    updateStore((current) => ({
      ...current,

      interns: (current.interns || []).filter(
        (item) => item.id !== intern.id
      ),

      tasks: (current.tasks || []).map((task) => {
        const matchesIntern =
          task.intern === intern.name ||
          task.assignedTo === intern.name ||
          task.internId === intern.id ||
          task.assignedToId === intern.id;

        if (!matchesIntern) {
          return task;
        }

        return {
          ...task,
          intern: "",
          assignedTo: "",
          internId: null,
          assignedToId: null,
        };
      }),
    }));

    addNotification({
      recipientRole: "admin",
      recipient: "Admin",
      type: "system",
      title: "Intern removed",
      message: `${intern.name} has been removed from the workforce.`,
    });

    if (selectedIntern?.id === intern.id) {
      setSelectedIntern(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <BackButton />

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Workforce
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Intern Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage interns, skills, workload and performance.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Intern
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Interns"
          value={enrichedInterns.length}
          description="All registered interns"
        />

        <SummaryCard
          label="Active"
          value={activeCount}
          description="Currently working"
        />

        <SummaryCard
          label="On Leave"
          value={onLeaveCount}
          description="Currently unavailable"
        />

        <SummaryCard
          label="Task Completion"
          value={
            totalTasks
              ? `${Math.round(
                  (completedTasks / totalTasks) * 100
                )}%`
              : "0%"
          }
          description={`${completedTasks} of ${totalTasks} tasks`}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
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
                placeholder="Search by name, email or skill..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 outline-none focus:border-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 outline-none focus:border-blue-500"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === "All" ? "All Roles" : role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Intern
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Skills
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tasks
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Performance
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInterns.map((intern) => (
                <InternRow
                  key={intern.id}
                  intern={intern}
                  onView={() => setSelectedIntern(intern)}
                  onEdit={() => openEditModal(intern)}
                  onDelete={() => deleteIntern(intern)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {filteredInterns.map((intern) => (
            <InternMobileCard
              key={intern.id}
              intern={intern}
              onView={() => setSelectedIntern(intern)}
              onEdit={() => openEditModal(intern)}
              onDelete={() => deleteIntern(intern)}
            />
          ))}
        </div>

        {filteredInterns.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserRound size={22} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              No interns found
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {selectedIntern && (
        <InternDetails
          intern={selectedIntern}
          onClose={() => setSelectedIntern(null)}
          onEdit={() => {
            openEditModal(selectedIntern);
            setSelectedIntern(null);
          }}
        />
      )}

      {showModal && (
        <InternModal
          form={form}
          editingIntern={editingIntern}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function InternRow({
  intern,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >
          <Avatar name={intern.name} />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {intern.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {intern.email}
            </p>
          </div>
        </button>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">
          {intern.role || "—"}
        </span>
      </td>

      <td className="max-w-[220px] px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {intern.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}

          {intern.skills.length > 3 && (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
              +{intern.skills.length - 3}
            </span>
          )}

          {!intern.skills.length && (
            <span className="text-xs text-slate-400">
              No skills
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-800">
          {intern.completed}/{intern.tasks}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-400">
          completed
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(
                  Math.max(Number(intern.performance) || 0, 0),
                  100
                )}%`,
              }}
            />
          </div>

          <span className="text-xs font-semibold text-slate-700">
            {intern.performance}%
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={intern.status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="View"
          >
            <MoreHorizontal size={17} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function InternMobileCard({
  intern,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >
          <Avatar name={intern.name} />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {intern.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {intern.role}
            </p>
          </div>
        </button>

        <StatusBadge status={intern.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {intern.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
          >
            {skill}
          </span>
        ))}

        {!intern.skills.length && (
          <span className="text-xs text-slate-400">
            No skills added
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] text-slate-400">
            Tasks
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {intern.completed}/{intern.tasks}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] text-slate-400">
            Performance
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {intern.performance}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          View
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-slate-200 px-3 text-slate-500 hover:bg-slate-50"
        >
          <Edit3 size={15} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-slate-200 px-3 text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function Avatar({ name = "" }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700",
    "On Leave": "bg-amber-50 text-amber-700",
    Inactive: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function InternDetails({
  intern,
  onClose,
  onEdit,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <Avatar name={intern.name} />

            <div>
              <h2 className="font-bold text-slate-900">
                {intern.name}
              </h2>

              <p className="text-xs text-slate-500">
                {intern.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contact
            </p>

            <p className="mt-2 text-sm text-slate-700">
              {intern.email || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Skills
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {intern.skills.length ? (
                intern.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">
                  No skills added.
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailStat
              label="Tasks"
              value={`${intern.completed}/${intern.tasks}`}
            />

            <DetailStat
              label="Performance"
              value={`${intern.performance}%`}
            />

            <DetailStat
              label="Status"
              value={intern.status}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Projects
            </p>

            {intern.assignedProjectNames?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {intern.assignedProjectNames.map((project) => (
                  <span
                    key={project}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {project}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No projects assigned yet.
              </p>
            )}
          </div>

          {intern.submitted > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-800">
                Submitted Work
              </p>

              <p className="mt-1 text-sm text-blue-700">
                {intern.submitted} task
                {intern.submitted !== 1 ? "s" : ""} awaiting
                review.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Joined
            </p>

            <p className="mt-2 text-sm text-slate-700">
              {intern.joined || "Not available"}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-800">
              AI Workforce Insight
            </p>

            <p className="mt-2 text-xs leading-5 text-blue-700">
              This intern currently has a{" "}
              {intern.performance}% performance score.
              AI recommendations can use skills, workload,
              previous tasks and performance to suggest suitable
              tasks.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Edit3 size={16} />
            Edit Intern
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function InternModal({
  form,
  editingIntern,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              {editingIntern
                ? "Edit Intern"
                : "Add Intern"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {editingIntern
                ? "Update intern information."
                : "Add a new intern to the workforce."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 p-5"
        >
          <FormField
            label="Full Name"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Enter intern name"
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="intern@example.com"
            required
          />

          <FormField
            label="Role"
            name="role"
            value={form.role}
            onChange={onChange}
            placeholder="e.g. AI/ML Intern"
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Skills
            </label>

            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={onChange}
              placeholder="Python, React, NLP"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1.5 text-[11px] text-slate-400">
              Separate multiple skills with commas.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingIntern
                ? "Save Changes"
                : "Add Intern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

export default Interns;