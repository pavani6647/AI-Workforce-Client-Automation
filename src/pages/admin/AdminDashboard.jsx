import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  WandSparkles,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStore,
  subscribeToStore,
} from "../../data/store";

function AdminDashboard() {
  const navigate = useNavigate();

  const [store, setStore] = useState(getStore());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    return subscribeToStore(() => {
      setStore(getStore());
    });
  }, []);

  const unreadNotifications = useMemo(() => {
    return (store.notifications || []).filter(
      (notification) =>
        notification.recipientRole === "admin" &&
        notification.recipient === "Admin" &&
        !notification.read
    ).length;
  }, [store.notifications]);

  const metrics = useMemo(() => {
    const interns = store.interns || [];
    const clients = store.clients || [];
    const projects = store.projects || [];
    const tasks = store.tasks || [];

    const activeInterns = interns.filter(
      (intern) => intern.status === "Active"
    ).length;

    const activeProjects = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    const completedTasks = tasks.filter(
      (task) => task.status === "Completed" ||
        task.status === "Approved" ||
        Number(task.progress || 0) >= 100
    ).length;

    const pendingTasks = tasks.filter(
      (task) =>
        task.status === "Pending" ||
        task.status === "In Progress" ||
        task.status === "Submitted"
    ).length;

    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.status === "Completed") {
        return false;
      }

      return new Date(task.dueDate) < new Date();
    }).length;

    const completedProjects = projects.filter(
      (project) => project.status === "Completed"
    ).length;

    const pendingReviews = tasks.filter(
      (task) => task.status === "Submitted"
    ).length;

    return {
      totalInterns: interns.length,
      activeInterns,
      totalClients: clients.length,
      activeProjects,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completedProjects,
      pendingReviews,
    };
  }, [store]);

  const projectOverview = useMemo(() => {
    const projects = store.projects || [];
    const tasks = store.tasks || [];

    return projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) =>
          task.project === project.name ||
          task.projectId === project.id
      );

      const progress = projectTasks.length
        ? Math.round(
            projectTasks.reduce(
              (sum, task) => sum + Number(task.progress || 0),
              0
            ) / projectTasks.length
          )
        : Number(project.progress || 0);

      return {
        ...project,
        progress,
      };
    });
  }, [store]);

  const recentTasks = useMemo(() => {
    return [...(store.tasks || [])]
      .sort((a, b) => {
        return (
          new Date(b.createdDate || 0) -
          new Date(a.createdDate || 0)
        );
      })
      .slice(0, 5);
  }, [store]);

  const handleLogout = () => {
    navigate("/login");
  };

  const openNotifications = () => {
    setMobileMenuOpen(false);
    navigate("/admin/notifications");
  };

  const openInternWorkspace = () => {
    setMobileMenuOpen(false);
    navigate("/intern");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BriefcaseBusiness size={20} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Shuroq
              </h1>

              <p className="text-xs text-slate-500">
                AI Workforce Platform
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <NavItem
              to="/admin"
              icon={<Activity size={18} />}
              label="Dashboard"
              active
            />

            <NavItem
              to="/admin/interns"
              icon={<Users size={18} />}
              label="Interns"
            />

            {/* Intern Workspace */}
            <NavItem
              to="/intern"
              icon={<BriefcaseBusiness size={18} />}
              label="Intern Workspace"
            />

            <NavItem
              to="/admin/clients"
              icon={<Users size={18} />}
              label="Clients"
            />

            <NavItem
              to="/admin/projects"
              icon={<FolderKanban size={18} />}
              label="Projects"
            />

            <NavItem
              to="/admin/tasks"
              icon={<ClipboardList size={18} />}
              label="Tasks"
            />

            {/* AI Tools */}
            <div className="pt-5">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI Tools
              </p>

              <Link
                to="/admin/ai-task-generator"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <WandSparkles size={18} />
                Task Generator
              </Link>

              <Link
                to="/admin/ai-requirement-analyzer"
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Brain size={18} />
                Requirement Analyzer
              </Link>

              <button
                type="button"
                disabled
                className="mt-1 flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400"
              >
                <ClipboardList size={18} />
                Proposal Generator
              </button>
            </div>

            {/* System */}
            <div className="pt-5">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                System
              </p>

              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl px-3 py-2.5 text-left text-sm text-slate-400"
              >
                Analytics
              </button>

              <button
                type="button"
                onClick={openNotifications}
                className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Bell size={18} />

                <span>Notifications</span>

                {unreadNotifications > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl px-3 py-2.5 text-left text-sm text-slate-400"
              >
                Settings
              </button>
            </div>
          </nav>

          {/* Profile */}
          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                PA
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  Pavani
                </p>

                <p className="truncate text-xs text-slate-500">
                  Administrator
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">
                Workspace
              </p>

              <p className="font-semibold text-slate-900">
                Admin Dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                type="button"
                onClick={openNotifications}
                title="Notifications"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Bell size={20} />

                {unreadNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </span>
                )}
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                PA
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Heading */}
            <div className="mb-8">
              <p className="text-sm font-medium text-blue-600">
                Good morning, Pavani
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Workforce Overview
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Monitor interns, projects, tasks and client
                activity from one place.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard
                icon={<Users size={20} />}
                label="Total Interns"
                value={metrics.totalInterns}
                subtitle={`${metrics.activeInterns} active`}
              />

              <MetricCard
                icon={<FolderKanban size={20} />}
                label="Active Projects"
                value={metrics.activeProjects}
                subtitle={`${metrics.completedProjects} completed`}
              />

              <MetricCard
                icon={<ClipboardList size={20} />}
                label="Pending Tasks"
                value={metrics.pendingTasks}
                subtitle={`${metrics.overdueTasks} overdue`}
              />

              <MetricCard
                icon={<Users size={20} />}
                label="Total Clients"
                value={metrics.totalClients}
                subtitle={`${metrics.pendingReviews} pending reviews`}
              />
            </div>

            {/* Project Overview + AI Insights */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {/* Project Overview */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Project Overview
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Live progress calculated from project tasks.
                    </p>
                  </div>

                  <Link
                    to="/admin/projects"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View all
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="mt-5 space-y-5">
                  {projectOverview.map((project) => (
                    <div key={project.id}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {project.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {project.client}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-slate-700">
                          {project.progress}%
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, project.progress)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {!projectOverview.length && (
                    <EmptyState text="No projects available." />
                  )}
                </div>
              </section>

              {/* AI Insights */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      AI Insights
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Current workforce signals
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Activity size={18} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Insight
                    title={`${metrics.activeInterns} active interns`}
                    text="Current active workforce capacity."
                  />

                  <Insight
                    title={`${metrics.overdueTasks} overdue tasks`}
                    text={
                      metrics.overdueTasks
                        ? "Review delayed tasks and reassign if necessary."
                        : "No overdue tasks detected."
                    }
                  />

                  <Insight
                    title={`${metrics.pendingReviews} submissions`}
                    text="Tasks are waiting for admin review."
                  />

                  <Insight
                    title={`${metrics.activeProjects} active projects`}
                    text="Projects currently receiving workforce activity."
                  />
                </div>
              </section>
            </div>

            {/* Recent Tasks + Workforce Summary */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {/* Recent Tasks */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Recent Tasks
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest workforce activity
                    </p>
                  </div>

                  <Link
                    to="/admin/tasks"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600"
                  >
                    Manage
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {task.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {task.intern || "Unassigned"} ·{" "}
                          {task.project || "No project"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <StatusBadge status={task.status} />

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {task.progress || 0}%
                        </p>
                      </div>
                    </div>
                  ))}

                  {!recentTasks.length && (
                    <EmptyState text="No tasks available." />
                  )}
                </div>
              </section>

              {/* Workforce Summary */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Workforce Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current platform activity
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <SummaryBox
                    label="Active Interns"
                    value={metrics.activeInterns}
                  />

                  <SummaryBox
                    label="Completed Tasks"
                    value={metrics.completedTasks}
                  />

                  <SummaryBox
                    label="Completed Projects"
                    value={metrics.completedProjects}
                  />

                  <SummaryBox
                    label="Pending Reviews"
                    value={metrics.pendingReviews}
                  />
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Shared workflow is active
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Task changes made by interns are reflected
                        in project progress and dashboard metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white shadow-2xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <BriefcaseBusiness size={20} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Shuroq
                  </p>

                  <p className="text-xs text-slate-500">
                    Admin
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-1 p-4">
              <MobileNav
                to="/admin"
                label="Dashboard"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNav
                to="/admin/interns"
                label="Interns"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Mobile Intern Workspace */}
              <MobileNav
                to="/intern"
                label="Intern Workspace"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNav
                to="/admin/clients"
                label="Clients"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNav
                to="/admin/projects"
                label="Projects"
                onClick={() => setMobileMenuOpen(false)}
              />

              <MobileNav
                to="/admin/tasks"
                label="Tasks"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Mobile AI Tools */}
              <div className="pt-5">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Tools
                </p>

                <Link
                  to="/admin/ai-task-generator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <WandSparkles size={18} />
                  Task Generator
                </Link>

                <Link
                  to="/admin/ai-requirement-analyzer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Brain size={18} />
                  Requirement Analyzer
                </Link>

                <button
                  type="button"
                  disabled
                  className="mt-1 flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400"
                >
                  <ClipboardList size={18} />
                  Proposal Generator
                </button>
              </div>

              {/* Mobile System */}
              <div className="pt-5">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  System
                </p>

                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl px-3 py-3 text-left text-sm text-slate-400"
                >
                  Analytics
                </button>

                <button
                  type="button"
                  onClick={openNotifications}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Bell size={18} />

                  <span>Notifications</span>

                  {unreadNotifications > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadNotifications > 9
                        ? "9+"
                        : unreadNotifications}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl px-3 py-3 text-left text-sm text-slate-400"
                >
                  Settings
                </button>
              </div>

              {/* Mobile Logout */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon, label, active = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNav({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}

function MetricCard({ icon, label, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {label}
      </p>

      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-slate-900">
          {value}
        </p>

        <span className="text-xs text-slate-400">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Insight({ title, text }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Completed: "bg-emerald-50 text-emerald-700",
    "In Progress": "bg-blue-50 text-blue-700",
    Submitted: "bg-purple-50 text-purple-700",
    Pending: "bg-amber-50 text-amber-700",
    Overdue: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-medium ${
        classes[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

export default AdminDashboard;