const AUTH_KEY = "shuroq_auth";

const USERS = [
  {
    id: 1,
    name: "Admin",
    email: "admin@shuroq.com",
    password: "admin123",
    role: "admin",
  },
  {
    id: 2,
    name: "Pavani",
    email: "pavani@shuroq.com",
    password: "intern123",
    role: "intern",
  },
  {
    id: 3,
    name: "ABC Technologies",
    email: "contact@abctech.com",
    password: "client123",
    role: "client",
  },
];

export function login(email, password) {
  const user = USERS.find(
    (user) =>
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(session));

  return {
    success: true,
    user: session,
  };
}

export function getCurrentUser() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}