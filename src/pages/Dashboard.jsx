import { useState, useEffect } from "react";
import { API_URL } from "../App.jsx";

const ONGLETS_ADMIN = ["stats", "reservations", "activites", "services", "utilisateurs"];
const ONGLETS_INTERVENANT = ["reservations", "services"];

export default function Dashboard({ user }) {
  const ongletsDispo = user.role === "admin" ? ONGLETS_ADMIN : ONGLETS_INTERVENANT;
  const [onglet, setOnglet] = useState(ongletsDispo[0]);

  // --- stats (admin) ---
  const [stats, setStats] = useState(null);

  // --- réservations à gérer ---
  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);

  // --- activités à gérer ---
  const [activites, setActivites] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);

  // --- services ---
  const [services, setServices] = useState([]);
  const [loadingSrv, setLoadingSrv] = useState(false);
  const [newService, setNewService] = useState({
    titre: "", description: "", categorie: "bien_etre",
    duree_minutes: 60, prix: 0
  });
  const [serviceMsg, setServiceMsg] = useState("");

  // --- utilisateurs (admin) ---
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (onglet === "stats") fetchStats();
    if (onglet === "reservations") fetchReservations();
    if (onglet === "activites") fetchActivites();
    if (onglet === "services") fetchServices();
    if (onglet === "utilisateurs") fetchUtilisateurs();
  }, [onglet]);

  async function fetchStats() {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error(err); }
  }

  async function fetchReservations() {
    setLoadingRes(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/reservations.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setReservations(data.reservations);
    } catch (err) { console.error(err); }
    finally { setLoadingRes(false); }
  }

  async function fetchActivites() {
    setLoadingAct(true);
    try {
      const res = await fetch(`${API_URL}/activites/list.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setActivites(data.activites);
    } catch (err) { console.error(err); }
    finally { setLoadingAct(false); }
  }

  async function fetchServices() {
    setLoadingSrv(true);
    try {
      const res = await fetch(`${API_URL}/services/list.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setServices(data.services);
    } catch (err) { console.error(err); }
    finally { setLoadingSrv(false); }
  }

  async function fetchUtilisateurs() {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/utilisateurs.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setUtilisateurs(data.utilisateurs);
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  }

  async function handleStatutReservation(reservationId, statut) {
    try {
      const res = await fetch(`${API_URL}/dashboard/statut_reservation.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId, statut })
      });
      const data = await res.json();
      if (data.success) fetchReservations();
    } catch (err) { console.error(err); }
  }

  async function handleSupprimerService(serviceId) {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      const res = await fetch(`${API_URL}/services/delete.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId })
      });
      const data = await res.json();
      if (data.success) fetchServices();
    } catch (err) { console.error(err); }
  }

  async function handleAjouterService(e) {
    e.preventDefault();
    setServiceMsg("");
    try {
      const res = await fetch(`${API_URL}/services/create.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService)
      });
      const data = await res.json();
      if (data.success) {
        setServiceMsg("✅ Service ajouté avec succès.");
        setNewService({ titre: "", description: "", categorie: "bien_etre", duree_minutes: 60, prix: 0 });
        fetchServices();
      } else {
        setServiceMsg("❌ " + (data.message || "Erreur."));
      }
    } catch (err) { setServiceMsg("❌ Erreur serveur."); }
  }

  async function handleChangerRole(userId, role) {
    try {
      const res = await fetch(`${API_URL}/dashboard/changer_role.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role })
      });
      const data = await res.json();
      if (data.success) fetchUtilisateurs();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="page-container">
      <h1>Dashboard — {user.role === "admin" ? "Administration" : "Intervenant"}</h1>

      {/* onglets */}
      <div className="profile-tabs">
        {ongletsDispo.map(o => (
          <button
            key={o}
            className={`profile-tab ${onglet === o ? "active" : ""}`}
            onClick={() => setOnglet(o)}
          >
            {o === "stats" && "Vue d'ensemble"}
            {o === "reservations" && "Réservations"}
            {o === "activites" && "Activités"}
            {o === "services" && "Services"}
            {o === "utilisateurs" && "Utilisateurs"}
          </button>
        ))}
      </div>

      {/* --- stats --- */}
      {onglet === "stats" && (
        <div className="profile-section">
          <h2>Vue d'ensemble</h2>
          {!stats ? <p>Chargement...</p> : (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{stats.total_reservations}</span>
                <span>Réservations totales</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.reservations_en_attente}</span>
                <span>En attente</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.total_clients}</span>
                <span>Clients</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.total_activites}</span>
                <span>Activités</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- réservations --- */}
      {onglet === "reservations" && (
        <div className="profile-section">
          <h2>Gestion des réservations</h2>
          {loadingRes ? <p>Chargement...</p> : (
            reservations.length === 0 ? <p>Aucune réservation.</p> : (
              <div className="reservations-list">
                {reservations.map(r => (
                  <div key={r.id} className={`reservation-card ${r.statut}`}>
                    <div className="reservation-info">
                      <h4>{r.service_titre}</h4>
                      <p>👤 Client : {r.client_prenom} {r.client_nom}</p>
                      <p>📅 {new Date(r.date_heure_debut).toLocaleDateString("fr-FR")}</p>
                      <span className={`statut-badge ${r.statut}`}>{r.statut}</span>
                    </div>
                    {r.statut === "en_attente" && (
                      <div className="action-buttons">
                        <button
                          className="btn-primary"
                          onClick={() => handleStatutReservation(r.id, "confirmee")}
                        >
                          Confirmer
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleStatutReservation(r.id, "refusee")}
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* --- services --- */}
      {onglet === "services" && (
        <div className="profile-section">
          <h2>Mes services</h2>
          {serviceMsg && <p className="info-msg">{serviceMsg}</p>}

          {/* formulaire ajout */}
          <form onSubmit={handleAjouterService} className="auth-form">
            <h3>Ajouter un service</h3>
            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                value={newService.titre}
                onChange={e => setNewService({ ...newService, titre: e.target.value })}
                required placeholder="Ex : Massage relaxant"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newService.description}
                onChange={e => setNewService({ ...newService, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={newService.categorie}
                  onChange={e => setNewService({ ...newService, categorie: e.target.value })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="therapie">Thérapie</option>
                  <option value="bien_etre">Bien-être</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="sport">Sport</option>
                  <option value="meditation">Méditation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Durée (min)</label>
                <input
                  type="number"
                  value={newService.duree_minutes}
                  onChange={e => setNewService({ ...newService, duree_minutes: parseInt(e.target.value) })}
                  min={15}
                />
              </div>
              <div className="form-group">
                <label>Prix (€)</label>
                <input
                  type="number"
                  value={newService.prix}
                  onChange={e => setNewService({ ...newService, prix: parseFloat(e.target.value) })}
                  min={0} step={0.01}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Ajouter le service</button>
          </form>

          {/* liste services */}
          {loadingSrv ? <p>Chargement...</p> : (
            <div className="cards-grid" style={{ marginTop: "2rem" }}>
              {services.map(s => (
                <div key={s.id} className="card">
                  <span className="badge">{s.categorie}</span>
                  <h3>{s.titre}</h3>
                  <p className="card-desc">{s.description}</p>
                  <div className="card-meta">
                    <span>⏱ {s.duree_minutes} min</span>
                    <span>💶 {s.prix} €</span>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => handleSupprimerService(s.id)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- utilisateurs (admin) --- */}
      {onglet === "utilisateurs" && (
        <div className="profile-section">
          <h2>Gestion des utilisateurs</h2>
          {loadingUsers ? <p>Chargement...</p> : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map(u => (
                  <tr key={u.id}>
                    <td>{u.prenom} {u.nom}</td>
                    <td>{u.email}</td>
                    <td><span className={`statut-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      {u.id !== user.id && (
                        <select
                          value={u.role}
                          onChange={e => handleChangerRole(u.id, e.target.value)}
                        >
                          <option value="client">client</option>
                          <option value="intervenant">intervenant</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- activités (admin) --- */}
      {onglet === "activites" && (
        <div className="profile-section">
          <h2>Activités en cours</h2>
          {loadingAct ? <p>Chargement...</p> : (
            <div className="cards-grid">
              {activites.map(a => (
                <div key={a.id} className="card">
                  <span className="badge">{a.categorie}</span>
                  <h3>{a.titre}</h3>
                  <p>📅 {new Date(a.date_heure_debut).toLocaleDateString("fr-FR")}</p>
                  <p>👥 {a.nb_inscrits} / {a.places_max}</p>
                  <span className={`statut-badge ${a.statut}`}>{a.statut}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
