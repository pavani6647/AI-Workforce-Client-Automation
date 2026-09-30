import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "./auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = login(email, password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }
   const requestedPath = location.state?.from;

   if (requestedPath) {
  navigate(requestedPath, { replace: true });
   } else if (result.user.role === "admin") {
    navigate("/admin", { replace: true });
  } else if (result.user.role === "intern") {
    navigate("/intern", { replace: true });
  } else if (result.user.role === "client") {
   navigate("/client", { replace: true });
  } else {
    setError("Invalid user role.");
    setLoading(false);
   }
    
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <BriefcaseBusiness size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold">Shuroq</h1>
                <p className="text-xs text-slate-400">
                  AI Workforce Platform
                </p>
              </div>
            </div>

            <div className="mt-24">
              <p className="text-sm font-medium text-blue-400">
                AI-Powered Workforce Management
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Manage interns,
                <br />
                clients & projects
                <br />
                in one place.
              </h2>

              <p className="mt-6 max-w-md text-sm leading-6 text-slate-400">
                Automate task management, client onboarding, project tracking
                and workforce insights with AI.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Shuroq AI Workforce & Client Automation Platform
          </p>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <div className="lg:hidden mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BriefcaseBusiness size={20} />
              </div>

              <div>
                <h1 className="font-bold">Shuroq</h1>
                <p className="text-xs text-slate-500">
                  AI Workforce Platform
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to access your workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">
                Development mode
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Use your assigned Shuroq account credentials to sign in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;