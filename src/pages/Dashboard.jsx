import { useState, useEffect } from "react";
import { API_URL } from "../App.jsx";

const ONGLETS_ADMIN = ["stats", "reservations", "activites", "services", "disponibilites", "utilisateurs"];
const ONGLETS_INTERVENANT = ["reservations", "activites", "services", "disponibilites"];

export default function Dashboard({ user }) {
  const ongletsDispo = user.role === "admin" ? ONGLETS_ADMIN : ONGLETS_INTERVENANT;
  const [onglet, setOnglet] = useState(ongletsDispo[0]);

  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [activites, setActivites] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingSrv, setLoadingSrv] = useState(false);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [newService, setNewService] = useState({ titre: "", description: "", categorie: "bien_etre", duree_minutes: 60, prix: 0 });
  const [serviceMsg, setServiceMsg] = useState("");

  const [newActivite, setNewActivite] = useState({
    titre: "", description: "", categorie: "atelier",
    date_heure_debut: "", date_heure_fin: "",
    lieu: "", places_max: 10, prix: 0, date_limite_inscription: ""
  });
  const [activiteMsg, setActiviteMsg] = useState("");

  const [newDispo, setNewDispo] = useState({ service_id: "", date_heure_debut: "", date_heure_fin: "", places_max: 1 });
  const [dispoMsg, setDispoMsg] = useState("");

  const [activiteParticipants, setActiviteParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingPart, setLoadingPart] = useState(false);

  useEffect(() => {
    if (onglet === "stats") fetchStats();
    if (onglet === "reservations") fetchReservations();
    if (onglet === "activites") fetchActivites();
    if (onglet === "services" || onglet === "disponibilites") fetchServices();
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

  async function handleVoirParticipants(activite) {
    setActiviteParticipants(activite);
    setParticipants([]);
    setLoadingPart(true);
    try {
      const res = await fetch(`${API_URL}/activites/participants.php?activite_id=${activite.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setParticipants(data.participants);
    } catch (err) { console.error(err); }
    finally { setLoadingPart(false); }
  }

  async function handleStatutReservation(reservationId, statut) {
    try {
      const res = await fetch(`${API_URL}/dashboard/statut_reservation.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId, statut })
      });
      const data = await res.json();
      if (data.success) fetchReservations();
    } catch (err) { console.error(err); }
  }

  async function handleAjouterService(e) {
    e.preventDefault(); setServiceMsg("");
    try {
      const res = await fetch(`${API_URL}/services/create.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService)
      });
      const data = await res.json();
      if (data.success) {
        setServiceMsg("✅ Service ajouté.");
        setNewService({ titre: "", description: "", categorie: "bien_etre", duree_minutes: 60, prix: 0 });
        fetchServices();
      } else { setServiceMsg("❌ " + (data.message || "Erreur.")); }
    } catch (err) { setServiceMsg("❌ Erreur serveur."); }
  }

  async function handleSupprimerService(serviceId) {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      const res = await fetch(`${API_URL}/services/delete.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId })
      });
      const data = await res.json();
      if (data.success) fetchServices();
    } catch (err) { console.error(err); }
  }

  async function handleAjouterActivite(e) {
    e.preventDefault(); setActiviteMsg("");
    try {
      const res = await fetch(`${API_URL}/activites/create.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivite)
      });
      const data = await res.json();
      if (data.success) {
        setActiviteMsg("✅ Activité créée avec succès.");
        setNewActivite({ titre: "", description: "", categorie: "atelier", date_heure_debut: "", date_heure_fin: "", lieu: "", places_max: 10, prix: 0, date_limite_inscription: "" });
        fetchActivites();
      } else { setActiviteMsg("❌ " + (data.message || "Erreur.")); }
    } catch (err) { setActiviteMsg("❌ Erreur serveur."); }
  }

  async function handleAjouterDispo(e) {
    e.preventDefault(); setDispoMsg("");
    try {
      const res = await fetch(`${API_URL}/services/ajouter_disponibilite.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDispo)
      });
      const data = await res.json();
      if (data.success) {
        setDispoMsg("✅ Créneau ajouté avec succès.");
        setNewDispo({ service_id: "", date_heure_debut: "", date_heure_fin: "", places_max: 1 });
      } else { setDispoMsg("❌ " + (data.message || "Erreur.")); }
    } catch (err) { setDispoMsg("❌ Erreur serveur."); }
  }

  async function handleChangerRole(userId, role) {
    try {
      const res = await fetch(`${API_URL}/dashboard/changer_role.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role })
      });
      const data = await res.json();
      if (data.success) fetchUtilisateurs();
    } catch (err) { console.error(err); }
  }

  function BarreProgression({ inscrits, max }) {
    const pct = Math.min(100, Math.round((inscrits / max) * 100));
    const couleur = pct >= 100 ? "var(--danger)" : pct >= 75 ? "var(--warning)" : "var(--vert)";
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
          <span>👥 {inscrits} / {max} participants</span>
          <span style={{ color: couleur, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ background: "#e0e0e0", borderRadius: "10px", height: "8px" }}>
          <div style={{ width: `${pct}%`, background: couleur, borderRadius: "10px", height: "8px", transition: "width 0.3s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Dashboard — {user.role === "admin" ? "Administration" : "Intervenant"}</h1>

      {activiteParticipants && (
        <div className="modal-overlay" onClick={() => setActiviteParticipants(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Participants — {activiteParticipants.titre}</h3>
              <button className="modal-close" onClick={() => setActiviteParticipants(null)}>✕</button>
            </div>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              📅 {new Date(activiteParticipants.date_heure_debut).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <BarreProgression inscrits={parseInt(activiteParticipants.nb_inscrits)} max={activiteParticipants.places_max} />
            <div className="participants-list" style={{ marginTop: "1.5rem" }}>
              {loadingPart ? <p>Chargement...</p> :
                participants.length === 0 ? <p>Aucun participant inscrit.</p> :
                participants.map(p => (
                  <div key={p.id} className="participant-card">
                    <div className="participant-info">
                      <strong>{p.prenom} {p.nom}</strong>
                      <p>{p.email}</p>
                      {p.telephone && <p>📞 {p.telephone}</p>}
                    </div>
                    <span className={`statut-badge ${p.statut}`}>{p.statut}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <div className="profile-tabs">
        {ongletsDispo.map(o => (
          <button key={o} className={`profile-tab ${onglet === o ? "active" : ""}`} onClick={() => setOnglet(o)}>
            {o === "stats" && "Vue d'ensemble"}
            {o === "reservations" && "Réservations"}
            {o === "activites" && "Activités"}
            {o === "services" && "Services"}
            {o === "disponibilites" && "Créneaux"}
            {o === "utilisateurs" && "Utilisateurs"}
          </button>
        ))}
      </div>

      {onglet === "stats" && (
        <div className="profile-section">
          <h2>Vue d'ensemble</h2>
          {!stats ? <p>Chargement...</p> : (
            <div className="stats-grid">
              {[
                { n: stats.total_reservations, l: "Réservations totales" },
                { n: stats.reservations_en_attente, l: "En attente" },
                { n: stats.total_clients, l: "Clients" },
                { n: stats.total_activites, l: "Activités" },
                { n: stats.total_services, l: "Services" },
                { n: stats.inscriptions_total, l: "Inscriptions" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <span className="stat-number">{s.n}</span>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === "reservations" && (
        <div className="profile-section">
          <h2>Gestion des réservations</h2>
          {loadingRes ? <p>Chargement...</p> :
            reservations.length === 0 ? <p>Aucune réservation.</p> : (
              <div className="reservations-list">
                {reservations.map(r => (
                  <div key={r.id} className={`reservation-card ${r.statut}`}>
                    <div className="reservation-info">
                      <h4>{r.service_titre}</h4>
                      <p>👤 {r.client_prenom} {r.client_nom}</p>
                      <p>📅 {new Date(r.date_heure_debut).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                      <p>🕐 {new Date(r.date_heure_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      <span className={`statut-badge ${r.statut}`}>{r.statut}</span>
                    </div>
                    {r.statut === "en_attente" && (
                      <div className="action-buttons">
                        <button className="btn-primary" onClick={() => handleStatutReservation(r.id, "confirmee")}>Confirmer</button>
                        <button className="btn-danger" onClick={() => handleStatutReservation(r.id, "refusee")}>Refuser</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {onglet === "activites" && (
        <div className="profile-section">
          {activiteMsg && <p className="info-msg" style={{ marginBottom: "1rem" }}>{activiteMsg}</p>}
          <form onSubmit={handleAjouterActivite} className="auth-form" style={{ marginBottom: "2rem" }}>
            <h3>Créer une activité</h3>
            <div className="form-group">
              <label>Titre</label>
              <input type="text" required placeholder="Ex : Atelier yoga débutant"
                value={newActivite.titre} onChange={e => setNewActivite({ ...newActivite, titre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={newActivite.description}
                onChange={e => setNewActivite({ ...newActivite, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Catégorie</label>
                <select value={newActivite.categorie} onChange={e => setNewActivite({ ...newActivite, categorie: e.target.value })}>
                  <option value="nutrition">Nutrition</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="sport">Sport</option>
                  <option value="prevention">Prévention</option>
                  <option value="meditation">Méditation</option>
                  <option value="atelier">Atelier</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lieu</label>
                <input type="text" placeholder="Ex : Salle Yoga"
                  value={newActivite.lieu} onChange={e => setNewActivite({ ...newActivite, lieu: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date et heure de début</label>
                <input type="datetime-local" required
                  value={newActivite.date_heure_debut} onChange={e => setNewActivite({ ...newActivite, date_heure_debut: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date et heure de fin</label>
                <input type="datetime-local" required
                  value={newActivite.date_heure_fin} onChange={e => setNewActivite({ ...newActivite, date_heure_fin: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de places</label>
                <input type="number" min={1} value={newActivite.places_max}
                  onChange={e => setNewActivite({ ...newActivite, places_max: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Prix (€)</label>
                <input type="number" min={0} step={0.01} value={newActivite.prix}
                  onChange={e => setNewActivite({ ...newActivite, prix: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Date limite inscription</label>
                <input type="datetime-local"
                  value={newActivite.date_limite_inscription} onChange={e => setNewActivite({ ...newActivite, date_limite_inscription: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Créer l'activité</button>
          </form>

          <h3 style={{ marginBottom: "1rem" }}>Activités existantes</h3>
          {loadingAct ? <p>Chargement...</p> :
            activites.length === 0 ? <p>Aucune activité.</p> : (
              <div className="cards-grid">
                {activites.map(a => (
                  <div key={a.id} className="card">
                    <span className="badge">{a.categorie}</span>
                    <h3>{a.titre}</h3>
                    <p>📅 {new Date(a.date_heure_debut).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                    <p>🕐 {new Date(a.date_heure_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p>📍 {a.lieu}</p>
                    <BarreProgression inscrits={parseInt(a.nb_inscrits)} max={a.places_max} />
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
                      <span className={`statut-badge ${a.statut}`}>{a.statut}</span>
                      <button className="btn-secondary" style={{ fontSize: "0.85rem", padding: "0.3rem 0.7rem" }}
                        onClick={() => handleVoirParticipants(a)}>👥 Participants</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {onglet === "services" && (
        <div className="profile-section">
          {serviceMsg && <p className="info-msg" style={{ marginBottom: "1rem" }}>{serviceMsg}</p>}
          <form onSubmit={handleAjouterService} className="auth-form" style={{ marginBottom: "2rem" }}>
            <h3>Ajouter un service</h3>
            <div className="form-group">
              <label>Titre</label>
              <input type="text" required placeholder="Ex : Massage relaxant"
                value={newService.titre} onChange={e => setNewService({ ...newService, titre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={newService.description}
                onChange={e => setNewService({ ...newService, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Catégorie</label>
                <select value={newService.categorie} onChange={e => setNewService({ ...newService, categorie: e.target.value })}>
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
                <input type="number" min={15} value={newService.duree_minutes}
                  onChange={e => setNewService({ ...newService, duree_minutes: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Prix (€)</label>
                <input type="number" min={0} step={0.01} value={newService.prix}
                  onChange={e => setNewService({ ...newService, prix: parseFloat(e.target.value) })} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Ajouter le service</button>
          </form>
          <h3 style={{ marginBottom: "1rem" }}>Services existants</h3>
          {loadingSrv ? <p>Chargement...</p> : (
            <div className="cards-grid">
              {services.map(s => (
                <div key={s.id} className="card">
                  <span className="badge">{s.categorie}</span>
                  <h3>{s.titre}</h3>
                  <p className="card-desc">{s.description}</p>
                  <div className="card-meta">
                    <span>⏱ {s.duree_minutes} min</span>
                    <span>💶 {s.prix} €</span>
                  </div>
                  <button className="btn-danger" onClick={() => handleSupprimerService(s.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === "disponibilites" && (
        <div className="profile-section">
          {dispoMsg && <p className="info-msg" style={{ marginBottom: "1rem" }}>{dispoMsg}</p>}
          <form onSubmit={handleAjouterDispo} className="auth-form">
            <h3>Ajouter un créneau de disponibilité</h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Un créneau permet aux clients de réserver un rendez-vous pour un service donné.
            </p>
            <div className="form-group">
              <label>Service concerné</label>
              <select required value={newDispo.service_id}
                onChange={e => setNewDispo({ ...newDispo, service_id: e.target.value })}>
                <option value="">-- Choisir un service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.titre}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date et heure de début</label>
                <input type="datetime-local" required
                  value={newDispo.date_heure_debut} onChange={e => setNewDispo({ ...newDispo, date_heure_debut: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date et heure de fin</label>
                <input type="datetime-local" required
                  value={newDispo.date_heure_fin} onChange={e => setNewDispo({ ...newDispo, date_heure_fin: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Nombre de places (1 = rendez-vous individuel)</label>
              <input type="number" min={1} value={newDispo.places_max}
                onChange={e => setNewDispo({ ...newDispo, places_max: parseInt(e.target.value) })} />
            </div>
            <button type="submit" className="btn-primary">Ajouter le créneau</button>
          </form>
        </div>
      )}

      {onglet === "utilisateurs" && (
        <div className="profile-section">
          <h2>Gestion des utilisateurs</h2>
          {loadingUsers ? <p>Chargement...</p> : (
            <table className="users-table">
              <thead>
                <tr><th>Nom</th><th>Email</th><th>Rôle actuel</th><th>Modifier le rôle</th></tr>
              </thead>
              <tbody>
                {utilisateurs.map(u => (
                  <tr key={u.id}>
                    <td>{u.prenom} {u.nom}</td>
                    <td>{u.email}</td>
                    <td><span className={`statut-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      {u.id !== user.id ? (
                        <select value={u.role} onChange={e => handleChangerRole(u.id, e.target.value)}>
                          <option value="client">client</option>
                          <option value="intervenant">intervenant</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : <span style={{ color: "#aaa", fontSize: "0.85rem" }}>Vous-même</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
