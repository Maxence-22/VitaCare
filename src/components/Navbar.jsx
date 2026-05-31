import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // au chargement, on restaure la préférence sauvegardée
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    if (saved) document.body.classList.add("dark");
  }, []);

  function toggleDarkMode() {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("darkMode", newVal);
    document.body.classList.toggle("dark", newVal);
  }

  function handleLogout() {
    onLogout();
    navigate("/");
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">💚 VitaCare</Link>

      <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <li><Link to="/services" onClick={() => setMenuOpen(false)}>Services</Link></li>
        <li><Link to="/activites" onClick={() => setMenuOpen(false)}>Activités</Link></li>

        {user ? (
          <>
            <li>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                👤 {user.prenom}
              </Link>
            </li>
            {(user.role === "admin" || user.role === "intervenant") && (
              <li>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              </li>
            )}
            <li>
              <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/auth" className="btn-nav-login" onClick={() => setMenuOpen(false)}>Connexion</Link>
          </li>
        )}

        {/* toggle mode sombre */}
        <li>
          <button className="btn-darkmode" onClick={toggleDarkMode} title="Mode sombre">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </li>
      </ul>

      <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
    </nav>
  );
}
