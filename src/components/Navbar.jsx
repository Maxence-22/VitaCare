import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/");
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">

      {/* logo */}
      <Link to="/" className="navbar-brand">
        💚 VitaCare
      </Link>

      {/* liens navigation */}
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
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              <button className="btn-logout" onClick={handleLogout}>
                Déconnexion
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/auth" className="btn-nav-login" onClick={() => setMenuOpen(false)}>
              Connexion
            </Link>
          </li>
        )}
      </ul>

      {/* bouton hamburger mobile */}
      <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

    </nav>
  );
}
