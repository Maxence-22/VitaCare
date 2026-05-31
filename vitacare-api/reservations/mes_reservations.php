<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('
    SELECT r.id, r.statut, r.created_at,
           d.date_heure_debut, d.date_heure_fin,
           s.titre AS service_titre, s.prix,
           u.nom AS intervenant_nom, u.prenom AS intervenant_prenom
    FROM reservations r
    JOIN disponibilites d ON r.disponibilite_id = d.id
    JOIN services s ON d.service_id = s.id
    LEFT JOIN users u ON d.intervenant_id = u.id
    WHERE r.client_id = ?
    ORDER BY d.date_heure_debut DESC
');
$stmt->execute([$_SESSION['user_id']]);
$reservations = $stmt->fetchAll();

echo json_encode(['success' => true, 'reservations' => $reservations]);
