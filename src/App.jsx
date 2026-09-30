import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Interns from "./pages/admin/Interns";
import Clients from "./pages/admin/Clients";
import Projects from "./pages/admin/Projects";
import Tasks from "./pages/admin/Tasks";
import AIRequirementAnalyzer from "./pages/admin/AIRequirementAnalyzer";
import AITaskGenerator from "./pages/admin/AITaskGenerator";
import Notifications from "./pages/admin/Notifications";

import InternDashboard from "./pages/intern/InternDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/interns"
          element={
            <ProtectedRoute allowedRole="admin">
              <Interns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute allowedRole="admin">
              <Clients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRole="admin">
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute allowedRole="admin">
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/ai-requirement-analyzer"
          element={
            <ProtectedRoute allowedRole="admin">
              <AIRequirementAnalyzer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/ai-task-generator"
          element={
            <ProtectedRoute allowedRole="admin">
              <AITaskGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRole="admin">
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/intern"
          element={
            <ProtectedRoute allowedRole="intern">
              <InternDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;