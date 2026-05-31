<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

// admin voit tout, intervenant ne voit que ses réservations
if ($user['role'] === 'admin') {
    $stmt = $pdo->query('
        SELECT r.id, r.statut, r.created_at,
               d.date_heure_debut,
               s.titre AS service_titre,
               c.nom AS client_nom, c.prenom AS client_prenom
        FROM reservations r
        JOIN disponibilites d ON r.disponibilite_id = d.id
        JOIN services s ON d.service_id = s.id
        JOIN users c ON r.client_id = c.id
        ORDER BY r.created_at DESC
        LIMIT 100
    ');
} else {
    $stmt = $pdo->prepare('
        SELECT r.id, r.statut, r.created_at,
               d.date_heure_debut,
               s.titre AS service_titre,
               c.nom AS client_nom, c.prenom AS client_prenom
        FROM reservations r
        JOIN disponibilites d ON r.disponibilite_id = d.id
        JOIN services s ON d.service_id = s.id
        JOIN users c ON r.client_id = c.id
        WHERE d.intervenant_id = ?
        ORDER BY r.created_at DESC
        LIMIT 100
    ');
    $stmt->execute([$_SESSION['user_id']]);
}

echo json_encode(['success' => true, 'reservations' => $stmt->fetchAll()]);
