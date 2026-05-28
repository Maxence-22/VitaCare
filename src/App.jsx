import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Services from "./pages/Services.jsx";
import Activites from "./pages/Activites.jsx";
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export const API_URL = "http://localhost:8888/vitacare-api";

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin" && user.role !== "intervenant") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/auth/me.php`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoadingSession(false));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    fetch(`${API_URL}/auth/logout.php`, {
      method: "POST",
      credentials: "include"
    }).finally(() => setUser(null));
  }

  if (loadingSession) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/auth" element={<Auth onLogin={handleLogin} user={user} />} />
          <Route path="/services" element={<Services user={user} />} />
          <Route path="/activites" element={<Activites user={user} />} />
          <Route path="/profile" element={
            <ProtectedRoute user={user}>
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <AdminRoute user={user}>
              <Dashboard user={user} />
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>© 2026 VitaCare — Votre santé, notre priorité</p>
      </footer>
    </BrowserRouter>
  );
}
