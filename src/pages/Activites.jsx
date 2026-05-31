import { useState, useEffect } from "react";
import { API_URL } from "../App.jsx";

const CATEGORIES = [
  { value: "toutes", label: "Toutes" },
  { value: "nutrition", label: "Nutrition" },
  { value: "relaxation", label: "Relaxation" },
  { value: "sport", label: "Sport" },
  { value: "prevention", label: "Prévention" },
  { value: "meditation", label: "Méditation" },
  { value: "atelier", label: "Ateliers" },
];

function getImageCategorie(categorie) {
  return `/images/categorie-${categorie || "autre"}.jpg`;
}

export default function Activites({ user }) {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("toutes");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState({});

  useEffect(() => {
    fetchActivites();
  }, []);

  async function fetchActivites() {
    try {
      const res = await fetch(`${API_URL}/activites/list.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setActivites(data.activites);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleInscrire(activiteId) {
    if (!user) {
      setMessages(prev => ({ ...prev, [activiteId]: "Connectez-vous pour vous inscrire." }));
      return;
    }
    try {
      const res = await fetch(`${API_URL}/activites/inscrire.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activite_id: activiteId })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => ({ ...prev, [activiteId]: "✅ Inscription réussie !" }));
        fetchActivites();
      } else {
        setMessages(prev => ({ ...prev, [activiteId]: "❌ " + (data.message || "Erreur.") }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [activiteId]: "❌ Erreur serveur." }));
    }
  }

  async function handleDesinscrire(activiteId) {
    try {
      const res = await fetch(`${API_URL}/activites/desinscrire.php`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activite_id: activiteId })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => ({ ...prev, [activiteId]: "✅ Désinscription effectuée." }));
        fetchActivites();
      } else {
        setMessages(prev => ({ ...prev, [activiteId]: "❌ " + (data.message || "Erreur.") }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [activiteId]: "❌ Erreur serveur." }));
    }
  }

  const activitesFiltrees = activites.filter(a => {
    const matchCat = categorie === "toutes" || a.categorie === categorie;
    const matchSearch = a.titre.toLowerCase().includes(search.toLowerCase())
      || (a.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <div className="loading">Chargement des activités...</div>;

  return (
    <div className="page-container">
      <h1>Activités & programmes</h1>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Rechercher une activité..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={categorie} onChange={e => setCategorie(e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <p className="results-count">{activitesFiltrees.length} activité(s)</p>

      <div className="cards-grid">
        {activitesFiltrees.length === 0 ? (
          <p>Aucune activité disponible.</p>
        ) : (
          activitesFiltrees.map(activite => {
            const placesRestantes = activite.places_max - activite.nb_inscrits;
            const estComplete = activite.statut === "complete" || placesRestantes <= 0;
            const estInscrit = activite.est_inscrit;
            const dateDebut = new Date(activite.date_heure_debut);
            const dateLimite = activite.date_limite_inscription
              ? new Date(activite.date_limite_inscription) : null;
            const inscriptionFermee = dateLimite && new Date() > dateLimite;
            const pct = Math.min(100, Math.round((activite.nb_inscrits / activite.places_max) * 100));
            const couleurBarre = pct >= 100 ? "var(--danger)" : pct >= 75 ? "var(--warning)" : "var(--vert)";

            return (
              <div key={activite.id} className={`card card-visuelle ${estComplete ? "card-complete" : ""}`}>

                {/* image + badge */}
                <div className="card-image-wrapper">
                  <img
                    src={getImageCategorie(activite.categorie)}
                    alt={activite.titre}
                    className="card-image"
                    onError={e => {
                      e.target.parentElement.style.background = "var(--vert-clair)";
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="badge card-badge">{activite.categorie}</span>
                  {estComplete && <span className="badge card-badge-complet">Complet</span>}
                </div>

                {/* contenu */}
                <div className="card-content">
                  <h3>{activite.titre}</h3>
                  <p className="card-desc">{activite.description}</p>

                  <div className="card-meta">
                    <span>📅 {dateDebut.toLocaleDateString("fr-FR", {
                      weekday: "short", day: "numeric", month: "short"
                    })}</span>
                    <span>🕐 {dateDebut.toLocaleTimeString("fr-FR", {
                      hour: "2-digit", minute: "2-digit"
                    })} – {new Date(activite.date_heure_fin).toLocaleTimeString("fr-FR", {
                      hour: "2-digit", minute: "2-digit"
                    })}</span>
                    <span>📍 {activite.lieu}</span>
                    <span>💶 {activite.prix} €</span>
                  </div>

                  {/* barre de progression */}
                  <div style={{ margin: "0.6rem 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                      <span>👥 {activite.nb_inscrits} / {activite.places_max} places</span>
                      <span style={{ color: couleurBarre, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#e0e0e0", borderRadius: "10px", height: "6px" }}>
                      <div style={{ width: `${pct}%`, background: couleurBarre, borderRadius: "10px", height: "6px" }} />
                    </div>
                  </div>

                  {dateLimite && (
                    <p className="date-limite">
                      Inscription avant le {dateLimite.toLocaleDateString("fr-FR")}
                    </p>
                  )}

                  {messages[activite.id] && (
                    <p className="info-msg">{messages[activite.id]}</p>
                  )}

                  {!estComplete && !inscriptionFermee ? (
                    estInscrit ? (
                      <button className="btn-secondary card-btn" onClick={() => handleDesinscrire(activite.id)}>
                        Se désinscrire
                      </button>
                    ) : (
                      <button className="btn-primary card-btn" onClick={() => handleInscrire(activite.id)} disabled={!user}>
                        {user ? "S'inscrire" : "Connectez-vous pour vous inscrire"}
                      </button>
                    )
                  ) : inscriptionFermee && !estInscrit ? (
                    <p className="info-msg">Les inscriptions sont fermées.</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
