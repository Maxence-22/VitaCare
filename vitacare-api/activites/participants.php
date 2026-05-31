<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$pdo = getDB();

// vérifier rôle
$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

$activite_id = intval($_GET['activite_id'] ?? 0);

if (!$activite_id) {
    echo json_encode(['success' => false, 'message' => 'activite_id manquant.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT u.id, u.nom, u.prenom, u.email, u.telephone, i.statut, i.created_at
    FROM inscriptions i
    JOIN users u ON i.client_id = u.id
    WHERE i.activite_id = ? AND i.statut != "annulee"
    ORDER BY i.created_at ASC
');
$stmt->execute([$activite_id]);

echo json_encode(['success' => true, 'participants' => $stmt->fetchAll()]);
