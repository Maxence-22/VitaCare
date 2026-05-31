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
    SELECT i.id, i.statut, i.created_at,
           a.titre AS activite_titre, a.date_heure_debut, a.lieu, a.prix
    FROM inscriptions i
    JOIN activites a ON i.activite_id = a.id
    WHERE i.client_id = ?
    ORDER BY a.date_heure_debut DESC
');
$stmt->execute([$_SESSION['user_id']]);

echo json_encode(['success' => true, 'inscriptions' => $stmt->fetchAll()]);
