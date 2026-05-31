import { useState, useEffect } from "react";
import { API_URL } from "../App.jsx";

const ONGLETS = ["profil", "reservations", "activites", "notifications"];

export default function Profile({ user, setUser }) {
  const [onglet, setOnglet] = useState("profil");

  const [profileForm, setProfileForm] = useState({
    nom: user.nom, prenom: user.prenom,
    telephone: user.telephone || "", date_naissance: user.date_naissance || ""
  });
  const [profileMsg, setProfileMsg] = useState("");

  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [filtreRes, setFiltreRes] = useState("toutes");

  // modale modification
  const [reservationAModifier, setReservationAModifier] = useState(null);
  const [nouvDispos, setNouvDispos] = useState([]);
  const [loadingDispos, setLoadingDispos] = useState(false);
  const [modifMsg, setModifMsg] = useState("");

  const [inscriptions, setInscriptions] = useState([]);
  const [loadingIns, setLoadingIns] = useState(false);
  const [filtreAct, setFiltreAct] = useState("toutes");

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    if (onglet === "reservations") fetchReservations();
    if (onglet === "activites") fetchInscriptions();
    if (onglet === "notifications") fetchNotifications();
  }, [onglet]);

  async function fetchReservations() {
    setLoadingRes(true);
    try {
      const res = await fetch(`${API_URL}/reservations/mes_reservations.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setReservations(data.reservations);
    } catch (err) { console.error(err); }
    finally { setLoadingRes(false); }
  }

  async function fetchInscriptions() {
    setLoadingIns(true);
    try {
      const res = await fetch(`${API_URL}/activites/mes_inscriptions.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setInscriptions(data.inscriptions);
    } catch (err) { console.error(err); }
    finally { setLoadingIns(false); }
  }

  async function fetchNotifications() {
    setLoadingNotifs(true);
    try {
      const res = await fetch(`${API_URL}/notifications/list.php`, { credentials: "include" });
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
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) { setUser(data.user); setProfileMsg("✅ Profil mis à jour."); }
      else setProfileMsg("❌ " + (data.message || "Erreur."));
    } catch (err) { setProfileMsg("❌ Erreur serveur."); }
  }

  async function handleAnnulerReservation(reservationId) {
    if (!confirm("Confirmer l'annulation ?")) return;
    try {
      const res = await fetch(`${API_URL}/reservations/annuler.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId })
      });
      const data = await res.json();
      if (data.success) fetchReservations();
    } catch (err) { console.error(err); }
  }

  async function handleOuvrirModification(reservation) {
    setReservationAModifier(reservation);
    setModifMsg("");
    setNouvDispos([]);
    setLoadingDispos(true);
    try {
      const res = await fetch(`${API_URL}/services/disponibilites.php?service_id=${reservation.service_id}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setNouvDispos(data.disponibilites.filter(d => d.id !== reservation.disponibilite_id && d.statut === "disponible"));
      }
    } catch (err) { console.error(err); }
    finally { setLoadingDispos(false); }
  }

  async function handleModifierReservation(nouvDispoId) {
    setModifMsg("");
    try {
      const res = await fetch(`${API_URL}/reservations/modifier.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationAModifier.id, nouvelle_disponibilite_id: nouvDispoId })
      });
      const data = await res.json();
      if (data.success) {
        setModifMsg("✅ Réservation modifiée !");
        fetchReservations();
        setTimeout(() => setReservationAModifier(null), 1500);
      } else {
        setModifMsg("❌ " + (data.message || "Erreur."));
      }
    } catch (err) { setModifMsg("❌ Erreur serveur."); }
  }

  async function handleMarquerLu(notifId) {
    try {
      const res = await fetch(`${API_URL}/notifications/marquer_lu.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notif_id: notifId })
      });
      const data = await res.json();
      if (data.success) setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lu: 1 } : n));
    } catch (err) { console.error(err); }
  }

  async function handleMarquerToutesLues() {
    for (const n of notifications.filter(n => n.lu === 0)) await handleMarquerLu(n.id);
  }

  const maintenant = new Date();
  const notifsNonLues = notifications.filter(n => n.lu === 0).length;

  const reservationsAvenir = reservations.filter(r => new Date(r.date_heure_debut) >= maintenant);
  const reservationsPassees = reservations.filter(r => new Date(r.date_heure_debut) < maintenant);
  const reservationsFiltrees =
    filtreRes === "avenir" ? reservationsAvenir :
    filtreRes === "passees" ? reservationsPassees : reservations;

  const activitesAvenir = inscriptions.filter(i => new Date(i.date_heure_debut) >= maintenant);
  const activitesPassees = inscriptions.filter(i => new Date(i.date_heure_debut) < maintenant);
  const inscriptionsFiltrees =
    filtreAct === "avenir" ? activitesAvenir :
    filtreAct === "passees" ? activitesPassees : inscriptions;

  function renderReservationCard(r) {
    const date = new Date(r.date_heure_debut);
    const estPasse = date < maintenant;
    return (
      <div key={r.id} className={`reservation-card ${r.statut}`}>
        <div className="reservation-info">
          <h4>{r.service_titre}</h4>
          <p>📅 {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <p>🕐 {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
          <p>⏱ {r.duree_minutes} min &nbsp;|&nbsp; 💶 {r.prix} €</p>
          <p>👤 {r.intervenant_prenom} {r.intervenant_nom}</p>
          {estPasse && <span className="badge-passe">Passé</span>}
        </div>
        <div className="reservation-statut">
          <span className={`statut-badge ${r.statut}`}>{r.statut}</span>
          {!estPasse && r.statut !== "annulee" && r.statut !== "refusee" && (
            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => handleOuvrirModification(r)}>Modifier</button>
              <button className="btn-danger" onClick={() => handleAnnulerReservation(r.id)}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Mon espace</h1>

      {/* modale modification */}
      {reservationAModifier && (
        <div className="modal-overlay" onClick={() => setReservationAModifier(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier ma réservation</h3>
              <button className="modal-close" onClick={() => setReservationAModifier(null)}>✕</button>
            </div>
            <p style={{ marginBottom: "0.5rem" }}>Service : <strong>{reservationAModifier.service_titre}</strong></p>
            <p style={{ marginBottom: "1.5rem", color: "#666" }}>
              Créneau actuel : <strong>
                {new Date(reservationAModifier.date_heure_debut).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long"
                })} à {new Date(reservationAModifier.date_heure_debut).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit"
                })}
              </strong>
            </p>
            <h4 style={{ marginBottom: "1rem" }}>Choisir un nouveau créneau :</h4>
            {modifMsg && <p className="info-msg" style={{ marginBottom: "1rem" }}>{modifMsg}</p>}
            {loadingDispos ? <p>Chargement...</p> :
              nouvDispos.length === 0 ? <p>Aucun autre créneau disponible.</p> : (
                <div className="disponibilites-list">
                  {nouvDispos.map(d => (
                    <div key={d.id} className="dispo-card">
                      <div className="dispo-info">
                        <span>📅 {new Date(d.date_heure_debut).toLocaleDateString("fr-FR", {
                          weekday: "long", day: "numeric", month: "long"
                        })}</span>
                        <span>🕐 {new Date(d.date_heure_debut).toLocaleTimeString("fr-FR", {
                          hour: "2-digit", minute: "2-digit"
                        })}</span>
                      </div>
                      <button className="btn-primary" onClick={() => handleModifierReservation(d.id)}>
                        Choisir ce créneau
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* onglets */}
      <div className="profile-tabs">
        {ONGLETS.map(o => (
          <button key={o} className={`profile-tab ${onglet === o ? "active" : ""}`} onClick={() => setOnglet(o)}>
            {o === "profil" && "Mon profil"}
            {o === "reservations" && `Mes réservations${reservationsAvenir.length > 0 ? ` (${reservationsAvenir.length} à venir)` : ""}`}
            {o === "activites" && `Mes activités${activitesAvenir.length > 0 ? ` (${activitesAvenir.length} à venir)` : ""}`}
            {o === "notifications" && (<>Notifications {notifsNonLues > 0 && <span className="notif-badge">{notifsNonLues}</span>}</>)}
          </button>
        ))}
      </div>

      {/* profil */}
      {onglet === "profil" && (
        <div className="profile-section">
          <div className="profile-info">
            <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
            <div>
              <h2>{user.prenom} {user.nom}</h2>
              <p>{user.email}</p>
              {user.telephone && <p>📞 {user.telephone}</p>}
              <span className="badge">{user.role}</span>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="auth-form">
            <h3>Modifier mes informations</h3>
            {profileMsg && <p className="info-msg">{profileMsg}</p>}
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" value={profileForm.prenom}
                  onChange={e => setProfileForm({ ...profileForm, prenom: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" value={profileForm.nom}
                  onChange={e => setProfileForm({ ...profileForm, nom: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" value={profileForm.telephone}
                onChange={e => setProfileForm({ ...profileForm, telephone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input type="date" value={profileForm.date_naissance}
                onChange={e => setProfileForm({ ...profileForm, date_naissance: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary">Sauvegarder</button>
          </form>
        </div>
      )}

      {/* réservations */}
      {onglet === "reservations" && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Mes réservations</h2>
            <div className="filtre-tabs">
              {[
                { val: "toutes", label: `Toutes (${reservations.length})` },
                { val: "avenir", label: `À venir (${reservationsAvenir.length})` },
                { val: "passees", label: `Passées (${reservationsPassees.length})` },
              ].map(f => (
                <button key={f.val} className={`filtre-tab ${filtreRes === f.val ? "active" : ""}`}
                  onClick={() => setFiltreRes(f.val)}>{f.label}</button>
              ))}
            </div>
          </div>
          {loadingRes ? <p>Chargement...</p> :
            reservationsFiltrees.length === 0 ? <p>Aucune réservation dans cette catégorie.</p> :
            <div className="reservations-list">{reservationsFiltrees.map(r => renderReservationCard(r))}</div>
          }
        </div>
      )}

      {/* activités */}
      {onglet === "activites" && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Mes activités</h2>
            <div className="filtre-tabs">
              {[
                { val: "toutes", label: `Toutes (${inscriptions.length})` },
                { val: "avenir", label: `À venir (${activitesAvenir.length})` },
                { val: "passees", label: `Passées (${activitesPassees.length})` },
              ].map(f => (
                <button key={f.val} className={`filtre-tab ${filtreAct === f.val ? "active" : ""}`}
                  onClick={() => setFiltreAct(f.val)}>{f.label}</button>
              ))}
            </div>
          </div>
          {loadingIns ? <p>Chargement...</p> :
            inscriptionsFiltrees.length === 0 ? <p>Aucune activité dans cette catégorie.</p> : (
              <div className="reservations-list">
                {inscriptionsFiltrees.map(i => {
                  const date = new Date(i.date_heure_debut);
                  const estPasse = date < maintenant;
                  return (
                    <div key={i.id} className={`reservation-card ${i.statut}`}>
                      <div className="reservation-info">
                        <h4>{i.activite_titre}</h4>
                        <p>📅 {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                        <p>🕐 {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                        <p>📍 {i.lieu}</p>
                        <p>💶 {i.prix} €</p>
                        {estPasse && <span className="badge-passe">Passé</span>}
                      </div>
                      <span className={`statut-badge ${i.statut}`}>{i.statut}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* notifications */}
      {onglet === "notifications" && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifsNonLues > 0 && (
              <button className="btn-secondary" onClick={handleMarquerToutesLues}>Tout marquer comme lu</button>
            )}
          </div>
          {loadingNotifs ? <p>Chargement...</p> :
            notifications.length === 0 ? <p>Aucune notification.</p> : (
              <div className="notifs-list">
                {notifications.map(n => (
                  <div key={n.id} className={`notif-card ${n.lu ? "lue" : "non-lue"}`}>
                    <div className="notif-content">
                      <strong>{n.titre}</strong>
                      <p>{n.message}</p>
                      <small>{new Date(n.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric"
                      })}</small>
                    </div>
                    {!n.lu && (
                      <button className="btn-small" onClick={() => handleMarquerLu(n.id)}>Marquer comme lu</button>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
