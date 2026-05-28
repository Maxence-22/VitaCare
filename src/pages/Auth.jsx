import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { API_URL } from "../App.jsx";

export default function Auth({ onLogin, user }) {
  // si déjà connecté, on redirige vers l'accueil
  if (user) return <Navigate to="/" replace />;

  const [onglet, setOnglet] = useState("login"); // "login" ou "register"
  const navigate = useNavigate();

  // --- état formulaire login ---
  const [loginForm, setLoginForm] = useState({ email: "", mot_de_passe: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // --- état formulaire register ---
  const [registerForm, setRegisterForm] = useState({
    nom: "", prenom: "", email: "", mot_de_passe: "", telephone: ""
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // ---- handlers login ----
  function handleLoginChange(e) {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
        navigate("/");
      } else {
        setLoginError(data.message || "Identifiants incorrects.");
      }
    } catch (err) {
      setLoginError("Erreur de connexion au serveur.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ---- handlers register ----
  function handleRegisterChange(e) {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();

      if (data.success) {
        setRegisterSuccess("Compte créé ! Vous pouvez vous connecter.");
        setOnglet("login");
        setLoginForm({ email: registerForm.email, mot_de_passe: "" });
      } else {
        setRegisterError(data.message || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      setRegisterError("Erreur de connexion au serveur.");
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="auth-container">

      {/* onglets */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${onglet === "login" ? "active" : ""}`}
          onClick={() => setOnglet("login")}
        >
          Connexion
        </button>
        <button
          className={`auth-tab ${onglet === "register" ? "active" : ""}`}
          onClick={() => setOnglet("register")}
        >
          Créer un compte
        </button>
      </div>

      {/* --- formulaire connexion --- */}
      {onglet === "login" && (
        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <h2>Connexion</h2>

          {registerSuccess && <p className="success-msg">{registerSuccess}</p>}
          {loginError && <p className="error-msg">{loginError}</p>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              required
              placeholder="votre@email.fr"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="mot_de_passe"
              value={loginForm.mot_de_passe}
              onChange={handleLoginChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loginLoading}>
            {loginLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      )}

      {/* --- formulaire inscription --- */}
      {onglet === "register" && (
        <form className="auth-form" onSubmit={handleRegisterSubmit}>
          <h2>Créer un compte</h2>

          {registerError && <p className="error-msg">{registerError}</p>}

          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                value={registerForm.prenom}
                onChange={handleRegisterChange}
                required
                placeholder="Julie"
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                value={registerForm.nom}
                onChange={handleRegisterChange}
                required
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              required
              placeholder="votre@email.fr"
            />
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="tel"
              name="telephone"
              value={registerForm.telephone}
              onChange={handleRegisterChange}
              placeholder="06 00 00 00 00"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="mot_de_passe"
              value={registerForm.mot_de_passe}
              onChange={handleRegisterChange}
              required
              placeholder="Minimum 6 caractères"
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={registerLoading}>
            {registerLoading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>
      )}

    </div>
  );
}
