import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Send,
  User,
  X,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getStore,
  subscribeToStore,
  updateStore,
  addNotification,
} from "../../data/store";

import {
  getCurrentUser,
  logout,
} from "../../auth/auth";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const CURRENT_CLIENT =
    currentUser?.name || "ABC Technologies";

  const [store, setStore] = useState(() => getStore());

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  const [requirementForm, setRequirementForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      const user = await getCurrentUser();

      if (!active) {
        return;
      }

      if (!user || user.role !== "client") {
        navigate("/login", { replace: true });
        return;
      }

      setCurrentUser(user);
      setCheckingUser(false);
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    return subscribeToStore(setStore);
  }, []);

  const clientProjects = useMemo(() => {
    return (store.projects || []).filter(
      (project) => project.client === CURRENT_CLIENT
    );
  }, [store.projects, CURRENT_CLIENT]);

  const clientTasks = useMemo(() => {
    return (store.tasks || []).filter(
      (task) => task.client === CURRENT_CLIENT
    );
  }, [store.tasks, CURRENT_CLIENT]);

  const clientRequirements = useMemo(() => {
    return (store.requirements || []).filter(
      (requirement) => requirement.client === CURRENT_CLIENT
    );
  }, [store.requirements, CURRENT_CLIENT]);

  const clientDeliverables = useMemo(() => {
    return (store.deliverables || []).filter(
      (deliverable) => deliverable.client === CURRENT_CLIENT
    );
  }, [store.deliverables, CURRENT_CLIENT]);

  const getProjectProgress = (project) => {
    const projectTasks = clientTasks.filter(
      (task) => task.project === project.name
    );

    if (projectTasks.length === 0) {
      return project.progress || 0;
    }

    const totalProgress = projectTasks.reduce(
      (sum, task) => sum + (Number(task.progress) || 0),
      0
    );

    return Math.round(totalProgress / projectTasks.length);
  };

  const totalProjects = clientProjects.length;

  const activeProjects = clientProjects.filter(
    (project) => project.status === "In Progress"
  ).length;

  const completedProjects = clientProjects.filter(
    (project) => project.status === "Completed"
  ).length;

  const pendingRequirements = clientRequirements.filter(
    (requirement) => requirement.status !== "Approved"
  ).length;

  const pendingDeliverables = clientDeliverables.filter(
    (deliverable) => deliverable.status === "Under Review"
  ).length;

  const approvedDeliverables = clientDeliverables.filter(
    (deliverable) => deliverable.status === "Approved"
  ).length;

  const overallProgress =
    clientProjects.length > 0
      ? Math.round(
          clientProjects.reduce(
            (sum, project) => sum + getProjectProgress(project),
            0
          ) / clientProjects.length
        )
      : 0;

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileOpen(false);

    setTimeout(() => {
      const element = document.getElementById(sectionId);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  const handleRequirementSubmit = (event) => {
    event.preventDefault();

    const title = requirementForm.title.trim();
    const description = requirementForm.description.trim();

    if (!title || !description) {
      return;
    }

    const projectName =
      clientProjects.length > 0
        ? clientProjects[0].name
        : "New Project";

    const createdDate = new Date().toISOString().split("T")[0];

    const newRequirement = {
      id: Date.now() + Math.random(),
      title,
      description,
      project: projectName,
      client: CURRENT_CLIENT,
      priority: requirementForm.priority,
      status: "Under Review",
      createdDate,
    };

    updateStore((current) => ({
      ...current,

      requirements: [
        ...(current.requirements || []),
        newRequirement,
      ],

      notifications: [
        {
          id: Date.now() + Math.random(),
          recipientRole: "admin",
          recipient: "Admin",
          type: "requirement",
          title: "New client requirement",
          message: `${CURRENT_CLIENT} submitted a new requirement: "${title}".`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...(current.notifications || []),
      ],
    }));

    setRequirementForm({
      title: "",
      description: "",
      priority: "Medium",
    });

    setShowRequirementModal(false);
  };

  const handleApproveDeliverable = (deliverableId) => {
    const targetDeliverable = clientDeliverables.find(
      (deliverable) => deliverable.id === deliverableId
    );

    if (!targetDeliverable) {
      return;
    }

    const internName = targetDeliverable.intern;

    updateStore((current) => ({
      ...current,

      deliverables: (current.deliverables || []).map(
        (deliverable) =>
          deliverable.id === deliverableId
            ? {
                ...deliverable,
                status: "Approved",
                feedback: "Approved by client.",
                reviewedDate: new Date()
                  .toISOString()
                  .split("T")[0],
              }
            : deliverable
      ),

      notifications: internName
        ? [
            {
              id: Date.now() + Math.random(),
              recipientRole: "intern",
              recipient: internName,
              type: "deliverable",
              title: "Deliverable approved",
              message: `${CURRENT_CLIENT} approved "${targetDeliverable.name}".`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...(current.notifications || []),
          ]
        : current.notifications || [],
    }));
  };

  const handleRequestChanges = (event) => {
    event.preventDefault();

    const feedbackText = feedback.trim();

    if (!selectedDeliverable || !feedbackText) {
      return;
    }

    const deliverableId = selectedDeliverable.id;
    const internName = selectedDeliverable.intern;
    const deliverableName = selectedDeliverable.name;

    updateStore((current) => ({
      ...current,

      deliverables: (current.deliverables || []).map(
        (deliverable) =>
          deliverable.id === deliverableId
            ? {
                ...deliverable,
                status: "Changes Requested",
                feedback: feedbackText,
                reviewedDate: new Date()
                  .toISOString()
                  .split("T")[0],
              }
            : deliverable
      ),

      notifications: internName
        ? [
            {
              id: Date.now() + Math.random(),
              recipientRole: "intern",
              recipient: internName,
              type: "deliverable",
              title: "Changes requested",
              message: `${CURRENT_CLIENT} requested changes to "${deliverableName}": ${feedbackText}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...(current.notifications || []),
          ]
        : current.notifications || [],
    }));

    setFeedback("");
    setSelectedDeliverable(null);
    setShowFeedbackModal(false);
  };

  const handleSendMessage = (event) => {
    event.preventDefault();

    const messageText = message.trim();

    if (!messageText) {
      return;
    }

    addNotification({
      recipientRole: "admin",
      recipient: "Admin",
      type: "message",
      title: `New message from ${CURRENT_CLIENT}`,
      message: messageText,
    });

    setMessage("");
    setShowMessageModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
      case "Completed":
        return "status-success";

      case "Under Review":
      case "In Progress":
        return "status-warning";

      case "Changes Requested":
        return "status-danger";

      case "Submitted":
        return "status-info";

      default:
        return "status-neutral";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "priority-high";

      case "Medium":
        return "priority-medium";

      case "Low":
        return "priority-low";

      default:
        return "priority-medium";
    }
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-dashboard">
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`client-sidebar ${
          mobileOpen ? "client-sidebar-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="brand-icon">S</div>

            <div>
              <h2>Shuroq</h2>
              <span>AI Workforce Platform</span>
            </div>
          </div>

          <button
            className="mobile-close-button"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="client-profile">
          <div className="profile-avatar">
            <User size={20} />
          </div>

          <div className="profile-info">
            <strong>{CURRENT_CLIENT}</strong>
            <span>Client</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => scrollToSection("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className={activeSection === "projects" ? "active" : ""}
            onClick={() => scrollToSection("projects")}
          >
            <FolderKanban size={19} />
            <span>Projects</span>
          </button>

          <button
            className={activeSection === "requirements" ? "active" : ""}
            onClick={() => scrollToSection("requirements")}
          >
            <ClipboardList size={19} />
            <span>Requirements</span>

            {pendingRequirements > 0 && (
              <span className="nav-badge">
                {pendingRequirements}
              </span>
            )}
          </button>

          <button
            className={activeSection === "deliverables" ? "active" : ""}
            onClick={() => scrollToSection("deliverables")}
          >
            <FileCheck2 size={19} />
            <span>Deliverables</span>

            {pendingDeliverables > 0 && (
              <span className="nav-badge">
                {pendingDeliverables}
              </span>
            )}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="client-main">
        <header className="client-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar-title">
            <h1>Client Dashboard</h1>
            <p>
              Monitor your projects, requirements and deliverables.
            </p>
          </div>

          <div className="topbar-actions">
            <button className="notification-button">
              <Bell size={21} />

              {pendingDeliverables + pendingRequirements > 0 && (
                <span className="notification-dot" />
              )}
            </button>

            <div className="topbar-user">
              <div className="topbar-avatar">
                <User size={18} />
              </div>

              <div>
                <strong>{CURRENT_CLIENT}</strong>
                <span>Client</span>
              </div>
            </div>
          </div>
        </header>

        <section id="dashboard" className="client-section dashboard-section">
          <div className="welcome-card">
            <div>
              <span className="welcome-label">
                Welcome back
              </span>

              <h2>{CURRENT_CLIENT}</h2>

              <p>
                Track your projects and collaborate with the
                Shuroq team from one place.
              </p>
            </div>

            <div className="welcome-progress">
              <div className="progress-circle">
                <span>{overallProgress}%</span>
              </div>

              <small>Overall Progress</small>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FolderKanban size={21} />
              </div>

              <div>
                <span>Total Projects</span>
                <strong>{totalProjects}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <span>Active Projects</span>
                <strong>{activeProjects}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ClipboardList size={21} />
              </div>

              <div>
                <span>Requirements</span>
                <strong>{pendingRequirements}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FileCheck2 size={21} />
              </div>

              <div>
                <span>Pending Reviews</span>
                <strong>{pendingDeliverables}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card project-overview-card">
              <div className="card-header">
                <div>
                  <h3>Project Overview</h3>
                  <p>Current status of your projects</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => scrollToSection("projects")}
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="project-overview-list">
                {clientProjects.length === 0 ? (
                  <div className="empty-state">
                    <FolderKanban size={30} />
                    <p>No projects available.</p>
                  </div>
                ) : (
                  clientProjects.slice(0, 4).map((project) => {
                    const progress = getProjectProgress(project);

                    return (
                      <div
                        className="project-overview-item"
                        key={project.id}
                      >
                        <div className="project-item-top">
                          <div>
                            <strong>{project.name}</strong>
                            <span>{project.status}</span>
                          </div>

                          <strong>{progress}%</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="project-item-bottom">
                          <span>
                            Deadline:{" "}
                            {project.deadline || "Not set"}
                          </span>

                          <span>
                            {clientTasks.filter(
                              (task) =>
                                task.project === project.name
                            ).length}{" "}
                            tasks
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="dashboard-card quick-actions-card">
              <div className="card-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Common client actions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  onClick={() =>
                    setShowRequirementModal(true)
                  }
                >
                  <div className="quick-action-icon">
                    <Plus size={20} />
                  </div>

                  <div>
                    <strong>Submit Requirement</strong>
                    <span>
                      Send a new project requirement
                    </span>
                  </div>

                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() =>
                    setShowMessageModal(true)
                  }
                >
                  <div className="quick-action-icon">
                    <MessageSquare size={20} />
                  </div>

                  <div>
                    <strong>Contact Admin</strong>
                    <span>
                      Send a message to the team
                    </span>
                  </div>

                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="client-section">
          <div className="section-heading">
            <div>
              <span className="section-label">PROJECTS</span>

              <h2>Your Projects</h2>

              <p>
                Monitor project progress and task activity.
              </p>
            </div>
          </div>

          <div className="projects-grid">
            {clientProjects.length === 0 ? (
              <div className="empty-card">
                <FolderKanban size={35} />
                <h3>No projects yet</h3>
                <p>
                  Projects assigned to your organization
                  will appear here.
                </p>
              </div>
            ) : (
              clientProjects.map((project) => {
                const progress = getProjectProgress(project);

                const projectTasks = clientTasks.filter(
                  (task) => task.project === project.name
                );

                const completedTasks = projectTasks.filter(
                  (task) =>
                    task.status === "Completed" ||
                    task.progress === 100
                ).length;

                return (
                  <div
                    className="project-card"
                    key={project.id}
                  >
                    <div className="project-card-header">
                      <div className="project-card-icon">
                        <FolderKanban size={21} />
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <h3>{project.name}</h3>

                    <div className="project-meta">
                      <span>
                        Priority:
                        <strong
                          className={getPriorityClass(
                            project.priority
                          )}
                        >
                          {project.priority || "Medium"}
                        </strong>
                      </span>

                      <span>
                        Deadline:
                        <strong>
                          {project.deadline || "Not set"}
                        </strong>
                      </span>
                    </div>

                    <div className="project-progress">
                      <div className="progress-label">
                        <span>Progress</span>
                        <strong>{progress}%</strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="project-footer">
                      <span>
                        {completedTasks}/{projectTasks.length}{" "}
                        tasks completed
                      </span>

                      <span>
                        Team: {project.teamSize || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="requirements" className="client-section">
          <div className="section-heading">
            <div>
              <span className="section-label">
                REQUIREMENTS
              </span>

              <h2>Project Requirements</h2>

              <p>
                Submit and track your requirements.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() =>
                setShowRequirementModal(true)
              }
            >
              <Plus size={18} />
              New Requirement
            </button>
          </div>

          <div className="dashboard-card">
            {clientRequirements.length === 0 ? (
              <div className="empty-state large">
                <ClipboardList size={40} />

                <h3>No requirements yet</h3>

                <p>
                  Submit your first requirement to get started.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setShowRequirementModal(true)
                  }
                >
                  <Plus size={18} />
                  Submit Requirement
                </button>
              </div>
            ) : (
              <div className="requirements-list">
                {clientRequirements.map((requirement) => (
                  <div
                    className="requirement-item"
                    key={requirement.id}
                  >
                    <div className="requirement-main">
                      <div className="requirement-icon">
                        <ClipboardList size={19} />
                      </div>

                      <div>
                        <h3>{requirement.title}</h3>

                        <p>
                          {requirement.description}
                        </p>

                        <div className="requirement-meta">
                          <span>
                            Project:{" "}
                            {requirement.project}
                          </span>

                          <span>
                            Submitted:{" "}
                            {requirement.createdDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="requirement-side">
                      <span
                        className={`priority-badge ${getPriorityClass(
                          requirement.priority
                        )}`}
                      >
                        {requirement.priority}
                      </span>

                      <span
                        className={`status-badge ${getStatusClass(
                          requirement.status
                        )}`}
                      >
                        {requirement.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="deliverables" className="client-section">
          <div className="section-heading">
            <div>
              <span className="section-label">
                DELIVERABLES
              </span>

              <h2>Project Deliverables</h2>

              <p>
                Review deliverables submitted by interns.
              </p>
            </div>
          </div>

          <div className="dashboard-card">
            {clientDeliverables.length === 0 ? (
              <div className="empty-state large">
                <FileCheck2 size={40} />

                <h3>No deliverables available</h3>

                <p>
                  Submitted deliverables will appear here.
                </p>
              </div>
            ) : (
              <div className="deliverables-list">
                {clientDeliverables.map((deliverable) => (
                  <div
                    className="deliverable-item"
                    key={deliverable.id}
                  >
                    <div className="deliverable-main">
                      <div className="deliverable-icon">
                        <FileCheck2 size={20} />
                      </div>

                      <div>
                        <h3>{deliverable.name}</h3>

                        <div className="deliverable-meta">
                          <span>
                            Project:{" "}
                            {deliverable.project}
                          </span>

                          <span>
                            Intern:{" "}
                            {deliverable.intern}
                          </span>

                          <span>
                            Submitted:{" "}
                            {deliverable.submittedDate}
                          </span>
                        </div>

                        {deliverable.feedback && (
                          <div className="deliverable-feedback">
                            <strong>Feedback:</strong>{" "}
                            {deliverable.feedback}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="deliverable-actions">
                      <span
                        className={`status-badge ${getStatusClass(
                          deliverable.status
                        )}`}
                      >
                        {deliverable.status}
                      </span>

                      {deliverable.status ===
                        "Under Review" && (
                        <div className="review-buttons">
                          <button
                            className="approve-button"
                            onClick={() =>
                              handleApproveDeliverable(
                                deliverable.id
                              )
                            }
                          >
                            <ThumbsUp size={16} />
                            Approve
                          </button>

                          <button
                            className="changes-button"
                            onClick={() => {
                              setSelectedDeliverable(
                                deliverable
                              );
                              setFeedback("");
                              setShowFeedbackModal(true);
                            }}
                          >
                            <RotateCcw size={16} />
                            Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="client-section communication-section">
          <div className="communication-card">
            <div className="communication-icon">
              <MessageSquare size={24} />
            </div>

            <div className="communication-content">
              <h3>Need help?</h3>

              <p>
                Contact the Shuroq administration team
                for questions, clarifications or project
                discussions.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setShowMessageModal(true)
              }
            >
              <Send size={17} />
              Send Message
            </button>
          </div>
        </section>

        <section className="client-section summary-section">
          <div className="summary-card">
            <div className="summary-item">
              <span>Projects</span>
              <strong>{totalProjects}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-item">
              <span>Completed</span>
              <strong>{completedProjects}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-item">
              <span>Approved Deliverables</span>
              <strong>{approvedDeliverables}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-item">
              <span>Pending Reviews</span>
              <strong>{pendingDeliverables}</strong>
            </div>
          </div>
        </section>
      </main>

      {showRequirementModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Submit Requirement</h2>
                <p>Tell the team what you need.</p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowRequirementModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequirementSubmit}>
              <div className="form-group">
                <label>Requirement Title</label>

                <input
                  type="text"
                  value={requirementForm.title}
                  onChange={(event) =>
                    setRequirementForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Enter requirement title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  value={requirementForm.description}
                  onChange={(event) =>
                    setRequirementForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Describe your requirement..."
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority</label>

                <select
                  value={requirementForm.priority}
                  onChange={(event) =>
                    setRequirementForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowRequirementModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  <Send size={17} />
                  Submit Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedDeliverable && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Request Changes</h2>

                <p>
                  {selectedDeliverable.name}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedDeliverable(null);
                  setFeedback("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestChanges}>
              <div className="form-group">
                <label>Feedback</label>

                <textarea
                  value={feedback}
                  onChange={(event) =>
                    setFeedback(event.target.value)
                  }
                  placeholder="Explain what needs to be changed..."
                  rows={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedDeliverable(null);
                    setFeedback("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="danger-button"
                >
                  <RotateCcw size={17} />
                  Request Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Contact Admin</h2>

                <p>
                  Send a message to the Shuroq team.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowMessageModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Message</label>

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="Write your message..."
                  rows={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowMessageModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  <Send size={17} />
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
