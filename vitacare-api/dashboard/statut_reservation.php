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

$data = json_decode(file_get_contents('php://input'), true);
$reservation_id = intval($data['reservation_id'] ?? 0);
$statut = $data['statut'] ?? '';

if (!$reservation_id || !in_array($statut, ['confirmee', 'refusee'])) {
    echo json_encode(['success' => false, 'message' => 'Données invalides.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE reservations SET statut = ? WHERE id = ?');
$stmt->execute([$statut, $reservation_id]);

// notifier le client
$stmt = $pdo->prepare('SELECT client_id FROM reservations WHERE id = ?');
$stmt->execute([$reservation_id]);
$res = $stmt->fetch();

if ($res) {
    $titre = $statut === 'confirmee' ? 'Réservation confirmée' : 'Réservation refusée';
    $message = $statut === 'confirmee'
        ? 'Votre réservation a été confirmée par l\'intervenant.'
        : 'Votre réservation a été refusée.';
    $stmt = $pdo->prepare('INSERT INTO notifications (user_id, titre, message, type) VALUES (?, ?, ?, "reservation")');
    $stmt->execute([$res['client_id'], $titre, $message]);
}

echo json_encode(['success' => true]);
