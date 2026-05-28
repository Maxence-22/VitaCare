import { Link } from "react-router-dom";

export default function Home({ user }) {
  return (
    <div className="home">

      {/* hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Votre bien-être, <span className="highlight">notre priorité</span></h1>
          <p>
            Réservez vos rendez-vous, participez à nos activités et prenez soin
            de vous chaque jour avec VitaCare.
          </p>
          <div className="hero-buttons">
            <Link to="/services" className="btn-primary">Découvrir nos services</Link>
            {!user && (
              <Link to="/auth" className="btn-secondary">Créer un compte</Link>
            )}
          </div>
        </div>
      </section>

      {/* catégories rapides */}
      <section className="categories-section">
        <h2>Nos domaines</h2>
        <div className="categories-grid">
          {[
            { icon: "🧘", label: "Bien-être", cat: "bien_etre" },
            { icon: "🥗", label: "Nutrition", cat: "nutrition" },
            { icon: "💆", label: "Thérapies", cat: "therapie" },
            { icon: "🏃", label: "Sport", cat: "sport" },
            { icon: "🧠", label: "Méditation", cat: "meditation" },
            { icon: "🩺", label: "Consultations", cat: "consultation" },
          ].map(item => (
            <Link
              key={item.cat}
              to={`/services?categorie=${item.cat}`}
              className="category-card"
            >
              <span className="category-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* appel à l'action activités */}
      <section className="cta-section">
        <h2>Activités & ateliers collectifs</h2>
        <p>Rejoignez nos ateliers en groupe pour apprendre, progresser et vous détendre.</p>
        <Link to="/activites" className="btn-primary">Voir les activités</Link>
      </section>

    </div>
  );
}
