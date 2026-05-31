<?php
require_once '../config/cors.php';
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$reservation_id = intval($data['reservation_id'] ?? 0);

if (!$reservation_id) {
    echo json_encode(['success' => false, 'message' => 'reservation_id manquant.']);
    exit;
}

$pdo = getDB();

// vérifier que la réservation appartient bien à cet utilisateur
$stmt = $pdo->prepare('SELECT * FROM reservations WHERE id = ? AND client_id = ?');
$stmt->execute([$reservation_id, $_SESSION['user_id']]);
$reservation = $stmt->fetch();

if (!$reservation) {
    echo json_encode(['success' => false, 'message' => 'Réservation introuvable.']);
    exit;
}

if ($reservation['statut'] === 'annulee') {
    echo json_encode(['success' => false, 'message' => 'Cette réservation est déjà annulée.']);
    exit;
}

// annuler
$stmt = $pdo->prepare('UPDATE reservations SET statut = "annulee" WHERE id = ?');
$stmt->execute([$reservation_id]);

// notification
$stmt = $pdo->prepare('
    INSERT INTO notifications (user_id, titre, message, type)
    VALUES (?, "Réservation annulée", "Votre réservation a été annulée avec succès.", "annulation")
');
$stmt->execute([$_SESSION['user_id']]);

echo json_encode(['success' => true, 'message' => 'Réservation annulée.']);
