import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../App.jsx";

const CATEGORIES = [
  { value: "toutes", label: "Toutes" },
  { value: "consultation", label: "Consultations" },
  { value: "therapie", label: "Thérapies" },
  { value: "bien_etre", label: "Bien-être" },
  { value: "nutrition", label: "Nutrition" },
  { value: "sport", label: "Sport" },
  { value: "meditation", label: "Méditation" },
];

// image par défaut selon la catégorie
function getImageCategorie(categorie) {
  return `/images/categorie-${categorie || "autre"}.jpg`;
}

export default function Services({ user }) {
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "toutes");
  const [tri, setTri] = useState("titre");

  const [serviceSelectionne, setServiceSelectionne] = useState(null);
  const [disponibilites, setDisponibilites] = useState([]);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const [msgReservation, setMsgReservation] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch(`${API_URL}/services/list.php`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setServices(data.services);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchDisponibilites(serviceId) {
    setLoadingDispo(true);
    setDisponibilites([]);
    setMsgReservation("");
    try {
      const res = await fetch(`${API_URL}/services/disponibilites.php?service_id=${serviceId}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setDisponibilites(data.disponibilites);
    } catch (err) { console.error(err); }
    finally { setLoadingDispo(false); }
  }

  function handleVoirDetail(service) {
    setServiceSelectionne(service);
    fetchDisponibilites(service.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFermerDetail() {
    setServiceSelectionne(null);
    setDisponibilites([]);
    setMsgReservation("");
  }

  async function handleReserver(disponibiliteId) {
    if (!user) {
      setMsgReservation("Vous devez être connecté pour réserver.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reservations/create.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponibilite_id: disponibiliteId })
      });
      const data = await res.json();
      if (data.success) {
        setMsgReservation("✅ Réservation effectuée avec succès !");
        fetchDisponibilites(serviceSelectionne.id);
      } else {
        setMsgReservation("❌ " + (data.message || "Erreur lors de la réservation."));
      }
    } catch (err) {
      setMsgReservation("❌ Erreur de connexion au serveur.");
    }
  }

  const servicesFiltres = services
    .filter(s => {
      const matchSearch = s.titre.toLowerCase().includes(search.toLowerCase())
        || (s.description || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = categorie === "toutes" || s.categorie === categorie;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (tri === "prix_asc") return a.prix - b.prix;
      if (tri === "prix_desc") return b.prix - a.prix;
      if (tri === "duree") return a.duree_minutes - b.duree_minutes;
      return a.titre.localeCompare(b.titre);
    });

  if (loading) return <div className="loading">Chargement des services...</div>;

  return (
    <div className="page-container">

      {/* --- vue détail --- */}
      {serviceSelectionne ? (
        <div className="detail-view">
          <button className="btn-back" onClick={handleFermerDetail}>← Retour aux services</button>

          <div className="detail-header">
            <div className="detail-image-wrapper">
              <img
                src={getImageCategorie(serviceSelectionne.categorie)}
                alt={serviceSelectionne.titre}
                className="detail-image"
                onError={e => { e.target.style.display = "none"; }}
              />
              <span className="badge detail-badge">{serviceSelectionne.categorie}</span>
            </div>
            <div className="detail-body">
              <h2>{serviceSelectionne.titre}</h2>
              <p>{serviceSelectionne.description}</p>
              <div className="detail-meta">
                <span>⏱ {serviceSelectionne.duree_minutes} min</span>
                <span>💶 {serviceSelectionne.prix} €</span>
                {serviceSelectionne.intervenant_prenom && (
                  <span>👤 {serviceSelectionne.intervenant_prenom} {serviceSelectionne.intervenant_nom}</span>
                )}
              </div>
            </div>
          </div>

          <h3 style={{ margin: "1.5rem 0 1rem" }}>Créneaux disponibles</h3>
          {msgReservation && <p className="info-msg">{msgReservation}</p>}

          {loadingDispo ? (
            <p>Chargement des créneaux...</p>
          ) : disponibilites.length === 0 ? (
            <p>Aucun créneau disponible pour ce service.</p>
          ) : (
            <div className="disponibilites-list">
              {disponibilites.map(dispo => (
                <div key={dispo.id} className="dispo-card">
                  <div className="dispo-info">
                    <span>📅 {new Date(dispo.date_heure_debut).toLocaleDateString("fr-FR", {
                      weekday: "long", day: "numeric", month: "long"
                    })}</span>
                    <span>🕐 {new Date(dispo.date_heure_debut).toLocaleTimeString("fr-FR", {
                      hour: "2-digit", minute: "2-digit"
                    })}</span>
                    <span className={`dispo-statut ${dispo.statut}`}>
                      {dispo.statut === "disponible" ? "Disponible" : "Complet"}
                    </span>
                  </div>
                  {dispo.statut === "disponible" && (
                    <button className="btn-primary" onClick={() => handleReserver(dispo.id)} disabled={!user}>
                      {user ? "Réserver" : "Connectez-vous pour réserver"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (
        /* --- vue catalogue --- */
        <>
          <h1>Nos services</h1>

          <div className="filters-bar">
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={categorie} onChange={e => setCategorie(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={tri} onChange={e => setTri(e.target.value)}>
              <option value="titre">Nom A-Z</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="duree">Durée</option>
            </select>
          </div>

          <p className="results-count">{servicesFiltres.length} service(s)</p>

          <div className="cards-grid">
            {servicesFiltres.length === 0 ? (
              <p>Aucun service ne correspond à votre recherche.</p>
            ) : (
              servicesFiltres.map(service => (
                <div key={service.id} className="card card-visuelle">
                  {/* image + badge catégorie */}
                  <div className="card-image-wrapper">
                    <img
                      src={getImageCategorie(service.categorie)}
                      alt={service.titre}
                      className="card-image"
                      onError={e => {
                        e.target.parentElement.style.background = "var(--vert-clair)";
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="badge card-badge">{service.categorie}</span>
                  </div>

                  {/* contenu */}
                  <div className="card-content">
                    <h3>{service.titre}</h3>
                    <p className="card-desc">{service.description}</p>
                    <div className="card-meta">
                      <span>⏱ {service.duree_minutes} min</span>
                      <span>💶 {service.prix} €</span>
                    </div>
                    {service.intervenant_prenom && (
                      <p className="card-intervenant">
                        👤 {service.intervenant_prenom} {service.intervenant_nom}
                      </p>
                    )}
                    <button className="btn-primary card-btn" onClick={() => handleVoirDetail(service)}>
                      Voir les disponibilités
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}