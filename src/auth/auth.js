function addProfileToStore(user) {
  try {
    const stored = localStorage.getItem("shuroq_workforce_data");

    if (!stored) {
      return;
    }

    const data = JSON.parse(stored);

    if (user.role === "intern") {
      const alreadyExists = (data.interns || []).some(
        (intern) =>
          intern.email?.toLowerCase() === user.email.toLowerCase()
      );

      if (!alreadyExists) {
        data.interns = [
          ...(data.interns || []),
          {
            id: Date.now(),
            name: user.name,
            email: user.email,
            role: "Intern",
            status: "Active",
            skills: [],
          },
        ];
      }
    }

    if (user.role === "client") {
      const alreadyExists = (data.clients || []).some(
        (client) =>
          client.email?.toLowerCase() === user.email.toLowerCase()
      );

      if (!alreadyExists) {
        data.clients = [
          ...(data.clients || []),
          {
            id: Date.now(),
            name: user.name,
            email: user.email,
            industry: "Not specified",
            status: "Active",
          },
        ];
      }
    }

    localStorage.setItem(
      "shuroq_workforce_data",
      JSON.stringify(data)
    );

    window.dispatchEvent(
      new Event("shuroq-store-updated")
    );
  } catch (error) {
    console.error("Workforce profile synchronization failed:", error);
  }
}

async function parseResponse(response) {
  try {
    return await response.json();
  } catch {
    return {
      success: false,
      message: "Unexpected server response.",
    };
  }
}

export async function login(email, password) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail) {
    return {
      success: false,
      message: "Please enter your email.",
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Please enter your password.",
    };
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: trimmedEmail,
        password,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || "Unable to sign in.",
      };
    }

    if (data.user) {
      addProfileToStore(data.user);
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
    };
  } catch (error) {
    console.error("Login request failed:", error);

    return {
      success: false,
      message: "Unable to connect to the server. Please try again.",
    };
  }
}

export async function register({
  name,
  email,
  password,
  role,
}) {
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName) {
    return {
      success: false,
      message: "Please enter your name.",
    };
  }

  if (!trimmedEmail) {
    return {
      success: false,
      message: "Please enter your email.",
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
    };
  }

  if (role !== "intern" && role !== "client") {
    return {
      success: false,
      message: "Please select Intern or Client.",
    };
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || "Unable to create account.",
      };
    }

    if (data.user) {
      addProfileToStore(data.user);
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
    };
  } catch (error) {
    console.error("Registration request failed:", error);

    return {
      success: false,
      message: "Unable to connect to the server. Please try again.",
    };
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await parseResponse(response);

    if (!data.success || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Session check failed:", error);
    return null;
  }
}

export async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await parseResponse(response);

    return {
      success: response.ok && data.success,
      message: data.message || "Logged out successfully.",
    };
  } catch (error) {
    console.error("Logout request failed:", error);

    return {
      success: false,
      message: "Unable to contact the server.",
    };
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return Boolean(user);
}