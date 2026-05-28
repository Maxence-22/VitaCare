<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$activite_id = intval($data['activite_id'] ?? 0);

if (!$activite_id) {
    echo json_encode(['success' => false, 'message' => 'activite_id manquant.']);
    exit;
}

$pdo = getDB();

$stmt = $pdo->prepare('
    SELECT id FROM inscriptions
    WHERE client_id = ? AND activite_id = ? AND statut != "annulee"
');
$stmt->execute([$_SESSION['user_id'], $activite_id]);
$inscription = $stmt->fetch();

if (!$inscription) {
    echo json_encode(['success' => false, 'message' => 'Inscription introuvable.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE inscriptions SET statut = "annulee" WHERE id = ?');
$stmt->execute([$inscription['id']]);

echo json_encode(['success' => true, 'message' => 'Désinscription effectuée.']);
