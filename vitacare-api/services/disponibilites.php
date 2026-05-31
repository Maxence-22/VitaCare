<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

$service_id = intval($_GET['service_id'] ?? 0);

if (!$service_id) {
    echo json_encode(['success' => false, 'message' => 'service_id manquant.']);
    exit;
}

$pdo = getDB();

// on ne retourne que les créneaux futurs
// on compte aussi combien de réservations confirmées/en_attente existent pour chaque créneau
$stmt = $pdo->prepare('
    SELECT d.*,
        (SELECT COUNT(*) FROM reservations r
         WHERE r.disponibilite_id = d.id
         AND r.statut IN ("en_attente", "confirmee")) AS nb_reserves
    FROM disponibilites d
    WHERE d.service_id = ?
    AND d.date_heure_debut > NOW()
    AND d.statut != "annule"
    ORDER BY d.date_heure_debut ASC
');
$stmt->execute([$service_id]);
$dispos = $stmt->fetchAll();

// on calcule le statut réel selon les places
foreach ($dispos as &$d) {
    if ($d['nb_reserves'] >= $d['places_max']) {
        $d['statut'] = 'complet';
    } else {
        $d['statut'] = 'disponible';
    }
}

echo json_encode(['success' => true, 'disponibilites' => $dispos]);
