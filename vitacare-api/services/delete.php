<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$service_id = intval($data['service_id'] ?? 0);

if (!$service_id) {
    echo json_encode(['success' => false, 'message' => 'service_id manquant.']);
    exit;
}

$pdo = getDB();

// vérifier le rôle
$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !in_array($user['role'], ['admin', 'intervenant'])) {
    echo json_encode(['success' => false, 'message' => 'Accès refusé.']);
    exit;
}

// un intervenant ne peut supprimer que ses propres services
if ($user['role'] === 'intervenant') {
    $stmt = $pdo->prepare('SELECT id FROM services WHERE id = ? AND intervenant_id = ?');
    $stmt->execute([$service_id, $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Service introuvable ou accès refusé.']);
        exit;
    }
}

// on désactive plutôt que supprimer (soft delete) pour garder l'historique
$stmt = $pdo->prepare('UPDATE services SET actif = 0 WHERE id = ?');
$stmt->execute([$service_id]);

echo json_encode(['success' => true, 'message' => 'Service supprimé.']);
