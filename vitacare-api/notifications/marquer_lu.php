<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$notif_id = intval($data['notif_id'] ?? 0);

if (!$notif_id) {
    echo json_encode(['success' => false, 'message' => 'notif_id manquant.']);
    exit;
}

$pdo = getDB();

// on vérifie que la notif appartient bien à cet utilisateur
$stmt = $pdo->prepare('UPDATE notifications SET lu = 1 WHERE id = ? AND user_id = ?');
$stmt->execute([$notif_id, $_SESSION['user_id']]);

echo json_encode(['success' => true]);
