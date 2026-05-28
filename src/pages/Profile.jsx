import { useState, useEffect } from "react";
import { API_URL } from "../App.jsx";

const ONGLETS = ["profil", "reservations", "activites", "notifications"];

export default function Profile({ user, setUser }) {
  const [onglet, setOnglet] = useState("profil");

  // --- profil ---
  const [profileForm, setProfileForm] = useState({
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone || "",
    date_naissance: user.date_naissance || ""
  });
  const [profileMsg, setProfileMsg] = useState("");

  // --- réservations ---
  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);

  // --- activités inscrites ---
  const [inscriptions, setInscriptions] = useState([]);
  const [loadingIns, setLoadingIns] = useState(false);

  // --- notifications ---
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // chargement selon l'onglet actif
  useEffect(() => {
    if (onglet === "reservations") fetchReservations();
    if (onglet === "activites") fetchInscriptions();
    if (onglet === "notifications") fetchNotifications();
  }, [onglet]);

  async function fetchReservations() {
    setLoadingRes(true);
    try {
      const res = await fetch(`${API_URL}/reservations/mes_reservations.php`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setReservations(data.reservations);
    } catch (err) { console.error(err); }
    finally { setLoadingRes(false); }
  }

  async function fetchInscriptions() {
    setLoadingIns(true);
    try {
      const res = await fetch(`${API_URL}/activites/mes_inscriptions.php`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setInscriptions(data.inscriptions);
    } catch (err) { console.error(err); }
    finally { setLoadingIns(false); }
  }

  async function fetchNotifications() {
    setLoadingNotifs(true);
    try {
      const res = await fetch(`${API_URL}/notifications/list.php`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) { console.error(err); }
    finally { setLoadingNotifs(false); }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileMsg("");
    try {
      const res = await fetch(`${API_URL}/auth/update_profile.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setProfileMsg("✅ Profil mis à jour avec succès.");
      } else {
        setProfileMsg("❌ " + (data.message || "Erreur."));
      }
    } catch (err) {
      setProfileMsg("❌ Erreur serveur.");
    }
  }

  async function handleAnnulerReservation(reservationId) {
    try {
      const res = await fetch(`${API_URL}/reservations/annuler.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId })
      });
      const data = await res.json();
      if (data.success) fetchReservations();
    } catch (err) { console.error(err); }
  }

  async function handleMarquerLu(notifId) {
    try {
      const res = await fetch(`${API_URL}/notifications/marquer_lu.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notif_id: notifId })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notifId ? { ...n, lu: 1 } : n)
        );
      }
    } catch (err) { console.error(err); }
  }

  const notifsNonLues = notifications.filter(n => n.lu === 0).length;

  return (
    <div className="page-container">
      <h1>Mon espace</h1>

      {/* onglets */}
      <div className="profile-tabs">
        {ONGLETS.map(o => (
          <button
            key={o}
            className={`profile-tab ${onglet === o ? "active" : ""}`}
            onClick={() => setOnglet(o)}
          >
            {o === "profil" && "Mon profil"}
            {o === "reservations" && "Mes réservations"}
            {o === "activites" && "Mes activités"}
            {o === "notifications" && (
              <>Notifications {notifsNonLues > 0 && <span className="notif-badge">{notifsNonLues}</span>}</>
            )}
          </button>
        ))}
      </div>

      {/* --- onglet profil --- */}
      {onglet === "profil" && (
        <div className="profile-section">
          <div className="profile-info">
            <div className="avatar">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div>
              <h2>{user.prenom} {user.nom}</h2>
              <p>{user.email}</p>
              <span className="badge">{user.role}</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="auth-form">
            <h3>Modifier mes informations</h3>
            {profileMsg && <p className="info-msg">{profileMsg}</p>}

            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={profileForm.prenom}
                  onChange={e => setProfileForm({ ...profileForm, prenom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={profileForm.nom}
                  onChange={e => setProfileForm({ ...profileForm, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={profileForm.telephone}
                onChange={e => setProfileForm({ ...profileForm, telephone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date de naissance</label>
              <input
                type="date"
                value={profileForm.date_naissance}
                onChange={e => setProfileForm({ ...profileForm, date_naissance: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary">Sauvegarder</button>
          </form>
        </div>
      )}

      {/* --- onglet réservations --- */}
      {onglet === "reservations" && (
        <div className="profile-section">
          <h2>Mes réservations</h2>
          {loadingRes ? <p>Chargement...</p> : (
            reservations.length === 0 ? (
              <p>Aucune réservation pour l'instant.</p>
            ) : (
              <div className="reservations-list">
                {reservations.map(r => {
                  const date = new Date(r.date_heure_debut);
                  const estPasse = date < new Date();
                  return (
                    <div key={r.id} className={`reservation-card ${r.statut}`}>
                      <div className="reservation-info">
                        <h4>{r.service_titre}</h4>
                        <p>📅 {date.toLocaleDateString("fr-FR", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric"
                        })}</p>
                        <p>🕐 {date.toLocaleTimeString("fr-FR", {
                          hour: "2-digit", minute: "2-digit"
                        })}</p>
                        <p>👤 {r.intervenant_prenom} {r.intervenant_nom}</p>
                      </div>
                      <div className="reservation-statut">
                        <span className={`statut-badge ${r.statut}`}>{r.statut}</span>
                        {!estPasse && r.statut !== "annulee" && r.statut !== "refusee" && (
                          <button
                            className="btn-danger"
                            onClick={() => handleAnnulerReservation(r.id)}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* --- onglet activités inscrites --- */}
      {onglet === "activites" && (
        <div className="profile-section">
          <h2>Mes activités</h2>
          {loadingIns ? <p>Chargement...</p> : (
            inscriptions.length === 0 ? (
              <p>Vous n'êtes inscrit à aucune activité.</p>
            ) : (
              <div className="reservations-list">
                {inscriptions.map(i => {
                  const date = new Date(i.date_heure_debut);
                  return (
                    <div key={i.id} className={`reservation-card ${i.statut}`}>
                      <div className="reservation-info">
                        <h4>{i.activite_titre}</h4>
                        <p>📅 {date.toLocaleDateString("fr-FR", {
                          weekday: "long", day: "numeric", month: "long"
                        })}</p>
                        <p>📍 {i.lieu}</p>
                      </div>
                      <span className={`statut-badge ${i.statut}`}>{i.statut}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* --- onglet notifications --- */}
      {onglet === "notifications" && (
        <div className="profile-section">
          <h2>Notifications</h2>
          {loadingNotifs ? <p>Chargement...</p> : (
            notifications.length === 0 ? (
              <p>Aucune notification.</p>
            ) : (
              <div className="notifs-list">
                {notifications.map(n => (
                  <div key={n.id} className={`notif-card ${n.lu ? "lue" : "non-lue"}`}>
                    <div className="notif-content">
                      <strong>{n.titre}</strong>
                      <p>{n.message}</p>
                      <small>{new Date(n.created_at).toLocaleDateString("fr-FR")}</small>
                    </div>
                    {!n.lu && (
                      <button
                        className="btn-small"
                        onClick={() => handleMarquerLu(n.id)}
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}
