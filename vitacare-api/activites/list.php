<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

$pdo = getDB();
$user_id = $_SESSION['user_id'] ?? null;

$stmt = $pdo->query('
    SELECT a.*,
           u.nom AS intervenant_nom, u.prenom AS intervenant_prenom,
           (SELECT COUNT(*) FROM inscriptions i
            WHERE i.activite_id = a.id AND i.statut IN ("en_attente", "confirmee")) AS nb_inscrits
    FROM activites a
    LEFT JOIN users u ON a.intervenant_id = u.id
    WHERE a.statut != "annulee"
    ORDER BY a.date_heure_debut ASC
');
$activites = $stmt->fetchAll();

// pour chaque activité, on vérifie si l'utilisateur connecté est inscrit
foreach ($activites as &$activite) {
    $activite['est_inscrit'] = false;
    if ($user_id) {
        $stmt = $pdo->prepare('
            SELECT id FROM inscriptions
            WHERE client_id = ? AND activite_id = ? AND statut != "annulee"
        ');
        $stmt->execute([$user_id, $activite['id']]);
        $activite['est_inscrit'] = (bool) $stmt->fetch();
    }
    // met à jour statut si complet
    if ($activite['nb_inscrits'] >= $activite['places_max']) {
        $activite['statut'] = 'complete';
    }
}

echo json_encode(['success' => true, 'activites' => $activites]);
