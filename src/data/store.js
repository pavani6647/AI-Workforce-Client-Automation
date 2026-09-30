const STORAGE_KEY = "shuroq_workforce_data";

const defaultData = {
  interns: [
    {
      id: 1,
      name: "Pavani",
      email: "pavani@shuroq.com",
      role: "AI/ML Intern",
      status: "Active",
      skills: ["Python", "AI", "ML", "React"],
    },
    {
      id: 2,
      name: "Taashif",
      email: "taashif@shuroq.com",
      role: "Full Stack Intern",
      status: "Active",
      skills: ["React", "Node.js", "MongoDB"],
    },
    {
      id: 3,
      name: "Rahul",
      email: "rahul@shuroq.com",
      role: "Frontend Intern",
      status: "Active",
      skills: ["React", "JavaScript", "Tailwind"],
    },
    {
      id: 4,
      name: "Ananya",
      email: "ananya@shuroq.com",
      role: "AI Intern",
      status: "Active",
      skills: ["Python", "Machine Learning", "Data Science"],
    },
    {
      id: 5,
      name: "Karthik",
      email: "karthik@shuroq.com",
      role: "Backend Intern",
      status: "Active",
      skills: ["Python", "FastAPI", "PostgreSQL"],
    },
  ],

  clients: [
    {
      id: 1,
      name: "ABC Technologies",
      email: "contact@abctech.com",
      industry: "Technology",
      status: "Active",
    },
    {
      id: 2,
      name: "MediCare Solutions",
      email: "contact@medicare.com",
      industry: "Healthcare",
      status: "Active",
    },
    {
      id: 3,
      name: "FinEdge",
      email: "contact@finedge.com",
      industry: "Finance",
      status: "Active",
    },
  ],

  projects: [
    {
      id: 1,
      name: "AI Workforce Platform",
      client: "ABC Technologies",
      status: "In Progress",
      priority: "High",
      progress: 72,
      startDate: "2026-09-01",
      deadline: "2026-09-30",
      teamSize: 4,
    },
    {
      id: 2,
      name: "Client Automation Portal",
      client: "ABC Technologies",
      status: "In Progress",
      priority: "Medium",
      progress: 48,
      startDate: "2026-09-05",
      deadline: "2026-10-15",
      teamSize: 3,
    },
    {
      id: 3,
      name: "HR Automation",
      client: "MediCare Solutions",
      status: "In Progress",
      priority: "High",
      progress: 55,
      startDate: "2026-09-03",
      deadline: "2026-10-05",
      teamSize: 3,
    },
  ],

  tasks: [
    {
      id: 1,
      title: "Build Login Authentication",
      description:
        "Implement secure login and role-based authentication.",
      project: "AI Workforce Platform",
      client: "ABC Technologies",
      intern: "Pavani",
      status: "In Progress",
      priority: "High",
      dueDate: "2026-09-18",
      progress: 65,
      createdDate: "2026-09-08",
      submission: "",
      feedback: "",
    },
    {
      id: 2,
      title: "Create Dashboard UI",
      description:
        "Design and implement the main workforce dashboard.",
      project: "AI Workforce Platform",
      client: "ABC Technologies",
      intern: "Rahul",
      status: "Completed",
      priority: "High",
      dueDate: "2026-09-12",
      progress: 100,
      createdDate: "2026-09-04",
      submission: "",
      feedback: "",
    },
    {
      id: 3,
      title: "Client Requirement Analysis",
      description:
        "Analyze client requirements and convert them into structured requirements.",
      project: "Client Automation Portal",
      client: "ABC Technologies",
      intern: "Ananya",
      status: "Submitted",
      priority: "Medium",
      dueDate: "2026-09-16",
      progress: 90,
      createdDate: "2026-09-07",
      submission: "Requirement analysis completed.",
      feedback: "",
    },
    {
      id: 4,
      title: "Build Employee Management Module",
      description:
        "Create employee listing, search, filtering and management functionality.",
      project: "HR Automation",
      client: "MediCare Solutions",
      intern: "Karthik",
      status: "In Progress",
      priority: "High",
      dueDate: "2026-09-20",
      progress: 55,
      createdDate: "2026-09-06",
      submission: "",
      feedback: "",
    },
  ],

  requirements: [
    {
      id: 1,
      title: "Role-based Client Dashboard",
      description:
        "Client needs separate dashboard access.",
      project: "AI Workforce Platform",
      client: "ABC Technologies",
      priority: "High",
      status: "Approved",
      createdDate: "2026-09-05",
    },
    {
      id: 2,
      title: "Automated Project Reports",
      description:
        "Generate automated weekly project reports.",
      project: "Client Automation Portal",
      client: "ABC Technologies",
      priority: "Medium",
      status: "Under Review",
      createdDate: "2026-09-09",
    },
  ],

  deliverables: [
    {
      id: 1,
      name: "Dashboard UI",
      project: "AI Workforce Platform",
      client: "ABC Technologies",
      intern: "Rahul",
      status: "Approved",
      submittedDate: "2026-09-12",
      feedback: "",
    },
    {
      id: 2,
      name: "Requirement Analysis",
      project: "Client Automation Portal",
      client: "ABC Technologies",
      intern: "Ananya",
      status: "Under Review",
      submittedDate: "2026-09-10",
      feedback: "",
    },
  ],

  /*
   * ==========================================================
   * MESSAGES
   * ==========================================================
   *
   * senderRole:
   *   "client" or "admin"
   *
   * sender:
   *   Name of the sender
   *
   * recipientRole:
   *   "client" or "admin"
   *
   * recipient:
   *   Name of the recipient
   *
   * status:
   *   "sent" or "read"
   */

  messages: [],

  notifications: [
    {
      id: 1,
      recipientRole: "admin",
      recipient: "Admin",
      type: "system",
      title: "Welcome to Shuroq",
      message:
        "Your AI Workforce workspace is ready.",
      read: false,
      createdAt: new Date().toISOString(),
    },

    {
      id: 2,
      recipientRole: "intern",
      recipient: "Pavani",
      type: "task",
      title: "Task assigned",
      message:
        'You have an active task: "Build Login Authentication".',
      read: false,
      createdAt: new Date().toISOString(),
    },

    {
      id: 3,
      recipientRole: "client",
      recipient: "ABC Technologies",
      type: "deliverable",
      title: "Deliverable awaiting review",
      message:
        '"Requirement Analysis" has been submitted for your review.',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getStore() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultData)
      );

      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(stored);

    return {
      ...structuredClone(defaultData),
      ...parsed,

      notifications:
        parsed.notifications ??
        structuredClone(defaultData.notifications),

      messages:
        parsed.messages ??
        structuredClone(defaultData.messages),
    };
  } catch {
    return structuredClone(defaultData);
  }
}

