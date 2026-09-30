import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../auth/auth";

function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "intern") {
      return <Navigate to="/intern" replace />;
    }

    if (user.role === "client") {
      return <Navigate to="/client" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;