export function saveStore(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

  window.dispatchEvent(
    new Event("shuroq-store-updated")
  );
}

export function updateStore(updater) {
  const current = getStore();
  const updated = updater(current);

  saveStore(updated);

  return updated;
}

export function subscribeToStore(callback) {
  const handler = () => callback(getStore());

  window.addEventListener(
    "shuroq-store-updated",
    handler
  );

  return () => {
    window.removeEventListener(
      "shuroq-store-updated",
      handler
    );
  };
}

export function addNotification({
  recipientRole,
  recipient,
  type,
  title,
  message,
}) {
  return updateStore((current) => ({
    ...current,

    notifications: [
      {
        id: Date.now() + Math.random(),
        recipientRole,
        recipient,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      },

      ...(current.notifications || []),
    ],
  }));
}

export function markNotificationAsRead(
  notificationId
) {
  return updateStore((current) => ({
    ...current,

    notifications: (
      current.notifications || []
    ).map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification
    ),
  }));
}

export function markAllNotificationsAsRead(
  recipientRole,
  recipient
) {
  return updateStore((current) => ({
    ...current,

    notifications: (
      current.notifications || []
    ).map((notification) =>
      notification.recipientRole === recipientRole &&
      notification.recipient === recipient
        ? {
            ...notification,
            read: true,
          }
        : notification
    ),
  }));
}

export function resetStore() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(defaultData)
  );

  window.dispatchEvent(
    new Event("shuroq-store-updated")
  );
}